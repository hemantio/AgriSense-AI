"""
AgriSense AI — Crop Model
============================
Tracks crop lifecycle from sowing to harvest for each plot.
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Crop(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Crop lifecycle model tied to a specific farm plot."""

    __tablename__ = "crops"

    # --- Foreign Key ---
    plot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("farm_plots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Crop Details ---
    crop_name: Mapped[str] = mapped_column(String(150), nullable=False)
    seed_variety: Mapped[str | None] = mapped_column(String(150), nullable=True)
    seed_brand: Mapped[str | None] = mapped_column(String(150), nullable=True)
    sowing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # --- Crop Stage ---
    crop_stage: Mapped[str] = mapped_column(
        String(50), nullable=False, default="sowing"
    )  # "sowing", "germination", "vegetative", "flowering", "fruiting", "harvest", "post-harvest"

    # --- Notes ---
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Relationships ---
    plot = relationship("FarmPlot", back_populates="crops")
    input_records = relationship(
        "InputRecord", back_populates="crop", lazy="selectin"
    )
    expenses = relationship(
        "Expense", back_populates="crop", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Crop(id={self.id}, name={self.crop_name}, stage={self.crop_stage})>"
