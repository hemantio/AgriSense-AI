/**
 * AgriSense AI — Recommendation Types
 * ========================================
 * TypeScript interfaces for AI-powered crop recommendations.
 */

export interface RecommendationRequest {
  crop_id: string;
  include_weather?: boolean;
}

export interface RecommendationContext {
  health?: {
    health_score: number | null;
    diagnosis: string | null;
    severity: string | null;
  } | null;
  weather_summary?: {
    temperature: number | null;
    humidity: number | null;
    alert_status: string | null;
  } | null;
  recent_inputs_count: number;
}

export interface RecommendationResponse {
  crop: {
    id: string;
    name: string;
    stage: string;
  };
  context: RecommendationContext;
  recommendation: Record<string, unknown>;
  generated_by: string;
}
