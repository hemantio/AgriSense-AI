"""
AgriSense AI — Domain Events
================================
Typed, immutable event objects for inter-module communication.
Each event carries the minimum data needed for handlers to act.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID


@dataclass(frozen=True)
class DomainEvent:
    """Base class for all domain events."""
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(frozen=True)
class CropImageUploaded(DomainEvent):
    """Emitted when a farmer uploads a crop image for health analysis.

    Triggers background AI analysis via Celery.
    """
    record_id: UUID = field(default_factory=lambda: UUID(int=0))
    image_path: str = ""
    plot_id: UUID = field(default_factory=lambda: UUID(int=0))


@dataclass(frozen=True)
class WeatherPollRequested(DomainEvent):
    """Emitted when weather data should be refreshed for a plot.

    Triggers background weather fetch via Celery.
    """
    plot_id: UUID = field(default_factory=lambda: UUID(int=0))
    latitude: float = 0.0
    longitude: float = 0.0
