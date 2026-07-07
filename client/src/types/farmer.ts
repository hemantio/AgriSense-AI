/**
 * AgriSense AI — Farmer Types
 * ===============================
 * TypeScript interfaces for farmer management (admin operations).
 */

export interface Farmer {
  id: string;
  email: string;
  name: string;
  role: "farmer";
  phone_number?: string | null;
  village_name?: string | null;
  preferred_language: string;
  is_active: boolean;
  is_verified: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerCreateRequest {
  email: string;
  password: string;
  name: string;
  phone_number?: string | null;
  village_name?: string | null;
  preferred_language?: string;
  notes?: string | null;
}

export interface FarmerUpdateRequest {
  name?: string;
  phone_number?: string | null;
  village_name?: string | null;
  preferred_language?: string;
  notes?: string | null;
  is_active?: boolean;
}

export interface FarmerListResponse {
  farmers: Farmer[];
  total: number;
  page: number;
  page_size: number;
}

export interface FarmerListParams {
  page?: number;
  page_size?: number;
  village_name?: string;
  is_active?: boolean;
}
