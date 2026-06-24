"""
AgriSense AI — Simulation Service
=====================================
Generates simulated scenarios for demo and testing.
"""

import json
import random
from datetime import UTC, datetime

from app.utils.logger import get_logger

logger = get_logger("agrisense.simulation")


SCENARIO_CONFIGS = {
    "rainfall": {
        "name": "Heavy Rainfall Simulation",
        "description": "Simulates heavy rainfall conditions",
        "parameters": {
            "rainfall_mm": {"min": 30, "max": 120, "default": 60},
            "duration_hours": {"min": 2, "max": 48, "default": 12},
            "humidity_percent": {"min": 80, "max": 100, "default": 95},
        },
    },
    "drought": {
        "name": "Drought Simulation",
        "description": "Simulates extended dry conditions",
        "parameters": {
            "days_without_rain": {"min": 7, "max": 60, "default": 21},
            "temperature_celsius": {"min": 35, "max": 50, "default": 42},
            "humidity_percent": {"min": 5, "max": 25, "default": 15},
        },
    },
    "crop_disease": {
        "name": "Crop Disease Simulation",
        "description": "Simulates crop disease outbreak",
        "parameters": {
            "disease_type": {
                "options": ["leaf_blight", "powdery_mildew", "root_rot", "bacterial_wilt", "rust"],
                "default": "leaf_blight",
            },
            "severity": {
                "options": ["low", "medium", "high", "critical"],
                "default": "medium",
            },
            "spread_rate": {"min": 0.1, "max": 1.0, "default": 0.5},
        },
    },
    "pest_outbreak": {
        "name": "Pest Outbreak Simulation",
        "description": "Simulates pest infestation",
        "parameters": {
            "pest_type": {
                "options": ["aphids", "bollworms", "whiteflies", "locusts", "stem_borers"],
                "default": "aphids",
            },
            "severity": {
                "options": ["low", "medium", "high", "critical"],
                "default": "medium",
            },
            "affected_area_percent": {"min": 10, "max": 100, "default": 40},
        },
    },
    "irrigation": {
        "name": "Irrigation Event Simulation",
        "description": "Simulates irrigation system events",
        "parameters": {
            "irrigation_type": {
                "options": ["flood", "drip", "sprinkler", "canal"],
                "default": "flood",
            },
            "duration_hours": {"min": 1, "max": 12, "default": 4},
            "water_liters": {"min": 500, "max": 50000, "default": 5000},
        },
    },
    "power_outage": {
        "name": "Power Outage Simulation",
        "description": "Simulates load shedding / power failure",
        "parameters": {
            "duration_hours": {"min": 1, "max": 24, "default": 6},
            "affected_systems": {
                "options": ["irrigation_pump", "weather_station", "all"],
                "default": "irrigation_pump",
            },
        },
    },
}


class SimulationService:
    """Service for generating simulation scenarios."""

    def get_available_scenarios(self) -> dict:
        """Return all available simulation scenario configurations."""
        return SCENARIO_CONFIGS

    async def run_simulation(
        self,
        scenario_type: str,
        parameters: dict | None = None,
    ) -> dict:
        """
        Run a simulation scenario and generate results.

        Args:
            scenario_type: Type of scenario to simulate.
            parameters: Custom parameters (uses defaults if not provided).

        Returns:
            Dictionary with generated state, alerts, and AI recommendation.
        """
        if scenario_type not in SCENARIO_CONFIGS:
            raise ValueError(f"Unknown scenario: {scenario_type}. Available: {list(SCENARIO_CONFIGS.keys())}")

        config = SCENARIO_CONFIGS[scenario_type]
        params = self._resolve_parameters(config["parameters"], parameters or {})

        # Generate scenario-specific state
        generator = getattr(self, f"_simulate_{scenario_type}", None)
        if generator:
            result = generator(params)
        else:
            result = self._generic_simulation(scenario_type, params)

        result["scenario_type"] = scenario_type
        result["scenario_name"] = config["name"]
        result["parameters_used"] = params
        result["timestamp"] = datetime.now(UTC).isoformat()

        logger.info(
            "Simulation completed",
            scenario=scenario_type,
            alerts=len(result.get("alerts", [])),
        )

        return result

    def _resolve_parameters(self, config_params: dict, user_params: dict) -> dict:
        """Merge user parameters with defaults."""
        resolved = {}
        for key, spec in config_params.items():
            if key in user_params:
                resolved[key] = user_params[key]
            elif "default" in spec:
                resolved[key] = spec["default"]
            elif "options" in spec:
                resolved[key] = spec["options"][0]
            elif "min" in spec and "max" in spec:
                resolved[key] = spec["default"] if "default" in spec else spec["min"]
        return resolved

    def _simulate_rainfall(self, params: dict) -> dict:
        """Generate heavy rainfall simulation results."""
        rainfall = params.get("rainfall_mm", 60)
        humidity = params.get("humidity_percent", 95)

        alerts = []
        if rainfall > 80:
            alerts.append({
                "type": "severe",
                "message": f"⛈️ Severe flooding risk! Expected rainfall: {rainfall}mm",
            })
        elif rainfall > 40:
            alerts.append({
                "type": "warning",
                "message": f"🌧️ Heavy rain expected: {rainfall}mm. Delay spraying activities.",
            })

        alerts.append({
            "type": "advisory",
            "message": "Ensure field drainage channels are clear.",
        })

        return {
            "generated_weather": {
                "temperature_celsius": round(random.uniform(20, 28), 1),
                "humidity_percent": humidity,
                "rainfall_mm": rainfall,
                "wind_speed_kmh": round(random.uniform(15, 45), 1),
                "weather_description": "Heavy rainfall",
            },
            "alerts": alerts,
            "recommendations": [
                "Postpone all fertilizer and pesticide applications.",
                "Check and clear drainage channels to prevent waterlogging.",
                "Protect seedlings with temporary covers if possible.",
                f"Expected rainfall of {rainfall}mm — avoid entering fields.",
            ],
        }

    def _simulate_drought(self, params: dict) -> dict:
        """Generate drought simulation results."""
        days = params.get("days_without_rain", 21)
        temp = params.get("temperature_celsius", 42)

        alerts = [{
            "type": "severe" if days > 30 else "warning",
            "message": f"🏜️ Drought conditions: {days} days without rain, temp {temp}°C",
        }]

        return {
            "generated_weather": {
                "temperature_celsius": temp,
                "humidity_percent": params.get("humidity_percent", 15),
                "rainfall_mm": 0,
                "wind_speed_kmh": round(random.uniform(5, 20), 1),
                "weather_description": "Drought conditions",
            },
            "alerts": alerts,
            "recommendations": [
                "Prioritize irrigation for critical crops.",
                "Apply mulching to reduce soil moisture loss.",
                "Consider drought-resistant crop varieties for next season.",
                f"Temperature at {temp}°C — irrigate during early morning or evening.",
            ],
        }

    def _simulate_crop_disease(self, params: dict) -> dict:
        """Generate crop disease simulation results."""
        disease = params.get("disease_type", "leaf_blight")
        severity = params.get("severity", "medium")

        alerts = [{
            "type": "severe" if severity in ["high", "critical"] else "warning",
            "message": f"🦠 {disease.replace('_', ' ').title()} detected — Severity: {severity}",
        }]

        return {
            "generated_health": {
                "diagnosis": disease,
                "health_score": {"low": 70, "medium": 50, "high": 30, "critical": 10}.get(severity, 50),
                "severity": severity,
                "spread_rate": params.get("spread_rate", 0.5),
            },
            "alerts": alerts,
            "recommendations": [
                f"Immediate action required for {disease.replace('_', ' ')}.",
                "Remove and destroy affected plant parts.",
                "Apply recommended fungicide/treatment.",
                "Isolate affected area to prevent spread.",
                "Monitor neighboring plots for early signs.",
            ],
        }

    def _simulate_pest_outbreak(self, params: dict) -> dict:
        """Generate pest outbreak simulation results."""
        pest = params.get("pest_type", "aphids")
        severity = params.get("severity", "medium")
        area = params.get("affected_area_percent", 40)

        return {
            "generated_health": {
                "diagnosis": f"{pest}_infestation",
                "health_score": max(10, 100 - area),
                "severity": severity,
                "affected_area_percent": area,
            },
            "alerts": [{
                "type": "warning",
                "message": f"🐛 {pest.replace('_', ' ').title()} outbreak — {area}% area affected",
            }],
            "recommendations": [
                f"Apply appropriate pesticide for {pest.replace('_', ' ')}.",
                "Use integrated pest management (IPM) techniques.",
                "Set up pest traps around affected areas.",
                "Monitor daily for changes in pest population.",
            ],
        }

    def _generic_simulation(self, scenario_type: str, params: dict) -> dict:
        """Fallback for scenarios without specific generators."""
        return {
            "generated_state": params,
            "alerts": [{"type": "advisory", "message": f"Simulation for {scenario_type} completed."}],
            "recommendations": [f"Review {scenario_type} scenario results and take appropriate action."],
        }


# Singleton instance
simulation_service = SimulationService()
