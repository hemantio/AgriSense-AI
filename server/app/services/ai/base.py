"""
AgriSense AI — AI Provider Protocol
=======================================
Abstract interface for AI providers.
Any AI service (Gemini, OpenAI, Claude, local models) must
implement this protocol to be used interchangeably.
"""

from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable


@dataclass
class CropAnalysisResult:
    """Structured result from crop health image analysis."""
    health_score: float = 75.0
    diagnosis: str = "unknown"
    confidence: float = 0.0
    severity: str = "none"  # "none", "low", "medium", "high", "critical"
    symptoms_observed: list[str] = field(default_factory=list)
    recommendation: str = ""
    additional_notes: str = ""


@dataclass
class LabelExtractionResult:
    """Structured result from fertilizer/pesticide label OCR."""
    product_name: str = ""
    brand: str = ""
    active_ingredients: list[str] = field(default_factory=list)
    dosage_instructions: str = ""
    application_method: str = ""
    safety_warnings: list[str] = field(default_factory=list)
    batch_number: str = ""
    expiry_date: str = ""
    full_extracted_text: str = ""
    confidence: float = 0.0
    error: str | None = None


@runtime_checkable
class AIProvider(Protocol):
    """Protocol for AI provider implementations.

    Implementations must provide crop health analysis, label OCR,
    and context-aware recommendation generation.
    """

    async def analyze_crop_health(self, image_path: str) -> CropAnalysisResult:
        """Analyze a crop image for health issues.

        Args:
            image_path: Path to the crop image file.

        Returns:
            CropAnalysisResult with diagnosis, score, and recommendation.
        """
        ...

    async def extract_label_text(self, image_path: str) -> LabelExtractionResult:
        """Extract text from a fertilizer/pesticide packet label.

        Args:
            image_path: Path to the packet image.

        Returns:
            LabelExtractionResult with structured product details.
        """
        ...

    async def generate_recommendation(
        self,
        crop_name: str,
        crop_stage: str,
        health_data: dict | None = None,
        weather_data: dict | None = None,
        input_history: list[dict] | None = None,
    ) -> str:
        """Generate context-aware farming recommendation.

        Args:
            crop_name: Name of the crop.
            crop_stage: Current growth stage.
            health_data: Latest health analysis results.
            weather_data: Current/forecast weather data.
            input_history: Recent fertilizer/pesticide applications.

        Returns:
            Recommendation text in simple, farmer-friendly language.
        """
        ...
