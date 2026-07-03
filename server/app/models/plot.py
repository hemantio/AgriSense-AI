"""
AgriSense AI — Farm Plot Model
================================
Represents individual farm plots owned by farmers.
Supports map-based coordinates and admin verification.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class FarmPlot(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Farm plot model with geospatial data and verification workflow."""

    __tablename__ = "farm_plots"

    # --- Foreign Key ---
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Plot Details ---
    plot_name: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    coordinates_geojson: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # GeoJSON polygon for boundaries
    approximate_area_acres: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    soil_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    map_reference: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Verification ---
    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # "pending", "verified", "rejected"
    verified_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Relationships ---
    farmer = relationship("User", back_populates="plots")
    crops = relationship("Crop", back_populates="plot", lazy="selectin")
    irrigation_logs = relationship(
        "IrrigationLog", back_populates="plot", lazy="selectin"
    )
    health_records = relationship(
        "HealthRecord", back_populates="plot", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<FarmPlot(id={self.id}, name={self.plot_name}, farmer_id={self.farmer_id})>"
