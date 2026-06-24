"""
AgriSense AI — Irrigation Log Model
======================================
Tracks irrigation events with water usage estimation.
"""

import GUID
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, GUID


class IrrigationLog(Base):
    """Irrigation event log for a farm plot."""

    __tablename__ = "irrigation_logs"

    id: Mapped[GUID.GUID] = mapped_column(
        GUID,
        primary_key=True,
        default=GUID.uuid4,
        index=True,
    )

    # --- Foreign Key ---
    plot_id: Mapped[GUID.GUID] = mapped_column(
        GUID,
        ForeignKey("farm_plots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Irrigation Details ---
    irrigation_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="manual"
    )  # "manual", "motor", "drip", "sprinkler", "canal"
    watering_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_water_liters: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # --- Motor Details (for future IoT) ---
    motor_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    power_consumed_kwh: Mapped[float | None] = mapped_column(Float, nullable=True)

    # --- Notes ---
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Source ---
    source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="manual_entry"
    )  # "manual_entry", "iot_sensor", "simulation"

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
    plot = relationship("FarmPlot", back_populates="irrigation_logs")

    def __repr__(self) -> str:
        return f"<IrrigationLog(id={self.id}, type={self.irrigation_type}, date={self.watering_date})>"
