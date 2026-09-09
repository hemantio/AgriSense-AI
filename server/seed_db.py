"""
AgriSense AI — Database Seeding Script
========================================
Populates the database with realistic mock data for development and testing.
Usage:
    python seed_db.py
"""

import asyncio
import os
import sys
import uuid
from datetime import date, datetime, UTC, timedelta

# Ensure parent directory is in sys.path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from project root (.env) if present
from dotenv import load_dotenv
root_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

from sqlalchemy import select
from app.database import init_db, async_session_factory, engine
from app.security import hash_password
from app.models import (
    User,
    FarmPlot,
    Crop,
    Expense,
    InputRecord,
    HealthRecord,
    WeatherData,
    IrrigationLog,
    Simulation,
    Group,
    GroupMember,
)

async def seed_database():
    print("Initializing database tables...")
    await init_db()
    
    async with async_session_factory() as session:
        # Check if users already exist to avoid duplicate seed runs
        result = await session.execute(select(User).limit(1))
        existing_user = result.scalars().first()
        if existing_user:
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding database...")

        # 1. Create Admin User
        admin = User(
            id=uuid.uuid4(),
            email="admin@agrisense.ai",
            hashed_password=hash_password("Password123"),
            role="admin",
            name="System Administrator",
            phone_number="+919999999999",
            village_name="AgriSense HQ",
            preferred_language="en",
            is_active=True,
            is_verified=True,
        )
        session.add(admin)

        # 2. Create Farmer Users
        farmer_ramesh = User(
            id=uuid.uuid4(),
            email="ramesh@agrisense.ai",
            hashed_password=hash_password("Password123"),
            role="farmer",
            name="Ramesh Kumar",
            phone_number="+919876543210",
            village_name="Sonipat",
            preferred_language="en",
            is_active=True,
            is_verified=True,
        )
        
        farmer_suresh = User(
            id=uuid.uuid4(),
            email="suresh@agrisense.ai",
            hashed_password=hash_password("Password123"),
            role="farmer",
            name="Suresh Patel",
            phone_number="+919812345678",
            village_name="Karnal",
            preferred_language="hi",
            is_active=True,
            is_verified=True,
        )
        session.add(farmer_ramesh)
        session.add(farmer_suresh)

        # Flush to get user IDs
        await session.flush()

        # 3. Create Farm Plots for Ramesh
        ramesh_plot1 = FarmPlot(
            id=uuid.uuid4(),
            farmer_id=farmer_ramesh.id,
            plot_name="North Field",
            latitude=28.9812,
            longitude=77.0123,
            approximate_area_acres=4.5,
            soil_type="Loam",
            verification_status="verified",
            verified_by=admin.id,
            verified_at=datetime.now(UTC),
            coordinates_geojson='{"type":"Polygon","coordinates":[[[77.011,28.980],[77.014,28.980],[77.014,28.983],[77.011,28.983],[77.011,28.980]]]}'
        )
        
        ramesh_plot2 = FarmPlot(
            id=uuid.uuid4(),
            farmer_id=farmer_ramesh.id,
            plot_name="East Field",
            latitude=28.9890,
            longitude=77.0254,
            approximate_area_acres=3.2,
            soil_type="Clay Loam",
            verification_status="verified",
            verified_by=admin.id,
            verified_at=datetime.now(UTC),
            coordinates_geojson='{"type":"Polygon","coordinates":[[[77.024,28.988],[77.027,28.988],[77.027,28.990],[77.024,28.990],[77.024,28.988]]]}'
        )
        session.add(ramesh_plot1)
        session.add(ramesh_plot2)

        # Create Farm Plot for Suresh
        suresh_plot = FarmPlot(
            id=uuid.uuid4(),
            farmer_id=farmer_suresh.id,
            plot_name="Highway Farm",
            latitude=29.0125,
            longitude=77.0456,
            approximate_area_acres=6.0,
            soil_type="Sandy Loam",
            verification_status="pending",
        )
        session.add(suresh_plot)

        await session.flush()

        # 4. Create Crops for Ramesh
        wheat_crop = Crop(
            id=uuid.uuid4(),
            plot_id=ramesh_plot1.id,
            crop_name="Wheat",
            seed_variety="HD-2967",
            seed_brand="Pioneer",
            sowing_date=date.today() - timedelta(days=60),
            expected_harvest_date=date.today() + timedelta(days=60),
            crop_stage="vegetative",
            description="High-yielding premium wheat variety. Doing well under loam soil conditions."
        )

        mustard_crop = Crop(
            id=uuid.uuid4(),
            plot_id=ramesh_plot2.id,
            crop_name="Mustard",
            seed_variety="Pusa Bold",
            seed_brand="Mahyco",
            sowing_date=date.today() - timedelta(days=90),
            expected_harvest_date=date.today() + timedelta(days=30),
            crop_stage="flowering",
            description="Mustard field in full bloom. Water levels monitored weekly."
        )
        session.add(wheat_crop)
        session.add(mustard_crop)

        await session.flush()

        # 5. Create Expenses
        expenses = [
            # Wheat expenses
            Expense(
                crop_id=wheat_crop.id,
                category="seeds",
                amount=4500.0,
                expense_date=date.today() - timedelta(days=58),
                description="HD-2967 certified seeds 50kg bag",
            ),
            Expense(
                crop_id=wheat_crop.id,
                category="fertilizer",
                amount=6200.0,
                expense_date=date.today() - timedelta(days=45),
                description="2 bags of NPK and Urea",
            ),
            Expense(
                crop_id=wheat_crop.id,
                category="labor",
                amount=3500.0,
                expense_date=date.today() - timedelta(days=30),
                description="Sowing and field preparation labor charges",
            ),
            Expense(
                crop_id=wheat_crop.id,
                category="irrigation",
                amount=1200.0,
                expense_date=date.today() - timedelta(days=15),
                description="Diesel fuel for water pump",
            ),
            # Mustard expenses
            Expense(
                crop_id=mustard_crop.id,
                category="seeds",
                amount=3200.0,
                expense_date=date.today() - timedelta(days=88),
                description="Pusa Bold mustard seeds",
            ),
            Expense(
                crop_id=mustard_crop.id,
                category="fertilizer",
                amount=5000.0,
                expense_date=date.today() - timedelta(days=70),
                description="Superphosphate fertilizer",
            ),
            Expense(
                crop_id=mustard_crop.id,
                category="pesticide",
                amount=2400.0,
                expense_date=date.today() - timedelta(days=40),
                description="Eco-friendly pest repellant spray",
            ),
            Expense(
                crop_id=mustard_crop.id,
                category="labor",
                amount=4000.0,
                expense_date=date.today() - timedelta(days=20),
                description="Weeding and spraying operations labor",
            ),
        ]
        for exp in expenses:
            session.add(exp)

        # 6. Create Input Scan Records
        npk_scan = InputRecord(
            crop_id=wheat_crop.id,
            input_type="fertilizer",
            product_name="NPK 19-19-19 Fertilizer",
            brand="IFFCO",
            quantity=50.0,
            quantity_unit="kg",
            application_date=date.today() - timedelta(days=44),
            application_notes="Scanned package label for verification. Applied evenly across North Field.",
            ocr_extracted_text="IFFCO NPK 19:19:19 NITROGEN PHOSPHORUS POTASSIUM NET WT 50KG MAX PRICE RS 1350",
            ocr_confidence=0.96
        )
        session.add(npk_scan)

        # 7. Create Crop Health Records
        health_rust = HealthRecord(
            plot_id=ramesh_plot1.id,
            crop_id=wheat_crop.id,
            image_path="uploads/scans/wheat_rust_sample.jpg",
            upload_date=datetime.now(UTC) - timedelta(days=10),
            ai_result='{"diagnosis":"Wheat Leaf Rust","confidence":0.88,"severity":"medium"}',
            health_score=72.0,
            diagnosis="Wheat Leaf Rust (Puccinia recondita)",
            confidence=0.88,
            severity="medium",
            recommendation_text="Apply Propiconazole 25% EC at 200 ml/acre diluted in 200 liters of water. Ensure proper spacing between rows to improve ventilation.",
            status="completed"
        )
        
        health_healthy = HealthRecord(
            plot_id=ramesh_plot2.id,
            crop_id=mustard_crop.id,
            image_path="uploads/scans/mustard_healthy.jpg",
            upload_date=datetime.now(UTC) - timedelta(days=5),
            ai_result='{"diagnosis":"Healthy Crop","confidence":0.95,"severity":"none"}',
            health_score=96.0,
            diagnosis="Healthy Mustard Foliage",
            confidence=0.95,
            severity="none",
            recommendation_text="Crop is in excellent health. Maintain current watering schedule of once every 10-12 days.",
            status="completed"
        )
        session.add(health_rust)
        session.add(health_healthy)

        # 8. Create Irrigation Logs
        irrigation_logs = [
            IrrigationLog(
                plot_id=ramesh_plot1.id,
                irrigation_type="drip",
                watering_date=date.today() - timedelta(days=8),
                duration_minutes=120.0,
                estimated_water_liters=4500.0,
                notes="Automated drip cycle completed early morning.",
                source="iot_sensor"
            ),
            IrrigationLog(
                plot_id=ramesh_plot1.id,
                irrigation_type="drip",
                watering_date=date.today() - timedelta(days=1),
                duration_minutes=90.0,
                estimated_water_liters=3400.0,
                notes="Standard drip watering.",
                source="manual_entry"
            ),
            IrrigationLog(
                plot_id=ramesh_plot2.id,
                irrigation_type="sprinkler",
                watering_date=date.today() - timedelta(days=5),
                duration_minutes=150.0,
                estimated_water_liters=6000.0,
                notes="Plot fully saturated. Next watering in 10 days.",
                source="manual_entry"
            ),
        ]
        for log in irrigation_logs:
            session.add(log)

        # 9. Create Weather Forecast and Historical Data
        weather_records = [
            WeatherData(
                plot_id=ramesh_plot1.id,
                location_name="Sonipat",
                latitude=28.9812,
                longitude=77.0123,
                temperature_celsius=32.5,
                feels_like_celsius=35.0,
                humidity_percent=60.0,
                rain_probability=0.2,
                wind_speed_kmh=12.0,
                weather_description="Partly Cloudy",
                weather_icon="02d",
                alert_status="normal",
                is_forecast=False,
                source="openweathermap"
            ),
            WeatherData(
                plot_id=ramesh_plot1.id,
                location_name="Sonipat",
                latitude=28.9812,
                longitude=77.0123,
                temperature_celsius=38.2,
                feels_like_celsius=42.0,
                humidity_percent=45.0,
                rain_probability=0.1,
                wind_speed_kmh=15.0,
                weather_description="Extreme Heat advisory",
                weather_icon="01d",
                alert_status="advisory",
                alert_type="heat",
                alert_message="High temperature warning. Ensure crops are irrigated during early morning or late evening.",
                is_forecast=True,
                forecast_date=datetime.now(UTC) + timedelta(days=1),
                source="openweathermap"
            ),
            WeatherData(
                plot_id=ramesh_plot1.id,
                location_name="Sonipat",
                latitude=28.9812,
                longitude=77.0123,
                temperature_celsius=26.0,
                feels_like_celsius=26.0,
                humidity_percent=90.0,
                rain_probability=0.95,
                rainfall_mm=25.0,
                wind_speed_kmh=24.0,
                weather_description="Heavy Thunderstorm",
                weather_icon="11d",
                alert_status="warning",
                alert_type="storm",
                alert_message="Heavy rainfall forecast. Check drainage channels in the field to prevent waterlogging.",
                is_forecast=True,
                forecast_date=datetime.now(UTC) + timedelta(days=2),
                source="openweathermap"
            )
        ]
        for w in weather_records:
            session.add(w)

        # 10. Create Sandbox Simulations
        drought_sim = Simulation(
            scenario_type="drought",
            scenario_name="Prolonged Dry Spell Scenario",
            input_values='{"duration_days": 21, "avg_temp_boost": 3.0}',
            simulated_temperature=41.5,
            simulated_humidity=25.0,
            simulated_rainfall_mm=0.0,
            generated_state='{"soil_moisture_depletion": "45%", "expected_yield_impact": "-12%"}',
            ai_response="Under critical soil moisture deficit, initiate immediate mulching to reduce evaporation. Focus irrigation resources on the active vegetative wheat block and reduce watering volume to the mature mustard patch to save water resources.",
            alerts_generated='[{"type":"soil_drought","severity":"high"}]',
            status="completed",
            plot_id=ramesh_plot1.id,
            completed_at=datetime.now(UTC)
        )
        session.add(drought_sim)

        # 11. Create Groups & Members
        group1 = Group(
            id=uuid.uuid4(),
            name="Sonipat Cooperative",
            description="Cooperative group for farmers in the Sonipat region to share tools, fertilizers, and inputs advice.",
            code="COOP1012"
        )
        group2 = Group(
            id=uuid.uuid4(),
            name="Karnal Rice Farmers Club",
            description="A local group sharing crop advisories and market price trends specifically for Basmati Rice growers in Karnal.",
            code="RICE9944"
        )
        session.add(group1)
        session.add(group2)
        await session.flush()

        member1 = GroupMember(
            id=uuid.uuid4(),
            group_id=group1.id,
            user_id=farmer_ramesh.id
        )
        member2 = GroupMember(
            id=uuid.uuid4(),
            group_id=group2.id,
            user_id=farmer_suresh.id
        )
        session.add(member1)
        session.add(member2)

        # Commit everything
        await session.commit()
        print("Database seeded successfully with all mock data!")

if __name__ == "__main__":
    asyncio.run(seed_database())
