"""
AgriSense AI — Dashboard Router
===================================
Aggregated data for the overview dashboard.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.crop import Crop
from app.models.expense import Expense
from app.models.health_record import HealthRecord
from app.models.plot import FarmPlot
from app.models.user import User
from app.models.weather import WeatherData
from app.security import UserRole, get_current_user, require_role

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    """Overview statistics for the dashboard."""

    total_farmers: int = 0
    total_plots: int = 0
    verified_plots: int = 0
    pending_plots: int = 0
    active_crops: int = 0
    total_health_analyses: int = 0
    critical_health_alerts: int = 0
    active_weather_alerts: int = 0
    total_expenses: float = 0.0
    recent_alerts: list[dict] = []


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated dashboard statistics.

    - Admin: sees platform-wide stats
    - Farmer: sees only their own data
    """
    is_admin = current_user["role"] == "admin"
    user_id = current_user["user_id"]

    # --- Total Farmers (admin only) ---
    total_farmers = 0
    if is_admin:
        result = await db.execute(
            select(func.count()).where(
                User.role == "farmer",
                User.is_deleted == False,  # noqa: E712
                User.is_active == True,  # noqa: E712
            )
        )
        total_farmers = result.scalar() or 0

    # --- Plots ---
    plots_query = select(func.count()).where(
        FarmPlot.is_deleted == False,  # noqa: E712
    )
    if not is_admin:
        plots_query = plots_query.where(FarmPlot.farmer_id == user_id)

    total_plots = (await db.execute(plots_query)).scalar() or 0

    verified_query = plots_query.where(FarmPlot.verification_status == "verified")
    verified_plots = (await db.execute(verified_query)).scalar() or 0

    pending_query = select(func.count()).where(
        FarmPlot.is_deleted == False,  # noqa: E712
        FarmPlot.verification_status == "pending",
    )
    if not is_admin:
        pending_query = pending_query.where(FarmPlot.farmer_id == user_id)
    pending_plots = (await db.execute(pending_query)).scalar() or 0

    # --- Active Crops ---
    crops_query = select(func.count()).select_from(Crop).join(FarmPlot).where(
        Crop.is_deleted == False,  # noqa: E712
        Crop.crop_stage != "post-harvest",
    )
    if not is_admin:
        crops_query = crops_query.where(FarmPlot.farmer_id == user_id)
    active_crops = (await db.execute(crops_query)).scalar() or 0

    # --- Health Analyses ---
    health_query = select(func.count()).select_from(HealthRecord).join(FarmPlot).where(
        HealthRecord.is_deleted == False,  # noqa: E712
    )
    if not is_admin:
        health_query = health_query.where(FarmPlot.farmer_id == user_id)
    total_health = (await db.execute(health_query)).scalar() or 0

    # Critical health alerts
    critical_query = select(func.count()).select_from(HealthRecord).join(FarmPlot).where(
        HealthRecord.is_deleted == False,  # noqa: E712
        HealthRecord.severity.in_(["high", "critical"]),
    )
    if not is_admin:
        critical_query = critical_query.where(FarmPlot.farmer_id == user_id)
    critical_alerts = (await db.execute(critical_query)).scalar() or 0

    # --- Weather Alerts ---
    weather_query = select(func.count()).where(
        WeatherData.alert_status.in_(["warning", "severe"]),
    )
    active_weather = (await db.execute(weather_query)).scalar() or 0

    # --- Total Expenses ---
    expense_query = select(func.coalesce(func.sum(Expense.amount), 0.0)).select_from(
        Expense
    ).join(Crop).join(FarmPlot).where(
        Expense.is_deleted == False,  # noqa: E712
    )
    if not is_admin:
        expense_query = expense_query.where(FarmPlot.farmer_id == user_id)
    total_expenses = (await db.execute(expense_query)).scalar() or 0.0

    return DashboardStats(
        total_farmers=total_farmers,
        total_plots=total_plots,
        verified_plots=verified_plots,
        pending_plots=pending_plots,
        active_crops=active_crops,
        total_health_analyses=total_health,
        critical_health_alerts=critical_alerts,
        active_weather_alerts=active_weather,
        total_expenses=float(total_expenses),
    )
