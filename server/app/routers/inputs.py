"""
AgriSense AI — Inputs Router
================================
Agricultural input (fertilizer/pesticide) tracking with OCR.
"""

import math

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.crop import Crop
from app.models.input_record import InputRecord
from app.models.plot import FarmPlot
from app.security import get_current_user
from app.services.ai_service import ai_service
from app.utils.audit import log_action
from app.utils.file_security import save_upload

router = APIRouter(prefix="/inputs", tags=["Agricultural Inputs"])


@router.get("/")
async def list_inputs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    crop_id: str | None = Query(None),
    input_type: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List agricultural input records with filtering."""
    query = (
        select(InputRecord)
        .join(Crop)
        .join(FarmPlot)
        .where(
            InputRecord.is_deleted == False,  # noqa: E712
            Crop.is_deleted == False,  # noqa: E712
        )
    )

    if current_user["role"] == "farmer":
        import uuid
        query = query.where(FarmPlot.farmer_id == uuid.UUID(current_user["user_id"]))
    if crop_id:
        query = query.where(InputRecord.crop_id == crop_id)
    if input_type:
        query = query.where(InputRecord.input_type == input_type)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(InputRecord.created_at.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    return {
        "inputs": [
            {
                "id": str(r.id),
                "crop_id": str(r.crop_id),
                "input_type": r.input_type,
                "product_name": r.product_name,
                "brand": r.brand,
                "quantity": r.quantity,
                "quantity_unit": r.quantity_unit,
                "application_date": r.application_date.isoformat() if r.application_date else None,
                "application_notes": r.application_notes,
                "image_path": r.image_path,
                "ocr_extracted_text": r.ocr_extracted_text,
                "ocr_confidence": r.ocr_confidence,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/", status_code=201)
async def create_input_record(
    crop_id: str = Form(...),
    input_type: str = Form(...),
    product_name: str = Form(...),
    brand: str | None = Form(None),
    quantity: float | None = Form(None),
    quantity_unit: str | None = Form(None),
    application_date: str | None = Form(None),
    application_notes: str | None = Form(None),
    packet_image: UploadFile | None = File(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record a fertilizer/pesticide application.

    Optionally upload a packet image for AI-powered OCR extraction.
    """
    # Verify crop ownership
    query = select(Crop).join(FarmPlot).where(
        Crop.id == crop_id,
        Crop.is_deleted == False,  # noqa: E712
    )
    if current_user["role"] == "farmer":
        import uuid
        query = query.where(FarmPlot.farmer_id == uuid.UUID(current_user["user_id"]))

    result = await db.execute(query)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Crop not found")

    image_path = None
    ocr_text = None
    ocr_confidence = None

    # Process packet image if provided
    if packet_image:
        image_path = await save_upload(packet_image, subfolder="packets")

        # Run OCR via Gemini
        from pathlib import Path
        from app.config import get_settings

        settings = get_settings()
        full_path = str(Path(settings.UPLOAD_DIR) / image_path)

        try:
            ocr_result = await ai_service.extract_label_text(full_path)
            ocr_text = ocr_result.get("full_extracted_text", "")
            ocr_confidence = ocr_result.get("confidence", 0.0)

            # Auto-fill product details from OCR if not manually provided
            if not brand and ocr_result.get("brand"):
                brand = ocr_result["brand"]
        except Exception:
            pass  # OCR failure is non-critical

    from datetime import date as date_type

    record = InputRecord(
        crop_id=crop_id,
        input_type=input_type,
        product_name=product_name,
        brand=brand,
        quantity=quantity,
        quantity_unit=quantity_unit,
        application_date=(
            date_type.fromisoformat(application_date) if application_date else None
        ),
        application_notes=application_notes,
        image_path=image_path,
        ocr_extracted_text=ocr_text,
        ocr_confidence=ocr_confidence,
    )
    db.add(record)
    await db.flush()

    await log_action(
        action="create",
        resource_type="input_record",
        resource_id=str(record.id),
        user_id=current_user["user_id"],
        details={"type": input_type, "product": product_name},
    )

    return {
        "id": str(record.id),
        "input_type": record.input_type,
        "product_name": record.product_name,
        "brand": record.brand,
        "image_path": record.image_path,
        "ocr_extracted_text": record.ocr_extracted_text,
        "ocr_confidence": record.ocr_confidence,
        "message": "Input recorded successfully",
    }


@router.delete("/{input_id}", status_code=204)
async def delete_input(
    input_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete an input record."""
    query = (
        select(InputRecord)
        .join(Crop)
        .join(FarmPlot)
        .where(
            InputRecord.id == input_id,
            InputRecord.is_deleted == False,  # noqa: E712
        )
    )
    if current_user["role"] == "farmer":
        import uuid
        query = query.where(FarmPlot.farmer_id == uuid.UUID(current_user["user_id"]))

    result = await db.execute(query)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Input record not found")

    record.is_deleted = True
    await db.flush()

    await log_action(
        action="delete",
        resource_type="input_record",
        resource_id=input_id,
        user_id=current_user["user_id"],
    )
