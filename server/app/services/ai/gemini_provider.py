"""
AgriSense AI — Gemini AI Provider
=====================================
Production AI provider using Google Gemini API.
Implements the AIProvider protocol.
"""

import json

from PIL import Image

from app.config import get_settings
from app.services.ai.base import AIProvider, CropAnalysisResult, LabelExtractionResult
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger("agrisense.ai.gemini")


class GeminiProvider:
    """Google Gemini implementation of the AIProvider protocol."""

    def __init__(self):
        self.model_name = settings.GEMINI_MODEL
        self._model = None

        if settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)

    @property
    def model(self):
        """Lazy-load the Gemini model."""
        if self._model is None and settings.GEMINI_API_KEY:
            import google.generativeai as genai
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            ]
            self._model = genai.GenerativeModel(
                model_name=self.model_name,
                safety_settings=safety_settings,
            )
        return self._model

    async def analyze_crop_health(self, image_path: str) -> CropAnalysisResult:
        """Analyze a crop image for health issues using Gemini Vision."""
        if not self.model:
            logger.warning("Gemini API key not configured, returning mock analysis")
            return CropAnalysisResult(
                recommendation="AI analysis unavailable. Please check the crop manually.",
                additional_notes="Gemini API key not configured",
            )

        try:
            image = Image.open(image_path)

            prompt = """You are an expert agricultural scientist analyzing a crop image.
            
Analyze this crop image and provide a structured assessment in JSON format:

{
    "health_score": <float 0-100, where 100 is perfectly healthy>,
    "diagnosis": "<primary finding: e.g., 'healthy', 'leaf_blight', 'pest_damage', 'nitrogen_deficiency', 'fungal_infection'>",
    "confidence": <float 0-1, your confidence in the diagnosis>,
    "severity": "<none|low|medium|high|critical>",
    "symptoms_observed": ["<list of visible symptoms>"],
    "recommendation": "<actionable advice for the farmer in simple, clear language>",
    "additional_notes": "<any other relevant observations>"
}

Respond ONLY with the JSON object, no additional text."""

            response = self.model.generate_content([prompt, image])
            result_text = response.text.strip()

            # Parse JSON from response
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]

            data = json.loads(result_text)
            logger.info(
                "Crop health analysis completed",
                diagnosis=data.get("diagnosis"),
                score=data.get("health_score"),
            )

            return CropAnalysisResult(
                health_score=float(data.get("health_score", 75.0)),
                diagnosis=data.get("diagnosis", "unknown"),
                confidence=float(data.get("confidence", 0.0)),
                severity=data.get("severity", "none"),
                symptoms_observed=data.get("symptoms_observed", []),
                recommendation=data.get("recommendation", ""),
                additional_notes=data.get("additional_notes", ""),
            )

        except json.JSONDecodeError:
            logger.error("Failed to parse AI response as JSON")
            return CropAnalysisResult(
                additional_notes="AI response was not valid JSON",
            )
        except Exception as e:
            logger.error("AI analysis failed", error=str(e))
            return CropAnalysisResult(
                additional_notes=str(e),
            )

    async def extract_label_text(self, image_path: str) -> LabelExtractionResult:
        """Extract text from a fertilizer/pesticide packet label using Gemini OCR."""
        if not self.model:
            return LabelExtractionResult(error="API not configured")

        try:
            image = Image.open(image_path)

            prompt = """Extract all text from this fertilizer/pesticide product label image.
            
Provide structured output in JSON format:

{
    "product_name": "<product name>",
    "brand": "<manufacturer/brand name>",
    "active_ingredients": ["<list of active ingredients with percentages>"],
    "dosage_instructions": "<recommended dosage>",
    "application_method": "<how to apply>",
    "safety_warnings": ["<safety precautions>"],
    "batch_number": "<if visible>",
    "expiry_date": "<if visible>",
    "full_extracted_text": "<complete raw text from label>",
    "confidence": <float 0-1>
}

Respond ONLY with the JSON object."""

            response = self.model.generate_content([prompt, image])
            result_text = response.text.strip()

            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]

            data = json.loads(result_text)
            return LabelExtractionResult(
                product_name=data.get("product_name", ""),
                brand=data.get("brand", ""),
                active_ingredients=data.get("active_ingredients", []),
                dosage_instructions=data.get("dosage_instructions", ""),
                application_method=data.get("application_method", ""),
                safety_warnings=data.get("safety_warnings", []),
                batch_number=data.get("batch_number", ""),
                expiry_date=data.get("expiry_date", ""),
                full_extracted_text=data.get("full_extracted_text", ""),
                confidence=float(data.get("confidence", 0.0)),
            )

        except Exception as e:
            logger.error("OCR extraction failed", error=str(e))
            return LabelExtractionResult(error=str(e))

    async def generate_recommendation(
        self,
        crop_name: str,
        crop_stage: str,
        health_data: dict | None = None,
        weather_data: dict | None = None,
        input_history: list[dict] | None = None,
    ) -> str:
        """Generate context-aware farming recommendation."""
        if not self.model:
            return "AI recommendations unavailable. Please configure the Gemini API key."

        try:
            context = f"""You are an experienced agricultural advisor helping a small-scale farmer.

**Crop:** {crop_name} (Stage: {crop_stage})
**Health Data:** {json.dumps(health_data or {}, default=str)}
**Weather:** {json.dumps(weather_data or {}, default=str)}
**Recent Inputs:** {json.dumps(input_history or [], default=str)}

Based on this information, provide 3-5 actionable recommendations in simple, clear language.
Each recommendation should be a single sentence that a farmer with limited education can understand.
Focus on practical, immediate actions they can take.
If there are any warnings (weather, health), prioritize those.

Format as a numbered list."""

            response = self.model.generate_content(context)
            return response.text.strip()

        except Exception as e:
            logger.error("Recommendation generation failed", error=str(e))
            return "Unable to generate recommendations at this time. Please try again later."
