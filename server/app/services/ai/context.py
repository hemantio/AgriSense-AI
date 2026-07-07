"""
AgriSense AI — CIE Context Engine
===================================
Assembles dynamic context layers for farmer queries (profile, weather, active plots/crops, history).
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.plot import FarmPlot
from app.models.crop import Crop
from app.models.input_record import InputRecord
from app.models.health_record import HealthRecord
from app.models.chat import ChatMessage
from app.services.weather_service import weather_service


def get_current_season() -> str:
    """Derives current Indian farming season based on month."""
    month = datetime.now(UTC).month
    if 6 <= month <= 10:
        return "Kharif"
    elif month in [11, 12, 1, 2, 3]:
        return "Rabi"
    else:
        return "Zaid"


class ContextEngine:
    """Compiles a farmer's operational profile and session context into structured JSON for LLM injection."""

    @staticmethod
    async def assemble_context(
        user_id: uuid.UUID,
        db: AsyncSession,
        session_id: uuid.UUID | None = None,
        page_context: str | None = None
    ) -> dict[str, Any]:
        """
        Assembles all available context layers for a user request.

        Args:
            user_id: The UUID of the authenticated user.
            db: Database session.
            session_id: The UUID of the active conversation session.
            page_context: Optional string describing the user's current client page.

        Returns:
            Dictionary structure containing farmer, active_plots, weather,
            recent_inputs, recent_health, season, and conversation history.
        """
        # 1. Fetch User Profile
        user_query = select(User).where(User.id == user_id, User.is_deleted == False)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        farmer_context = {
            "name": user.name if user else "Unknown Farmer",
            "village": user.village_name if user else None,
            "role": user.role if user else "farmer",
            "language": user.preferred_language if user else "hi",
        }

        # 2. Fetch Active Plots and Crops
        # We scopes by user_id
        plots_query = select(FarmPlot).where(
            FarmPlot.farmer_id == user_id,
            FarmPlot.is_deleted == False
        )
        plots_result = await db.execute(plots_query)
        plots = plots_result.scalars().all()

        active_plots_context = []
        coordinates = None  # To fetch weather for the first plot, if available

        for plot in plots:
            # Fetch active crops on this plot
            crops_query = select(Crop).where(
                Crop.plot_id == plot.id,
                Crop.is_deleted == False,
                Crop.crop_stage != "harvested"
            )
            crops_result = await db.execute(crops_query)
            active_crops = crops_result.scalars().all()

            crops_data = []
            for crop in active_crops:
                crops_data.append({
                    "crop_id": str(crop.id),
                    "crop_name": crop.crop_name,
                    "crop_stage": crop.crop_stage,
                    "sowing_date": crop.sowing_date.isoformat() if crop.sowing_date else None,
                    "expected_harvest_date": crop.expected_harvest_date.isoformat() if crop.expected_harvest_date else None,
                })

            active_plots_context.append({
                "plot_id": str(plot.id),
                "plot_name": plot.plot_name,
                "area_acres": plot.approximate_area_acres,
                "soil_type": plot.soil_type,
                "verification_status": plot.verification_status,
                "crops": crops_data
            })

            # Store coordinates of first plot to fetch weather
            if coordinates is None and plot.latitude is not None and plot.longitude is not None:
                coordinates = (plot.latitude, plot.longitude)

        # 3. Fetch Weather Data (using weather_service with caching or live lookup)
        weather_context = {}
        if coordinates:
            lat, lon = coordinates
            try:
                weather_data = await weather_service.get_current_weather(lat, lon)
                weather_context = {
                    "temperature_celsius": weather_data.get("temperature_celsius"),
                    "feels_like_celsius": weather_data.get("feels_like_celsius"),
                    "humidity_percent": weather_data.get("humidity_percent"),
                    "rain_probability": weather_data.get("rain_probability"),
                    "rainfall_mm": weather_data.get("rainfall_mm"),
                    "wind_speed_kmh": weather_data.get("wind_speed_kmh"),
                    "weather_description": weather_data.get("weather_description"),
                    "alert_status": weather_data.get("alert_status", "normal"),
                    "alert_message": weather_data.get("alert_message"),
                }
            except Exception:
                # Fail gracefully for weather
                weather_context = {
                    "alert_status": "normal",
                    "error": "Weather data currently unavailable"
                }

        # 4. Fetch Recent Inputs (Last 5 records)
        inputs_query = (
            select(InputRecord)
            .join(Crop)
            .join(FarmPlot)
            .where(
                FarmPlot.farmer_id == user_id,
                InputRecord.is_deleted == False
            )
            .order_by(InputRecord.application_date.desc(), InputRecord.created_at.desc())
            .limit(5)
        )
        inputs_result = await db.execute(inputs_query)
        inputs = inputs_result.scalars().all()

        recent_inputs_context = []
        for input_rec in inputs:
            recent_inputs_context.append({
                "product_name": input_rec.product_name,
                "input_type": input_rec.input_type,
                "brand": input_rec.brand,
                "quantity": input_rec.quantity,
                "unit": input_rec.quantity_unit,
                "date": input_rec.application_date.isoformat() if input_rec.application_date else None,
            })

        # 5. Fetch Recent Health Scans (Last 3 records)
        health_query = (
            select(HealthRecord)
            .join(FarmPlot)
            .where(
                FarmPlot.farmer_id == user_id,
                HealthRecord.is_deleted == False
            )
            .order_by(HealthRecord.created_at.desc())
            .limit(3)
        )
        health_result = await db.execute(health_query)
        health_recs = health_result.scalars().all()

        recent_health_context = []
        for health_rec in health_recs:
            recent_health_context.append({
                "diagnosis": health_rec.diagnosis,
                "severity": health_rec.severity,
                "health_score": health_rec.health_score,
                "recommendation": health_rec.recommendation_text,
                "date": health_rec.created_at.isoformat(),
            })

        # 6. Fetch Conversation History (Last 10 messages)
        conversation_history = []
        if session_id:
            msg_query = (
                select(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.created_at.desc())
                .limit(10)
            )
            msg_result = await db.execute(msg_query)
            messages = msg_result.scalars().all()
            # Reverse to get chronological order (oldest to newest)
            messages = list(reversed(messages))
            for msg in messages:
                conversation_history.append({
                    "role": msg.role,
                    "content": msg.content,
                    "intent": msg.intent,
                    "tool_name": msg.tool_name,
                })

        # 7. Compile Overall Context Object
        return {
            "farmer": farmer_context,
            "active_plots": active_plots_context,
            "weather": weather_context,
            "recent_inputs": recent_inputs_context,
            "recent_health": recent_health_context,
            "season": {
                "current": get_current_season(),
                "planting_window": "active"
            },
            "page_context": page_context,
            "conversation_history": conversation_history
        }
