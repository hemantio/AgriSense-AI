"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Activity, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

interface HealthRecord {
  id: string;
  plot_id?: string;
  crop_name?: string;
  image_url?: string;
  disease_detected?: string;
  confidence_score?: number;
  organic_treatment?: string;
  chemical_treatment?: string;
  notes?: string;
  created_at: string;
}

const SCAN_STAGES = [
  "🔍 Initializing computer vision scanner...",
  "🍃 Extracting chlorophyll & leaf pigmentation density...",
  "⚡ Segmenting leaf necrosis and spot metrics...",
  "🤖 Consulting Gemini AI Diagnosis engine...",
  "💊 Synthesizing treatments & guidelines...",
];

export default function HealthPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<HealthRecord | null>(null);
  
  // Telemetry stages
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  
  // Image preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.getHealthHistory();
      setHistory(response.data.records || response.data.history || (Array.isArray(response.data) ? response.data : []));
    } catch (error) {
      console.error("Error fetching health history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      const errMsg = "File size exceeds 10MB limit.";
      setErrorMsg(errMsg);
      toast.error(errMsg);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setErrorMsg("");
    toast.info("Image loaded. Click 'Diagnose Leaf Health' to begin scanning.");
  };

  const handleAnalyze = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a crop leaf image to upload.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg("");
    setActiveAnalysis(null);
    setTelemetryLogs([]);

    // Telemetry log simulator
    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < SCAN_STAGES.length) {
        setTelemetryLogs((prev) => [...prev, SCAN_STAGES[currentStage]]);
        currentStage++;
      } else {
        clearInterval(interval);
      }
    }, 900);

    toast.info("Uploading image to Diagnostic Engine...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.analyzeHealth(formData);
      clearInterval(interval);
      
      // Ensure all stages are shown
      setTelemetryLogs(SCAN_STAGES);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setActiveAnalysis(response.data);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("AI Diagnostic analysis complete!");
      fetchHistory();
    } catch (err: any) {
      clearInterval(interval);
      const errMsg = err.response?.data?.detail || "AI crop analysis failed. Please try again.";
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          AI Crop Clinic & Diagnostics 🩺
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Upload crop photos to detect diseases instantly and get customized chemical & organic treatment instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics scanner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4">Diagnostic Scanner</h2>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div 
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isAnalyzing 
                    ? "border-emerald-500 bg-zinc-900/30" 
                    : "border-zinc-800 hover:border-emerald-500/50 bg-zinc-950/20"
                } relative overflow-hidden group`}
                style={{ minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "center" }}
              >
                {/* Visual scanner line animation */}
                {isAnalyzing && (
                  <div className="laser-scan-line z-20" />
                )}

                {previewUrl ? (
                  <div className="space-y-3 z-10 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={previewUrl} 
                      alt="Crop preview" 
                      className="max-h-40 mx-auto rounded-lg object-cover border border-zinc-800"
                    />
                    <p className="text-[10px] text-zinc-500">Tap to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2 z-10">
                    <span className="text-4xl block group-hover:scale-110 transition-transform duration-300">🍃</span>
                    <p className="text-xs font-semibold text-white">
                      {isAnalyzing ? "Analyzing Leaves & Roots..." : "Select Crop Photo to Scan"}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Supports JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isAnalyzing}
                />
              </div>

              {previewUrl && !isAnalyzing && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="btn btn-primary w-full py-2.5 shadow-lg shadow-emerald-500/10 cursor-pointer text-zinc-900 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border-0"
                >
                  🧬 Diagnose Leaf Health
                </button>
              )}

              {/* Ticker logs */}
              {isAnalyzing && (
                <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-1.5 text-zinc-500 border-b border-zinc-900 pb-1 mb-2 font-sans font-bold">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> SCANNER TELEMETRY LOGS
                  </div>
                  {telemetryLogs.map((log, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="truncate"
                    >
                      {log}
                    </motion.p>
                  ))}
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-3 bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scan results / History list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Diagnostic results */}
          <AnimatePresence>
            {activeAnalysis && (
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl overflow-hidden"
              >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Diagnosis Results</span>
                  <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    {activeAnalysis.disease_detected || "Healthy Leaves Detected"}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono block">Confidence</span>
                  <span className="text-lg font-black text-[var(--color-primary-light)]">
                    {activeAnalysis.confidence_score ? `${Math.round(activeAnalysis.confidence_score * 100)}%` : "N/A"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {activeAnalysis.notes && (
                  <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-900 text-xs text-zinc-400 leading-relaxed">
                    <span className="font-bold text-white block mb-1 font-mono uppercase tracking-wider text-[10px]">Visual Diagnostic Report</span>
                    {activeAnalysis.notes}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-xs text-emerald-100 leading-relaxed shadow-inner">
                    <span className="font-bold text-emerald-400 block mb-2 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Organic Treatments
                    </span>
                    <p className="whitespace-pre-line">{activeAnalysis.organic_treatment || "No organic treatments listed."}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-950/10 border border-orange-500/20 text-xs text-orange-100 leading-relaxed shadow-inner">
                    <span className="font-bold text-orange-400 block mb-2 text-xs flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-orange-400" /> Chemical Treatment Guidelines
                    </span>
                    <p className="whitespace-pre-line">{activeAnalysis.chemical_treatment || "No chemical treatments recommended."}</p>
                  </div>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Diagnostic History */}
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white mb-4">Recent Diagnostic Scans</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-zinc-900/20 rounded-lg" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No previous diagnostic scans found.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[450px]">
                {history.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:border-emerald-500/30 transition-all cursor-pointer glow-border-emerald"
                    onClick={() => setActiveAnalysis(record)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-sm text-white">
                          {record.disease_detected || "Unknown Disease"}
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                          Scanned: {new Date(record.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 text-[var(--color-primary-light)] border border-zinc-800 font-mono font-bold">
                        {record.confidence_score ? `${Math.round(record.confidence_score * 100)}% Match` : "N/A"}
                      </span>
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
