"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

export default function HealthPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<HealthRecord | null>(null);
  
  // Image preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.getHealthHistory();
      setHistory(response.data.history || response.data || []);
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

    // Check size (10MB limit)
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
    toast.info("Uploading image to Diagnostic Engine...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.analyzeHealth(formData);
      setActiveAnalysis(response.data);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("AI Diagnostic analysis complete!");
      fetchHistory();
    } catch (err: any) {
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
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          AI Crop Clinic & Diagnostic Doctor 🩺
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Upload crop photos to detect diseases instantly and get customized chemical & organic treatment instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics scanner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Diagnostic Scanner</h2>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div 
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isAnalyzing 
                    ? "border-[var(--color-primary-light)] bg-[var(--bg-tertiary)]" 
                    : "border-[var(--border-color)] hover:border-[var(--color-primary-light)] bg-[var(--bg-tertiary)]/30"
                } relative overflow-hidden group`}
                style={{ minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "center" }}
              >
                {/* Visual scanner line animation */}
                {isAnalyzing && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary-light)] animate-[bounce_2s_infinite] shadow-[0_0_15px_#40916c] z-20" />
                )}

                {previewUrl ? (
                  <div className="space-y-3 z-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={previewUrl} 
                      alt="Crop preview" 
                      className="max-h-40 mx-auto rounded-lg object-cover border border-[var(--border-color)]"
                    />
                    <p className="text-[10px] text-[var(--text-muted)]">Tap to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2 z-10">
                    <span className="text-4xl block group-hover:scale-110 transition-transform">🍃</span>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      {isAnalyzing ? "Analyzing Leaves & Roots..." : "Select Crop Photo to Scan"}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
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
                  className="btn btn-primary w-full py-2.5"
                >
                  🧬 Diagnose Leaf Health
                </button>
              )}

              {isAnalyzing && (
                <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-center text-xs text-[var(--text-secondary)] animate-pulse-soft">
                  🤖 Running computer vision diagnostics...
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
                transition={{ duration: 0.2 }}
                className="glass-card p-6 border-l-4 border-l-[var(--color-primary-light)] overflow-hidden"
              >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Diagnosis Results</span>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mt-1">
                    {activeAnalysis.disease_detected || "Healthy Leaves Detected"}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Confidence</span>
                  <span className="text-lg font-bold text-[var(--color-primary-light)]">
                    {activeAnalysis.confidence_score ? `${Math.round(activeAnalysis.confidence_score * 100)}%` : "N/A"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {activeAnalysis.notes && (
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-light)] text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)] block mb-1">Visual Analysis Notes:</span>
                    {activeAnalysis.notes}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-[var(--text-secondary)]">
                    <span className="font-bold text-emerald-400 block mb-2 text-sm">🌿 Organic Treatments (Safe/Eco)</span>
                    <p className="whitespace-pre-line leading-relaxed">{activeAnalysis.organic_treatment || "No organic treatments listed."}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/20 text-xs text-[var(--text-secondary)]">
                    <span className="font-bold text-orange-400 block mb-2 text-sm">🧪 Chemical Treatment Guidelines</span>
                    <p className="whitespace-pre-line leading-relaxed">{activeAnalysis.chemical_treatment || "No chemical treatments recommended."}</p>
                  </div>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Diagnostic History */}
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Recent Diagnostic Scans</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded-lg" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">No previous diagnostic scans found.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[450px]">
                {history.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)]/20 hover:border-[var(--color-primary-light)] transition-all cursor-pointer"
                    onClick={() => setActiveAnalysis(record)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">
                          {record.disease_detected || "Unknown Disease"}
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">
                          Scanned: {new Date(record.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--color-primary-light)] border border-[var(--border-light)] font-bold">
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
