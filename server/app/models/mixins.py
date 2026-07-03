"""
AgriSense AI — ORM Model Mixins
===================================
Reusable column mixins that eliminate boilerplate across all models.

Usage:
    class MyModel(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
        __tablename__ = "my_table"
        # only domain-specific columns here
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    """Provides a UUID primary key column."""

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TimestampMixin:
    """Provides created_at and updated_at audit columns."""

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


class SoftDeleteMixin:
    """Provides a soft-delete flag."""

    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
