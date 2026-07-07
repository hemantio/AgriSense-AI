/**
 * AgriSense AI — Simulation Types
 * ===================================
 * TypeScript interfaces for simulation scenarios and results.
 */

export type ScenarioType =
  | "rainfall"
  | "drought"
  | "crop_disease"
  | "pest_outbreak"
  | "irrigation"
  | "power_outage";

export interface SimulationScenario {
  type: ScenarioType;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface SimulationRunRequest {
  scenario_type: ScenarioType;
  parameters?: Record<string, unknown> | null;
  plot_id?: string | null;
}

export interface SimulationResult {
  simulation_id: string;
  scenario_name: string;
  parameters_used: Record<string, unknown>;
  generated_weather?: Record<string, unknown> | null;
  generated_health?: Record<string, unknown> | null;
  alerts: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
}

export interface SimulationHistoryItem {
  id: string;
  scenario_type: ScenarioType;
  scenario_name?: string | null;
  status: "pending" | "running" | "completed" | "failed";
  alerts: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
  created_at: string;
}

export interface SimulationHistoryResponse {
  simulations: SimulationHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface SimulationHistoryParams {
  page?: number;
  page_size?: number;
  scenario_type?: ScenarioType;
}
