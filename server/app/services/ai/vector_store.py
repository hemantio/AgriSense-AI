"""
AgriSense AI — RAG Vector Store Service
==========================================
Dual-mode vector embedding similarity search supporting PostgreSQL (pgvector) and SQLite (in-python math).
"""

import json
import math
from typing import Any, Dict, List

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.chat import KnowledgeEmbedding
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger("agrisense.cie.vector")

# Standard embedding dimensions for text-embedding-004
EMBEDDING_DIM = 768


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(x * y for x, y in zip(v1, v2))
    norm_a = math.sqrt(sum(x * x for x in v1))
    norm_b = math.sqrt(sum(x * x for x in v2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)


class VectorStoreService:
    """Provides vector storage and query capabilities for RAG."""

    @staticmethod
    def get_embedding(text_content: str) -> List[float]:
        """
        Generates 768-dimension float vector for a text chunk using Gemini.
        Falls back to a deterministic mock vector if API key is not configured.
        """
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mock_gemini_api_key_for_testing":
            # Generate deterministic mock vector based on hash of text
            val = hash(text_content) % 1000 / 1000.0
            mock_vec = [val * 0.1] * EMBEDDING_DIM
            # Make sure it is normalized or non-zero
            mock_vec[0] = 1.0
            return mock_vec

        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=text_content
            )
            embedding = response.get("embedding", [])
            if len(embedding) == EMBEDDING_DIM:
                return embedding
            else:
                logger.warning(f"Unexpected embedding dimension: {len(embedding)}")
                return [0.0] * EMBEDDING_DIM
        except Exception as e:
            logger.error(f"Error generating embedding via Gemini: {str(e)}")
            # Fallback mock
            return [0.001] * EMBEDDING_DIM

    @classmethod
    async def search_similarity(
        cls,
        query: str,
        db: AsyncSession,
        limit: int = 3,
        threshold: float = 0.70
    ) -> List[Dict[str, Any]]:
        """
        Performs similarity search.
        Uses pgvector <=> cosine distance operator on Postgres,
        and python-based similarity filtering on SQLite.
        """
        logger.info(f"RAG searching for query: {query}")
        query_vector = cls.get_embedding(query)

        # Check if database is SQLite or PostgreSQL
        # We can inspect DATABASE_URL
        is_sqlite = settings.DATABASE_URL.startswith("sqlite")

        if not is_sqlite:
            # PostgreSQL execution with pgvector
            try:
                # pgvector cosine distance operator is <=>
                # 1 - (embedding <=> query_vector) is similarity
                sql_query = text(
                    """
                    SELECT id, source, title, content, metadata, region, language,
                    (1 - (embedding <=> :qv)) AS similarity
                    FROM knowledge_embeddings
                    WHERE (1 - (embedding <=> :qv)) >= :thresh
                    ORDER BY similarity DESC
                    LIMIT :lim
                    """
                )
                # Convert query vector to string format for pgvector bind parameter
                # e.g., '[0.1, 0.2, ...]'
                qv_str = "[" + ",".join(map(str, query_vector)) + "]"
                res = await db.execute(
                    sql_query,
                    {"qv": qv_str, "thresh": threshold, "lim": limit}
                )
                rows = res.fetchall()
                results = []
                for row in rows:
                    results.append({
                        "id": str(row[0]),
                        "source": row[1],
                        "title": row[2],
                        "content": row[3],
                        "metadata": row[4] if isinstance(row[4], dict) else json.loads(row[4] or "{}"),
                        "region": row[5],
                        "language": row[6],
                        "similarity": row[7]
                    })
                return results
            except Exception as e:
                logger.error(f"Postgres pgvector similarity query failed: {str(e)}, falling back to python mode.")
                # fall back to python similarity search

        # SQLite/Python mode: fetch all records and compute similarity
        stmt = select(KnowledgeEmbedding)
        res = await db.execute(stmt)
        records = res.scalars().all()

        scored_records = []
        for rec in records:
            if not rec.embedding:
                continue
            sim = cosine_similarity(query_vector, rec.embedding)
            if sim >= threshold:
                scored_records.append((rec, sim))

        # Sort by similarity descending
        scored_records.sort(key=lambda x: x[1], reverse=True)
        top_records = scored_records[:limit]

        results = []
        for rec, sim in top_records:
            results.append({
                "id": str(rec.id),
                "source": rec.source,
                "title": rec.title,
                "content": rec.content,
                "metadata": rec.metadata_json or {},
                "region": rec.region,
                "language": rec.language,
                "similarity": sim
            })

        return results

    @classmethod
    async def ingest_chunk(
        cls,
        source: str,
        title: str,
        content: str,
        metadata: dict,
        db: AsyncSession,
        region: str | None = None,
        language: str = "en"
    ) -> KnowledgeEmbedding:
        """Helper to create and insert a new knowledge chunk with its embedding."""
        embedding = cls.get_embedding(content)
        new_chunk = KnowledgeEmbedding(
            source=source,
            title=title,
            content=content,
            embedding=embedding,
            metadata_json=metadata,
            region=region,
            language=language
        )
        db.add(new_chunk)
        logger.info(f"Ingested RAG chunk from source: {source} (Title length: {len(title)})")
        return new_chunk
