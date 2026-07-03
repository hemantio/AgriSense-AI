"""
AgriSense AI — Crops Router (Refactored)
============================================
Crop lifecycle management with Repository + DI + Domain Exceptions.
"""

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_crop_repository, get_plot_repository
from app.exceptions import NotFoundError
from app.repositories.crop_repository import CropRepository
from app.repositories.plot_repository import PlotRepository
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
    repo: CropRepository = Depends(get_crop_repository),
):
    """List crops with filtering. Farmers see only their own."""
    crops, total = await repo.list_for_user(
        user_id=current_user["user_id"],
        role=current_user["role"],
        plot_id=plot_id,
        crop_stage=crop_stage,
        page=page,
        page_size=page_size,
    )

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
    crop_repo: CropRepository = Depends(get_crop_repository),
    plot_repo: PlotRepository = Depends(get_plot_repository),
):
    """Register a new crop on a plot."""
    # Verify plot ownership
    plot = await plot_repo.get_for_user(
        body.plot_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not plot:
        raise NotFoundError("Plot", str(body.plot_id))

    crop = await crop_repo.create(
        plot_id=body.plot_id,
        crop_name=body.crop_name,
        seed_variety=body.seed_variety,
        seed_brand=body.seed_brand,
        sowing_date=body.sowing_date,
        expected_harvest_date=body.expected_harvest_date,
        crop_stage=body.crop_stage,
        description=body.description,
    )

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
    repo: CropRepository = Depends(get_crop_repository),
):
    """Get a specific crop's details."""
    crop = await repo.get_for_user(
        crop_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not crop:
        raise NotFoundError("Crop", crop_id)
    return crop


@router.put("/{crop_id}", response_model=CropResponse)
async def update_crop(
    crop_id: str,
    body: CropUpdateRequest,
    current_user: dict = Depends(get_current_user),
    repo: CropRepository = Depends(get_crop_repository),
):
    """Update a crop's details or stage."""
    crop = await repo.get_for_user(
        crop_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not crop:
        raise NotFoundError("Crop", crop_id)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crop, field, value)
    await repo.db.flush()

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
    repo: CropRepository = Depends(get_crop_repository),
):
    """Soft-delete a crop record."""
    crop = await repo.get_for_user(
        crop_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not crop:
        raise NotFoundError("Crop", crop_id)

    crop.is_deleted = True
    await repo.db.flush()

    await log_action(
        action="delete",
        resource_type="crop",
        resource_id=crop_id,
        user_id=current_user["user_id"],
    )
