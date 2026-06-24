"""
AgriSense AI — Input Record Model
====================================
Tracks fertilizer and pesticide applications with OCR support.
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InputRecord(Base):
    """Agricultural input (fertilizer/pesticide) tracking model."""

    __tablename__ = "input_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # --- Foreign Key ---
    crop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Input Details ---
    input_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "fertilizer", "pesticide", "herbicide", "growth_regulator"
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(150), nullable=True)
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity_unit: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # "kg", "liters", "ml", "grams"
    application_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    application_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Image & OCR ---
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ocr_extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

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
    crop = relationship("Crop", back_populates="input_records")

    def __repr__(self) -> str:
        return f"<InputRecord(id={self.id}, type={self.input_type}, product={self.product_name})>"
