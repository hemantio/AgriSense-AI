"""
AgriSense AI — CIE Integration Tests
======================================
Verifies ContextEngine aggregation, ConversationalIntelligenceService classification,
and ToolRegistry dynamic routing.
"""

import uuid
import pytest
import pytest_asyncio
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.models.plot import FarmPlot
from app.models.crop import Crop
from app.models.expense import Expense
from app.models.input_record import InputRecord
from app.models.irrigation import IrrigationLog
from app.services.ai.context import ContextEngine
from app.services.ai.conversational import ConversationalIntelligenceService
from app.services.ai.tool_registry import ToolRegistryService

# In-memory SQLite for testing
DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_db():
    """Initializes an in-memory SQLite database and yields a session."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Seed a test user, plot, and crop
        test_user = User(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            email="farmer@test.com",
            hashed_password="mock",
            role="farmer",
            name="Ramesh Patil",
            preferred_language="hi",
            village_name="Shirgaon"
        )
        session.add(test_user)

        test_plot = FarmPlot(
            id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            farmer_id=test_user.id,
            plot_name="Plot 3 - North Field",
            approximate_area_acres=2.5,
            soil_type="black_cotton",
            latitude=19.0760,
            longitude=72.8777,
            verification_status="verified"
        )
        session.add(test_plot)

        test_crop = Crop(
            id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
            plot_id=test_plot.id,
            crop_name="Wheat",
            crop_stage="vegetative",
            sowing_date=datetime.now(UTC).date()
        )
        session.add(test_crop)

        await session.commit()
        
        # Synchronize CIE tool registry
        await ToolRegistryService.synchronize_registry(session)
        await session.commit()

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_context_engine(test_db):
    """Verifies that ContextEngine aggregates correct models into user context."""
    user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    context = await ContextEngine.assemble_context(user_id, test_db)

    assert context["farmer"]["name"] == "Ramesh Patil"
    assert context["farmer"]["village"] == "Shirgaon"
    assert len(context["active_plots"]) == 1
    assert context["active_plots"][0]["plot_name"] == "Plot 3 - North Field"
    assert context["active_plots"][0]["crops"][0]["crop_name"] == "Wheat"
    assert context["season"]["current"] in ["Kharif", "Rabi", "Zaid"]


@pytest.mark.asyncio
async def test_mock_classifier_weather(test_db):
    """Verifies the mock classifier parses weather intents and parameters."""
    user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    res = await ConversationalIntelligenceService.process_message(
        message="Kal baarish hogi kya?",
        user_id=user_id,
        db=test_db
    )

    assert "session_id" in res
    assert res["intent"] in ["weather.current", "weather.forecast"]
    assert res["tool_used"] == "weather_tool"
    assert "response_text" in res
    # Should give some forecast responses
    assert len(res["suggestions"]) > 0


@pytest.mark.asyncio
async def test_action_confirmation_expense(test_db):
    """Verifies the confirmation cycle for database logging."""
    user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    
    # 1. User says "Add 500 rupaye expense"
    res1 = await ConversationalIntelligenceService.process_message(
        message="500 rupaye mazdoori pe kharch hue",
        user_id=user_id,
        db=test_db
    )
    assert res1["needs_confirmation"] is True
    assert res1["intent"] == "expense.log"
    assert res1["confirmation_data"]["params"]["amount"] == 500.0

    session_id = uuid.UUID(res1["session_id"])

    # 2. User confirms with "Haan"
    res2 = await ConversationalIntelligenceService.process_message(
        message="Haan",
        user_id=user_id,
        db=test_db,
        session_id=session_id
    )

    assert res2["needs_confirmation"] is False
    assert "record ho gaya" in res2["response_text"].lower()

    # 3. Check that the expense is actually saved in DB
    eq = select(Expense).where(Expense.amount == 500.0)
    er = await test_db.execute(eq)
    saved_expense = er.scalar_one_or_none()
    assert saved_expense is not None
    assert saved_expense.category == "labour"
