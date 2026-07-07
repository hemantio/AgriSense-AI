"""
AgriSense AI — Repositories Package
========================================
Domain-specific data access layer.
"""

from app.repositories.base import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.plot_repository import PlotRepository
from app.repositories.crop_repository import CropRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.health_repository import HealthRepository
from app.repositories.input_repository import InputRepository
from app.repositories.irrigation_repository import IrrigationRepository
from app.repositories.simulation_repository import SimulationRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "PlotRepository",
    "CropRepository",
    "ExpenseRepository",
    "HealthRepository",
    "InputRepository",
    "IrrigationRepository",
    "SimulationRepository",
]
