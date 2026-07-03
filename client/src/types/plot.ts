/**
 * AgriSense AI — Plot Types
 * ============================
 * TypeScript interfaces for farm plot management.
 */

export interface Plot {
  id: string;
  farmer_id: string;
  plot_name: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinates_geojson?: string | null;
  approximate_area_acres?: number | null;
  soil_type?: string | null;
  verification_status: "pending" | "verified" | "rejected";
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlotCreateRequest {
  plot_name: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinates_geojson?: string | null;
  approximate_area_acres?: number | null;
  soil_type?: string | null;
}

export interface PlotUpdateRequest {
  plot_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinates_geojson?: string | null;
  approximate_area_acres?: number | null;
  soil_type?: string | null;
}

export interface PlotListResponse {
  plots: Plot[];
  total: number;
  page: number;
  page_size: number;
}

export interface PlotListParams {
  page?: number;
  page_size?: number;
  farmer_id?: string;
  verification_status?: "pending" | "verified" | "rejected";
}
