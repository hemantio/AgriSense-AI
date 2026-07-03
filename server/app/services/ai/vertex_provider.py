"""
AgriSense AI — Vertex AI Provider
====================================
Google Cloud Platform native AI provider using Vertex AI.
Implements the AIProvider protocol.
"""

import json
from PIL import Image

from app.config import get_settings
from app.services.ai.base import AIProvider, CropAnalysisResult, LabelExtractionResult
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger("agrisense.ai.vertex")


class VertexAIProvider:
    """GCP Vertex AI implementation of the AIProvider protocol.

    Uses the google-cloud-aiplatform / vertexai library.
    Ideal for enterprise deployments on Google Cloud Run/GKE.
    """

    def __init__(self):
        self.project_id = settings.GCP_PROJECT_ID
        self.location = settings.GCP_LOCATION
        self.model_name = settings.GEMINI_MODEL
        self._model = None
        self._initialized = False

    def _initialize(self):
        """Lazy-initialize Vertex AI with project ID and location."""
        if self._initialized:
            return

        try:
            import vertexai
            # If project ID is empty, Vertex AI will try to auto-discover it
            # from application default credentials (ADC) or metadata server.
            project = self.project_id if self.project_id else None
            vertexai.init(project=project, location=self.location)
            self._initialized = True
            logger.info("Vertex AI successfully initialized", project=project, location=self.location)
        except Exception as e:
            logger.error("Failed to initialize Vertex AI SDK", error=str(e))

    @property
    def model(self):
        """Lazy-load the Vertex GenerativeModel."""
        self._initialize()
        if self._model is None and self._initialized:
            from vertexai.generative_models import GenerativeModel
            self._model = GenerativeModel(self.model_name)
        return self._model

    async def analyze_crop_health(self, image_path: str) -> CropAnalysisResult:
        """Analyze a crop image for health issues using Vertex AI."""
        if not self.model:
            logger.warning("Vertex AI model not initialized, returning mock analysis")
            return CropAnalysisResult(
                recommendation="Vertex AI unavailable. Please check the crop manually.",
                additional_notes="Vertex AI SDK not initialized",
            )

        try:
            from vertexai.generative_models import Part
            
            # Read image bytes and format as Part for Vertex AI
            with open(image_path, "rb") as f:
                image_bytes = f.read()

            # Determine mime type from extension
            mime_type = "image/jpeg"
            if image_path.lower().endswith(".png"):
                mime_type = "image/png"
            elif image_path.lower().endswith(".webp"):
                mime_type = "image/webp"

            image_part = Part.from_data(data=image_bytes, mime_type=mime_type)

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

Respond ONLY with the JSON object, no additional markdown code blocks or wrapper text."""

            response = self.model.generate_content([prompt, image_part])
            result_text = response.text.strip()

            # Strip markdown JSON fences if model returns them
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]

            data = json.loads(result_text)
            logger.info(
                "Vertex AI crop health analysis completed",
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
            logger.error("Failed to parse Vertex AI response as JSON")
            return CropAnalysisResult(
                additional_notes="AI response was not valid JSON",
            )
        except Exception as e:
            logger.error("Vertex AI analysis failed", error=str(e))
            return CropAnalysisResult(
                additional_notes=str(e),
            )

    async def extract_label_text(self, image_path: str) -> LabelExtractionResult:
        """Extract text from product labels using Vertex AI OCR."""
        if not self.model:
            return LabelExtractionResult(error="Vertex AI not initialized")

        try:
            from vertexai.generative_models import Part
            
            with open(image_path, "rb") as f:
                image_bytes = f.read()

            mime_type = "image/jpeg"
            if image_path.lower().endswith(".png"):
                mime_type = "image/png"
            elif image_path.lower().endswith(".webp"):
                mime_type = "image/webp"

            image_part = Part.from_data(data=image_bytes, mime_type=mime_type)

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

            response = self.model.generate_content([prompt, image_part])
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
            logger.error("Vertex AI OCR extraction failed", error=str(e))
            return LabelExtractionResult(error=str(e))

    async def generate_recommendation(
        self,
        crop_name: str,
        crop_stage: str,
        health_data: dict | None = None,
        weather_data: dict | None = None,
        input_history: list[dict] | None = None,
    ) -> str:
        """Generate context-aware farming recommendations."""
        if not self.model:
            return "Vertex AI recommendations unavailable. Please configure Vertex AI credentials."

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
            logger.error("Vertex AI recommendation generation failed", error=str(e))
            return "Unable to generate recommendations via Vertex AI at this time."
