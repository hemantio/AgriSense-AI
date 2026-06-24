"""
AgriSense AI — Crop Health Router
=====================================
Handles crop image upload and AI-based health analysis.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.health_record import HealthRecord
from app.models.plot import FarmPlot
from app.schemas.health import HealthAnalysisResponse, HealthHistoryResponse
from app.security import get_current_user
from app.utils.audit import log_action
from app.utils.file_security import save_upload

router = APIRouter(prefix="/health", tags=["Crop Health"])


@router.post("/analyze", response_model=HealthAnalysisResponse, status_code=201)
async def analyze_crop_health(
    file: UploadFile = File(..., description="Crop image for health analysis"),
    plot_id: str = Form(...),
    crop_id: str | None = Form(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a crop image for AI-based health analysis.

    The image is validated, saved securely, and queued for AI processing.
    """
    # Verify plot ownership
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

    # Save image securely (validates type, size, magic bytes)
    image_path = await save_upload(file, subfolder="crop_health")

    # Create health record (initially pending)
    record = HealthRecord(
        plot_id=plot_id,
        crop_id=crop_id,
        image_path=image_path,
        status="pending",
    )
    db.add(record)
    await db.flush()

    # Queue background AI analysis task via Celery
    from app.worker import analyze_crop_health_task
    analyze_crop_health_task.delay(str(record.id))

    await log_action(
        action="create",
        resource_type="health_record",
        resource_id=str(record.id),
        user_id=current_user["user_id"],
        details={"plot_id": plot_id, "image_path": image_path},
    )

    return record


@router.get("/history", response_model=HealthHistoryResponse)
async def get_health_history(
    plot_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get crop health analysis history with pagination."""
    query = select(HealthRecord).where(
        HealthRecord.is_deleted == False,  # noqa: E712
    )

    if plot_id:
        query = query.where(HealthRecord.plot_id == plot_id)

    # Farmers: filter by their own plots
    if current_user["role"] == "farmer":
        query = query.join(FarmPlot).where(
            FarmPlot.farmer_id == current_user["user_id"]
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(HealthRecord.created_at.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    return HealthHistoryResponse(
        records=[HealthAnalysisResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{record_id}", response_model=HealthAnalysisResponse)
async def get_health_record(
    record_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific health analysis record."""
    query = select(HealthRecord).where(
        HealthRecord.id == record_id,
        HealthRecord.is_deleted == False,  # noqa: E712
    )

    if current_user["role"] == "farmer":
        query = query.join(FarmPlot).where(
            FarmPlot.farmer_id == current_user["user_id"]
        )

    result = await db.execute(query)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")

    return record
