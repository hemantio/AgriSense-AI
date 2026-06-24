"""
AgriSense AI — Health Record Model
=====================================
Stores AI-analyzed crop health results with image references.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HealthRecord(Base):
    """Crop health analysis record from AI image processing."""

    __tablename__ = "health_records"

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
    crop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # --- Image ---
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # --- AI Analysis Results ---
    ai_result: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Full AI response JSON
    health_score: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # 0.0 (critical) to 100.0 (healthy)
    diagnosis: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )  # "healthy", "leaf_blight", "pest_damage", etc.
    confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # AI confidence 0.0–1.0
    severity: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # "none", "low", "medium", "high", "critical"
    recommendation_text: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # --- Processing Status ---
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # "pending", "processing", "completed", "failed"

    # --- Audit ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)

    # --- Relationships ---
    plot = relationship("FarmPlot", back_populates="health_records")

    def __repr__(self) -> str:
        return f"<HealthRecord(id={self.id}, score={self.health_score}, diagnosis={self.diagnosis})>"
