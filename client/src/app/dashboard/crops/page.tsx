"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Crop {
  id: string;
  plot_id: string;
  plot_name?: string;
  crop_name: string;
  seed_variety?: string;
  seed_brand?: string;
  sowing_date?: string;
  expected_harvest_date?: string;
  crop_stage: string;
  description?: string;
  created_at: string;
}

interface Plot {
  id: string;
  plot_name: string;
  verification_status: string;
}

const STAGES = ["sowing", "vegetative", "flowering", "maturity", "harvesting"];

export default function CropsPage() {
  const { user } = useAuthStore();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState("");
  const [cropName, setCropName] = useState("");
  const [seedVariety, setSeedVariety] = useState("");
  const [seedBrand, setSeedBrand] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCropsAndPlots = async () => {
    setIsLoading(true);
    try {
      const [cropsRes, plotsRes] = await Promise.all([
        api.listCrops(),
        api.listPlots(),
      ]);

      // Map plot names to crops
      const plotMap = new Map(plotsRes.data.plots.map((p: Plot) => [p.id, p.plot_name]));
      const mappedCrops = cropsRes.data.crops.map((c: Crop) => ({
        ...c,
        plot_name: plotMap.get(c.plot_id) || "Unknown Plot",
      }));

      setCrops(mappedCrops);
      // Only allow sowing on verified plots
      setPlots(plotsRes.data.plots.filter((p: Plot) => p.verification_status === "verified"));
    } catch (error) {
      console.error("Error fetching crop info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCropsAndPlots();
  }, []);

  const handleStageUpdate = async (id: string, currentStage: string) => {
    const currentIndex = STAGES.indexOf(currentStage.toLowerCase());
    if (currentIndex === -1 || currentIndex === STAGES.length - 1) return;
    
    const nextStage = STAGES[currentIndex + 1];
    try {
      await api.updateCrop(id, { crop_stage: nextStage });
      toast.success(`Crop advanced to: ${nextStage}`);
      fetchCropsAndPlots();
    } catch (error) {
      toast.error("Failed to update crop growth stage.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedPlot) {
      setFormError("Please select a verified plot for this crop.");
      toast.error("Please select a verified plot.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createCrop({
        plot_id: selectedPlot,
        crop_name: cropName,
        seed_variety: seedVariety || undefined,
        seed_brand: seedBrand || undefined,
        sowing_date: sowingDate || undefined,
        expected_harvest_date: harvestDate || undefined,
        crop_stage: "sowing",
        description: description || undefined,
      });

      toast.success(`Crop "${cropName}" logged successfully!`);
      // Reset
      setSelectedPlot("");
      setCropName("");
      setSeedVariety("");
      setSeedBrand("");
      setSowingDate("");
      setHarvestDate("");
      setDescription("");
      setIsModalOpen(false);
      fetchCropsAndPlots();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to log crop details";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStagePercentage = (stage: string) => {
    const index = STAGES.indexOf(stage.toLowerCase());
    if (index === -1) return 0;
    return Math.round(((index + 1) / STAGES.length) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Crop Lifecycle Tracking 🌾
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Monitor crop growth phases, record varieties, and optimize harvesting timelines.
          </p>
        </div>
        <button
          onClick={() => {
            if (plots.length === 0) {
              alert("You must map at least one plot and have it verified by an admin before planting crops!");
              return;
            }
            setIsModalOpen(true);
          }}
          className="btn btn-primary self-start sm:self-center"
        >
          🌱 Log New Crop Planting
        </button>
      </div>

      {/* Crops List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 h-64 animate-pulse bg-[var(--bg-secondary)]/50" />
          ))}
        </div>
      ) : crops.length === 0 ? (
        <div className="glass-card p-12 text-center text-[var(--text-secondary)]">
          <p className="text-lg font-medium">No crops currently planted.</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Register a new sowing log on a verified plot to start monitoring growth.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {crops.map((crop, index) => {
            const currentStageIndex = STAGES.indexOf(crop.crop_stage.toLowerCase());
            return (
              <motion.div
                key={crop.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className="glass-card p-6 flex flex-col justify-between group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 gradient-accent opacity-5 blur-3xl pointer-events-none" />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-[var(--text-primary)]">{crop.crop_name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Plot: {crop.plot_name}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize gradient-accent text-white">
                      {crop.crop_stage}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-[var(--text-secondary)] mb-6">
                    <div>
                      <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Seed Variety</p>
                      <p className="font-medium mt-0.5">{crop.seed_variety || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Seed Brand</p>
                      <p className="font-medium mt-0.5">{crop.seed_brand || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Sowing Date</p>
                      <p className="font-medium mt-0.5">
                        {crop.sowing_date ? new Date(crop.sowing_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">Exp. Harvest</p>
                      <p className="font-medium mt-0.5 text-[var(--color-accent-warm)]">
                        {crop.expected_harvest_date ? new Date(crop.expected_harvest_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Growth Progress Bar */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                      <span>Growth Progress</span>
                      <span className="font-bold">{getStagePercentage(crop.crop_stage)}%</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] h-2 rounded-full overflow-hidden border border-[var(--border-light)]">
                      <div
                        className="gradient-accent h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getStagePercentage(crop.crop_stage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex justify-between items-center gap-1">
                    {STAGES.map((s, idx) => (
                      <div key={s} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border text-[8px] transition-all duration-300 ${
                            idx <= currentStageIndex
                              ? "bg-[var(--color-primary-light)] border-[var(--color-primary-light)] text-white scale-105"
                              : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]"
                          }`}
                        >
                          {idx < currentStageIndex ? "✓" : idx + 1}
                        </div>
                        <span className="text-[9px] capitalize mt-1 text-[var(--text-muted)] hidden sm:inline">
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update Stage CTA */}
                {currentStageIndex < STAGES.length - 1 && (
                  <div className="mt-6 pt-4 border-t border-[var(--border-light)] flex justify-end">
                    <button
                      onClick={() => handleStageUpdate(crop.id, crop.crop_stage)}
                      className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-primary-light)] hover:text-white rounded-lg text-xs transition-all duration-200"
                    >
                      Advance to Next Stage &rarr;
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Planting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Log Sowing Activity</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl text-[var(--text-secondary)] hover:text-white">&times;</button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Select Farm Plot</label>
                <select
                  required
                  value={selectedPlot}
                  onChange={(e) => setSelectedPlot(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                >
                  <option value="">-- Choose a Verified Plot --</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>{p.plot_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Crop Name</label>
                <input
                  type="text"
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  placeholder="e.g. Wheat, Basmati Rice, Cotton"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Seed Variety</label>
                  <input
                    type="text"
                    value={seedVariety}
                    onChange={(e) => setSeedVariety(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. HD-2967"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Seed Brand</label>
                  <input
                    type="text"
                    value={seedBrand}
                    onChange={(e) => setSeedBrand(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. Mahyco, Pioneer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  placeholder="Soil dampness level, organic manure added, custom watering cycles..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Log Sowing Event"}
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
