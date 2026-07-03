"""
AgriSense AI — Expense Model
===============================
Tracks farming expenses by category per crop.
"""

import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Expense(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Farming expense record tied to a specific crop."""

    __tablename__ = "expenses"

    # --- Foreign Key ---
    crop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Expense Details ---
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "seeds", "fertilizer", "pesticide", "labor", "irrigation", "miscellaneous"
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(10), nullable=False, default="INR"
    )
    expense_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Receipt ---
    receipt_image_path: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    # --- Relationships ---
    crop = relationship("Crop", back_populates="expenses")

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, category={self.category}, amount={self.amount})>"
