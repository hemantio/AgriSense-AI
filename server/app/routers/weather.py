"""
AgriSense AI — Weather Router
=================================
Weather intelligence endpoints with alert classification.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.weather import WeatherData
from app.schemas.weather import WeatherForecastResponse, WeatherRequest, WeatherResponse
from app.security import get_current_user
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.post("/current", response_model=WeatherResponse)
async def get_current_weather(
    body: WeatherRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch current weather for a location and save to database."""
    weather_data = await weather_service.get_current_weather(
        body.latitude, body.longitude
    )

    # Classify alerts
    alert = weather_service.classify_alert(weather_data)
    weather_data.update(alert)

    # Save to database
    record = WeatherData(
        plot_id=body.plot_id,
        latitude=body.latitude,
        longitude=body.longitude,
        location_name=weather_data.get("location_name"),
        temperature_celsius=weather_data.get("temperature_celsius"),
        feels_like_celsius=weather_data.get("feels_like_celsius"),
        humidity_percent=weather_data.get("humidity_percent"),
        rain_probability=weather_data.get("rain_probability"),
        rainfall_mm=weather_data.get("rainfall_mm"),
        wind_speed_kmh=weather_data.get("wind_speed_kmh"),
        weather_description=weather_data.get("weather_description"),
        weather_icon=weather_data.get("weather_icon"),
        alert_status=alert["alert_status"],
        alert_type=alert.get("alert_type"),
        alert_message=alert.get("alert_message"),
        source=weather_data.get("source", "openweathermap"),
        raw_response=weather_data.get("raw_response"),
    )
    db.add(record)
    await db.flush()

    return record


@router.get("/forecast")
async def get_weather_forecast(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    current_user: dict = Depends(get_current_user),
):
    """Get 5-day weather forecast with alerts."""
    current = await weather_service.get_current_weather(latitude, longitude)
    forecast_list = await weather_service.get_forecast(latitude, longitude)

    # Classify alerts for current and each forecast item
    current_alert = weather_service.classify_alert(current)
    current.update(current_alert)

    alerts = []
    if current_alert["alert_status"] != "normal":
        alerts.append(current_alert)

    for item in forecast_list:
        alert = weather_service.classify_alert(item)
        item.update(alert)
        if alert["alert_status"] != "normal" and alert not in alerts:
            alerts.append(alert)

    return {
        "current": current,
        "forecast": forecast_list[:10],  # Next ~30 hours
        "alerts": alerts,
    }


@router.get("/alerts")
async def get_active_alerts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all active weather alerts from the database."""
    from sqlalchemy import select

    result = await db.execute(
        select(WeatherData)
        .where(WeatherData.alert_status.in_(["advisory", "warning", "severe"]))
        .order_by(WeatherData.fetched_at.desc())
        .limit(20)
    )
    records = result.scalars().all()

    return {
        "alerts": [
            {
                "id": str(r.id),
                "location_name": r.location_name,
                "alert_status": r.alert_status,
                "alert_type": r.alert_type,
                "alert_message": r.alert_message,
                "temperature": r.temperature_celsius,
                "humidity": r.humidity_percent,
                "fetched_at": r.fetched_at.isoformat() if r.fetched_at else None,
            }
            for r in records
        ],
        "total": len(records),
    }
