"""
AgriSense AI — Dependency Injection Module
=============================================
FastAPI Depends() factories for repositories, services, and providers.

This module wires the application's data access layer and services
into FastAPI's dependency injection system, enabling:
  - Per-request database session scoping
  - Easy swapping of implementations for testing
  - Clean separation between routers and business logic

Usage in routers:
    @router.get("/")
    async def list_plots(
        repo: PlotRepository = Depends(get_plot_repository),
    ):
        plots, total = await repo.list_for_user(...)
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

# ---- Lazy imports to avoid circular dependencies ----
# Repositories are imported inside factory functions.

from fastapi import Depends


# --- Repository Factories ---


def get_user_repository(db: AsyncSession = Depends(get_db)):
    """Yield a UserRepository bound to the current request's session."""
    from app.repositories.user_repository import UserRepository
    return UserRepository(db)


def get_plot_repository(db: AsyncSession = Depends(get_db)):
    """Yield a PlotRepository bound to the current request's session."""
    from app.repositories.plot_repository import PlotRepository
    return PlotRepository(db)


def get_crop_repository(db: AsyncSession = Depends(get_db)):
    """Yield a CropRepository bound to the current request's session."""
    from app.repositories.crop_repository import CropRepository
    return CropRepository(db)


def get_expense_repository(db: AsyncSession = Depends(get_db)):
    """Yield an ExpenseRepository bound to the current request's session."""
    from app.repositories.expense_repository import ExpenseRepository
    return ExpenseRepository(db)


def get_health_repository(db: AsyncSession = Depends(get_db)):
    """Yield a HealthRepository bound to the current request's session."""
    from app.repositories.health_repository import HealthRepository
    return HealthRepository(db)


def get_input_repository(db: AsyncSession = Depends(get_db)):
    """Yield an InputRepository bound to the current request's session."""
    from app.repositories.input_repository import InputRepository
    return InputRepository(db)


# --- Service Factories ---


def get_ai_service():
    """Return the AI service singleton."""
    from app.services.ai_service import ai_service
    return ai_service


def get_weather_service():
    """Return the weather service singleton."""
    from app.services.weather_service import weather_service
    return weather_service


def get_simulation_service():
    """Return the simulation service singleton."""
    from app.services.simulation_service import simulation_service
    return simulation_service
