"""
AgriSense AI — Weather Data Model
====================================
Stores weather data from OpenWeatherMap with alert classification.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeatherData(Base):
    """Weather data record for a specific location."""

    __tablename__ = "weather_data"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # --- Location Reference ---
    plot_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("farm_plots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    location_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # --- Weather Data ---
    temperature_celsius: Mapped[float | None] = mapped_column(Float, nullable=True)
    feels_like_celsius: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    rain_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    rainfall_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    weather_description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    weather_icon: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # --- Forecast ---
    forecast_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_forecast: Mapped[bool] = mapped_column(default=False, nullable=False)

    # --- Alert Classification ---
    alert_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="normal"
    )  # "normal", "advisory", "warning", "severe"
    alert_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # "rain", "heat", "drought", "frost", "storm"
    alert_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Source ---
    source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="openweathermap"
    )  # "openweathermap", "simulation"
    raw_response: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Full API response for debugging

    # --- Audit ---
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<WeatherData(id={self.id}, temp={self.temperature_celsius}°C, alert={self.alert_status})>"
