/**
 * AgriSense AI — Weather Hooks
 * ================================
 * React Query hooks for weather data.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { WeatherData } from "@/types";

/** Fetch current weather for a location. */
export function useWeather(params?: { latitude?: number; longitude?: number }) {
  return useQuery<WeatherData>({
    queryKey: ["weather", "current", params],
    queryFn: () => api.getWeather(params).then((r) => r.data as WeatherData),
    enabled: !!params?.latitude && !!params?.longitude,
    staleTime: 5 * 60 * 1000, // 5 minute cache
  });
}

/** Fetch weather forecast. */
export function useWeatherForecast(params?: {
  latitude?: number;
  longitude?: number;
}) {
  return useQuery<WeatherData[]>({
    queryKey: ["weather", "forecast", params],
    queryFn: () =>
      api.getWeatherForecast(params).then((r) => r.data as WeatherData[]),
    enabled: !!params?.latitude && !!params?.longitude,
    staleTime: 15 * 60 * 1000, // 15 minute cache
  });
}

