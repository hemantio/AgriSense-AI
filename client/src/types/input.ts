/**
 * AgriSense AI — Input Types
 * =============================
 * TypeScript interfaces for agricultural input (fertilizer/pesticide) records.
 */

export type InputType = "fertilizer" | "pesticide" | "seed" | "herbicide" | "other";

export interface InputRecord {
  id: string;
  crop_id: string;
  input_type: InputType;
  product_name: string;
  brand?: string | null;
  quantity?: number | null;
  quantity_unit?: string | null;
  application_date?: string | null;
  application_notes?: string | null;
  image_path?: string | null;
  ocr_extracted_text?: string | null;
  ocr_confidence?: number | null;
  created_at: string;
}

export interface InputCreateRequest {
  crop_id: string;
  input_type: InputType;
  product_name: string;
  brand?: string | null;
  quantity?: number | null;
  quantity_unit?: string | null;
  application_date?: string | null;
  application_notes?: string | null;
}

export interface InputListResponse {
  inputs: InputRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface InputListParams {
  page?: number;
  page_size?: number;
  crop_id?: string;
  input_type?: InputType;
}
