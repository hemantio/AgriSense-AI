"""
AgriSense AI — Group & GroupMember Models
===========================================
Represents farming cooperative and village groups that farmers can join.
"""

import uuid
import secrets
from datetime import datetime, UTC

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


def generate_join_code() -> str:
    """Generate a random 8-character unique group join code."""
    return secrets.token_hex(4).upper()


class Group(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Group model representing cooperatives or regional clubs."""

    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, default=generate_join_code
    )

    # --- Relationships ---
    members = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name={self.name}, code={self.code})>"


class GroupMember(UUIDPrimaryKeyMixin, Base):
    """Join table linking Farmers to Groups."""

    __tablename__ = "group_members"

    group_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # --- Relationships ---
    group = relationship("Group", back_populates="members")
    user = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<GroupMember(group_id={self.group_id}, user_id={self.user_id})>"
