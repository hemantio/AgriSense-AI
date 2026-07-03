"""
AgriSense AI — User Repository
==================================
Data access for User model with auth-specific queries.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user-related database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """Find an active, non-deleted user by email."""
        result = await self.db.execute(
            select(User).where(
                User.email == email,
                User.is_active == True,  # noqa: E712
                User.is_deleted == False,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def get_active_by_id(self, user_id: UUID) -> User | None:
        """Find an active user by ID (for token validation)."""
        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.is_active == True,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        """Check if an email is already registered."""
        result = await self.db.execute(
            select(User.id).where(User.email == email)
        )
        return result.scalar_one_or_none() is not None

    async def count_active_farmers(self) -> int:
        """Count active, non-deleted farmers."""
        return await self.count(
            filters=[
                User.role == "farmer",
                User.is_active == True,  # noqa: E712
            ]
        )
