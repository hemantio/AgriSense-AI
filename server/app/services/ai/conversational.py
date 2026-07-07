"""
AgriSense AI — Conversational Intelligence Service
=====================================================
Orchestrates CIE conversational agent flow, managing RAG, function calling loops,
confidence tiers, action confirmations, and session logging.
"""

import json
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Dict

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.chat import ChatSession, ChatMessage, ChatFeedback
from app.models.expense import Expense
from app.models.input_record import InputRecord
from app.models.irrigation import IrrigationLog
from app.models.crop import Crop
from app.models.plot import FarmPlot
from app.services.ai.context import ContextEngine
from app.services.ai.tool_registry import ToolRegistryService
from app.services.ai.vector_store import VectorStoreService
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger("agrisense.cie.service")

# ──────────────────────────────────────────────────
# System Prompt Loader (Versioned)
# ──────────────────────────────────────────────────

def _load_system_prompt() -> str:
    """Load system prompt from versioned file. Falls back to inline default."""
    version = settings.CIE_PROMPT_VERSION
    prompt_dir = Path(__file__).resolve().parent.parent.parent / "prompts"
    prompt_file = prompt_dir / f"system_prompt_{version}.txt"

    if prompt_file.exists():
        logger.info(f"Loading CIE system prompt from {prompt_file.name}")
        return prompt_file.read_text(encoding="utf-8")

    logger.warning(f"Prompt file {prompt_file.name} not found, using inline default")
    return _INLINE_SYSTEM_PROMPT


_INLINE_SYSTEM_PROMPT = """You are Krishi Mitra (कृषि मित्र), the AI farming assistant for AgriSense AI.

## Identity
- You help small-scale Indian farmers manage their farms digitally.
- You speak simply, clearly, and warmly — like a knowledgeable village elder.
- You are part of the AgriSense AI platform, not a general-purpose AI.
- Your name is Krishi Mitra (कृषि मित्र).

## Language Rules
- DETECT the farmer's language from their message and respond in the SAME language.
- Supported languages: Hindi (hi), Marathi (mr), English (en), Hinglish (hi-en mixed).
- Use local farming vocabulary the farmer would recognize.
- NEVER use technical jargon when a simple word exists.
- If the farmer speaks Hindi/Hinglish, respond fully in Hindi — do not mix in complex English terms.

## Response Guidelines
- Keep responses UNDER 3 sentences for simple factual questions.
- Always include ONE actionable suggestion when relevant.
- Use bullet points for lists (maximum 5 items).
- For weather: always mention if it's safe to spray or irrigate.
- For crop health: ask for a photo if no image was provided.
- For expenses/inputs: always show what you'll record before saving.

## Tool Usage
- You have access to specialized tools for weather, crops, plots, expenses, inputs, health analysis, irrigation, recommendations, simulation, and dashboard data.
- Always use the appropriate tool — NEVER make up data.
- If a tool call fails, tell the farmer honestly and suggest trying again.

## ABSOLUTE SAFETY RULES — NEVER VIOLATE
1. NEVER invent pesticide names, chemical formulations, or dosages.
2. NEVER confirm or execute a data-modifying action without explicit user approval.
3. NEVER provide medical, legal, or financial advice beyond farming costs.
4. NEVER make up government scheme names, subsidy amounts, eligibility criteria, or deadlines.
5. When uncertain about chemical usage: "Apne krishi adhikari se sahi matra confirm karein".
6. For disease diagnosis without photo: "Photo bhejiye toh better diagnose kar sakta hun".
7. NEVER delete records, change plot boundaries, approve farmers, or modify roles.
8. If confidence is below 25%, DO NOT attempt to answer — ask for clarification instead.

## Output Format
Always respond in this JSON structure:
{
  "intent": "<detected_intent>",
  "entities": { "<entity_name>": "<value>" },
  "confidence": <0.0 to 1.0>,
  "language": "<detected language code: hi, mr, en, hi-en>",
  "response_text": "<farmer-facing natural language response in detected language>",
  "tool_calls": [{ "name": "<tool_name>", "params": { ... } }],
  "needs_confirmation": <true/false>,
  "confirmation_data": { ... },
  "suggestions": ["<related question 1>", "<related question 2>"]
}
"""

# Load system prompt on module import
MASTER_SYSTEM_PROMPT = _load_system_prompt()


class ConversationalIntelligenceService:
    """Manages the end-to-end conversational interface flow."""

    @classmethod
    async def process_message(
        cls,
        message: str,
        user_id: uuid.UUID,
        db: AsyncSession,
        session_id: uuid.UUID | None = None,
        page_context: str | None = None
    ) -> Dict[str, Any]:
        """
        Processes a user message, manages conversation state, routes tools,
        executes confirmations, and returns the response payload.
        """
        start_time = datetime.now(UTC)

        # 1. Resolve or Create Chat Session
        session = None
        if session_id:
            sq = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
            sr = await db.execute(sq)
            session = sr.scalar_one_or_none()

            # Check session timeout
            if session and not session.is_active:
                session = None  # Force new session
            elif session:
                timeout_delta = timedelta(minutes=settings.CIE_SESSION_TIMEOUT_MINUTES)
                if session.updated_at and (datetime.now(UTC) - session.updated_at.replace(tzinfo=UTC if session.updated_at.tzinfo is None else session.updated_at.tzinfo)) > timeout_delta:
                    # Session has timed out — close it and start a new one
                    session.is_active = False
                    session.ended_at = datetime.now(UTC)
                    await db.commit()
                    logger.info(f"Session {session.id} timed out after {settings.CIE_SESSION_TIMEOUT_MINUTES} minutes")
                    session = None

        if not session:
            # Create a new session
            title = message[:40] + ("..." if len(message) > 40 else "")
            session = ChatSession(
                user_id=user_id,
                title=title,
                language="hi",  # Will detect and update
                page_context=page_context,
                message_count=0,
                is_active=True
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)
            session_id = session.id

        # Update message count
        session.message_count += 1
        await db.commit()

        # 2. Check for Action Confirmation ("Haan", "Confirm", "Yes", etc.)
        confirmed_payload = await cls._handle_action_confirmation(message, session_id, user_id, db)
        if confirmed_payload:
            user_msg_rec = ChatMessage(
                session_id=session_id,
                role="user",
                content=message,
                intent="action.confirm"
            )
            db.add(user_msg_rec)

            assistant_msg_rec = ChatMessage(
                session_id=session_id,
                role="assistant",
                content=confirmed_payload["response_text"],
                intent="action.confirm",
                confidence=1.0,
                action_taken=confirmed_payload.get("action_taken")
            )
            db.add(assistant_msg_rec)
            await db.commit()

            return {
                "session_id": str(session_id),
                "message_id": str(assistant_msg_rec.id),
                "response_text": confirmed_payload["response_text"],
                "intent": "action.confirm",
                "confidence": 1.0,
                "needs_confirmation": False,
                "confirmation_data": None,
                "suggestions": ["Mera summary batao", "Mausam kaisa hai?"]
            }

        # 3. Assemble Context & RAG Knowledge
        context_data = await ContextEngine.assemble_context(user_id, db, session_id, page_context)
        rag_hits = await VectorStoreService.search_similarity(message, db, limit=3)
        rag_context = "\n".join([f"Source: {hit['title']}\nContent: {hit['content']}" for hit in rag_hits])

        # 4. Generate AI Response (incorporating mock mode fallback)
        ai_payload = await cls._generate_llm_response(message, context_data, rag_context, db)

        # 5. Route Tools & Evaluate Confidence
        confidence = ai_payload.get("confidence", 1.0)
        needs_confirmation = ai_payload.get("needs_confirmation", False)
        response_text = ai_payload.get("response_text", "")
        tool_calls = ai_payload.get("tool_calls", [])
        intent = ai_payload.get("intent", "unknown")
        entities = ai_payload.get("entities", {})

        tool_used = None
        action_result = None
        action_taken = None

        # Tier 4: Decline if confidence is very low (< 25%)
        if confidence < 0.25:
            response_text = "Main samajh nahi paaya. Kya aap farming, mausam, ya kharche ke baare mein pooch rahe hain?"
            tool_calls = []
            needs_confirmation = False

        # Tier 3: Clarify if confidence is low-medium (25% - 49%)
        elif confidence < 0.50:
            # Let the response text stand as a clarification request
            tool_calls = []
            needs_confirmation = False

        # Execute/Confirm logic (Tier 1 & 2)
        elif tool_calls:
            first_tool = tool_calls[0]
            tool_used = first_tool["name"]
            tool_params = first_tool.get("params", {})

            # Check if this tool requires confirmation and we aren't already confirming
            requires_conf = tool_used in ["expense_tool", "input_tool", "irrigation_tool"]

            if requires_conf:
                # Force confirmation card
                needs_confirmation = True
                ai_payload["confirmation_data"] = {
                    "tool": tool_used,
                    "params": tool_params,
                    "action_type": "data_write"
                }
                if tool_used == "expense_tool":
                    response_text = f"Main ₹{tool_params.get('amount')} ka kharcha '{tool_params.get('category')}' category mein add kar raha hun. Sahi hai?"
                elif tool_used == "input_tool":
                    response_text = f"Main {tool_params.get('product_name')} ({tool_params.get('quantity')} {tool_params.get('unit')}) log kar raha hun. Confirm karein?"
                elif tool_used == "irrigation_tool":
                    response_text = "Main irrigation event log kar raha hun. Kya main save karun?"

            elif not needs_confirmation:
                # Execute immediately! (Tier 1: ≥ 85%)
                action_result = await ToolRegistryService.execute_tool(tool_used, tool_params, user_id, db)
                action_taken = f"Executed {tool_used}"

                # Synthesize natural language from tool results
                if "error" not in action_result:
                    if tool_used == "weather_tool":
                        if tool_params.get("action") == "current":
                            response_text = f"Abhi mausam {action_result.get('temperature')}°C hai aur {action_result.get('description')} hai. Baarish ka chance {action_result.get('rain_prob')}% hai."
                        elif tool_params.get("action") == "spray_safety":
                            safe_msg = "safe hai" if action_result.get("spray_safe") else "safe nahi hai"
                            response_text = f"Aaj spray karna {safe_msg}. Reason: {action_result.get('reason')}."
                        elif tool_params.get("action") == "forecast":
                            forecast = action_result.get("forecast", [])
                            if forecast:
                                response_text = f"Agle kuch dino ka forecast: {action_result.get('location', 'aapke khet')} ke liye weather data mil gaya hai."
                            else:
                                response_text = "Forecast data abhi available nahi hai."
                    elif tool_used == "dashboard_tool":
                        response_text = f"Aapke paas {action_result.get('plots_count')} active khet hain aur {action_result.get('crops_count')} fasalein hain. Summary: {action_result.get('daily_advice')}"
                    elif tool_used == "crop_tool":
                        if tool_params.get("action") == "list":
                            crops = action_result.get("crops", [])
                            if crops:
                                crop_list = ", ".join([f"{c['name']} ({c['stage']})" for c in crops[:5]])
                                response_text = f"Aapki active fasalein: {crop_list}."
                            else:
                                response_text = "Abhi koi active fasal registered nahi hai."
                        elif tool_params.get("action") == "harvest_timing":
                            response_text = f"{action_result.get('crop_name', 'Fasal')} ki harvest lagbhag {action_result.get('days_remaining', '?')} dino mein hogi."
                    elif tool_used == "plot_tool":
                        if tool_params.get("action") == "list":
                            plots = action_result.get("plots", [])
                            if plots:
                                plot_list = ", ".join([f"{p['name']} ({p['area']} acre)" for p in plots[:5]])
                                response_text = f"Aapke khet: {plot_list}."
                            else:
                                response_text = "Abhi koi khet registered nahi hai."
                    elif tool_used == "expense_tool":
                        if tool_params.get("action") == "get_summary":
                            total = action_result.get("total_expense", 0)
                            breakdown = action_result.get("breakdown", {})
                            parts = [f"{k}: ₹{v}" for k, v in breakdown.items()]
                            response_text = f"Is season ka kul kharcha: ₹{total}. " + (", ".join(parts) if parts else "")
                        elif tool_params.get("action") == "get_total":
                            response_text = f"Aapka kul kharcha ₹{action_result.get('total_spent', 0)} hai."
                    elif tool_used == "health_tool":
                        if tool_params.get("action") == "get_score":
                            score = action_result.get("average_health_score", 100)
                            rating = action_result.get("rating", "Good")
                            response_text = f"Aapki faslon ka average health score {score} hai — {rating}."
                    elif tool_used == "simulation_tool":
                        if tool_params.get("action") == "run":
                            response_text = f"Simulation complete: {action_result.get('scenario', 'scenario')} — {action_result.get('advisory', '')}."
                        elif tool_params.get("action") == "list":
                            scenarios = action_result.get("scenarios", [])
                            names = ", ".join([s["name"] for s in scenarios])
                            response_text = f"Available simulations: {names}."
                    elif tool_used == "navigation_tool":
                        response_text = f"{action_result.get('target_page', 'Page')} pe le ja raha hun."
                    elif tool_used == "report_tool":
                        response_text = f"Report generated for {action_result.get('period', 'period')}: {action_result.get('summary', '')}."
                    elif tool_used == "input_tool":
                        if tool_params.get("action") == "get_history":
                            inputs = action_result.get("inputs", [])
                            if inputs:
                                items = [f"{inp['product']} ({inp['quantity']})" for inp in inputs[:3]]
                                response_text = f"Haal ke inputs: {', '.join(items)}."
                            else:
                                response_text = "Abhi tak koi input log nahi hai."
                    elif tool_used == "recommendation_tool":
                        response_text = f"{action_result.get('crop_name', 'Fasal')} ({action_result.get('stage', 'stage')}) ke liye recommendations tayyar hain."
                else:
                    response_text = f"Maaf kijiyega, {tool_used} execute karne mein dikkat aayi: {action_result.get('error')}"

        # 6. Save message history in DB
        user_msg_rec = ChatMessage(
            session_id=session_id,
            role="user",
            content=message,
            intent=intent,
            entities=entities if entities else None
        )
        db.add(user_msg_rec)

        latency = int((datetime.now(UTC) - start_time).total_seconds() * 1000)

        assistant_msg_rec = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=response_text,
            intent=intent,
            confidence=confidence,
            entities=entities if entities else None,
            tool_name=tool_used,
            tool_params=tool_calls[0].get("params") if tool_calls else None,
            action_taken=action_taken or ("pending_confirmation" if needs_confirmation else None),
            latency_ms=latency,
            tokens_used=150  # Mock estimate
        )
        db.add(assistant_msg_rec)
        await db.commit()

        # Update language in session based on prompt detection
        detected_lang = ai_payload.get("language", "hi")
        session.language = detected_lang
        await db.commit()

        return {
            "session_id": str(session_id),
            "message_id": str(assistant_msg_rec.id),
            "response_text": response_text,
            "intent": intent,
            "confidence": confidence,
            "tool_used": tool_used,
            "action_result": action_result,
            "needs_confirmation": needs_confirmation,
            "confirmation_data": ai_payload.get("confirmation_data"),
            "suggestions": ai_payload.get("suggestions", ["Mausam ka haal batao", "Mera kharcha dikhao"])
        }

    @staticmethod
    async def close_session(
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        db: AsyncSession
    ) -> bool:
        """Close an active chat session."""
        sq = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
            ChatSession.is_active == True
        )
        sr = await db.execute(sq)
        session = sr.scalar_one_or_none()
        if session:
            session.is_active = False
            session.ended_at = datetime.now(UTC)
            await db.commit()
            return True
        return False

    @staticmethod
    async def _handle_action_confirmation(
        message: str,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        db: AsyncSession
    ) -> Dict[str, Any] | None:
        """
        Evaluates if the user is confirming a pending action.
        If yes, saves the record to the database and returns a success response.
        """
        clean_msg = message.strip().lower()
        is_confirm = clean_msg in ["haan", "yes", "confirm", "sahi hai", "karo", "ha", "okay", "ok", "yap", "हाँ", "हां"]
        is_cancel = clean_msg in ["na", "no", "cancel", "rehne do", "galat", "nahin", "nahi", "नहीं", "रहने दो"]

        if not (is_confirm or is_cancel):
            return None

        # Find last assistant message with pending confirmation in this session
        q = select(ChatMessage).where(
            ChatMessage.session_id == session_id,
            ChatMessage.role == "assistant",
            ChatMessage.action_taken == "pending_confirmation"
        ).order_by(ChatMessage.created_at.desc()).limit(1)
        res = await db.execute(q)
        pending_msg = res.scalar_one_or_none()

        if not pending_msg:
            return None

        # Mark as resolved
        if is_cancel:
            pending_msg.action_taken = "cancelled"
            await db.commit()
            return {
                "response_text": "Theek hai, maine cancel kar diya. ✗",
                "action_taken": "cancelled"
            }

        # User confirmed! Execute actual database insert
        tool_name = pending_msg.tool_name
        params = pending_msg.tool_params or {}

        try:
            if tool_name == "expense_tool":
                amount = params.get("amount", 0.0)
                category = params.get("category", "misc")
                crop_id_str = params.get("crop_id")
                notes = params.get("notes", "CIE log")

                # Resolve crop_id
                crop_id = None
                if crop_id_str:
                    crop_id = uuid.UUID(crop_id_str)
                else:
                    # Fallback: get user's first crop
                    cq = select(Crop).join(FarmPlot).where(FarmPlot.farmer_id == user_id, Crop.is_deleted == False).limit(1)
                    cr = await db.execute(cq)
                    first_crop = cr.scalar_one_or_none()
                    if first_crop:
                        crop_id = first_crop.id

                if not crop_id:
                    raise Exception("No active crops found to link expense.")

                new_expense = Expense(
                    crop_id=crop_id,
                    amount=amount,
                    category=category,
                    notes=notes,
                    expense_date=datetime.now(UTC).date()
                )
                db.add(new_expense)
                await db.commit()

                pending_msg.action_taken = "completed"
                await db.commit()
                return {
                    "response_text": f"Record ho gaya ✓ ₹{amount} ka kharcha '{category}' category mein save hua.",
                    "action_taken": "completed"
                }

            elif tool_name == "input_tool":
                product_name = params.get("product_name", "Unknown Product")
                input_type = params.get("input_type", "fertilizer")
                brand = params.get("brand")
                quantity = params.get("quantity", 0.0)
                unit = params.get("unit", "bags")
                crop_id_str = params.get("crop_id")

                crop_id = None
                if crop_id_str:
                    crop_id = uuid.UUID(crop_id_str)
                else:
                    cq = select(Crop).join(FarmPlot).where(FarmPlot.farmer_id == user_id, Crop.is_deleted == False).limit(1)
                    cr = await db.execute(cq)
                    first_crop = cr.scalar_one_or_none()
                    if first_crop:
                        crop_id = first_crop.id

                if not crop_id:
                    raise Exception("No active crops found to log input.")

                new_input = InputRecord(
                    crop_id=crop_id,
                    input_type=input_type,
                    product_name=product_name,
                    brand=brand,
                    quantity=quantity,
                    quantity_unit=unit,
                    application_date=datetime.now(UTC).date(),
                    application_notes=params.get("notes")
                )
                db.add(new_input)
                await db.commit()

                pending_msg.action_taken = "completed"
                await db.commit()
                return {
                    "response_text": f"Record ho gaya ✓ {product_name} ({quantity} {unit}) log ho gaya.",
                    "action_taken": "completed"
                }

            elif tool_name == "irrigation_tool":
                plot_id_str = params.get("plot_id")
                hours = params.get("hours", 0.0)
                water_source = params.get("water_source", "borewell")

                plot_id = None
                if plot_id_str:
                    plot_id = uuid.UUID(plot_id_str)
                else:
                    pq = select(FarmPlot).where(FarmPlot.farmer_id == user_id, FarmPlot.is_deleted == False).limit(1)
                    pr = await db.execute(pq)
                    first_plot = pr.scalar_one_or_none()
                    if first_plot:
                        plot_id = first_plot.id

                if not plot_id:
                    raise Exception("No active plots found to log irrigation.")

                new_log = IrrigationLog(
                    plot_id=plot_id,
                    duration_hours=hours,
                    water_source=water_source,
                    irrigation_date=datetime.now(UTC).date()
                )
                db.add(new_log)
                await db.commit()

                pending_msg.action_taken = "completed"
                await db.commit()
                return {
                    "response_text": f"Record ho gaya ✓ {hours} ghante irrigation log ho gaya.",
                    "action_taken": "completed"
                }

        except Exception as e:
            logger.error(f"Failed to execute confirmed action: {str(e)}")
            pending_msg.action_taken = "failed"
            await db.commit()
            return {
                "response_text": f"Maaf kijiyega, save karne mein error aayi: {str(e)}",
                "action_taken": "failed"
            }

        return None

    @classmethod
    async def _generate_llm_response(
        cls,
        message: str,
        context_data: Dict[str, Any],
        rag_context: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Hits the Gemini API to identify intent, extract entities, evaluate confidence,
        and select tools. Fallback to mock rule-based logic if API key is not configured.
        """
        # If API key is missing, run our mock rule-based classifier
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mock_gemini_api_key_for_testing":
            return cls._mock_classifier(message, context_data)

        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)

            # Retrieve active tools schema list
            active_schemas = await ToolRegistryService.get_active_schemas(db)

            # Format context data as JSON string to inject into prompt
            formatted_farmer_context = json.dumps(context_data.get("farmer", {}))
            formatted_plots_crops = json.dumps(context_data.get("active_plots", []))
            formatted_weather = json.dumps(context_data.get("weather", {}))
            formatted_inputs = json.dumps(context_data.get("recent_inputs", []))
            formatted_health = json.dumps(context_data.get("recent_health", []))
            formatted_history = json.dumps(context_data.get("conversation_history", []))

            injected_prompt = f"""
{MASTER_SYSTEM_PROMPT}

## GROUNDING RAG KNOWLEDGE (VERIFIED INFO)
{rag_context if rag_context else "No relevant knowledge base entries found."}

## CURRENT CONTEXT LAYER
Farmer profile: {formatted_farmer_context}
Plots & Crops: {formatted_plots_crops}
Current Weather: {formatted_weather}
Recent Input Applications: {formatted_inputs}
Recent Crop Health Scans: {formatted_health}
Active Chat History: {formatted_history}

User message to answer: "{message}"
"""

            # Build Gemini model
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json"}
            )

            # Gemini 2.0 Flash supports native tool declarations
            response = model.generate_content(
                injected_prompt,
                tools=active_schemas if active_schemas else None
            )

            # Parse structural JSON output
            result_text = response.text.strip()
            # Clean markdown fences if any
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]

            payload = json.loads(result_text)
            return payload

        except Exception as e:
            logger.error(f"Gemini CIE call failed: {str(e)}")
            # Fallback to mock classifier on failure
            return cls._mock_classifier(message, context_data)

    @staticmethod
    def _mock_classifier(message: str, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simple rule-based mock CIE classifier for development/testing."""
        clean = message.lower().strip()

        # Default fallback payload
        payload = {
            "intent": "unknown",
            "entities": {},
            "confidence": 0.90,
            "language": "hi",
            "response_text": "Main samajh nahi paaya. Kya aap mausam, fasal, ya kharche ke baare mein pooch rahe hain?",
            "tool_calls": [],
            "needs_confirmation": False,
            "suggestions": ["Mausam kaisa hai?", "Mera summary batao", "Kharcha log karo"]
        }

        # Detect language
        has_hindi = any(c in clean for c in "ँंःअआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह")
        has_marathi_markers = any(w in clean for w in ["mala", "majhya", "ahe", "shet", "kaapus", "paus"])
        if has_marathi_markers:
            payload["language"] = "mr"
        elif has_hindi:
            payload["language"] = "hi"
        elif any(c.isascii() and c.isalpha() for c in clean):
            # Check if mostly English
            hindi_words = ["mein", "hai", "kya", "ka", "ki", "ke", "aaj", "kal", "hogi", "hain", "karo", "batao", "dikhao", "kaisa", "kitna", "kharcha"]
            if any(w in clean.split() for w in hindi_words):
                payload["language"] = "hi-en"
            else:
                payload["language"] = "en"

        # 1. Weather
        if any(w in clean for w in ["baarish", "weather", "mausam", "rain", "paus", "tufan"]):
            is_spray = any(w in clean for w in ["spray", "safe", "chidkav"])
            is_forecast = any(w in clean for w in ["kal", "forecast", "week", "hafte", "agle"])
            payload.update({
                "intent": "weather.spray_safety" if is_spray else ("weather.forecast" if is_forecast else "weather.current"),
                "response_text": "Mausam checking tool trigger ho raha hai.",
                "tool_calls": [{
                    "name": "weather_tool",
                    "params": {
                        "action": "spray_safety" if is_spray else ("forecast" if is_forecast else "current")
                    }
                }],
                "suggestions": ["Spray kab safe hoga?", "Is hafte ka forecast"]
            })

        # 2. Expense Log
        elif any(w in clean for w in ["kharch", "rupaye", "spend", "expense", "cost", "paisa"]):
            import re
            amount_match = re.search(r'\d+', clean)
            if amount_match and any(w in clean for w in ["add", "log", "hua", "hue", "daala", "laga"]):
                amount = float(amount_match.group())
                category = "labour" if any(w in clean for w in ["mazdoor", "labour", "mazdoori"]) \
                    else "seed" if any(w in clean for w in ["beej", "seed"]) \
                    else "fertilizer" if any(w in clean for w in ["khaad", "fertilizer", "dap", "urea"]) \
                    else "pesticide" if any(w in clean for w in ["dawai", "pesticide", "spray"]) \
                    else "irrigation" if any(w in clean for w in ["paani", "sinchai", "motor"]) \
                    else "misc"
                payload.update({
                    "intent": "expense.log",
                    "confidence": 0.75,
                    "entities": {"amount": amount, "category": category},
                    "needs_confirmation": True,
                    "response_text": f"Main ₹{amount} ka kharcha '{category}' category mein add kar raha hun. Confirm karein?",
                    "tool_calls": [{
                        "name": "expense_tool",
                        "params": {
                            "action": "log",
                            "amount": amount,
                            "category": category,
                            "notes": "Logged via CIE voice assistant"
                        }
                    }],
                    "suggestions": ["Haan", "Cancel", "Summary dikhao"]
                })
            else:
                payload.update({
                    "intent": "expense.summary",
                    "tool_calls": [{
                        "name": "expense_tool",
                        "params": {"action": "get_summary"}
                    }],
                    "response_text": "Main aapke is season ke kharchon ki summary fetch kar raha hun.",
                    "suggestions": ["Seed cost check karo", "Labour cost kitna hai?"]
                })

        # 3. Input Record Log
        elif any(w in clean for w in ["bag", "dap", "urea", "khaad", "fertilizer"]):
            import re
            qty_match = re.search(r'\d+', clean)
            qty = float(qty_match.group()) if qty_match else 1.0
            product = "DAP" if "dap" in clean else "Urea" if "urea" in clean else "Khaad"
            payload.update({
                "intent": "input.log",
                "confidence": 0.70,
                "entities": {"product": product, "quantity": qty, "unit": "bags"},
                "needs_confirmation": True,
                "response_text": f"Main {product} ({qty} bags) input log kar raha hun. Confirm karein?",
                "tool_calls": [{
                    "name": "input_tool",
                    "params": {
                        "action": "log",
                        "product_name": product,
                        "input_type": "fertilizer",
                        "quantity": qty,
                        "unit": "bags"
                    }
                }],
                "suggestions": ["Haan", "Cancel", "Inputs history dikhao"]
            })

        # 4. Irrigation
        elif any(w in clean for w in ["sinchai", "paani", "motor", "irrigation", "water"]):
            import re
            hrs_match = re.search(r'\d+', clean)
            hrs = float(hrs_match.group()) if hrs_match else 1.0
            if any(w in clean for w in ["log", "chalayi", "daala", "diya", "kiya"]):
                payload.update({
                    "intent": "irrigation.log",
                    "confidence": 0.70,
                    "entities": {"hours": hrs},
                    "needs_confirmation": True,
                    "response_text": f"Main {hrs} ghante ki sinchai log kar raha hun. Confirm karein?",
                    "tool_calls": [{
                        "name": "irrigation_tool",
                        "params": {"action": "log", "hours": hrs, "water_source": "borewell"}
                    }],
                    "suggestions": ["Haan", "Cancel"]
                })
            else:
                payload.update({
                    "intent": "irrigation.history",
                    "tool_calls": [{
                        "name": "irrigation_tool",
                        "params": {"action": "get_history"}
                    }],
                    "response_text": "Main aapke sinchai ki history check kar raha hun."
                })

        # 5. Plots
        elif any(w in clean for w in ["khet", "plot", "shet"]):
            payload.update({
                "intent": "plot.list",
                "tool_calls": [{
                    "name": "plot_tool",
                    "params": {"action": "list"}
                }],
                "response_text": "Main aapke khet ki details fetch kar raha hun.",
                "suggestions": ["Plot 4 kholo", "Kapas ke khet dikhao"]
            })

        # 6. Crops
        elif any(w in clean for w in ["crop", "fasal", "tamatar", "gehun", "kapas", "dhaan", "soybean"]):
            payload.update({
                "intent": "crop.list",
                "tool_calls": [{
                    "name": "crop_tool",
                    "params": {"action": "list"}
                }],
                "response_text": "Main aapki fasal ki list check kar raha hun.",
                "suggestions": ["Gehun kab harvest hoga?", "Tamatar ka haal batao"]
            })

        # 7. Health
        elif any(w in clean for w in ["bimari", "rog", "peele", "yellow", "health", "disease", "pest", "keeda"]):
            payload.update({
                "intent": "crop.health_check",
                "confidence": 0.38,
                "response_text": "Kaun si fasal mein dikkat hai? Photo bhejenge toh better diagnose kar sakta hun.",
                "suggestions": ["Photo bhejo", "Tamatar mein dikkat", "Gehun mein dikkat"]
            })

        # 8. Dashboard summary
        elif any(w in clean for w in ["summary", "advice", "kya karna", "overview", "batao"]):
            payload.update({
                "intent": "dashboard.summary",
                "tool_calls": [{
                    "name": "dashboard_tool",
                    "params": {"action": "summary"}
                }],
                "response_text": "Main aapke dashboard ka overall summary nikal raha hun.",
                "suggestions": ["Mausam dikhao", "Kharcha breakdown"]
            })

        # 9. Navigation
        elif any(w in clean for w in ["kholo", "open", "dikhao", "show", "page"]):
            # Try to detect target page
            page = "dashboard"
            if any(w in clean for w in ["plot", "khet"]):
                page = "plots"
            elif any(w in clean for w in ["crop", "fasal"]):
                page = "crops"
            elif any(w in clean for w in ["expense", "kharcha"]):
                page = "expenses"
            elif any(w in clean for w in ["weather", "mausam"]):
                page = "weather"
            elif any(w in clean for w in ["health", "swasthya"]):
                page = "health"
            elif any(w in clean for w in ["simulation", "anumaan"]):
                page = "simulation"
            payload.update({
                "intent": "navigation.open",
                "tool_calls": [{
                    "name": "navigation_tool",
                    "params": {"page": page}
                }],
                "response_text": f"{page.capitalize()} page pe le ja raha hun.",
                "suggestions": ["Dashboard dikhao", "Plots kholo"]
            })

        # 10. Simulation
        elif any(w in clean for w in ["simulation", "drought", "sukha", "scenario"]):
            payload.update({
                "intent": "simulation.run",
                "tool_calls": [{
                    "name": "simulation_tool",
                    "params": {"action": "run", "scenario_type": "drought"}
                }],
                "response_text": "Drought simulation run kar raha hun.",
                "suggestions": ["Pest scenario", "Rainfall scenario"]
            })

        # 11. Report
        elif any(w in clean for w in ["report", "mahina", "month"]):
            payload.update({
                "intent": "report.generate",
                "tool_calls": [{
                    "name": "report_tool",
                    "params": {"action": "generate", "period": "this_month"}
                }],
                "response_text": "Is mahine ki report generate kar raha hun.",
                "suggestions": ["June ki report", "Season report"]
            })

        # 12. Joke / Off-topic (Tier 4: Decline)
        elif any(w in clean for w in ["joke", "kahaani", "song", "gaana", "cricket"]):
            payload.update({
                "intent": "chat.casual",
                "confidence": 0.10,
                "response_text": "Main farming and farm management mein madad karta hun. Agriculture ke baare mein poochna chahein?\n1. Aaj ka mausam\n2. Fasal summary\n3. Kharcha check",
                "suggestions": ["Aaj ka mausam", "Fasal summary", "Kharcha check"]
            })

        # 13. Greetings
        elif any(w in clean for w in ["namaste", "hello", "hi", "namaskar"]):
            farmer_name = context_data.get("farmer", {}).get("name", "Kisaan")
            payload.update({
                "intent": "greeting",
                "confidence": 0.95,
                "response_text": f"Namaste {farmer_name}! Main Krishi Mitra hun. Aapki kya madad karun? Mausam, fasal, ya kharche ke baare mein poochiye.",
                "suggestions": ["Aaj ka mausam", "Mera summary", "Kharcha log karo"]
            })

        return payload
