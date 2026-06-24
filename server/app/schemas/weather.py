"""
AgriSense AI — Weather Schemas
=================================
Pydantic schemas for weather intelligence.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WeatherRequest(BaseModel):
    """Schema for requesting weather data."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    plot_id: uuid.UUID | None = None


class WeatherAlertResponse(BaseModel):
    """Schema for weather alert."""

    alert_status: str
    alert_type: str | None = None
    alert_message: str | None = None


class WeatherResponse(BaseModel):
    """Schema for weather data response."""

    id: uuid.UUID
    location_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    temperature_celsius: float | None = None
    feels_like_celsius: float | None = None
    humidity_percent: float | None = None
    rain_probability: float | None = None
    rainfall_mm: float | None = None
    wind_speed_kmh: float | None = None
    weather_description: str | None = None
    weather_icon: str | None = None
    forecast_date: datetime | None = None
    is_forecast: bool = False
    alert: WeatherAlertResponse | None = None
    source: str
    fetched_at: datetime

    model_config = {"from_attributes": True}


class WeatherForecastResponse(BaseModel):
    """Schema for multi-day forecast."""

    current: WeatherResponse
    forecast: list[WeatherResponse]
    alerts: list[WeatherAlertResponse]
