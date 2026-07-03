"""
AgriSense AI — AI Provider Factory
======================================
Selects the appropriate AI provider based on configuration.
"""

from app.config import get_settings
from app.services.ai.base import AIProvider
from app.utils.logger import get_logger

logger = get_logger("agrisense.ai.factory")

_provider_instance: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    """Get the configured AI provider (singleton).

    Returns GeminiProvider if GEMINI_API_KEY is set,
    otherwise falls back to MockProvider.
    """
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    settings = get_settings()

    if settings.GCP_PROJECT_ID:
        from app.services.ai.vertex_provider import VertexAIProvider
        _provider_instance = VertexAIProvider()
        logger.info("AI provider initialized", provider="vertex_ai")
    elif settings.GEMINI_API_KEY:
        from app.services.ai.gemini_provider import GeminiProvider
        _provider_instance = GeminiProvider()
        logger.info("AI provider initialized", provider="gemini")
    else:
        from app.services.ai.mock_provider import MockProvider
        _provider_instance = MockProvider()
        logger.info("AI provider initialized", provider="mock")

    return _provider_instance
