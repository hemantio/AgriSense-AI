"""
AgriSense AI — Authentication Schemas
========================================
Pydantic v2 schemas for auth request/response validation.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator
import bleach


class UserRegisterRequest(BaseModel):
    """Schema for user registration (admin-only action)."""

    email: EmailStr
    password: str = Field(
        ..., min_length=8, max_length=128,
        description="Password must be 8-128 characters",
    )
    name: str = Field(..., min_length=2, max_length=150)
    role: str = Field(default="farmer", pattern=r"^(admin|farmer)$")
    phone_number: str | None = Field(
        default=None, max_length=20, pattern=r"^\+?[\d\s\-]{7,20}$"
    )
    village_name: str | None = Field(default=None, max_length=150)
    preferred_language: str = Field(default="en", max_length=10)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "village_name", "notes")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        """Strip HTML/script tags from text inputs."""
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Enforce minimum password complexity."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLoginRequest(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: "UserProfileResponse"


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh."""

    refresh_token: str


class UserProfileResponse(BaseModel):
    """Schema for user profile in responses."""

    id: uuid.UUID
    email: str
    name: str
    role: str
    phone_number: str | None = None
    village_name: str | None = None
    preferred_language: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    """Schema for updating user profile."""

    name: str | None = Field(default=None, min_length=2, max_length=150)
    phone_number: str | None = Field(
        default=None, max_length=20, pattern=r"^\+?[\d\s\-]{7,20}$"
    )
    village_name: str | None = Field(default=None, max_length=150)
    preferred_language: str | None = Field(default=None, max_length=10)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "village_name", "notes")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class PasswordChangeRequest(BaseModel):
    """Schema for password change."""

    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
