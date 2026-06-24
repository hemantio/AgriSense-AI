"""
AgriSense AI — Plots Router
===============================
Farm plot management with map-based features and admin verification.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.plot import FarmPlot
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
    db: AsyncSession = Depends(get_db),
):
    """
    List farm plots.

    - Admins can see all plots (optionally filtered by farmer_id).
    - Farmers can only see their own plots.
    """
    query = select(FarmPlot).where(FarmPlot.is_deleted == False)  # noqa: E712

    # Role-based filtering
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])
    elif farmer_id:
        query = query.where(FarmPlot.farmer_id == farmer_id)

    if verification_status:
        query = query.where(FarmPlot.verification_status == verification_status)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(FarmPlot.created_at.desc())

    result = await db.execute(query)
    plots = result.scalars().all()

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
    db: AsyncSession = Depends(get_db),
):
    """Create a new farm plot. Farmers add their own; admins can add for anyone."""
    plot = FarmPlot(
        farmer_id=current_user["user_id"],
        plot_name=body.plot_name,
        latitude=body.latitude,
        longitude=body.longitude,
        coordinates_geojson=body.coordinates_geojson,
        approximate_area_acres=body.approximate_area_acres,
        soil_type=body.soil_type,
        verification_status="pending",
    )
    db.add(plot)
    await db.flush()

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
    db: AsyncSession = Depends(get_db),
):
    """Get a specific plot's details."""
    query = select(FarmPlot).where(
        FarmPlot.id == plot_id,
        FarmPlot.is_deleted == False,  # noqa: E712
    )

    # Farmers can only see their own plots
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    return plot


@router.put("/{plot_id}", response_model=PlotResponse)
async def update_plot(
    plot_id: str,
    body: PlotUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a farm plot's details."""
    query = select(FarmPlot).where(
        FarmPlot.id == plot_id,
        FarmPlot.is_deleted == False,  # noqa: E712
    )

    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plot, field, value)

    await db.flush()

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
    db: AsyncSession = Depends(get_db),
):
    """Verify or reject a farm plot (admin only)."""
    result = await db.execute(
        select(FarmPlot).where(
            FarmPlot.id == plot_id,
            FarmPlot.is_deleted == False,  # noqa: E712
        )
    )
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    plot.verification_status = body.verification_status
    plot.verified_by = current_user["user_id"]
    plot.verified_at = datetime.now(UTC)
    await db.flush()

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
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a farm plot."""
    query = select(FarmPlot).where(
        FarmPlot.id == plot_id,
        FarmPlot.is_deleted == False,  # noqa: E712
    )

    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    plot.is_deleted = True
    await db.flush()

    await log_action(
        action="delete",
        resource_type="plot",
        resource_id=plot_id,
        user_id=current_user["user_id"],
    )
