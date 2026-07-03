"""
AgriSense AI — Mock AI Provider
===================================
Development/testing AI provider that returns deterministic results.
"""

from app.services.ai.base import AIProvider, CropAnalysisResult, LabelExtractionResult
from app.utils.logger import get_logger

logger = get_logger("agrisense.ai.mock")


class MockProvider:
    """Mock implementation of the AIProvider protocol for dev/testing."""

    async def analyze_crop_health(self, image_path: str) -> CropAnalysisResult:
        """Return mock crop health analysis."""
        logger.info("Mock crop health analysis", image_path=image_path)
        return CropAnalysisResult(
            health_score=75.0,
            diagnosis="mock_analysis",
            confidence=0.0,
            severity="none",
            symptoms_observed=[],
            recommendation="AI analysis unavailable. Please check the crop manually.",
            additional_notes="Mock provider — no API key configured",
        )

    async def extract_label_text(self, image_path: str) -> LabelExtractionResult:
        """Return mock label extraction."""
        logger.info("Mock label OCR", image_path=image_path)
        return LabelExtractionResult(
            product_name="Mock Product",
            brand="Mock Brand",
            full_extracted_text="Mock extracted text",
            confidence=0.0,
            error="Mock provider — no API key configured",
        )

    async def generate_recommendation(
        self,
        crop_name: str,
        crop_stage: str,
        health_data: dict | None = None,
        weather_data: dict | None = None,
        input_history: list[dict] | None = None,
    ) -> str:
        """Return mock recommendation."""
        logger.info("Mock recommendation", crop=crop_name, stage=crop_stage)
        return (
            f"1. Continue monitoring your {crop_name} crop.\n"
            f"2. Ensure regular watering during the {crop_stage} stage.\n"
            f"3. Check for signs of pest or disease.\n"
            "4. AI recommendations unavailable — please consult a local advisor.\n"
        )
