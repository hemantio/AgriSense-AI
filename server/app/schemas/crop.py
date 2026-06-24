"""
AgriSense AI — Crop Schemas
==============================
Pydantic schemas for crop lifecycle management.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator
import bleach


VALID_CROP_STAGES = [
    "sowing", "germination", "vegetative", "flowering",
    "fruiting", "harvest", "post-harvest",
]


class CropCreateRequest(BaseModel):
    """Schema for registering a new crop on a plot."""

    plot_id: uuid.UUID
    crop_name: str = Field(..., min_length=2, max_length=150)
    seed_variety: str | None = Field(default=None, max_length=150)
    seed_brand: str | None = Field(default=None, max_length=150)
    sowing_date: date | None = None
    expected_harvest_date: date | None = None
    crop_stage: str = Field(default="sowing")
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("crop_stage")
    @classmethod
    def validate_crop_stage(cls, v: str) -> str:
        if v not in VALID_CROP_STAGES:
            raise ValueError(f"Invalid crop stage. Must be one of: {VALID_CROP_STAGES}")
        return v

    @field_validator("crop_name", "seed_variety", "seed_brand", "description")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class CropUpdateRequest(BaseModel):
    """Schema for updating crop details."""

    crop_name: str | None = Field(default=None, min_length=2, max_length=150)
    seed_variety: str | None = Field(default=None, max_length=150)
    seed_brand: str | None = Field(default=None, max_length=150)
    sowing_date: date | None = None
    expected_harvest_date: date | None = None
    actual_harvest_date: date | None = None
    crop_stage: str | None = None
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("crop_stage")
    @classmethod
    def validate_crop_stage(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_CROP_STAGES:
            raise ValueError(f"Invalid crop stage. Must be one of: {VALID_CROP_STAGES}")
        return v

    @field_validator("crop_name", "seed_variety", "seed_brand", "description")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class CropResponse(BaseModel):
    """Schema for crop responses."""

    id: uuid.UUID
    plot_id: uuid.UUID
    crop_name: str
    seed_variety: str | None = None
    seed_brand: str | None = None
    sowing_date: date | None = None
    expected_harvest_date: date | None = None
    actual_harvest_date: date | None = None
    crop_stage: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CropListResponse(BaseModel):
    """Paginated list of crops."""

    crops: list[CropResponse]
    total: int
    page: int
    page_size: int
