"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { 
  CloudSun, 
  Camera, 
  Volume2, 
  MapPin, 
  Sprout, 
  Coins, 
  AlertTriangle,
  Play,
  Square,
  Thermometer,
  Droplets,
  Wind
} from "lucide-react";

interface DashboardStats {
  total_plots: number;
  active_crops: number;
  total_health_analyses: number;
  critical_health_alerts: number;
  active_weather_alerts: number;
  total_expenses: number;
}

interface WeatherInfo {
  temperature_celsius?: number;
  humidity_percent?: number;
  weather_description?: string;
  rain_probability?: number;
  wind_speed_kmh?: number;
}

export default function FarmerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [plotsCount, setPlotsCount] = useState(0);
  const [cropsCount, setCropsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Audio state
  const [speaking, setSpeaking] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSynth(window.speechSynthesis);
    }

    const loadFarmerData = async () => {
      try {
        // 1. Get aggregate stats
        const statsResp = await api.getDashboardStats();
        setStats(statsResp.data);

        // 2. Get plots
        const plotsResp = await api.listPlots();
        const plots = plotsResp.data.plots || [];
        setPlotsCount(plots.length);

        // 3. Get crops
        const cropsResp = await api.listCrops();
        const crops = cropsResp.data.crops || [];
        setCropsCount(crops.length);

        // 4. Load weather forecast based on first plot coordinates
        let lat = 28.9812; // Default Sonipat
        let lon = 77.0123;
        if (plots.length > 0 && plots[0].latitude && plots[0].longitude) {
          lat = plots[0].latitude;
          lon = plots[0].longitude;
        }

        const weatherResp = await api.getWeatherForecast({ latitude: lat, longitude: lon });
        if (weatherResp.data && weatherResp.data.current) {
          setWeather(weatherResp.data.current);
        }
      } catch (err) {
        console.error("Error loading farmer dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFarmerData();
  }, []);

  const handleSpeak = () => {
    if (!synth) return;

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    // Generate speech text based on preferred language
    const isHindi = user?.preferred_language === "hi";
    let text = "";

    if (isHindi) {
      text = `नमस्ते ${user?.name || "किसान भाई"}. आपका स्वागत है एग्रीसेंस एआई में. `;
      if (weather) {
        text += `आज का तापमान ${Math.round(weather.temperature_celsius || 30)} डिग्री सेल्सियस है. `;
        if (weather.weather_description) {
          text += `मौसम ${weather.weather_description} है. `;
        }
        if (weather.rain_probability && weather.rain_probability > 30) {
          text += `आज बारिश की संभावना ${Math.round(weather.rain_probability)} प्रतिशत है. खाद डालने से बचें. `;
        }
      }
      if (stats?.critical_health_alerts && stats.critical_health_alerts > 0) {
        text += `आपके खेत में ${stats.critical_health_alerts} महत्वपूर्ण फसल रोग अलर्ट हैं. कृपया जल्द से जल्द पत्तों की जांच करें. `;
      } else {
        text += `आपकी फसलें स्वस्थ दिख रही हैं. `;
      }
    } else {
      text = `Hello ${user?.name || "farmer"}. Welcome to AgriSense AI. `;
      if (weather) {
        text += `Current temperature is ${Math.round(weather.temperature_celsius || 30)} degrees Celsius. `;
        text += `Weather is ${weather.weather_description || "clear"}. `;
        if (weather.rain_probability && weather.rain_probability > 30) {
          text += `Rain probability is ${Math.round(weather.rain_probability)} percent. Avoid applying fertilizer. `;
        }
      }
      if (stats?.critical_health_alerts && stats.critical_health_alerts > 0) {
        text += `You have ${stats.critical_health_alerts} critical crop alerts. Please inspect your fields. `;
      } else {
        text += `Your crops look healthy today. `;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHindi ? "hi-IN" : "en-US";
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      setSpeaking(false);
    };

    setSpeaking(true);
    synth.speak(utterance);
  };

  // Cancel speaking if component unmounts
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  const greeting = user?.preferred_language === "hi" ? "नमस्ते" : "Welcome";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        Fetching field conditions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div>
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Farmer Portal</span>
        <h1 className="text-2xl font-black text-white mt-1 leading-tight">
          {greeting}, <span className="text-[#34d399]">{user?.name || "Ramesh"}</span>!
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Village: {user?.village_name || "Sonipat"}</p>
      </div>

      {/* Voice Assistant Playback Card (Orchid Accent) */}
      <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl relative overflow-hidden">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono block">Voice Advisory</span>
            <p className="text-xs font-semibold text-white mt-1.5 leading-relaxed">
              {user?.preferred_language === "hi" 
                ? "मौसम पूर्वानुमान और फसल रोग की स्थिति सुनने के लिए बटन दबाएं।" 
                : "Listen to weather forecasts and crop disease advisories now."}
            </p>
          </div>
          <button
            onClick={handleSpeak}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 cursor-pointer ${
              speaking 
                ? "bg-[#ffb1ee]/20 text-[#ffb1ee] border-[#ffb1ee]" 
                : "bg-[#ffb1ee] text-zinc-950 border-[#ffb1ee] hover:scale-105"
            }`}
          >
            {speaking ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Giant Camera Scanner Action Button (Living Emerald) */}
      <Link 
        href="/farmer/scan"
        className="block p-5 bg-gradient-to-br from-[#065f46] to-[#10b981] rounded-2xl hover:scale-[1.01] transition-transform shadow-[0_4px_20px_rgba(16,185,129,0.25)] group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-950/20 flex items-center justify-center text-zinc-950 shrink-0 group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-white leading-tight">
              {user?.preferred_language === "hi" ? "फसल रोग स्कैन करें" : "Scan Crop Diseases"}
            </h3>
            <p className="text-xs text-emerald-100 mt-1">
              {user?.preferred_language === "hi" ? "पत्ती की फोटो खींचकर तुरंत उपचार पाएं" : "Upload leaf photo to get instant diagnosis"}
            </p>
          </div>
        </div>
      </Link>

      {/* Weather Telemetry Hub */}
      {weather && (
        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Weather Intelligence</span>
            <div className="flex items-center gap-1.5 text-[#f59e0b] font-semibold text-xs bg-[#f59e0b]/5 px-2 py-0.5 rounded border border-[#f59e0b]/10">
              <CloudSun className="w-3.5 h-3.5" />
              <span>{Math.round(weather.rain_probability || 0)}% Rain Prob</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-lg text-center">
              <Thermometer className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
              <span className="text-[9px] uppercase text-zinc-500 font-mono">Temp</span>
              <p className="text-sm font-bold text-white mt-0.5">{Math.round(weather.temperature_celsius || 0)}°C</p>
            </div>
            <div className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-lg text-center">
              <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
              <span className="text-[9px] uppercase text-zinc-500 font-mono">Humid</span>
              <p className="text-sm font-bold text-white mt-0.5">{weather.humidity_percent}%</p>
            </div>
            <div className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-lg text-center">
              <Wind className="w-4 h-4 text-teal-400 mx-auto mb-1.5" />
              <span className="text-[9px] uppercase text-zinc-500 font-mono">Wind</span>
              <p className="text-sm font-bold text-white mt-0.5">{Math.round(weather.wind_speed_kmh || 0)} km/h</p>
            </div>
          </div>

          {weather.weather_description && (
            <p className="text-center text-[10px] text-zinc-400 capitalize font-medium font-mono">
              Sky Condition: {weather.weather_description}
            </p>
          )}
        </div>
      )}

      {/* Quick Stats Telemetry */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Farm Ledger Stats</span>
        <div className="grid grid-cols-2 gap-3">
          
          <div className="p-3 bg-[#09090b] border border-zinc-900 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
              <MapPin className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-mono block">Plots</span>
              <span className="text-sm font-black text-white">{plotsCount} Fields</span>
            </div>
          </div>

          <div className="p-3 bg-[#09090b] border border-zinc-900 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
              <Sprout className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-mono block">Crops</span>
              <span className="text-sm font-black text-white">{cropsCount} Active</span>
            </div>
          </div>

          <div className="p-3 bg-[#09090b] border border-zinc-900 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-mono block">Alerts</span>
              <span className="text-sm font-black text-white">
                {stats?.critical_health_alerts || 0} Disease
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#09090b] border border-zinc-900 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[9px] uppercase text-zinc-500 font-mono block">Expenses</span>
              <span className="text-sm font-black text-white">
                ₹{(stats?.total_expenses || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
