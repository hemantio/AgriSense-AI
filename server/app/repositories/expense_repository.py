"""
AgriSense AI — Expense Repository
=====================================
Data access for Expense model with category summaries.
"""

from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crop import Crop
from app.models.expense import Expense
from app.models.plot import FarmPlot
from app.repositories.base import BaseRepository


class ExpenseRepository(BaseRepository[Expense]):
    """Repository for expense database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Expense, db)

    def _user_scoped_query(self, user_id: str, role: str):
        """Base query with ownership via crop → plot join."""
        query = (
            select(Expense)
            .join(Crop)
            .join(FarmPlot)
            .where(
                Expense.is_deleted == False,  # noqa: E712
                Crop.is_deleted == False,  # noqa: E712
            )
        )
        if role == "farmer":
            query = query.where(FarmPlot.farmer_id == user_id)
        return query

    async def list_for_user(
        self,
        *,
        user_id: str,
        role: str,
        crop_id: str | None = None,
        category: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Expense], int]:
        """List expenses with role-based scoping."""
        query = self._user_scoped_query(user_id, role)

        if crop_id:
            query = query.where(Expense.crop_id == crop_id)
        if category:
            query = query.where(Expense.category == category)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(Expense.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())
        return items, total

    async def get_for_user(
        self, expense_id: UUID, *, user_id: str, role: str
    ) -> Expense | None:
        """Get an expense with ownership check."""
        query = self._user_scoped_query(user_id, role).where(
            Expense.id == expense_id
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_category_summary(
        self,
        *,
        user_id: str,
        role: str,
        crop_id: str | None = None,
    ) -> list[dict]:
        """Get expense totals grouped by category."""
        query = (
            select(
                Expense.category,
                func.sum(Expense.amount).label("total_amount"),
                func.count().label("count"),
            )
            .join(Crop)
            .join(FarmPlot)
            .where(
                Expense.is_deleted == False,  # noqa: E712
                Crop.is_deleted == False,  # noqa: E712
            )
            .group_by(Expense.category)
        )
        if role == "farmer":
            query = query.where(FarmPlot.farmer_id == user_id)
        if crop_id:
            query = query.where(Expense.crop_id == crop_id)

        result = await self.db.execute(query)
        return [
            {
                "category": row.category,
                "total_amount": float(row.total_amount or 0),
                "count": row.count,
            }
            for row in result.all()
        ]

    async def get_total_expenses(
        self, *, user_id: str | None = None
    ) -> float:
        """Get grand total of all expenses, optionally for a specific user."""
        query = (
            select(func.coalesce(func.sum(Expense.amount), 0.0))
            .select_from(Expense)
            .join(Crop)
            .join(FarmPlot)
            .where(Expense.is_deleted == False)  # noqa: E712
        )
        if user_id:
            query = query.where(FarmPlot.farmer_id == user_id)
        return float((await self.db.execute(query)).scalar() or 0.0)
