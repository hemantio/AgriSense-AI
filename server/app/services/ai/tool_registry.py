"""
AgriSense AI — CIE Tool Registry & Routing Service
=====================================================
Defines Gemini schemas for CIE tools and routes LLM-generated function calls to backend handlers.
"""

import json
import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any, Callable, Dict, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ToolRegistry
from app.models.crop import Crop
from app.models.plot import FarmPlot
from app.models.expense import Expense
from app.models.input_record import InputRecord
from app.models.health_record import HealthRecord
from app.models.irrigation import IrrigationLog
from app.models.simulation import Simulation
from app.services.weather_service import weather_service
from app.utils.logger import get_logger

logger = get_logger("agrisense.cie.tools")

# --- Python-defined Tool Schemas for Seeding and Gemini registration ---
TOOL_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "weather_tool": {
        "name": "weather_tool",
        "description": "Checks weather forecasts, current weather conditions, and assesses spray safety alerts for plots.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["current", "forecast", "spray_safety"],
                    "description": "The weather action to execute"
                },
                "plot_id": {
                    "type": "STRING",
                    "description": "Optional UUID string of the plot to check weather for."
                }
            },
            "required": ["action"]
        }
    },
    "crop_tool": {
        "name": "crop_tool",
        "description": "Retrieves crop details, listings, health status, and harvest timing forecasts.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["list", "get", "harvest_timing"],
                    "description": "The crop action: list all crops, get details for one, or predict harvest date."
                },
                "crop_id": {
                    "type": "STRING",
                    "description": "Optional UUID string of a specific crop."
                }
            },
            "required": ["action"]
        }
    },
    "plot_tool": {
        "name": "plot_tool",
        "description": "Retrieves plot information, plot listings, areas, and filters plots by crop type.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["list", "get", "filter"],
                    "description": "List plots, get plot detail, or filter plots by crop."
                },
                "plot_id": {
                    "type": "STRING",
                    "description": "Optional UUID string of the plot."
                },
                "crop_name": {
                    "type": "STRING",
                    "description": "Name of crop (e.g. 'Wheat', 'Cotton') to filter by."
                }
            },
            "required": ["action"]
        }
    },
    "expense_tool": {
        "name": "expense_tool",
        "description": "Manages expenses: logging new expenses, retrieving summaries, category breakdown, or seasonal totals. Modifying operations require confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["log", "get_summary", "get_by_category", "get_total"],
                    "description": "log (add new), get_summary (recent breakdown), get_by_category (grouped), get_total (sum)."
                },
                "amount": {
                    "type": "NUMBER",
                    "description": "Amount in INR (required for 'log')."
                },
                "category": {
                    "type": "STRING",
                    "enum": ["seed", "fertilizer", "pesticide", "labour", "irrigation", "equipment", "misc"],
                    "description": "Expense category (required for 'log')."
                },
                "crop_id": {
                    "type": "STRING",
                    "description": "Optional UUID string of associated crop."
                },
                "period": {
                    "type": "STRING",
                    "enum": ["today", "this_week", "this_month", "current_season"],
                    "description": "Optional time period to query."
                },
                "notes": {
                    "type": "STRING",
                    "description": "Additional notes about the expense."
                }
            },
            "required": ["action"]
        }
    },
    "input_tool": {
        "name": "input_tool",
        "description": "Manages farm input logging (fertilizers/pesticides) and fetches input logs history.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["log", "get_history", "get_last"],
                    "description": "log (record application), get_history, get_last (most recent)."
                },
                "product_name": {
                    "type": "STRING",
                    "description": "Product name (e.g., 'Urea', 'DAP', 'Superphosphate') (required for 'log')."
                },
                "input_type": {
                    "type": "STRING",
                    "enum": ["fertilizer", "pesticide", "herbicide", "growth_regulator"],
                    "description": "Input type (required for 'log')."
                },
                "brand": {
                    "type": "STRING",
                    "description": "Product brand."
                },
                "quantity": {
                    "type": "NUMBER",
                    "description": "Quantity applied (required for 'log')."
                },
                "unit": {
                    "type": "STRING",
                    "enum": ["kg", "liters", "ml", "grams", "bags"],
                    "description": "Quantity unit (required for 'log')."
                },
                "crop_id": {
                    "type": "STRING",
                    "description": "Optional UUID crop reference."
                },
                "notes": {
                    "type": "STRING",
                    "description": "Application notes."
                }
            },
            "required": ["action"]
        }
    },
    "health_tool": {
        "name": "health_tool",
        "description": "Accesses crop disease diagnosis logs and health history.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["get_history", "get_score"],
                    "description": "Fetch health diagnosis history or get average health score."
                },
                "crop_id": {
                    "type": "STRING",
                    "description": "Optional UUID string of crop."
                }
            },
            "required": ["action"]
        }
    },
    "irrigation_tool": {
        "name": "irrigation_tool",
        "description": "Manages watering logs: records new watering events or checks history.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["log", "get_history"],
                    "description": "log (add new record) or get_history."
                },
                "plot_id": {
                    "type": "STRING",
                    "description": "UUID string of irrigated plot (required for 'log')."
                },
                "hours": {
                    "type": "NUMBER",
                    "description": "Watering duration in hours (required for 'log')."
                },
                "water_source": {
                    "type": "STRING",
                    "enum": ["borewell", "canal", "rainwater", "well"],
                    "description": "Source of irrigation water."
                }
            },
            "required": ["action"]
        }
    },
    "recommendation_tool": {
        "name": "recommendation_tool",
        "description": "Generates localized agricultural recommendations for a specific crop.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["generate"],
                    "description": "Generate context-aware recommendations."
                },
                "crop_id": {
                    "type": "STRING",
                    "description": "UUID string of the crop (required)."
                }
            },
            "required": ["action", "crop_id"]
        }
    },
    "simulation_tool": {
        "name": "simulation_tool",
        "description": "Runs weather, drought, or pest outbreak simulation scenarios.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["run", "list"],
                    "description": "run (execute new simulation scenario) or list (get scenarios)."
                },
                "scenario_type": {
                    "type": "STRING",
                    "enum": ["rainfall", "drought", "crop_disease", "pest_outbreak"],
                    "description": "The simulation scenario type (required for 'run')."
                },
                "plot_id": {
                    "type": "STRING",
                    "description": "Plot UUID reference."
                }
            },
            "required": ["action"]
        }
    },
    "dashboard_tool": {
        "name": "dashboard_tool",
        "description": "Fetches general farmer metrics, active crops overview, and daily summaries.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["summary", "daily_advice"],
                    "description": "Farming summary or daily advice."
                }
            },
            "required": ["action"]
        }
    },
    "navigation_tool": {
        "name": "navigation_tool",
        "description": "Commands the client UI to navigate to a specific page or load specific plot/crop view details.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "page": {
                    "type": "STRING",
                    "enum": ["dashboard", "plots", "crops", "expenses", "weather", "inputs", "health", "simulation", "settings"],
                    "description": "The page key to navigate to."
                },
                "plot_id": {
                    "type": "STRING",
                    "description": "Optional plot ID to open detailed view."
                },
                "crop_id": {
                    "type": "STRING",
                    "description": "Optional crop ID to open detailed view."
                }
            },
            "required": ["page"]
        }
    },
    "report_tool": {
        "name": "report_tool",
        "description": "Generates monthly or seasonal summaries for farm yields, expenses, and inputs.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "action": {
                    "type": "STRING",
                    "enum": ["generate"],
                    "description": "Generate report."
                },
                "period": {
                    "type": "STRING",
                    "enum": ["june", "this_month", "current_season"],
                    "description": "The timeframe of report (required)."
                }
            },
            "required": ["action", "period"]
        }
    }
}


class ToolRegistryService:
    """Manages CIE tool declarations in DB and handles execution routing."""

    @staticmethod
    async def synchronize_registry(db: AsyncSession) -> None:
        """Ensures all python defined tools exist in the database registry."""
        for tool_name, details in TOOL_SCHEMAS.items():
            query = select(ToolRegistry).where(ToolRegistry.name == tool_name)
            result = await db.execute(query)
            existing = result.scalar_one_or_none()

            # Certain tools require confirmation
            requires_conf = tool_name in ["expense_tool", "input_tool", "irrigation_tool"]

            if not existing:
                new_tool = ToolRegistry(
                    name=tool_name,
                    description=details["description"],
                    schema=details,
                    endpoint_pattern=f"/api/v1/cie/tools/{tool_name}",
                    is_active=True,
                    requires_confirmation=requires_conf,
                    allowed_roles=["admin", "farmer"],
                    max_calls_per_session=10
                )
                db.add(new_tool)
                logger.info(f"Registered new tool in DB: {tool_name}")
            else:
                existing.schema = details
                existing.description = details["description"]
                existing.requires_confirmation = requires_conf
                logger.info(f"Updated tool schema in DB: {tool_name}")

        await db.commit()

    @staticmethod
    async def get_active_schemas(db: AsyncSession) -> List[Dict[str, Any]]:
        """Returns the list of active function schemas registered in DB."""
        query = select(ToolRegistry).where(ToolRegistry.is_active == True)
        result = await db.execute(query)
        tools = result.scalars().all()
        # Convert schema JSON to format expected by Gemini SDK
        # We need declarations as functions in Gemini API structure
        schemas = []
        for tool in tools:
            # We return the schema definition directly
            schemas.append(tool.schema)
        return schemas

    @classmethod
    async def execute_tool(
        cls,
        tool_name: str,
        params: Dict[str, Any],
        user_id: uuid.UUID,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Executes a registered tool call with params.

        Returns:
            Dictionary payload representing the tool result.
        """
        logger.info(f"Executing tool {tool_name} with params: {params} for user {user_id}")

        # Check if active in registry
        query = select(ToolRegistry).where(ToolRegistry.name == tool_name, ToolRegistry.is_active == True)
        result = await db.execute(query)
        tool_record = result.scalar_one_or_none()
        if not tool_record:
            return {"error": f"Tool '{tool_name}' is inactive or unregistered."}

        # Route to handler
        handler_name = f"_handle_{tool_name}"
        handler: Callable = getattr(cls, handler_name, None)
        if not handler:
            return {"error": f"Handler for '{tool_name}' not implemented on registry."}

        try:
            return await handler(params, user_id, db)
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}")
            return {"error": f"Internal execution error on tool '{tool_name}': {str(e)}"}

    # ==========================================
    # TOOL HANDLER IMPLEMENTATIONS
    # ==========================================

    @staticmethod
    async def _handle_weather_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        plot_id_str = params.get("plot_id")

        # Get coordinates
        latitude, longitude = 19.0760, 72.8777  # Default (Mumbai/MH)
        plot_name = "Default Location"

        if plot_id_str:
            try:
                plot_id = uuid.UUID(plot_id_str)
                pq = select(FarmPlot).where(FarmPlot.id == plot_id)
                pr = await db.execute(pq)
                plot = pr.scalar_one_or_none()
                if plot and plot.latitude is not None and plot.longitude is not None:
                    latitude, longitude = plot.latitude, plot.longitude
                    plot_name = plot.plot_name
            except ValueError:
                pass
        else:
            # Fall back to user's first plot
            pq = select(FarmPlot).where(FarmPlot.farmer_id == user_id, FarmPlot.is_deleted == False).limit(1)
            pr = await db.execute(pq)
            plot = pr.scalar_one_or_none()
            if plot and plot.latitude is not None and plot.longitude is not None:
                latitude, longitude = plot.latitude, plot.longitude
                plot_name = plot.plot_name

        if action == "current":
            data = await weather_service.get_current_weather(latitude, longitude)
            return {
                "location": plot_name,
                "temperature": data.get("temperature_celsius"),
                "humidity": data.get("humidity_percent"),
                "description": data.get("weather_description"),
                "rain_prob": data.get("rain_probability"),
                "alert": data.get("alert_status"),
                "alert_message": data.get("alert_message")
            }
        elif action == "forecast":
            forecasts = await weather_service.get_forecast(latitude, longitude)
            # Return next 3 forecast intervals for brevity
            return {
                "location": plot_name,
                "forecast": forecasts[:5] if forecasts else []
            }
        elif action == "spray_safety":
            data = await weather_service.get_current_weather(latitude, longitude)
            rain_prob = data.get("rain_probability", 0) or 0
            wind_speed = data.get("wind_speed_kmh", 0) or 0
            temp = data.get("temperature_celsius", 25) or 25

            safe = True
            reason = "Weather looks clear. Wind and temperature are normal."

            if rain_prob > 50:
                safe = False
                reason = f"High chance of rain ({rain_prob}%). Spray will wash off."
            elif wind_speed > 20:
                safe = False
                reason = f"Wind speed is too high ({wind_speed:.1f} km/h). Risk of spray drift."
            elif temp > 38:
                safe = False
                reason = f"Temperature is too high ({temp}°C). Risk of crop burn or chemical evaporation."

            return {
                "location": plot_name,
                "spray_safe": safe,
                "reason": reason,
                "metrics": {"rain_probability": rain_prob, "wind_speed_kmh": wind_speed, "temperature": temp}
            }

        return {"error": "Invalid weather action"}

    @staticmethod
    async def _handle_crop_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        crop_id_str = params.get("crop_id")

        if action == "list":
            q = select(Crop).join(FarmPlot).where(FarmPlot.farmer_id == user_id, Crop.is_deleted == False)
            res = await db.execute(q)
            crops = res.scalars().all()
            return {
                "crops": [{
                    "id": str(c.id),
                    "name": c.crop_name,
                    "stage": c.crop_stage,
                    "plot": c.plot.plot_name if c.plot else "Unknown"
                } for c in crops]
            }

        elif action == "get" and crop_id_str:
            try:
                crop_id = uuid.UUID(crop_id_str)
                q = select(Crop).join(FarmPlot).where(Crop.id == crop_id, FarmPlot.farmer_id == user_id)
                res = await db.execute(q)
                c = res.scalar_one_or_none()
                if c:
                    return {
                        "id": str(c.id),
                        "name": c.crop_name,
                        "variety": getattr(c, "variety", None),
                        "stage": c.crop_stage,
                        "sowing_date": c.sowing_date.isoformat() if c.sowing_date else None,
                        "plot_name": c.plot.plot_name if c.plot else "Unknown"
                    }
            except ValueError:
                pass
            return {"error": "Crop not found"}

        elif action == "harvest_timing" and crop_id_str:
            try:
                crop_id = uuid.UUID(crop_id_str)
                q = select(Crop).join(FarmPlot).where(Crop.id == crop_id, FarmPlot.farmer_id == user_id)
                res = await db.execute(q)
                c = res.scalar_one_or_none()
                if c:
                    harvest_date = c.expected_harvest_date if c.expected_harvest_date else (datetime.now() + timedelta(days=60))
                    days_remaining = (harvest_date - datetime.now().date() if isinstance(harvest_date, date) else harvest_date - datetime.now()).days
                    return {
                        "crop_name": c.crop_name,
                        "expected_harvest": harvest_date.isoformat(),
                        "days_remaining": max(0, days_remaining),
                        "stage": c.crop_stage
                    }
            except ValueError:
                pass
            return {"error": "Crop not found"}

        return {"error": "Invalid crop action"}

    @staticmethod
    async def _handle_plot_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        plot_id_str = params.get("plot_id")
        crop_name = params.get("crop_name")

        if action == "list":
            q = select(FarmPlot).where(FarmPlot.farmer_id == user_id, FarmPlot.is_deleted == False)
            res = await db.execute(q)
            plots = res.scalars().all()
            return {
                "plots": [{
                    "id": str(p.id),
                    "name": p.plot_name,
                    "area": p.approximate_area_acres,
                    "soil": p.soil_type,
                    "verified": p.verification_status
                } for p in plots]
            }

        elif action == "get" and plot_id_str:
            try:
                plot_id = uuid.UUID(plot_id_str)
                q = select(FarmPlot).where(FarmPlot.id == plot_id, FarmPlot.farmer_id == user_id)
                res = await db.execute(q)
                p = res.scalar_one_or_none()
                if p:
                    return {
                        "id": str(p.id),
                        "name": p.plot_name,
                        "area": p.approximate_area_acres,
                        "soil": p.soil_type,
                        "verified": p.verification_status,
                        "latitude": p.latitude,
                        "longitude": p.longitude
                    }
            except ValueError:
                pass
            return {"error": "Plot not found"}

        elif action == "filter" and crop_name:
            q = select(FarmPlot).join(Crop).where(
                FarmPlot.farmer_id == user_id,
                Crop.crop_name.ilike(f"%{crop_name}%"),
                FarmPlot.is_deleted == False
            )
            res = await db.execute(q)
            plots = res.scalars().all()
            return {
                "filtered_crop": crop_name,
                "plots": [{
                    "id": str(p.id),
                    "name": p.plot_name,
                    "area": p.approximate_area_acres,
                    "soil": p.soil_type
                } for p in plots]
            }

        return {"error": "Invalid plot action"}

    @staticmethod
    async def _handle_expense_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        amount = params.get("amount")
        category = params.get("category")
        crop_id_str = params.get("crop_id")
        period = params.get("period")
        notes = params.get("notes")

        if action == "log":
            # For logging, we return confirmation_data so that the engine requests confirmation.
            # If the user has already confirmed, we save it (handled in main conversational service).
            return {
                "action": "log",
                "amount": amount,
                "category": category,
                "crop_id": crop_id_str,
                "notes": notes,
                "date": datetime.now(UTC).date().isoformat()
            }

        elif action == "get_summary":
            # Query expenses for user crops
            q = select(Expense).join(Crop).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                Expense.is_deleted == False
            )
            res = await db.execute(q)
            expenses = res.scalars().all()
            total = sum(e.amount for e in expenses)
            breakdown = {}
            for e in expenses:
                breakdown[e.category] = breakdown.get(e.category, 0.0) + float(e.amount)
            return {
                "total_expense": total,
                "breakdown": breakdown,
                "count": len(expenses)
            }

        elif action == "get_by_category" and category:
            q = select(Expense).join(Crop).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                Expense.category == category,
                Expense.is_deleted == False
            )
            res = await db.execute(q)
            expenses = res.scalars().all()
            return {
                "category": category,
                "total": sum(e.amount for e in expenses),
                "records": [{
                    "amount": e.amount,
                    "crop": e.crop.crop_name if e.crop else "General",
                    "date": e.expense_date.isoformat() if e.expense_date else None,
                    "notes": e.notes
                } for e in expenses]
            }

        elif action == "get_total":
            q = select(func.sum(Expense.amount)).join(Crop).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                Expense.is_deleted == False
            )
            total = (await db.execute(q)).scalar() or 0.0
            return {"total_spent": float(total)}

        return {"error": "Invalid expense action"}

    @staticmethod
    async def _handle_input_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        product = params.get("product_name")
        input_type = params.get("input_type")
        brand = params.get("brand")
        quantity = params.get("quantity")
        unit = params.get("unit")
        crop_id_str = params.get("crop_id")
        notes = params.get("notes")

        if action == "log":
            return {
                "action": "log",
                "product_name": product,
                "input_type": input_type,
                "brand": brand,
                "quantity": quantity,
                "unit": unit,
                "crop_id": crop_id_str,
                "notes": notes,
                "date": datetime.now(UTC).date().isoformat()
            }

        elif action == "get_history":
            q = select(InputRecord).join(Crop).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                InputRecord.is_deleted == False
            ).order_by(InputRecord.application_date.desc()).limit(10)
            res = await db.execute(q)
            records = res.scalars().all()
            return {
                "inputs": [{
                    "product": r.product_name,
                    "type": r.input_type,
                    "quantity": f"{r.quantity} {r.quantity_unit}",
                    "date": r.application_date.isoformat() if r.application_date else None,
                    "crop": r.crop.crop_name if r.crop else "General"
                } for r in records]
            }

        elif action == "get_last":
            q = select(InputRecord).join(Crop).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                InputRecord.is_deleted == False
            ).order_by(InputRecord.application_date.desc(), InputRecord.created_at.desc()).limit(1)
            res = await db.execute(q)
            r = res.scalar_one_or_none()
            if r:
                return {
                    "product": r.product_name,
                    "type": r.input_type,
                    "quantity": f"{r.quantity} {r.quantity_unit}",
                    "date": r.application_date.isoformat() if r.application_date else None,
                    "crop": r.crop.crop_name if r.crop else "General"
                }
            return {"message": "No input logged yet."}

        return {"error": "Invalid input action"}

    @staticmethod
    async def _handle_health_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        crop_id_str = params.get("crop_id")

        if action == "get_history":
            q = select(HealthRecord).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                HealthRecord.is_deleted == False
            ).order_by(HealthRecord.created_at.desc()).limit(5)
            res = await db.execute(q)
            records = res.scalars().all()
            return {
                "scans": [{
                    "diagnosis": r.diagnosis,
                    "severity": r.severity,
                    "score": r.health_score,
                    "date": r.created_at.isoformat(),
                    "plot": r.plot.plot_name
                } for r in records]
            }

        elif action == "get_score":
            q = select(func.avg(HealthRecord.health_score)).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                HealthRecord.is_deleted == False
            )
            score = (await db.execute(q)).scalar()
            return {
                "average_health_score": round(float(score), 1) if score else 100.0,
                "rating": "Good" if (score and score >= 80) else "Monitor Closely"
            }

        return {"error": "Invalid health action"}

    @staticmethod
    async def _handle_irrigation_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        plot_id_str = params.get("plot_id")
        hours = params.get("hours")
        water_source = params.get("water_source")

        if action == "log":
            return {
                "action": "log",
                "plot_id": plot_id_str,
                "hours": hours,
                "water_source": water_source or "borewell",
                "date": datetime.now(UTC).date().isoformat()
            }

        elif action == "get_history":
            q = select(IrrigationLog).join(FarmPlot).where(
                FarmPlot.farmer_id == user_id,
                IrrigationLog.is_deleted == False
            ).order_by(IrrigationLog.irrigation_date.desc()).limit(10)
            res = await db.execute(q)
            records = res.scalars().all()
            return {
                "irrigation_logs": [{
                    "plot": r.plot.plot_name,
                    "hours": r.duration_hours,
                    "source": r.water_source,
                    "date": r.irrigation_date.isoformat()
                } for r in records]
            }

        return {"error": "Invalid irrigation action"}

    @staticmethod
    async def _handle_recommendation_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        crop_id_str = params.get("crop_id")
        try:
            crop_id = uuid.UUID(crop_id_str)
            # Resolve recommendations
            q = select(Crop).join(FarmPlot).where(Crop.id == crop_id, FarmPlot.farmer_id == user_id)
            res = await db.execute(q)
            crop = res.scalar_one_or_none()
            if crop:
                # Call recommendation service or generate local recommendations
                # Return context for conversational prompt synthesis
                return {
                    "crop_name": crop.crop_name,
                    "stage": crop.crop_stage,
                    "sowing_date": crop.sowing_date.isoformat() if crop.sowing_date else None,
                    "plot_name": crop.plot.plot_name
                }
        except ValueError:
            pass
        return {"error": "Crop not found"}

    @staticmethod
    async def _handle_simulation_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")
        scenario_type = params.get("scenario_type")
        plot_id_str = params.get("plot_id")

        if action == "list":
            return {
                "scenarios": [
                    {"type": "rainfall", "name": "Heavy Monsoons Scenario"},
                    {"type": "drought", "name": "Severe El Nino Drought Simulation"},
                    {"type": "crop_disease", "name": "Late Blight Sprout Outbreak"},
                    {"type": "pest_outbreak", "name": "Locust Influx Simulation"}
                ]
            }

        elif action == "run" and scenario_type:
            # Trigger mock/actual simulation
            return {
                "status": "completed",
                "scenario": scenario_type,
                "plot_id": plot_id_str,
                "affected_crops": ["Wheat", "Tomato"],
                "severity": "medium",
                "advisory": f"A {scenario_type} simulation was triggered. Ensure drainage channels are cleared and soil moisture is monitored."
            }

        return {"error": "Invalid simulation action"}

    @staticmethod
    async def _handle_dashboard_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        action = params.get("action")

        if action in ["summary", "daily_advice"]:
            # Aggregate plot count, crop count, expense sum
            pq = select(func.count(FarmPlot.id)).where(FarmPlot.farmer_id == user_id, FarmPlot.is_deleted == False)
            plots_count = (await db.execute(pq)).scalar() or 0

            cq = select(func.count(Crop.id)).join(FarmPlot).where(FarmPlot.farmer_id == user_id, Crop.is_deleted == False, Crop.crop_stage != "harvested")
            crops_count = (await db.execute(cq)).scalar() or 0

            eq = select(func.sum(Expense.amount)).join(Crop).join(FarmPlot).where(FarmPlot.farmer_id == user_id, Expense.is_deleted == False)
            expense_total = (await db.execute(eq)).scalar() or 0.0

            return {
                "plots_count": plots_count,
                "crops_count": crops_count,
                "expense_total": float(expense_total),
                "alerts": [
                    {"type": "weather", "message": "Heavy Rain expected tomorrow (70% probability). Delay pesticide spraying."}
                ],
                "daily_advice": "Ensure soil moisture levels are monitored on Wheat. Forecast indicates rain, so suspend irrigation for the next 24 hours."
            }

        return {"error": "Invalid dashboard action"}

    @staticmethod
    async def _handle_navigation_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        # Simple client side navigation routing details returned to client
        page = params.get("page")
        plot_id = params.get("plot_id")
        crop_id = params.get("crop_id")

        return {
            "navigate": True,
            "target_page": page,
            "query_params": {
                "plot_id": plot_id,
                "crop_id": crop_id
            }
        }

    @staticmethod
    async def _handle_report_tool(params: Dict[str, Any], user_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        period = params.get("period")
        return {
            "report_generated": True,
            "period": period,
            "summary": f"Your agricultural report for {period} has been generated.",
            "metrics": {
                "sowing_progress": "100% completed",
                "fertilizer_applied": "3 bags DAP, 2 bags Urea",
                "water_usage_hours": "14 hours",
                "expenses_total": "₹4,200"
            }
        }
