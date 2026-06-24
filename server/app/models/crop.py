"""
AgriSense AI — Crop Model
============================
Tracks crop lifecycle from sowing to harvest for each plot.
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Crop(Base):
    """Crop lifecycle model tied to a specific farm plot."""

    __tablename__ = "crops"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

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

    # --- Audit ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)

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
