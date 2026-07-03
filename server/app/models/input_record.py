"""
AgriSense AI — Input Record Model
====================================
Tracks fertilizer and pesticide applications with OCR support.
"""

import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class InputRecord(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Agricultural input (fertilizer/pesticide) tracking model."""

    __tablename__ = "input_records"

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

    # --- Relationships ---
    crop = relationship("Crop", back_populates="input_records")

    def __repr__(self) -> str:
        return f"<InputRecord(id={self.id}, type={self.input_type}, product={self.product_name})>"
