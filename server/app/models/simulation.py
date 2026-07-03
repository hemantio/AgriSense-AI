"""
AgriSense AI — Simulation Model
==================================
Stores simulation scenarios and their generated results for demo/testing.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class Simulation(UUIDPrimaryKeyMixin, Base):
    """Simulation scenario record for demo and testing.

    Note: No TimestampMixin or SoftDeleteMixin — simulations are
    append-only log records with their own created_at/completed_at lifecycle.
    """

    __tablename__ = "simulations"

    # --- Scenario Configuration ---
    scenario_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "rainfall", "drought", "crop_disease", "pest_outbreak", "irrigation", "power_outage"
    scenario_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # --- Input Parameters ---
    input_values: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON: parameters for the simulation

    # --- Simulated Weather (if applicable) ---
    simulated_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    simulated_humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    simulated_rainfall_mm: Mapped[float | None] = mapped_column(Float, nullable=True)

    # --- Generated Results ---
    generated_state: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON: crop/weather state after simulation
    ai_response: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # AI recommendation based on simulated scenario
    alerts_generated: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON: list of alerts triggered

    # --- Status ---
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # "pending", "running", "completed", "failed"

    # --- Context ---
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, nullable=True
    )
    plot_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, nullable=True
    )

    # --- Audit ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Simulation(id={self.id}, type={self.scenario_type}, status={self.status})>"
