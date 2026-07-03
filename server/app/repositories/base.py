"""
AgriSense AI — Base Repository
==================================
Generic async repository providing reusable CRUD operations
with soft-delete awareness, pagination, and role-scoped queries.

All domain repositories extend this base to inherit standard
data access patterns and reduce boilerplate in routers/services.
"""

from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Generic async repository for SQLAlchemy models.

    Provides:
        - get_by_id: fetch single record with soft-delete awareness
        - list_paginated: filtered, paginated queries
        - create: insert a new record
        - update: partial update by id
        - soft_delete: mark record as deleted
        - count: count matching records
        - _base_query: extensible base query with soft-delete filter
    """

    def __init__(self, model: type[ModelT], db: AsyncSession):
        self.model = model
        self.db = db

    def _base_query(self, *, include_deleted: bool = False) -> Select:
        """Build a base SELECT with optional soft-delete filtering."""
        query = select(self.model)
        if not include_deleted and hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)  # noqa: E712
        return query

    async def get_by_id(
        self, id: UUID, *, include_deleted: bool = False
    ) -> ModelT | None:
        """Fetch a single record by primary key."""
        query = self._base_query(include_deleted=include_deleted).where(
            self.model.id == id
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        *,
        filters: list[Any] | None = None,
        order_by: Any | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ModelT], int]:
        """Fetch paginated results with optional filters.

        Args:
            filters: List of SQLAlchemy filter expressions.
            order_by: Column to sort by (defaults to created_at desc).
            page: 1-indexed page number.
            page_size: Items per page.

        Returns:
            Tuple of (items, total_count).
        """
        query = self._base_query()

        if filters:
            for f in filters:
                query = query.where(f)

        # Count total matching records
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        # Apply ordering
        if order_by is not None:
            query = query.order_by(order_by)
        elif hasattr(self.model, "created_at"):
            query = query.order_by(self.model.created_at.desc())

        # Paginate
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def create(self, **kwargs: Any) -> ModelT:
        """Insert a new record and flush to obtain its ID."""
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        return instance

    async def update(self, id: UUID, data: dict[str, Any]) -> ModelT | None:
        """Partially update a record by primary key.

        Args:
            id: Record primary key.
            data: Dictionary of field names to new values (unset fields excluded).

        Returns:
            Updated model instance, or None if not found.
        """
        instance = await self.get_by_id(id)
        if instance is None:
            return None

        for field, value in data.items():
            setattr(instance, field, value)

        await self.db.flush()
        return instance

    async def soft_delete(self, id: UUID) -> bool:
        """Mark a record as deleted (soft-delete).

        Returns:
            True if record was found and deleted, False otherwise.
        """
        instance = await self.get_by_id(id)
        if instance is None:
            return False

        if hasattr(instance, "is_deleted"):
            instance.is_deleted = True
            await self.db.flush()
            return True

        return False

    async def count(self, *, filters: list[Any] | None = None) -> int:
        """Count records matching optional filters."""
        query = self._base_query()
        if filters:
            for f in filters:
                query = query.where(f)
        count_query = select(func.count()).select_from(query.subquery())
        return (await self.db.execute(count_query)).scalar() or 0
