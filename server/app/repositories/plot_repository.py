"""
AgriSense AI — Plot Repository
==================================
Data access for FarmPlot model with role-scoped and verification queries.
"""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.plot import FarmPlot
from app.repositories.base import BaseRepository


class PlotRepository(BaseRepository[FarmPlot]):
    """Repository for farm plot database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(FarmPlot, db)

    async def list_for_user(
        self,
        *,
        user_id: str,
        role: str,
        farmer_id: str | None = None,
        verification_status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[FarmPlot], int]:
        """List plots with role-based scoping.

        - Farmers see only their own plots.
        - Admins see all, optionally filtered by farmer_id.
        """
        filters: list[Any] = []

        if role == "farmer":
            filters.append(FarmPlot.farmer_id == user_id)
        elif farmer_id:
            filters.append(FarmPlot.farmer_id == farmer_id)

        if verification_status:
            filters.append(FarmPlot.verification_status == verification_status)

        return await self.list_paginated(
            filters=filters,
            page=page,
            page_size=page_size,
        )

    async def get_for_user(
        self, plot_id: UUID, *, user_id: str, role: str
    ) -> FarmPlot | None:
        """Get a plot with ownership check for farmers."""
        query = self._base_query().where(FarmPlot.id == plot_id)
        if role == "farmer":
            query = query.where(FarmPlot.farmer_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def verify(
        self,
        plot_id: UUID,
        *,
        status: str,
        verified_by: str,
    ) -> FarmPlot | None:
        """Set verification status on a plot (admin action)."""
        plot = await self.get_by_id(plot_id)
        if plot is None:
            return None

        plot.verification_status = status
        plot.verified_by = verified_by
        plot.verified_at = datetime.now(UTC)
        await self.db.flush()
        return plot

    async def count_by_status(
        self,
        status: str,
        *,
        user_id: str | None = None,
    ) -> int:
        """Count plots by verification status, optionally scoped to a user."""
        filters: list[Any] = [FarmPlot.verification_status == status]
        if user_id:
            filters.append(FarmPlot.farmer_id == user_id)
        return await self.count(filters=filters)
