"""
AgriSense AI — Recommendations Router
=========================================
Context-aware AI recommendations based on crop, weather, and input data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.crop import Crop
from app.models.health_record import HealthRecord
from app.models.input_record import InputRecord
from app.models.plot import FarmPlot
from app.security import get_current_user
from app.services.ai_service import ai_service
from app.services.weather_service import weather_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


class RecommendationRequest(BaseModel):
    """Request for crop-specific recommendations."""
    crop_id: str
    include_weather: bool = True


@router.post("/generate")
async def generate_recommendations(
    body: RecommendationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI-powered, context-aware recommendations for a specific crop.

    Aggregates data from crop history, health analysis, weather,
    and input logs to produce actionable advice.
    """
    # Fetch crop with plot info
    query = select(Crop).join(FarmPlot).where(
        Crop.id == body.crop_id,
        Crop.is_deleted == False,  # noqa: E712
    )
    if current_user["role"] == "farmer":
        query = query.where(FarmPlot.farmer_id == current_user["user_id"])

    result = await db.execute(query)
    crop = result.scalar_one_or_none()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    # Fetch plot for coordinates
    plot_result = await db.execute(
        select(FarmPlot).where(FarmPlot.id == crop.plot_id)
    )
    plot = plot_result.scalar_one_or_none()

    # Fetch latest health record
    health_result = await db.execute(
        select(HealthRecord)
        .where(
            HealthRecord.plot_id == crop.plot_id,
            HealthRecord.is_deleted == False,  # noqa: E712
            HealthRecord.status == "completed",
        )
        .order_by(HealthRecord.created_at.desc())
        .limit(1)
    )
    health = health_result.scalar_one_or_none()

    health_data = None
    if health:
        health_data = {
            "health_score": health.health_score,
            "diagnosis": health.diagnosis,
            "severity": health.severity,
        }

    # Fetch recent inputs
    input_result = await db.execute(
        select(InputRecord)
        .where(
            InputRecord.crop_id == body.crop_id,
            InputRecord.is_deleted == False,  # noqa: E712
        )
        .order_by(InputRecord.created_at.desc())
        .limit(5)
    )
    inputs = input_result.scalars().all()

    input_history = [
        {
            "type": i.input_type,
            "product": i.product_name,
            "quantity": i.quantity,
            "date": i.application_date.isoformat() if i.application_date else None,
        }
        for i in inputs
    ]

    # Fetch weather if requested and coordinates available
    weather_data = None
    if body.include_weather and plot and plot.latitude and plot.longitude:
        weather_data = await weather_service.get_current_weather(
            plot.latitude, plot.longitude
        )
        alert = weather_service.classify_alert(weather_data)
        weather_data.update(alert)

    # Generate recommendation via AI
    recommendation = await ai_service.generate_recommendation(
        crop_name=crop.crop_name,
        crop_stage=crop.crop_stage,
        health_data=health_data,
        weather_data=weather_data,
        input_history=input_history,
    )

    return {
        "crop": {
            "id": str(crop.id),
            "name": crop.crop_name,
            "stage": crop.crop_stage,
        },
        "context": {
            "health": health_data,
            "weather_summary": {
                "temperature": weather_data.get("temperature_celsius") if weather_data else None,
                "humidity": weather_data.get("humidity_percent") if weather_data else None,
                "alert_status": weather_data.get("alert_status") if weather_data else None,
            } if weather_data else None,
            "recent_inputs_count": len(input_history),
        },
        "recommendation": recommendation,
        "generated_by": "gemini-ai",
    }
