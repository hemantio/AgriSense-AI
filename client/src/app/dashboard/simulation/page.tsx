"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { Cpu, Thermometer, Droplet, Wind, RefreshCw, Layers, Terminal, AlertTriangle, ShieldCheck } from "lucide-react";

interface Scenario {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface SimulationRecord {
  id: string;
  scenario_type: string;
  scenario_name: string;
  input_values: string;
  simulated_temperature?: number;
  simulated_humidity?: number;
  simulated_rainfall_mm?: number;
  ai_response: string;
  alerts_generated: string;
  created_at: string;
}

interface Plot {
  id: string;
  plot_name: string;
}

const SCENARIOS = {
  rainfall: { name: "Heavy Rainfall", icon: "🌧️", type: "rainfall" },
  drought: { name: "Drought", icon: "☀️", type: "drought" },
  crop_disease: { name: "Crop Disease", icon: "🍂", type: "crop_disease" },
  pest_outbreak: { name: "Pest Outbreak", icon: "🐛", type: "pest_outbreak" },
  irrigation: { name: "Irrigation Event", icon: "💧", type: "irrigation" },
  power_outage: { name: "Power Outage", icon: "🔌", type: "power_outage" },
};

export default function SimulationPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<SimulationRecord[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection
  const [selectedScenario, setSelectedScenario] = useState<string>("drought");
  const [selectedPlot, setSelectedPlot] = useState("");
  
  // Parameter forms
  const [params, setParams] = useState<Record<string, any>>({
    days_without_rain: 21,
    temperature_celsius: 42,
    humidity_percent: 15,
  });

  // Runner states
  const [isSimulating, setIsSimulating] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [formError, setFormError] = useState("");

  // Telemetry metrics
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(38);
  const [packetCount, setPacketCount] = useState(0);

  const fetchHistoryAndPlots = async () => {
    setIsLoading(true);
    try {
      const [histRes, plotsRes] = await Promise.all([
        api.getSimulationHistory(),
        api.listPlots(),
      ]);
      setHistory(histRes.data.history || histRes.data || []);
      setPlots(plotsRes.data.plots || []);
    } catch (error) {
      console.error("Error fetching simulation info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndPlots();
  }, []);

  // Update default parameters when scenario changes
  useEffect(() => {
    const defaults: Record<string, any> = {
      rainfall: { rainfall_mm: 60, duration_hours: 12, humidity_percent: 95 },
      drought: { days_without_rain: 21, temperature_celsius: 42, humidity_percent: 15 },
      crop_disease: { disease_type: "leaf_blight", severity: "medium", spread_rate: 0.5 },
      pest_outbreak: { pest_type: "aphids", severity: "medium", affected_area_percent: 40 },
      irrigation: { irrigation_type: "flood", duration_hours: 4, water_liters: 5000 },
      power_outage: { duration_hours: 6, affected_systems: "irrigation_pump" },
    };
    setParams(defaults[selectedScenario] || {});
    setSimulationResult(null);
    setConsoleLogs([]);
  }, [selectedScenario]);

  const updateParam = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Oscillate telemetry metrics when simulation is running
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        setCpuUsage(Math.floor(Math.random() * 30) + 65); // 65% - 95%
        setRamUsage(Math.floor(Math.random() * 10) + 72); // 72% - 82%
        setPacketCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      }, 300);
    } else {
      setCpuUsage(12);
      setRamUsage(38);
      setPacketCount(0);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const executeSimulation = async () => {
    setIsSimulating(true);
    setFormError("");
    setConsoleLogs([]);
    setSimulationResult(null);

    const logs = [
      "🔄 Initializing simulator kernel...",
      `📍 Binding scenario to plot ID: ${selectedPlot || "General Area"}`,
      `⚙️ Loading configuration variables: ${JSON.stringify(params)}`,
      "🌡️ Modifying local atmospheric parameters...",
      "💻 Running plant health vulnerability matrices...",
      "🤖 Consulting Google Gemini reasoning model...",
      "📊 Synthesizing risk mitigation procedures...",
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      setConsoleLogs((prev) => [...prev, logs[i]]);
    }

    try {
      const response = await api.runSimulation({
        scenario_type: selectedScenario,
        parameters: params,
        plot_id: selectedPlot || undefined,
      });

      setSimulationResult(response.data);
      setConsoleLogs((prev) => [...prev, "✅ Simulation sandbox execution complete! Output ready."]);
      fetchHistoryAndPlots();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Simulation run failed.");
      setConsoleLogs((prev) => [...prev, "❌ Critical: Simulation engine halted with errors."]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Simulation Climate Sandbox 🎭
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Simulate extreme scenarios (droughts, rainstorms, pests) to test your farm resilience and preview AI countermeasures.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Setup Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4">Scenario Configuration</h2>

            {/* Scenario Selector */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {Object.values(SCENARIOS).map((sc) => (
                <button
                  key={sc.type}
                  onClick={() => !isSimulating && setSelectedScenario(sc.type)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    selectedScenario === sc.type
                      ? "border-emerald-500 bg-zinc-900/30 text-white scale-[1.03]"
                      : "border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:border-emerald-500/30"
                  }`}
                  disabled={isSimulating}
                >
                  <span className="text-xl mb-1">{sc.icon}</span>
                  <span className="text-[9px] font-bold leading-tight uppercase font-mono">{sc.name}</span>
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Target Farm Plot</label>
                <select
                  value={selectedPlot}
                  onChange={(e) => setSelectedPlot(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  disabled={isSimulating}
                >
                  <option value="">General Area (None)</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>{p.plot_name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Parameter Sliders */}
              {selectedScenario === "rainfall" && (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-400">Rainfall Quantity:</span>
                      <span className="font-bold text-emerald-400">{params.rainfall_mm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="120"
                      value={params.rainfall_mm || 60}
                      onChange={(e) => updateParam("rainfall_mm", parseInt(e.target.value))}
                      className="w-full accent-emerald-400"
                      disabled={isSimulating}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-400">Duration:</span>
                      <span className="font-bold text-emerald-400">{params.duration_hours} hours</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="48"
                      value={params.duration_hours || 12}
                      onChange={(e) => updateParam("duration_hours", parseInt(e.target.value))}
                      className="w-full accent-emerald-400"
                      disabled={isSimulating}
                    />
                  </div>
                </div>
              )}

              {selectedScenario === "drought" && (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-400">Days Without Rain:</span>
                      <span className="font-bold text-emerald-400">{params.days_without_rain} Days</span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="60"
                      value={params.days_without_rain || 21}
                      onChange={(e) => updateParam("days_without_rain", parseInt(e.target.value))}
                      className="w-full accent-emerald-400"
                      disabled={isSimulating}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-400">Simulated Temp:</span>
                      <span className="font-bold text-emerald-400">{params.temperature_celsius}°C</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="50"
                      value={params.temperature_celsius || 42}
                      onChange={(e) => updateParam("temperature_celsius", parseInt(e.target.value))}
                      className="w-full accent-emerald-400"
                      disabled={isSimulating}
                    />
                  </div>
                </div>
              )}

              {selectedScenario === "crop_disease" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Disease Type</label>
                    <select
                      value={params.disease_type || "leaf_blight"}
                      onChange={(e) => updateParam("disease_type", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      disabled={isSimulating}
                    >
                      <option value="leaf_blight">Leaf Blight</option>
                      <option value="powdery_mildew">Powdery Mildew</option>
                      <option value="root_rot">Root Rot</option>
                      <option value="rust">Rust</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Severity</label>
                    <select
                      value={params.severity || "medium"}
                      onChange={(e) => updateParam("severity", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      disabled={isSimulating}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedScenario === "pest_outbreak" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Pest Type</label>
                    <select
                      value={params.pest_type || "aphids"}
                      onChange={(e) => updateParam("pest_type", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      disabled={isSimulating}
                    >
                      <option value="aphids">Aphids</option>
                      <option value="bollworms">Bollworms</option>
                      <option value="whiteflies">Whiteflies</option>
                      <option value="locusts">Locusts</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-400">Affected Area:</span>
                      <span className="font-bold text-emerald-400">{params.affected_area_percent}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={params.affected_area_percent || 40}
                      onChange={(e) => updateParam("affected_area_percent", parseInt(e.target.value))}
                      className="w-full accent-emerald-400"
                      disabled={isSimulating}
                    />
                  </div>
                </div>
              )}

              {selectedScenario === "irrigation" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Irrigation System Type</label>
                    <select
                      value={params.irrigation_type || "flood"}
                      onChange={(e) => updateParam("irrigation_type", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      disabled={isSimulating}
                    >
                      <option value="flood">Flood</option>
                      <option value="drip">Drip</option>
                      <option value="sprinkler">Sprinkler</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-400">Duration (Hours):</span>
                      <span className="font-bold text-emerald-400">{params.duration_hours} Hours</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={params.duration_hours || 4}
                      onChange={(e) => updateParam("duration_hours", parseInt(e.target.value))}
                      className="w-full accent-emerald-400"
                      disabled={isSimulating}
                    />
                  </div>
                </div>
              )}

              {selectedScenario === "power_outage" && (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-zinc-400">Outage Duration:</span>
                      <span className="font-bold text-emerald-400">{params.duration_hours} Hours</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={params.duration_hours || 6}
                      onChange={(e) => updateParam("duration_hours", parseInt(e.target.value))}
                      className="w-full accent-emerald-400"
                      disabled={isSimulating}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={executeSimulation}
                className="btn btn-primary w-full py-2.5 mt-6 shadow-lg shadow-emerald-500/10 cursor-pointer text-zinc-900 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border-0 font-bold"
                disabled={isSimulating}
              >
                {isSimulating ? "Synthesizing Sandbox..." : "🚀 Run Climate Scenario"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Output Logs & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Telemetry Hardware Monitor */}
          <div className="glass-card p-5 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-zinc-900 pb-2 mb-4 font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" /> SIMULATOR HARDWARE COMPONENT PERFORMANCE
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 text-[10px] block">CPU CORE USAGE</span>
                <p className="font-bold text-base mt-1 text-white">{cpuUsage}%</p>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-400"
                    animate={{ width: `${cpuUsage}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 text-[10px] block">RAM ALLOCATION</span>
                <p className="font-bold text-base mt-1 text-white">{ramUsage}%</p>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-400"
                    animate={{ width: `${ramUsage}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 text-[10px] block">AI QUERY PACKETS</span>
                <p className="font-bold text-base mt-1 text-white">{packetCount} TX/RX</p>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-400 animate-pulse" style={{ width: isSimulating ? "80%" : "0%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Console logger */}
          {(consoleLogs.length > 0 || isSimulating) && (
            <div className="glass-card p-5 bg-black/95 font-mono text-xs text-green-400 border border-zinc-800 shadow-2xl relative overflow-hidden">
              {/* Scan grid CRT line */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
              
              <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-zinc-900 pb-2 mb-3 flex items-center gap-1.5 font-sans">
                <Terminal className="w-4 h-4 text-emerald-400" /> CLIMATE MATRIX TERMINAL OUTPUT
              </h3>
              <div className="space-y-1.5 h-36 overflow-y-auto">
                {consoleLogs.map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
                {isSimulating && (
                  <span className="inline-block w-2 h-3.5 bg-green-400 animate-pulse ml-0.5" />
                )}
              </div>
            </div>
          )}

          {/* Result Card */}
          {simulationResult && (
            <div className="glass-card p-6 border border-zinc-800 bg-zinc-950/40 backdrop-blur-xl animate-fade-in">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Simulation Results</span>
              <h2 className="text-lg font-black text-white mt-1">
                {simulationResult.scenario_name || "Completed Dry Run"}
              </h2>

              <div className="space-y-4 mt-6">
                {/* Weather details */}
                {simulationResult.generated_weather && (
                  <div className="grid grid-cols-3 gap-4 bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 flex items-center gap-1 text-[10px]"><Thermometer className="w-3.5 h-3.5 text-red-400" /> TEMP</span>
                      <p className="font-bold mt-1 text-white">
                        {simulationResult.generated_weather.temperature_celsius}°C
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 flex items-center gap-1 text-[10px]"><Droplet className="w-3.5 h-3.5 text-blue-400" /> HUMIDITY</span>
                      <p className="font-bold mt-1 text-white">
                        {simulationResult.generated_weather.humidity_percent}%
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 flex items-center gap-1 text-[10px]"><Wind className="w-3.5 h-3.5 text-teal-400" /> RAINFALL</span>
                      <p className="font-bold mt-1 text-white">
                        {simulationResult.generated_weather.rainfall_mm} mm
                      </p>
                    </div>
                  </div>
                )}

                {/* Simulated Alerts */}
                {simulationResult.alerts && simulationResult.alerts.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-xs text-white block font-mono uppercase tracking-wider text-[10px]">Simulated Risk Warnings:</span>
                    {simulationResult.alerts.map((al: any, idx: number) => (
                      <div key={idx} className="p-3 bg-red-950/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>{al.event} ({al.severity}):</strong> {al.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simulated AI recommendations */}
                {simulationResult.recommendations && simulationResult.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <span className="font-bold text-xs text-white block font-mono uppercase tracking-wider text-[10px]">Mitigation Protocol Advice:</span>
                    {simulationResult.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 bg-emerald-950/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-100 leading-relaxed shadow-inner">
                        <strong className="text-emerald-400 block mb-1 text-xs">💡 {rec.title} ({rec.priority} Priority)</strong>
                        {rec.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History ledger */}
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4">Past Simulations Run</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-zinc-900/20 rounded-lg" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No previous simulations run.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[300px]">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:border-emerald-500/30 transition-colors flex justify-between items-center glow-border-emerald"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-white capitalize">
                        {record.scenario_name || record.scenario_type}
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        Run: {new Date(record.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-green-950/30 text-green-400 border border-green-500/20 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> COMPLETED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
