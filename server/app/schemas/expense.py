"""
AgriSense AI — Expense Schemas
=================================
Pydantic schemas for expense management.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator
import bleach


VALID_EXPENSE_CATEGORIES = [
    "seeds", "fertilizer", "pesticide", "labor",
    "irrigation", "miscellaneous",
]


class ExpenseCreateRequest(BaseModel):
    """Schema for recording an expense."""

    crop_id: uuid.UUID
    category: str = Field(...)
    amount: float = Field(..., gt=0, le=10_000_000)
    currency: str = Field(default="INR", max_length=10)
    expense_date: date | None = None
    description: str | None = Field(default=None, max_length=300)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_EXPENSE_CATEGORIES:
            raise ValueError(
                f"Invalid category. Must be one of: {VALID_EXPENSE_CATEGORIES}"
            )
        return v

    @field_validator("description", "notes")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class ExpenseUpdateRequest(BaseModel):
    """Schema for updating an expense."""

    category: str | None = None
    amount: float | None = Field(default=None, gt=0, le=10_000_000)
    expense_date: date | None = None
    description: str | None = Field(default=None, max_length=300)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_EXPENSE_CATEGORIES:
            raise ValueError(
                f"Invalid category. Must be one of: {VALID_EXPENSE_CATEGORIES}"
            )
        return v

    @field_validator("description", "notes")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class ExpenseResponse(BaseModel):
    """Schema for expense responses."""

    id: uuid.UUID
    crop_id: uuid.UUID
    category: str
    amount: float
    currency: str
    expense_date: date | None = None
    description: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseSummaryResponse(BaseModel):
    """Schema for expense summary by category."""

    category: str
    total_amount: float
    count: int


class ExpenseListResponse(BaseModel):
    """Paginated expense list with summary."""

    expenses: list[ExpenseResponse]
    total: int
    page: int
    page_size: int
    summary: list[ExpenseSummaryResponse] = []
    grand_total: float = 0.0
