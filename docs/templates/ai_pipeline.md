# Technical Template: AI Pipeline, Prompt Design, and Evaluation
> **System Status**: MODEL TEMPLATE | **Version**: 1.0.0 | **Classification**: TECHNICAL STANDARDS

---

## 1. Document Specification

- **Purpose**: Governs the design, deployment, monitoring, safety filtering, confidence scoring, and evaluation of all LLM integrations, CIE pipelines, and OCR models.
- **Audience**: AI engineers, backend developers, data scientists, and model evaluation experts.
- **Prerequisites**: Clear definition of AI tasks (e.g. disease diagnosis, climate sandboxes).
- **Dependencies**: Gemini SDK (`@google/genai`) configuration.
- **Related Documents**: `standards/writing_and_markdown.md`.
- **Expected Length**: 1000 - 1800 words.
- **Maintenance Frequency**: Monthly or upon upgrading underlying LLM model engines.
- **Owner**: AI Systems Architect / Lead ML Engineer.
- **Review Checklist**: Verify robust system prompt constraints, check for security safety bounds, review temperature parameters, check confidence score calculations, validate evaluations.
- **Completion Criteria**: Fully defined prompting architecture with automated evaluation bounds and zero permissive failure holes.
- **Versioning Strategy**: Incremented on any system prompt alteration (1.0.x), major model migration (1.x.0), or structural evaluation rework (x.0.0).

---

## 2. Model Selection and Configuration Standards

AgriSense AI standardizes on the **Gemini 2.5/1.5** family of models via the official `@google/genai` TypeScript SDK. The standard aliases and configuration parameters are:

| Task Domain | Selected Model | Target Temperature | Top-P / Top-K | Rationale |
| :--- | :--- | :---: | :---: | :--- |
| **CIE Conversation** | `gemini-1.5-flash` | `0.4` | `0.9 / 40` | Low latency, factual responses with moderate creativity bounds. |
| **Disease Image Diagnostic**| `gemini-2.5-flash` | `0.1` | `0.95 / 20` | High reasoning capability, highly deterministic diagnosis output. |
| **Sandbox Simulation** | `gemini-2.5-flash` | `0.2` | `0.9 / 30` | Strong structured JSON instruction alignment. |

---

## 3. System Prompt Specification (Copy and Complete)

Every AI pipeline integrated into AgriSense AI must document its prompting parameters using the following framework:

```markdown
### 3.1 Pipeline Component: [e.g., Crop Disease Analyzer]
*Describe the high-level task and role the model executes.*

#### System Prompt Template
*Place the exact, un-interpolated system prompt text below.*

```text
You are an expert plant pathologist specializing in sub-tropical crops...
Constraints:
1. Speak only using simple, direct vocabulary.
2. Under no circumstance should you recommend synthetic chemicals if organic options exist.
3. If the image is not a plant leaf, return {"disease_detected": "invalid_image"}.
```

#### JSON Output Schema (Constraint)
*If the model is configured to return structured JSON data, detail the exact interface schema here.*

```json
{
  "disease_detected": "string",
  "confidence_score": 0.00,
  "organic_treatment": "string",
  "chemical_treatment": "string",
  "severity": "none | low | medium | high | critical"
}
```
```

---

## 4. Grounding, Context, and RAG Architectures

To eliminate hallucinations, LLM generations must be grounded using contextual source materials:

*   **Weather Grounding**: Inject current telemetry coordinates fetched via the OpenWeather REST API directly into prompt parameters prior to inference.
*   **Vector Search & Knowledge Base (RAG)**: For localized agronomic advice:
    1.  Convert localized PDFs or manuals into dense vectors using embedding models.
    2.  Query the vector store using cosine similarity matches on user question inputs.
    3.  Inject the top 3 matched context blocks into the prompt under a `<context>` tag.

---

## 5. Safety Shields, Confidence Scoring, and Anti-Hallucination

All LLM inputs and outputs are governed by a multi-layer guardrail system:

```text
 User Input ──> [ Input Safety Filter ] ──> [ LLM Inference ] ──> [ Output Guard & Validator ] ──> Clean Response
```

### 5.1 System Safety Settings (Gemini SDK API)
Model requests must explicitly define safe filtering thresholds:
```typescript
import { HarmonySafetyThreshold, HarmonySafetyCategory } from "@google/genai";

const safetySettings = [
  {
    category: HarmonySafetyCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmonySafetyThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmonySafetyCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmonySafetyThreshold.BLOCK_LOW_AND_ABOVE,
  }
];
```

### 5.2 Confidence Scoring Framework
*   **Verification**: All structural JSON blocks returned from vision analysis must include a self-assessed model `confidence_score` (between `0.0` and `1.0`).
*   **Threshold Rule**: If the returned `confidence_score` is below **0.75**, the application UI must display a prominent warning banner instructing the farmer to capture a clearer leaf image under better lighting conditions.

---

## 6. Evaluation and Benchmarking Specifications

To measure system performance over time, we execute automated evaluation runs on a test set of **100 annotated leaf images** and **200 standard user conversations**:

*   **Metric 1: Classification Accuracy**: Goal: `> 92%` exact matches on disease name tags.
*   **Metric 2: Latency P95**: Goal: Under `1.8 seconds` on text inference; under `3.5 seconds` on multimodal image-based diagnostic inference.
*   **Metric 3: Hallucination Rate**: Checked via automated LLM-as-a-judge setups comparing generations against known agricultural manuals. Goal: `0.0%` major factual deviations.
*   **Benchmarking Schedule**: Evaluation runs execute automatically on the CI/CD pipeline upon any changes to prompt files or model engine properties.
