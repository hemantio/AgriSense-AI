"""
AgriSense AI — Plots Router (Refactored)
============================================
Farm plot management with Repository + DI + Domain Exceptions.
"""

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_plot_repository
from app.exceptions import NotFoundError
from app.repositories.plot_repository import PlotRepository
from app.schemas.plot import (
    PlotCreateRequest,
    PlotListResponse,
    PlotResponse,
    PlotUpdateRequest,
    PlotVerifyRequest,
)
from app.security import UserRole, get_current_user, require_role
from app.utils.audit import log_action

router = APIRouter(prefix="/plots", tags=["Farm Plots"])


@router.get("/", response_model=PlotListResponse)
async def list_plots(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    farmer_id: str | None = Query(None),
    verification_status: str | None = Query(None, pattern=r"^(pending|verified|rejected)$"),
    current_user: dict = Depends(get_current_user),
    repo: PlotRepository = Depends(get_plot_repository),
):
    """
    List farm plots.

    - Admins can see all plots (optionally filtered by farmer_id).
    - Farmers can only see their own plots.
    """
    plots, total = await repo.list_for_user(
        user_id=current_user["user_id"],
        role=current_user["role"],
        farmer_id=farmer_id,
        verification_status=verification_status,
        page=page,
        page_size=page_size,
    )

    return PlotListResponse(
        plots=[PlotResponse.model_validate(p) for p in plots],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=PlotResponse, status_code=201)
async def create_plot(
    body: PlotCreateRequest,
    current_user: dict = Depends(get_current_user),
    repo: PlotRepository = Depends(get_plot_repository),
):
    """Create a new farm plot. Farmers add their own; admins can add for anyone."""
    plot = await repo.create(
        farmer_id=current_user["user_id"],
        plot_name=body.plot_name,
        latitude=body.latitude,
        longitude=body.longitude,
        coordinates_geojson=body.coordinates_geojson,
        approximate_area_acres=body.approximate_area_acres,
        soil_type=body.soil_type,
        verification_status="pending",
    )

    await log_action(
        action="create",
        resource_type="plot",
        resource_id=str(plot.id),
        user_id=current_user["user_id"],
    )

    return plot


@router.get("/{plot_id}", response_model=PlotResponse)
async def get_plot(
    plot_id: str,
    current_user: dict = Depends(get_current_user),
    repo: PlotRepository = Depends(get_plot_repository),
):
    """Get a specific plot's details."""
    plot = await repo.get_for_user(
        plot_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not plot:
        raise NotFoundError("Plot", plot_id)
    return plot


@router.put("/{plot_id}", response_model=PlotResponse)
async def update_plot(
    plot_id: str,
    body: PlotUpdateRequest,
    current_user: dict = Depends(get_current_user),
    repo: PlotRepository = Depends(get_plot_repository),
):
    """Update a farm plot's details."""
    plot = await repo.get_for_user(
        plot_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not plot:
        raise NotFoundError("Plot", plot_id)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plot, field, value)

    await repo.db.flush()

    await log_action(
        action="update",
        resource_type="plot",
        resource_id=plot_id,
        user_id=current_user["user_id"],
    )

    return plot


@router.post("/{plot_id}/verify", response_model=PlotResponse)
async def verify_plot(
    plot_id: str,
    body: PlotVerifyRequest,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    repo: PlotRepository = Depends(get_plot_repository),
):
    """Verify or reject a farm plot (admin only)."""
    plot = await repo.verify(
        plot_id,
        status=body.verification_status,
        verified_by=current_user["user_id"],
    )
    if not plot:
        raise NotFoundError("Plot", plot_id)

    await log_action(
        action="verify",
        resource_type="plot",
        resource_id=plot_id,
        user_id=current_user["user_id"],
        details={"status": body.verification_status},
    )

    return plot


@router.delete("/{plot_id}", status_code=204)
async def delete_plot(
    plot_id: str,
    current_user: dict = Depends(get_current_user),
    repo: PlotRepository = Depends(get_plot_repository),
):
    """Soft-delete a farm plot."""
    plot = await repo.get_for_user(
        plot_id,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
    if not plot:
        raise NotFoundError("Plot", plot_id)

    plot.is_deleted = True
    await repo.db.flush()

    await log_action(
        action="delete",
        resource_type="plot",
        resource_id=plot_id,
        user_id=current_user["user_id"],
    )
