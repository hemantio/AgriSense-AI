"""
AgriSense AI — Plot Schemas
==============================
Pydantic schemas for farm plot management.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator
import bleach


class PlotCreateRequest(BaseModel):
    """Schema for creating a new farm plot."""

    plot_name: str = Field(..., min_length=2, max_length=200)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    coordinates_geojson: str | None = Field(default=None, max_length=10000)
    approximate_area_acres: float | None = Field(default=None, gt=0, le=10000)
    soil_type: str | None = Field(default=None, max_length=100)

    @field_validator("plot_name", "soil_type")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class PlotUpdateRequest(BaseModel):
    """Schema for updating a farm plot."""

    plot_name: str | None = Field(default=None, min_length=2, max_length=200)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    coordinates_geojson: str | None = Field(default=None, max_length=10000)
    approximate_area_acres: float | None = Field(default=None, gt=0, le=10000)
    soil_type: str | None = Field(default=None, max_length=100)

    @field_validator("plot_name", "soil_type")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class PlotVerifyRequest(BaseModel):
    """Schema for admin verifying a plot."""

    verification_status: str = Field(..., pattern=r"^(verified|rejected)$")


class PlotResponse(BaseModel):
    """Schema for plot responses."""

    id: uuid.UUID
    farmer_id: uuid.UUID
    plot_name: str
    latitude: float | None = None
    longitude: float | None = None
    coordinates_geojson: str | None = None
    approximate_area_acres: float | None = None
    soil_type: str | None = None
    verification_status: str
    verified_by: uuid.UUID | None = None
    verified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlotListResponse(BaseModel):
    """Paginated list of plots."""

    plots: list[PlotResponse]
    total: int
    page: int
    page_size: int
