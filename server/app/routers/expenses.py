"""
AgriSense AI — Expenses Router
==================================
Expense tracking with category-wise summaries.
"""

import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.crop import Crop
from app.models.expense import Expense
from app.models.plot import FarmPlot
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
    db: AsyncSession = Depends(get_db),
):
    """List expenses with filtering and category summary."""
    query = (
        select(Expense)
        .join(Crop)
        .join(FarmPlot)
        .where(
            Expense.is_deleted == False,  # noqa: E712
            Crop.is_deleted == False,  # noqa: E712
        )
    )

    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    if crop_id:
        query = query.where(Expense.crop_id == crop_id)
    if category:
        query = query.where(Expense.category == category)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Get category summaries
    summary_query = (
        select(
            Expense.category,
            func.sum(Expense.amount).label("total_amount"),
            func.count().label("count"),
        )
        .join(Crop)
        .join(FarmPlot)
        .where(
            Expense.is_deleted == False,  # noqa: E712
            Crop.is_deleted == False,  # noqa: E712
        )
        .group_by(Expense.category)
    )
    if current_user["role"] == "farmer":
        summary_query = summary_query.where(FarmPlot.farmer_id == current_user["user_id"])
    if crop_id:
        summary_query = summary_query.where(Expense.crop_id == crop_id)

    summary_result = await db.execute(summary_query)
    summaries = [
        ExpenseSummaryResponse(
            category=row.category,
            total_amount=float(row.total_amount or 0),
            count=row.count,
        )
        for row in summary_result.all()
    ]
    grand_total = sum(s.total_amount for s in summaries)

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Expense.created_at.desc())

    result = await db.execute(query)
    expenses = result.scalars().all()

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
    db: AsyncSession = Depends(get_db),
):
    """Record a new farming expense."""
    # Verify crop ownership
    query = select(Crop).join(FarmPlot).where(
        Crop.id == body.crop_id,
        Crop.is_deleted == False,  # noqa: E712
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Crop not found")

    expense = Expense(
        crop_id=body.crop_id,
        category=body.category,
        amount=body.amount,
        currency=body.currency,
        expense_date=body.expense_date,
        description=body.description,
        notes=body.notes,
    )
    db.add(expense)
    await db.flush()

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
    db: AsyncSession = Depends(get_db),
):
    """Get a specific expense record."""
    query = (
        select(Expense)
        .join(Crop)
        .join(FarmPlot)
        .where(
            Expense.id == expense_id,
            Expense.is_deleted == False,  # noqa: E712
        )
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an expense record."""
    query = (
        select(Expense)
        .join(Crop)
        .join(FarmPlot)
        .where(
            Expense.id == expense_id,
            Expense.is_deleted == False,  # noqa: E712
        )
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    await db.flush()

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
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete an expense record."""
    query = (
        select(Expense)
        .join(Crop)
        .join(FarmPlot)
        .where(
            Expense.id == expense_id,
            Expense.is_deleted == False,  # noqa: E712
        )
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    expense.is_deleted = True
    await db.flush()

    await log_action(
        action="delete",
        resource_type="expense",
        resource_id=expense_id,
        user_id=current_user["user_id"],
    )
