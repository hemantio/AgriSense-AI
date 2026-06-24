"""
AgriSense AI — Crops Router
===============================
Crop lifecycle management with RBAC-filtered access.
"""

import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.crop import Crop
from app.models.plot import FarmPlot
from app.schemas.crop import (
    CropCreateRequest,
    CropListResponse,
    CropResponse,
    CropUpdateRequest,
)
from app.security import get_current_user
from app.utils.audit import log_action

router = APIRouter(prefix="/crops", tags=["Crops"])


@router.get("/", response_model=CropListResponse)
async def list_crops(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    plot_id: str | None = Query(None),
    crop_stage: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List crops with filtering. Farmers see only their own."""
    query = select(Crop).join(FarmPlot).where(
        Crop.is_deleted == False,  # noqa: E712
        FarmPlot.is_deleted == False,  # noqa: E712
    )

    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    if plot_id:
        query = query.where(Crop.plot_id == plot_id)
    if crop_stage:
        query = query.where(Crop.crop_stage == crop_stage)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Crop.created_at.desc())

    result = await db.execute(query)
    crops = result.scalars().all()

    return CropListResponse(
        crops=[CropResponse.model_validate(c) for c in crops],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=CropResponse, status_code=201)
async def create_crop(
    body: CropCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register a new crop on a plot."""
    # Verify plot ownership
    query = select(FarmPlot).where(
        FarmPlot.id == body.plot_id,
        FarmPlot.is_deleted == False,  # noqa: E712
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plot not found")

    crop = Crop(
        plot_id=body.plot_id,
        crop_name=body.crop_name,
        seed_variety=body.seed_variety,
        seed_brand=body.seed_brand,
        sowing_date=body.sowing_date,
        expected_harvest_date=body.expected_harvest_date,
        crop_stage=body.crop_stage,
        description=body.description,
    )
    db.add(crop)
    await db.flush()

    await log_action(
        action="create",
        resource_type="crop",
        resource_id=str(crop.id),
        user_id=current_user["user_id"],
    )
    return crop


@router.get("/{crop_id}", response_model=CropResponse)
async def get_crop(
    crop_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific crop's details."""
    query = select(Crop).join(FarmPlot).where(
        Crop.id == crop_id,
        Crop.is_deleted == False,  # noqa: E712
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    crop = result.scalar_one_or_none()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return crop


@router.put("/{crop_id}", response_model=CropResponse)
async def update_crop(
    crop_id: str,
    body: CropUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a crop's details or stage."""
    query = select(Crop).join(FarmPlot).where(
        Crop.id == crop_id,
        Crop.is_deleted == False,  # noqa: E712
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    crop = result.scalar_one_or_none()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crop, field, value)
    await db.flush()

    await log_action(
        action="update",
        resource_type="crop",
        resource_id=crop_id,
        user_id=current_user["user_id"],
        details={"updated_fields": list(update_data.keys())},
    )
    return crop


@router.delete("/{crop_id}", status_code=204)
async def delete_crop(
    crop_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a crop record."""
    query = select(Crop).join(FarmPlot).where(
        Crop.id == crop_id,
        Crop.is_deleted == False,  # noqa: E712
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    crop = result.scalar_one_or_none()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    crop.is_deleted = True
    await db.flush()

    await log_action(
        action="delete",
        resource_type="crop",
        resource_id=crop_id,
        user_id=current_user["user_id"],
    )
