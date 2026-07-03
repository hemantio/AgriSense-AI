"""
AgriSense AI — Health Repository
====================================
Data access for HealthRecord model with plot-ownership-aware queries.
"""

from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health_record import HealthRecord
from app.models.plot import FarmPlot
from app.repositories.base import BaseRepository


class HealthRepository(BaseRepository[HealthRecord]):
    """Repository for health record database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(HealthRecord, db)

    async def list_for_user(
        self,
        *,
        user_id: str,
        role: str,
        plot_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[HealthRecord], int]:
        """List health records with role-based scoping."""
        query = select(HealthRecord).where(
            HealthRecord.is_deleted == False,  # noqa: E712
        )

        if plot_id:
            query = query.where(HealthRecord.plot_id == plot_id)

        if role == "farmer":
            query = query.join(FarmPlot).where(
                FarmPlot.farmer_id == user_id
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(HealthRecord.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())
        return items, total

    async def get_for_user(
        self, record_id: UUID, *, user_id: str, role: str
    ) -> HealthRecord | None:
        """Get a health record with ownership check."""
        query = select(HealthRecord).where(
            HealthRecord.id == record_id,
            HealthRecord.is_deleted == False,  # noqa: E712
        )
        if role == "farmer":
            query = query.join(FarmPlot).where(
                FarmPlot.farmer_id == user_id
            )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_latest_for_plot(
        self, plot_id: UUID, *, status: str = "completed"
    ) -> HealthRecord | None:
        """Get the most recent completed health record for a plot."""
        result = await self.db.execute(
            select(HealthRecord)
            .where(
                HealthRecord.plot_id == plot_id,
                HealthRecord.is_deleted == False,  # noqa: E712
                HealthRecord.status == status,
            )
            .order_by(HealthRecord.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def count_critical(self, *, user_id: str | None = None) -> int:
        """Count health records with high/critical severity."""
        query = (
            select(func.count())
            .select_from(HealthRecord)
            .join(FarmPlot)
            .where(
                HealthRecord.is_deleted == False,  # noqa: E712
                HealthRecord.severity.in_(["high", "critical"]),
            )
        )
        if user_id:
            query = query.where(FarmPlot.farmer_id == user_id)
        return (await self.db.execute(query)).scalar() or 0
