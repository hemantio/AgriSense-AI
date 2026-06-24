"""
AgriSense AI — Health Analysis Schemas
=========================================
Pydantic schemas for crop health monitoring.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class HealthAnalysisRequest(BaseModel):
    """Schema for requesting crop health analysis."""

    plot_id: uuid.UUID
    crop_id: uuid.UUID | None = None
    notes: str | None = Field(default=None, max_length=500)
    # Image is uploaded as multipart form data, not in JSON body


class HealthAnalysisResponse(BaseModel):
    """Schema for health analysis results."""

    id: uuid.UUID
    plot_id: uuid.UUID
    crop_id: uuid.UUID | None = None
    image_path: str
    upload_date: datetime
    health_score: float | None = None
    diagnosis: str | None = None
    confidence: float | None = None
    severity: str | None = None
    recommendation_text: str | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HealthHistoryResponse(BaseModel):
    """Paginated health analysis history."""

    records: list[HealthAnalysisResponse]
    total: int
    page: int
    page_size: int
