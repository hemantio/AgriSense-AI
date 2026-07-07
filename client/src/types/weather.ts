/**
 * AgriSense AI — Weather Types
 * ================================
 */

export type AlertStatus = "normal" | "advisory" | "warning" | "severe";

export interface WeatherData {
  location_name?: string;
  temperature_celsius?: number;
  feels_like_celsius?: number;
  humidity_percent?: number;
  rain_probability?: number;
  rainfall_mm?: number;
  wind_speed_kmh?: number;
  weather_description?: string;
  weather_icon?: string;
  alert_status?: AlertStatus;
  alert_type?: string;
  alert_message?: string;
  source?: string;
}

