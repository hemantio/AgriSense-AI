"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, Wind, Droplets, Thermometer, RefreshCw } from "lucide-react";

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
  priority: string;
  category: string;
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

// Custom animated weather component
function AnimatedWeatherIcon({ iconCode, size = 64 }: { iconCode: string; size?: number }) {
  const isSunny = iconCode.startsWith("01");
  const isFewClouds = iconCode.startsWith("02");
  const isScattered = iconCode.startsWith("03") || iconCode.startsWith("04");
  const isRainy = iconCode.startsWith("09") || iconCode.startsWith("10");
  const isThunder = iconCode.startsWith("11");
  const isSnow = iconCode.startsWith("13");

  if (isSunny) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="w-full h-full text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" />
        </motion.div>
      </div>
    );
  }

  if (isFewClouds || isScattered) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Cloud className="w-full h-full text-zinc-400 drop-shadow-[0_0_10px_rgba(161,161,170,0.3)]" />
        </motion.div>
      </div>
    );
  }

  if (isRainy) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.div
          animate={{ y: [-1, 1, -1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <CloudRain className="w-full h-full text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)]" />
        </motion.div>
      </div>
    );
  }

  if (isThunder) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.div
          animate={{ scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <CloudLightning className="w-full h-full text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
        </motion.div>
      </div>
    );
  }

  if (isSnow) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.div
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <CloudSnow className="w-full h-full text-zinc-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
        </motion.div>
      </div>
    );
  }

  // Default cloud/sun mix
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Cloud className="w-full h-full text-zinc-400" />
      </motion.div>
    </div>
  );
}

export default function WeatherPage() {
  const { user } = useAuthStore();
  const [weather, setWeatherData] = useState<WeatherData>(DEFAULT_WEATHER);
  const [forecast, setForecast] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeatherAndRecommendations = async () => {
    setIsLoading(true);
    try {
      const weatherRes = await api.getWeather({ lat: 18.5204, lon: 73.8567 });
      if (weatherRes.data) {
        setWeatherData(weatherRes.data);
      }

      const forecastRes = await api.getWeatherForecast({ lat: 18.5204, lon: 73.8567 });
      if (forecastRes.data && forecastRes.data.list) {
        const daily = forecastRes.data.list.filter((item: any) => item.dt_txt.includes("12:00:00"));
        setForecast(daily);
      }

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
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Weather Intelligence & AI Recommendations 🌤️
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Stay ahead of changing atmospheric patterns and receive Gemini-powered organic crop suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current weather + Forecast */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Weather Card */}
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 gradient-warm opacity-5 blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Current Conditions</span>
                <h2 className="text-2xl font-black text-white mt-1">{weather.location_name}</h2>
              </div>
              <AnimatedWeatherIcon iconCode={weather.icon} size={64} />
            </div>

            <div className="flex items-baseline mt-4">
              <span className="text-5xl font-black text-white">{weather.temp}°C</span>
              <span className="text-xs text-zinc-400 ml-2.5 capitalize font-bold">
                &bull; {weather.description}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-zinc-900 mt-6 pt-6 text-center text-xs text-zinc-400">
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] mb-1 font-mono">Humidity</p>
                <p className="font-bold text-sm text-white flex items-center justify-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> {weather.humidity}%
                </p>
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] mb-1 font-mono">Wind Speed</p>
                <p className="font-bold text-sm text-white flex items-center justify-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" /> {weather.wind_speed} km/h
                </p>
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] mb-1 font-mono">Rainfall</p>
                <p className="font-bold text-sm text-white flex items-center justify-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" /> {weather.rain_1h || 0} mm
                </p>
              </div>
            </div>

            {/* Weather Alerts if present */}
            {weather.alerts && weather.alerts.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-[var(--color-danger-light)] space-y-2">
                <p className="font-bold text-sm">🚨 Weather Alert Issued!</p>
                {weather.alerts.map((alert, index) => (
                  <div key={index}>
                    <p className="font-semibold uppercase">{alert.event} ({alert.severity})</p>
                    <p className="mt-0.5 leading-relaxed text-zinc-500">{alert.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5-Day Forecast */}
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white mb-4">5-Day Meteorological Forecast</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-zinc-900/20 rounded-lg" />
                ))}
              </div>
            ) : forecast.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Forecast data temporarily unavailable.</p>
            ) : (
              <div className="space-y-3.5">
                {forecast.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-zinc-900 last:border-b-0">
                    <span className="font-semibold text-zinc-400">
                      {new Date(item.dt_txt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <AnimatedWeatherIcon iconCode={item.weather[0].icon} size={32} />
                      <span className="font-bold text-white font-mono">{Math.round(item.main.temp)}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI context recommendations list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 gradient-accent opacity-5 blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Gemini Contextual AI Advice
              </h2>
              <button
                onClick={fetchWeatherAndRecommendations}
                className="text-xs text-[var(--color-primary-light)] hover:underline flex items-center gap-1 cursor-pointer font-bold font-mono uppercase text-[10px]"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Advice
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-zinc-900/20 rounded-lg" />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/10 border border-zinc-800 rounded-xl">
                <span className="text-2xl block mb-2">💡</span>
                <p className="text-xs text-zinc-400 font-semibold">No recommendations available at this time.</p>
                <p className="text-[10px] text-zinc-500 mt-1">Register farm plots and plant crops to receive context-aware AI farming advice.</p>
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
                        ? "bg-red-950/10 border-red-500/20 hover:border-red-500/40 glow-border-rose"
                        : rec.priority === "MEDIUM"
                        ? "bg-yellow-950/10 border-yellow-500/20 hover:border-yellow-500/40 glow-border-amber"
                        : "bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40 glow-border-emerald"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {rec.category === "Irrigation" ? "💧" : rec.category === "Pest" ? "🐛" : rec.category === "Sowing" ? "🌱" : "🌾"}
                        </span>
                        <h3 className="font-bold text-sm text-white">{rec.title}</h3>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono ${
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

                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                      {rec.message}
                    </p>

                    <div className="mt-3.5 pt-2 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
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
