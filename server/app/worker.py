"""
AgriSense AI — Celery Background Tasks Worker
================================================
Defines background tasks for crop health scanning and weather polling.
"""

import asyncio
import os
import sys
import uuid
import json
from datetime import datetime, UTC

# Ensure parent directory is in sys.path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from celery import Celery
from sqlalchemy import select

from app.config import get_settings
from app.database import async_session_factory
from app.models import HealthRecord, FarmPlot, WeatherData
from app.services.ai_service import ai_service
from app.services.weather_service import weather_service

settings = get_settings()

celery_app = Celery(
    "agrisense_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Celery Configurations
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_always_eager=settings.CELERY_ALWAYS_EAGER,
)

@celery_app.task(name="app.worker.analyze_crop_health_task")
def analyze_crop_health_task(record_id_str: str):
    """
    Background task to analyze uploaded crop images using Gemini API.
    Updates the HealthRecord database object once complete.
    """
    async def _run():
        record_id = uuid.UUID(record_id_str)
        async with async_session_factory() as db:
            query = select(HealthRecord).where(HealthRecord.id == record_id)
            result = await db.execute(query)
            record = result.scalar_one_or_none()
            if not record:
                return f"Error: HealthRecord {record_id_str} not found."

            record.status = "processing"
            await db.commit()

            try:
                # Call Gemini to analyze crop health
                analysis = await ai_service.analyze_crop_health(record.image_path)
                
                # Update health record details
                record.ai_result = json.dumps(analysis)
                record.health_score = float(analysis.get("health_score", 75.0))
                record.diagnosis = analysis.get("diagnosis", "unknown")
                record.confidence = float(analysis.get("confidence", 0.0))
                record.severity = analysis.get("severity", "none")
                record.recommendation_text = analysis.get("recommendation", "Check manually.")
                record.status = "completed"
            except Exception as e:
                record.status = "failed"
                record.recommendation_text = f"Background analysis failed: {str(e)}"
            
            await db.commit()
            return f"Successfully processed crop health analysis for record: {record_id_str}"

    loop = asyncio.get_event_loop()
    if loop.is_running():
        future = asyncio.run_coroutine_threadsafe(_run(), loop)
        return future.result()
    else:
        return asyncio.run(_run())

@celery_app.task(name="app.worker.poll_weather_data_task")
def poll_weather_data_task():
    """
    Background periodic task to poll current weather conditions
    for all active, verified farm plots.
    """
    async def _run():
        async with async_session_factory() as db:
            # Get all active verified farm plots
            query = select(FarmPlot).where(
                FarmPlot.is_deleted == False,
                FarmPlot.verification_status == "verified"
            )
            result = await db.execute(query)
            plots = result.scalars().all()

            count = 0
            for plot in plots:
                if not plot.latitude or not plot.longitude:
                    continue

                try:
                    # Fetch current weather
                    weather_data = await weather_service.get_current_weather(
                        plot.latitude, plot.longitude
                    )

                    # Classify alert info
                    alert_info = weather_service.classify_alert(weather_data)

                    # Save weather conditions
                    db_weather = WeatherData(
                        plot_id=plot.id,
                        location_name=weather_data.get("location_name", plot.plot_name),
                        latitude=plot.latitude,
                        longitude=plot.longitude,
                        temperature_celsius=weather_data.get("temperature_celsius"),
                        feels_like_celsius=weather_data.get("feels_like_celsius"),
                        humidity_percent=weather_data.get("humidity_percent"),
                        rain_probability=weather_data.get("rain_probability", 0.0),
                        rainfall_mm=weather_data.get("rainfall_mm", 0.0),
                        wind_speed_kmh=weather_data.get("wind_speed_kmh", 0.0),
                        weather_description=weather_data.get("weather_description"),
                        weather_icon=weather_data.get("weather_icon"),
                        alert_status=alert_info.get("alert_status", "normal"),
                        alert_type=alert_info.get("alert_type"),
                        alert_message=alert_info.get("alert_message"),
                        is_forecast=False,
                        source=weather_data.get("source", "openweathermap"),
                        raw_response=weather_data.get("raw_response")
                    )
                    db.add(db_weather)
                    count += 1
                except Exception as e:
                    print(f"Error polling weather for plot {plot.id}: {str(e)}")

            await db.commit()
            return f"Successfully polled weather conditions for {count} plots."

    loop = asyncio.get_event_loop()
    if loop.is_running():
        future = asyncio.run_coroutine_threadsafe(_run(), loop)
        return future.result()
    else:
        return asyncio.run(_run())
