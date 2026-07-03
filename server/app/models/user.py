"""
AgriSense AI — User Model
===========================
Represents Admin/Coordinator and Farmer accounts.
Uses UUID primary keys to prevent enumeration attacks.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """User model for both Admin and Farmer roles."""

    __tablename__ = "users"

    # --- Authentication ---
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="farmer"
    )  # "admin" or "farmer"

    # --- Profile ---
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    village_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    preferred_language: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Account Status ---
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # --- Extra Timestamps ---
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Relationships ---
    plots = relationship("FarmPlot", back_populates="farmer", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name={self.name}, role={self.role})>"
