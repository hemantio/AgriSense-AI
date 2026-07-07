"""
AgriSense AI — Irrigation Repository
=========================================
Data access for IrrigationLog model with plot-scoped queries.
"""

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.irrigation import IrrigationLog
from app.repositories.base import BaseRepository


class IrrigationRepository(BaseRepository[IrrigationLog]):
    """Repository for irrigation log database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(IrrigationLog, db)

    async def list_by_plot(
        self,
        plot_id: UUID,
        *,
        irrigation_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[IrrigationLog], int]:
        """List irrigation logs for a specific plot.

        Args:
            plot_id: Farm plot to filter by.
            irrigation_type: Optional filter (e.g. 'manual', 'motor', 'drip').
            page: 1-indexed page number.
            page_size: Items per page.

        Returns:
            Tuple of (items, total_count).
        """
        filters: list[Any] = [IrrigationLog.plot_id == plot_id]

        if irrigation_type:
            filters.append(IrrigationLog.irrigation_type == irrigation_type)

        return await self.list_paginated(
            filters=filters,
            page=page,
            page_size=page_size,
            order_by=IrrigationLog.watering_date.desc(),
        )

    async def list_for_user(
        self,
        *,
        user_id: str,
        role: str,
        plot_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[IrrigationLog], int]:
        """List irrigation logs with role-based scoping.

        Farmers see only logs for their own plots.
        Admins see all, optionally filtered by plot_id.
        """
        from app.models.plot import FarmPlot
        from sqlalchemy import select, func

        query = self._base_query()

        if role == "farmer":
            query = query.join(FarmPlot).where(FarmPlot.farmer_id == user_id)
        elif plot_id:
            query = query.where(IrrigationLog.plot_id == plot_id)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        # Paginate
        query = query.order_by(IrrigationLog.watering_date.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total
