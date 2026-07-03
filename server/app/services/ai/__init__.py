"""
AgriSense AI — AI Providers Package
=======================================
Strategy pattern for swappable AI providers.
"""

from app.services.ai.base import AIProvider, CropAnalysisResult, LabelExtractionResult
from app.services.ai.factory import get_ai_provider

__all__ = [
    "AIProvider",
    "CropAnalysisResult",
    "LabelExtractionResult",
    "get_ai_provider",
]
