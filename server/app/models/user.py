"""
AgriSense AI — User Model
===========================
Represents Admin/Coordinator and Farmer accounts.
Uses UUID primary keys to prevent enumeration attacks.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """User model for both Admin and Farmer roles."""

    __tablename__ = "users"

    # --- Primary Key (UUID for security) ---
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

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

    # --- Audit Timestamps ---
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
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Soft Delete ---
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # --- Relationships ---
    plots = relationship("FarmPlot", back_populates="farmer", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name={self.name}, role={self.role})>"
