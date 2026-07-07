"""
AgriSense AI — Simulation Repository
=========================================
Data access for Simulation model with user-scoped queries.

Note: Simulation is an append-only log (no SoftDeleteMixin),
so _base_query is overridden to skip is_deleted filtering.
"""

from typing import Any
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulation import Simulation
from app.repositories.base import BaseRepository


class SimulationRepository(BaseRepository[Simulation]):
    """Repository for simulation record database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Simulation, db)

    def _base_query(self, *, include_deleted: bool = False) -> Select:
        """Override: Simulation has no soft-delete, always return plain SELECT."""
        return select(self.model)

    async def list_by_user(
        self,
        user_id: UUID,
        *,
        scenario_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Simulation], int]:
        """List simulation records created by a specific user.

        Args:
            user_id: Creator user ID.
            scenario_type: Optional scenario type filter.
            page: 1-indexed page number.
            page_size: Items per page.

        Returns:
            Tuple of (items, total_count).
        """
        filters: list[Any] = [Simulation.created_by == user_id]

        if scenario_type:
            filters.append(Simulation.scenario_type == scenario_type)

        return await self.list_paginated(
            filters=filters,
            page=page,
            page_size=page_size,
            order_by=Simulation.created_at.desc(),
        )

    async def get_latest_by_type(
        self,
        scenario_type: str,
        *,
        user_id: UUID | None = None,
    ) -> Simulation | None:
        """Get the most recent simulation of a given type.

        Args:
            scenario_type: The scenario type to filter by.
            user_id: Optional user scope.

        Returns:
            The most recent Simulation, or None.
        """
        query = self._base_query().where(
            Simulation.scenario_type == scenario_type,
            Simulation.status == "completed",
        )

        if user_id:
            query = query.where(Simulation.created_by == user_id)

        query = query.order_by(Simulation.created_at.desc()).limit(1)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()
