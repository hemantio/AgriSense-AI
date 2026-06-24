"""
AgriSense AI — Farmer Schemas
================================
Pydantic schemas for farmer management operations.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator
import bleach


class FarmerCreateRequest(BaseModel):
    """Schema for admin creating a farmer account."""

    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=2, max_length=150)
    phone_number: str | None = Field(
        default=None, max_length=20, pattern=r"^\+?[\d\s\-]{7,20}$"
    )
    village_name: str | None = Field(default=None, max_length=150)
    preferred_language: str = Field(default="en", max_length=10)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "village_name", "notes")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class FarmerResponse(BaseModel):
    """Schema for farmer profile responses."""

    id: uuid.UUID
    email: str
    name: str
    role: str
    phone_number: str | None = None
    village_name: str | None = None
    preferred_language: str
    is_active: bool
    is_verified: bool
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
    plots_count: int = 0

    model_config = {"from_attributes": True}


class FarmerListResponse(BaseModel):
    """Paginated list of farmers."""

    farmers: list[FarmerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
