"""
AgriSense AI — Crop Repository
==================================
Data access for Crop model with plot-ownership-aware queries.
"""

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crop import Crop
from app.models.plot import FarmPlot
from app.repositories.base import BaseRepository


class CropRepository(BaseRepository[Crop]):
    """Repository for crop database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Crop, db)

    def _user_scoped_query(self, user_id: str, role: str):
        """Base query that enforces farmer ownership via plot join."""
        query = (
            select(Crop)
            .join(FarmPlot)
            .where(
                Crop.is_deleted == False,  # noqa: E712
                FarmPlot.is_deleted == False,  # noqa: E712
            )
        )
        if role == "farmer":
            query = query.where(FarmPlot.farmer_id == (UUID(user_id) if isinstance(user_id, str) else user_id))
        return query

    async def list_for_user(
        self,
        *,
        user_id: str,
        role: str,
        plot_id: str | None = None,
        crop_stage: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Crop], int]:
        """List crops with role-based scoping through plot ownership."""
        query = self._user_scoped_query(user_id, role)

        if plot_id:
            query = query.where(Crop.plot_id == plot_id)
        if crop_stage:
            query = query.where(Crop.crop_stage == crop_stage)

        # Count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        # Paginate
        query = query.order_by(Crop.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def get_for_user(
        self, crop_id: UUID, *, user_id: str, role: str
    ) -> Crop | None:
        """Get a crop with ownership check through plot."""
        query = self._user_scoped_query(user_id, role).where(Crop.id == crop_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def count_active(
        self, *, user_id: str | None = None
    ) -> int:
        """Count active (non-post-harvest) crops."""
        filters: list[Any] = [Crop.crop_stage != "post-harvest"]
        if user_id:
            # Need join-based filter — use raw query
            from sqlalchemy import func
            query = (
                select(func.count())
                .select_from(Crop)
                .join(FarmPlot)
                .where(
                    Crop.is_deleted == False,  # noqa: E712
                    Crop.crop_stage != "post-harvest",
                    FarmPlot.farmer_id == (UUID(user_id) if isinstance(user_id, str) else user_id),
                )
            )
            return (await self.db.execute(query)).scalar() or 0
        return await self.count(filters=filters)
