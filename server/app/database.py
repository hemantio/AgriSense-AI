"""
AgriSense AI — Database Engine & Session Management
=====================================================
Async SQLAlchemy 2.0 setup with connection pooling for PostgreSQL.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# --- Async Engine configuration ---
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DB_ECHO,
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_pre_ping=True,  # Verify connections before use
        echo=settings.DB_ECHO,
    )

# --- Session Factory ---
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# --- Base Model ---
class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# --- Dependency Injection ---
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a database session.
    Automatically commits on success, rolls back on error,
    and closes the session when the request completes.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# --- Lifecycle Helpers ---
async def init_db() -> None:
    """Create all tables (for development/testing only)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose of the engine connection pool."""
    await engine.dispose()
