"""
AgriSense AI — ORM Models Package
===================================
Exports all SQLAlchemy models and mixins for easy importing.
"""

from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.user import User
from app.models.plot import FarmPlot
from app.models.crop import Crop
from app.models.input_record import InputRecord
from app.models.health_record import HealthRecord
from app.models.weather import WeatherData
from app.models.expense import Expense
from app.models.irrigation import IrrigationLog
from app.models.simulation import Simulation

__all__ = [
    # Mixins
    "UUIDPrimaryKeyMixin",
    "TimestampMixin",
    "SoftDeleteMixin",
    # Models
    "User",
    "FarmPlot",
    "Crop",
    "InputRecord",
    "HealthRecord",
    "WeatherData",
    "Expense",
    "IrrigationLog",
    "Simulation",
]
