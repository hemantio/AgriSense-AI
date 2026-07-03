/**
 * AgriSense AI — Health Types
 * ==============================
 */

export type HealthSeverity = "none" | "low" | "medium" | "high" | "critical";
export type HealthStatus = "pending" | "processing" | "completed" | "failed";

export interface HealthRecord {
  id: string;
  plot_id: string;
  crop_id?: string | null;
  image_path: string;
  upload_date: string;
  ai_result?: string | null;
  health_score?: number | null;
  diagnosis?: string | null;
  confidence?: number | null;
  severity?: HealthSeverity | null;
  recommendation_text?: string | null;
  status: HealthStatus;
  created_at: string;
}

export interface HealthListResponse {
  records: HealthRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface HealthListParams {
  page?: number;
  page_size?: number;
  plot_id?: string;
}
