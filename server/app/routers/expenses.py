"""
AgriSense AI — Expenses Router (Refactored)
===============================================
Expense tracking with Repository + DI + Domain Exceptions.
"""

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_crop_repository, get_expense_repository
from app.exceptions import NotFoundError
from app.repositories.crop_repository import CropRepository
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import (
    ExpenseCreateRequest,
    ExpenseListResponse,
    ExpenseResponse,
    ExpenseSummaryResponse,
    ExpenseUpdateRequest,
)
from app.security import get_current_user
from app.utils.audit import log_action

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("/", response_model=ExpenseListResponse)
async def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    crop_id: str | None = Query(None),
    category: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    """List expenses with filtering and category summary."""
    expenses, total = await repo.list_for_user(
        user_id=current_user["user_id"],
        role=current_user["role"],
        crop_id=crop_id,
        category=category,
        page=page,
        page_size=page_size,
    )

    # Get category summaries
    summary_data = await repo.get_category_summary(
        user_id=current_user["user_id"],
        role=current_user["role"],
        crop_id=crop_id,
    )
    summaries = [ExpenseSummaryResponse(**s) for s in summary_data]
    grand_total = sum(s.total_amount for s in summaries)

    return ExpenseListResponse(
        expenses=[ExpenseResponse.model_validate(e) for e in expenses],
        total=total,
        page=page,
        page_size=page_size,
        summary=summaries,
        grand_total=grand_total,
    )


@router.post("/", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    body: ExpenseCreateRequest,
    current_user: dict = Depends(get_current_user),
    expense_repo: ExpenseRepository = Depends(get_expense_repository),
    crop_repo: CropRepository = Depends(get_crop_repository),
):
    """Record a new farming expense."""
    # Verify crop ownership
    crop = await crop_repo.get_for_user(
        body.crop_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not crop:
        raise NotFoundError("Crop", str(body.crop_id))

    expense = await expense_repo.create(
        crop_id=body.crop_id,
        category=body.category,
        amount=body.amount,
        currency=body.currency,
        expense_date=body.expense_date,
        description=body.description,
        notes=body.notes,
    )

    await log_action(
        action="create",
        resource_type="expense",
        resource_id=str(expense.id),
        user_id=current_user["user_id"],
        details={"category": body.category, "amount": body.amount},
    )
    return expense


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    """Get a specific expense record."""
    expense = await repo.get_for_user(
        expense_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not expense:
        raise NotFoundError("Expense", expense_id)
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdateRequest,
    current_user: dict = Depends(get_current_user),
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    """Update an expense record."""
    expense = await repo.get_for_user(
        expense_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not expense:
        raise NotFoundError("Expense", expense_id)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    await repo.db.flush()

    await log_action(
        action="update",
        resource_type="expense",
        resource_id=expense_id,
        user_id=current_user["user_id"],
    )
    return expense


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_user),
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    """Soft-delete an expense record."""
    expense = await repo.get_for_user(
        expense_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not expense:
        raise NotFoundError("Expense", expense_id)

    expense.is_deleted = True
    await repo.db.flush()

    await log_action(
        action="delete",
        resource_type="expense",
        resource_id=expense_id,
        user_id=current_user["user_id"],
    )
