"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface WeatherAlert {
  event: string;
  severity: string;
  description: string;
}

interface WeatherData {
  temp: number;
  humidity: number;
  wind_speed: number;
  rain_1h: number;
  description: string;
  icon: string;
  location_name: string;
  alerts: WeatherAlert[];
}

interface Recommendation {
  id: string;
  title: string;
  message: string;
  priority: string; // HIGH, MEDIUM, LOW
  category: string; // Irrigation, Pest, Sowing, Harvest
  created_at: string;
}

const DEFAULT_WEATHER: WeatherData = {
  temp: 31.5,
  humidity: 62,
  wind_speed: 12.4,
  rain_1h: 0.0,
  description: "scattered clouds",
  icon: "03d",
  location_name: "Pune, Maharashtra",
  alerts: [],
};

export default function WeatherPage() {
  const { user } = useAuthStore();
  const [weather, setWeatherData] = useState<WeatherData>(DEFAULT_WEATHER);
  const [forecast, setForecast] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeatherAndRecommendations = async () => {
    setIsLoading(true);
    try {
      // Fetch weather data
      const weatherRes = await api.getWeather({ lat: 18.5204, lon: 73.8567 }); // Defaults to Pune coordinates
      if (weatherRes.data) {
        setWeatherData(weatherRes.data);
      }

      // Fetch 5-day forecast
      const forecastRes = await api.getWeatherForecast({ lat: 18.5204, lon: 73.8567 });
      if (forecastRes.data && forecastRes.data.list) {
        // Filter daily values (roughly 1 per day, e.g. at 12:00 PM)
        const daily = forecastRes.data.list.filter((item: any) => item.dt_txt.includes("12:00:00"));
        setForecast(daily);
      }

      // Fetch AI recommendations
      const recRes = await api.getRecommendations();
      setRecommendations(recRes.data.recommendations || recRes.data || []);
      toast.success("Weather metrics and AI recommendations updated!");
    } catch (error) {
      toast.error("Failed to load meteorological intelligence.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherAndRecommendations();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Weather Intelligence & AI Recommendations 🌤️
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Stay ahead of changing atmospheric patterns and receive Gemini-powered organic crop suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current weather + Forecast */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Weather Card */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 gradient-warm opacity-10 blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Current Conditions</span>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{weather.location_name}</h2>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                className="w-16 h-16 object-contain"
              />
            </div>

            <div className="flex items-baseline mt-4">
              <span className="text-5xl font-black text-[var(--text-primary)]">{weather.temp}°C</span>
              <span className="text-sm text-[var(--text-secondary)] ml-2 capitalize font-medium">
                &bull; {weather.description}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-[var(--border-light)] mt-6 pt-6 text-center text-xs text-[var(--text-secondary)]">
              <div>
                <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[9px] mb-1">Humidity</p>
                <p className="font-bold text-sm text-[var(--text-primary)]">{weather.humidity}%</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[9px] mb-1">Wind Speed</p>
                <p className="font-bold text-sm text-[var(--text-primary)]">{weather.wind_speed} km/h</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[9px] mb-1">Rainfall</p>
                <p className="font-bold text-sm text-[var(--text-primary)]">{weather.rain_1h || 0} mm</p>
              </div>
            </div>

            {/* Weather Alerts if present */}
            {weather.alerts && weather.alerts.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-[var(--color-danger-light)] space-y-2">
                <p className="font-bold text-sm">🚨 Weather Alert Issued!</p>
                {weather.alerts.map((alert, index) => (
                  <div key={index}>
                    <p className="font-semibold uppercase">{alert.event} ({alert.severity})</p>
                    <p className="mt-0.5 leading-relaxed text-[var(--text-muted)]">{alert.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5-Day Forecast */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">5-Day Forecast</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-[var(--bg-secondary)] rounded-lg" />
                ))}
              </div>
            ) : forecast.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">Forecast data temporarily unavailable.</p>
            ) : (
              <div className="space-y-3.5">
                {forecast.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-light)] last:border-b-0">
                    <span className="font-medium text-[var(--text-secondary)]">
                      {new Date(item.dt_txt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                        alt="icon"
                        className="w-8 h-8 object-contain"
                      />
                      <span className="font-bold text-[var(--text-primary)]">{Math.round(item.main.temp)}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI context recommendations list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 gradient-accent opacity-5 blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                🤖 Gemini Contextual AI Advice
              </h2>
              <button
                onClick={fetchWeatherAndRecommendations}
                className="text-xs text-[var(--color-primary-light)] hover:underline"
              >
                Refresh Advice
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-[var(--bg-secondary)] rounded-lg" />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-8 text-center bg-[var(--bg-tertiary)]/20 border border-[var(--border-color)] rounded-xl">
                <span className="text-2xl block mb-2">💡</span>
                <p className="text-xs text-[var(--text-secondary)]">No recommendations available at this time.</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Register farm plots and plant crops to receive context-aware AI farming advice.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className={`p-5 rounded-xl border transition-all ${
                      rec.priority === "HIGH"
                        ? "bg-red-950/15 border-red-500/20 hover:border-red-500/40"
                        : rec.priority === "MEDIUM"
                        ? "bg-yellow-950/15 border-yellow-500/20 hover:border-yellow-500/40"
                        : "bg-emerald-950/15 border-emerald-500/20 hover:border-emerald-500/40"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {rec.category === "Irrigation" ? "💧" : rec.category === "Pest" ? "🐛" : rec.category === "Sowing" ? "🌱" : "🌾"}
                        </span>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">{rec.title}</h3>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          rec.priority === "HIGH"
                            ? "bg-red-900/30 text-red-400 border border-red-500/30"
                            : rec.priority === "MEDIUM"
                            ? "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                            : "bg-green-900/30 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                      {rec.message}
                    </p>

                    <div className="mt-3.5 pt-2 border-t border-[var(--border-light)] flex justify-between items-center text-[9px] text-[var(--text-muted)]">
                      <span>Advice generated: {new Date(rec.created_at).toLocaleDateString()}</span>
                      <span className="capitalize">Category: {rec.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
