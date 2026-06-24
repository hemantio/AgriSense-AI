"""
AgriSense AI — Simulation Router
====================================
Simulation endpoints for demo and testing scenarios.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.database import get_db
from app.models.simulation import Simulation
from app.security import UserRole, get_current_user, require_role
from app.services.simulation_service import simulation_service
from app.utils.audit import log_action

router = APIRouter(prefix="/simulation", tags=["Simulation"])


class SimulationRunRequest(BaseModel):
    """Request schema for running a simulation."""
    scenario_type: str
    parameters: dict | None = None
    plot_id: str | None = None


@router.get("/scenarios")
async def get_available_scenarios(
    current_user: dict = Depends(get_current_user),
):
    """List all available simulation scenarios with their parameters."""
    return simulation_service.get_available_scenarios()


@router.post("/run")
async def run_simulation(
    body: SimulationRunRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run a simulation scenario.

    Returns generated state, alerts, and recommendations.
    """
    try:
        result = await simulation_service.run_simulation(
            scenario_type=body.scenario_type,
            parameters=body.parameters,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Save simulation record
    sim_record = Simulation(
        scenario_type=body.scenario_type,
        scenario_name=result.get("scenario_name"),
        input_values=json.dumps(result.get("parameters_used", {})),
        simulated_temperature=result.get("generated_weather", {}).get("temperature_celsius"),
        simulated_humidity=result.get("generated_weather", {}).get("humidity_percent"),
        simulated_rainfall_mm=result.get("generated_weather", {}).get("rainfall_mm"),
        generated_state=json.dumps(result.get("generated_weather") or result.get("generated_health", {})),
        ai_response=json.dumps(result.get("recommendations", [])),
        alerts_generated=json.dumps(result.get("alerts", [])),
        status="completed",
        created_by=current_user["user_id"],
        plot_id=body.plot_id,
        completed_at=datetime.now(UTC),
    )
    db.add(sim_record)
    await db.flush()

    await log_action(
        action="simulate",
        resource_type="simulation",
        resource_id=str(sim_record.id),
        user_id=current_user["user_id"],
        details={"scenario": body.scenario_type},
    )

    return {
        "simulation_id": str(sim_record.id),
        **result,
    }


@router.get("/history")
async def get_simulation_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    scenario_type: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get past simulation runs."""
    from sqlalchemy import func

    query = select(Simulation).where(
        Simulation.created_by == current_user["user_id"]
    )

    if scenario_type:
        query = query.where(Simulation.scenario_type == scenario_type)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Simulation.created_at.desc())

    result = await db.execute(query)
    sims = result.scalars().all()

    return {
        "simulations": [
            {
                "id": str(s.id),
                "scenario_type": s.scenario_type,
                "scenario_name": s.scenario_name,
                "status": s.status,
                "alerts": json.loads(s.alerts_generated) if s.alerts_generated else [],
                "recommendations": json.loads(s.ai_response) if s.ai_response else [],
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sims
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
