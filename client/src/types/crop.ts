/**
 * AgriSense AI — Crop Types
 * ============================
 */

export type CropStage =
  | "sowing"
  | "germination"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "harvest"
  | "post-harvest";

export interface Crop {
  id: string;
  plot_id: string;
  crop_name: string;
  seed_variety?: string | null;
  seed_brand?: string | null;
  sowing_date?: string | null;
  expected_harvest_date?: string | null;
  actual_harvest_date?: string | null;
  crop_stage: CropStage;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CropCreateRequest {
  plot_id: string;
  crop_name: string;
  seed_variety?: string | null;
  seed_brand?: string | null;
  sowing_date?: string | null;
  expected_harvest_date?: string | null;
  crop_stage?: CropStage;
  description?: string | null;
}

export interface CropUpdateRequest {
  crop_name?: string;
  seed_variety?: string | null;
  seed_brand?: string | null;
  sowing_date?: string | null;
  expected_harvest_date?: string | null;
  actual_harvest_date?: string | null;
  crop_stage?: CropStage;
  description?: string | null;
}

export interface CropListResponse {
  crops: Crop[];
  total: number;
  page: number;
  page_size: number;
}

export interface CropListParams {
  page?: number;
  page_size?: number;
  plot_id?: string;
  crop_stage?: CropStage;
}
