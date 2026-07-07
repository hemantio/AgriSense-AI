/**
 * AgriSense AI — Dashboard Types
 * ==================================
 * TypeScript interfaces for dashboard aggregated statistics.
 */

export interface DashboardStats {
  total_farmers: number;
  total_plots: number;
  verified_plots: number;
  pending_plots: number;
  active_crops: number;
  total_health_analyses: number;
  critical_health_alerts: number;
  active_weather_alerts: number;
  total_expenses: number;
  recent_alerts: Array<Record<string, unknown>>;
}
