"""
AgriSense AI — CIE Database Models
=====================================
ORM definitions for conversational sessions, history, tools, and vector embeddings.
"""

import json
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class VectorType(TypeDecorator):
    """
    Custom SQLAlchemy type to support pgvector in Postgres
    and fallback JSON float array storage in SQLite.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            try:
                from pgvector.sqlalchemy import Vector
                return dialect.type_descriptor(Vector(768))
            except ImportError:
                from sqlalchemy.sql.sqltypes import NullType
                class PostgreSQLVector(NullType):
                    def get_col_spec(self, **kw):
                        return "vector(768)"
                return dialect.type_descriptor(PostgreSQLVector())
        else:
            return dialect.type_descriptor(JSON)

    def process_bind_param(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        else:
            # SQLite stores vector as JSON list
            return value

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        else:
            # SQLite loads vector from JSON list/string
            if isinstance(value, str):
                return json.loads(value)
            return value


class ChatSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Represents a conversation session for a user."""
    __tablename__ = "chat_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="hi", nullable=False)
    page_context: Mapped[str | None] = mapped_column(String(100), nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", lazy="selectin")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

    def __repr__(self) -> str:
        return f"<ChatSession(id={self.id}, user_id={self.user_id}, active={self.is_active})>"


class ChatMessage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Represents an individual message (user text/voice, system instructions, AI text/tool calls/results)."""
    __tablename__ = "chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role: Mapped[str] = mapped_column(String(15), nullable=False)  # 'user', 'assistant', 'system', 'tool_call', 'tool_result'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    intent: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    entities: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    tool_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tool_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    action_taken: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    feedback = relationship("ChatFeedback", back_populates="message", cascade="all, delete-orphan", uselist=False)

    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, role={self.role}, intent={self.intent})>"


class KnowledgeEmbedding(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Agricultural knowledge chunks with embeddings for RAG retrieval."""
    __tablename__ = "knowledge_embeddings"

    source: Mapped[str] = mapped_column(String(50), nullable=False)  # 'crop_manual', 'govt_scheme', 'disease_db', 'best_practice'
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(VectorType, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    region: Mapped[str | None] = mapped_column(String(50), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)

    def __repr__(self) -> str:
        return f"<KnowledgeEmbedding(id={self.id}, source={self.source}, title={self.title})>"


class ChatFeedback(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """User feedback for chat responses."""
    __tablename__ = "chat_feedback"

    message_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("chat_messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # Rating 1-5
    was_helpful: Mapped[bool] = mapped_column(Boolean, nullable=False)
    correction: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    message = relationship("ChatMessage", back_populates="feedback")
    user = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<ChatFeedback(id={self.id}, rating={self.rating})>"


class ToolRegistry(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """AI Tool/Function Calling Registry."""
    __tablename__ = "tool_registry"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    schema: Mapped[dict] = mapped_column(JSON, nullable=False)
    endpoint_pattern: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    requires_confirmation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allowed_roles: Mapped[list[str]] = mapped_column(JSON, nullable=False)  # List of roles: ['admin', 'farmer']
    max_calls_per_session: Mapped[int] = mapped_column(Integer, default=10, nullable=False)

    def __repr__(self) -> str:
        return f"<ToolRegistry(name={self.name}, active={self.is_active})>"
