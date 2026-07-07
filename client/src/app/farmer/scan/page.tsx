"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { 
  Camera, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowLeft, 
  Activity,
  Play,
  Square
} from "lucide-react";
import Link from "next/link";

interface Plot {
  id: string;
  plot_name: string;
}

interface AnalysisResult {
  id: string;
  diagnosis?: string;
  health_score?: number;
  confidence?: number;
  severity?: string;
  recommendation_text?: string;
  status: string;
}

const SCAN_STAGES = [
  "Uploading leaf signature...",
  "Running multi-spectral leaf anomaly detection...",
  "Evaluating cellular stress patterns...",
  "Consulting AgriSense AI crop model...",
  "Finalizing diagnostic treatments..."
];

export default function FarmerScanner() {
  const { user } = useAuthStore();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Audio state
  const [speaking, setSpeaking] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSynth(window.speechSynthesis);
    }

    const loadPlots = async () => {
      try {
        const response = await api.listPlots();
        const list = response.data.plots || [];
        setPlots(list);
        if (list.length > 0) {
          setSelectedPlotId(list[0].id);
        }
      } catch (err) {
        console.error("Error loading plots for scanner:", err);
      }
    };
    loadPlots();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setErrorMsg("");
    setActiveAnalysis(null);
  };

  const handleDiagnose = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMsg("Please select a leaf photo first.");
      return;
    }
    if (!selectedPlotId) {
      setErrorMsg("Please register and select a plot.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg("");
    setActiveAnalysis(null);
    setTelemetryLogs([]);

    // Telemetry log simulator
    let stage = 0;
    const logInterval = setInterval(() => {
      if (stage < SCAN_STAGES.length) {
        setTelemetryLogs((prev) => [...prev, SCAN_STAGES[stage]]);
        stage++;
      } else {
        clearInterval(logInterval);
      }
    }, 850);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("plot_id", selectedPlotId);

    try {
      const response = await api.analyzeHealth(formData);
      clearInterval(logInterval);
      setTelemetryLogs(SCAN_STAGES);
      
      // Delay slightly for presentation
      await new Promise((r) => setTimeout(r, 400));
      
      // Wait for celery execution or use completed result directly
      // In Eager Mode, the returned object has status = 'completed' immediately
      const record = response.data;
      
      // If the result is pending, poll for completion
      if (record.status === "pending" || record.status === "processing") {
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const checkResp = await api.getHealthRecord(record.id);
            if (checkResp.data.status === "completed" || checkResp.data.status === "failed") {
              clearInterval(pollInterval);
              setActiveAnalysis(checkResp.data);
              setIsAnalyzing(false);
            }
          } catch {
            // Ignore polling errors
          }

          if (attempts > 15) {
            clearInterval(pollInterval);
            setErrorMsg("Diagnostic engine timeout. Check history logs later.");
            setIsAnalyzing(false);
          }
        }, 1500);
      } else {
        setActiveAnalysis(record);
        setIsAnalyzing(false);
      }
      
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      clearInterval(logInterval);
      setErrorMsg(err.response?.data?.detail || "AI diagnostics failed. Try again.");
      setIsAnalyzing(false);
    }
  };

  const handleSpeakReport = () => {
    if (!synth || !activeAnalysis) return;

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    const isHindi = user?.preferred_language === "hi";
    let text = "";

    if (isHindi) {
      text = `जांच रिपोर्ट पूरी हो गई है. फसल रोग निदान है: ${activeAnalysis.diagnosis || "स्वस्थ पत्ते"}. `;
      if (activeAnalysis.recommendation_text) {
        text += `एआई उपचार सलाह है: ${activeAnalysis.recommendation_text}. `;
      }
    } else {
      text = `Diagnostic scan complete. The diagnosis is: ${activeAnalysis.diagnosis || "Healthy leaves"}. `;
      if (activeAnalysis.recommendation_text) {
        text += `AI Recommendation: ${activeAnalysis.recommendation_text}. `;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHindi ? "hi-IN" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => {
      setSpeaking(false);
    };

    setSpeaking(true);
    synth.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/farmer" className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-white">AI Crop Clinic</h1>
          <p className="text-[10px] text-zinc-500">Scan leaves for immediate treatment advice</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Inputs Form */}
      <div className="space-y-4">
        {/* Plot Selector */}
        <div>
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono block mb-1.5">Select Farm Plot</label>
          <select
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            disabled={isAnalyzing}
            className="w-full bg-zinc-950 border border-zinc-900 text-zinc-100 rounded-xl p-3 text-xs outline-none focus:border-[#34d399] transition-colors"
          >
            {plots.length === 0 ? (
              <option value="">No plots registered</option>
            ) : (
              plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.plot_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Camera Selector frame */}
        <div 
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden min-h-[220px] ${
            isAnalyzing 
              ? "border-[#10b981] bg-zinc-900/10" 
              : "border-zinc-800 hover:border-[#10b981]/50 bg-zinc-950/20"
          }`}
        >
          {isAnalyzing && (
            <div className="absolute inset-0 bg-[#10b981]/5 flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 rounded-full border-2 border-[#10b981] border-t-transparent animate-spin" />
              <div className="w-full px-6 space-y-1.5 font-mono text-[9px] text-[#34d399]">
                {telemetryLogs.map((log, idx) => (
                  <p key={idx} className="animate-fade-in">✓ {log}</p>
                ))}
              </div>
            </div>
          )}

          {!isAnalyzing && previewUrl && (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewUrl} 
                alt="Selected crop leaf" 
                className="max-h-40 rounded-xl object-cover border border-zinc-800 mx-auto"
              />
              <p className="text-[9px] text-zinc-500">Tap to snap a different photo</p>
            </div>
          )}

          {!isAnalyzing && !previewUrl && (
            <div className="space-y-2">
              <Camera className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs font-semibold text-white">Snap or Select Leaf Photo</p>
              <p className="text-[9px] text-zinc-500">Take a close-up photo of leaf damage</p>
            </div>
          )}

          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            disabled={isAnalyzing}
            className="hidden"
          />
        </div>

        {/* Diagnosis Trigger (Living Emerald) */}
        {!isAnalyzing && previewUrl && (
          <button
            onClick={handleDiagnose}
            className="w-full bg-[#10b981] hover:bg-[#34d399] text-zinc-950 font-bold py-3.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            🧬 Start Diagnostics Scan
          </button>
        )}
      </div>

      {/* Diagnostic Analysis Result Card */}
      {activeAnalysis && (
        <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Diagnosis Output</span>
              <h3 className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                {activeAnalysis.diagnosis || "Healthy Crop"}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider font-mono block">Severity</span>
              <span className={`text-xs font-black uppercase ${
                activeAnalysis.severity === "severe" ? "text-red-400" : "text-amber-400"
              }`}>
                {activeAnalysis.severity || "None"}
              </span>
            </div>
          </div>

          {/* Voice advisories audio playback */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
            <span className="text-[10px] text-zinc-400 font-semibold">Play Diagnosis Out Loud:</span>
            <button
              onClick={handleSpeakReport}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                speaking 
                  ? "bg-[#ffb1ee]/20 text-[#ffb1ee] border-[#ffb1ee]" 
                  : "bg-[#ffb1ee] text-zinc-950 border-[#ffb1ee]"
              }`}
            >
              {speaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          </div>

          <div className="space-y-4">
            {activeAnalysis.recommendation_text && (
              <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-100 leading-relaxed shadow-inner">
                <span className="font-bold text-emerald-400 block mb-1 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recommended Action Protocol:
                </span>
                <p className="whitespace-pre-line">{activeAnalysis.recommendation_text}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
