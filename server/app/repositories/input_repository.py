"""
AgriSense AI — Input Repository
===================================
Data access for InputRecord model with crop-ownership-aware queries.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crop import Crop
from app.models.input_record import InputRecord
from app.models.plot import FarmPlot
from app.repositories.base import BaseRepository


class InputRepository(BaseRepository[InputRecord]):
    """Repository for agricultural input record database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(InputRecord, db)

    async def list_for_user(
        self,
        *,
        user_id: str,
        role: str,
        crop_id: str | None = None,
        input_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[InputRecord], int]:
        """List input records with role-based scoping."""
        query = (
            select(InputRecord)
            .join(Crop)
            .join(FarmPlot)
            .where(
                InputRecord.is_deleted == False,  # noqa: E712
                Crop.is_deleted == False,  # noqa: E712
            )
        )

        if role == "farmer":
            query = query.where(FarmPlot.farmer_id == user_id)
        if crop_id:
            query = query.where(InputRecord.crop_id == crop_id)
        if input_type:
            query = query.where(InputRecord.input_type == input_type)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        query = query.order_by(InputRecord.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())
        return items, total

    async def get_recent_for_crop(
        self, crop_id: UUID, *, limit: int = 5
    ) -> list[InputRecord]:
        """Get most recent inputs for a crop (used by recommendation engine)."""
        result = await self.db.execute(
            select(InputRecord)
            .where(
                InputRecord.crop_id == crop_id,
                InputRecord.is_deleted == False,  # noqa: E712
            )
            .order_by(InputRecord.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
