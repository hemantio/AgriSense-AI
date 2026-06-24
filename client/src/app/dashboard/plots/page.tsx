"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Map, AlertCircle, Plus, RefreshCw, Trash2, Eye } from "lucide-react";

// Dynamically import map component with no SSR to avoid leaflet browser errors
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-[var(--bg-secondary)] flex items-center justify-center rounded-xl border border-zinc-800">
      <div className="text-center">
        <p className="text-sm text-zinc-500 animate-pulse-soft">Loading Agricultural Map Satellite Data...</p>
      </div>
    </div>
  ),
});

interface Plot {
  id: string;
  farmer_id: string;
  plot_name: string;
  latitude: number | null;
  longitude: number | null;
  coordinates_geojson: string | null;
  approximate_area_acres: number | null;
  soil_type: string | null;
  verification_status: string;
  created_at: string;
}

export default function PlotsPage() {
  const { user } = useAuthStore();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Array<[number, number]>>([]);

  // Form states
  const [plotName, setPlotName] = useState("");
  const [acres, setAcres] = useState("");
  const [soilType, setSoilType] = useState("Clay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isAdmin = user?.role === "admin";

  const fetchPlots = async () => {
    setIsLoading(true);
    try {
      const response = await api.listPlots();
      setPlots(response.data.plots);
    } catch (error) {
      console.error("Error fetching plots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handlePointAdd = (point: [number, number]) => {
    setDrawnPoints((prev) => [...prev, point]);
    toast.success(`Node added at: [${point[0].toFixed(4)}, ${point[1].toFixed(4)}]`);
  };

  const clearDrawing = () => {
    setDrawnPoints([]);
    setIsDrawing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (drawnPoints.length < 3) {
      setFormError("Please define at least 3 points on the map to outline your plot.");
      return;
    }

    setIsSubmitting(true);

    const lats = drawnPoints.map((p) => p[0]);
    const lngs = drawnPoints.map((p) => p[1]);
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    const geojson = {
      type: "Polygon",
      coordinates: [
        [...drawnPoints.map((p) => [p[1], p[0]]), [drawnPoints[0][1], drawnPoints[0][0]]],
      ],
    };

    try {
      await api.createPlot({
        plot_name: plotName,
        latitude: avgLat,
        longitude: avgLng,
        coordinates_geojson: JSON.stringify(geojson),
        approximate_area_acres: parseFloat(acres) || 1.0,
        soil_type: soilType,
      });

      toast.success(`Plot "${plotName}" registered successfully!`);
      setPlotName("");
      setAcres("");
      setSoilType("Clay");
      clearDrawing();
      fetchPlots();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to save plot";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: string, status: "verified" | "rejected") => {
    try {
      await api.verifyPlot(id, status);
      toast.success(`Plot status updated to ${status}`);
      fetchPlots();
    } catch (error) {
      toast.error("Failed to verify plot");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plot?")) return;
    try {
      await api.deletePlot(id);
      toast.success("Plot removed successfully.");
      fetchPlots();
    } catch (error) {
      toast.error("Failed to delete plot");
    }
  };

  const getMapPlots = () => {
    return plots
      .map((p) => {
        try {
          if (!p.coordinates_geojson) return null;
          const geo = JSON.parse(p.coordinates_geojson);
          if (geo.type === "Polygon" && geo.coordinates && geo.coordinates[0]) {
            const coords = geo.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);
            return {
              id: p.id,
              name: p.plot_name,
              boundary_coordinates: coords as Array<[number, number]>,
              is_verified: p.verification_status === "verified",
            };
          }
        } catch (e) {
          console.error(e);
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Farm Plot Management 🗺️
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Geolocate plot boundaries on the satellite map, choose soil types, and request verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plot Listing & Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Create Plot Card */}
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h2 className="text-base font-bold mb-4 text-white">
              {isDrawing ? "📐 Boundary Plotter Active" : "📍 Register New Plot"}
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
                ⚠️ {formError}
              </div>
            )}

            {!isDrawing ? (
              <button
                type="button"
                onClick={() => setIsDrawing(true)}
                className="btn btn-primary w-full shadow-lg shadow-emerald-500/10 cursor-pointer text-zinc-900 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border-0 py-2.5 font-bold text-sm"
              >
                🗺️ Start Boundary Calibration
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Plot Name</label>
                  <input
                    type="text"
                    required
                    value={plotName}
                    onChange={(e) => setPlotName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. North Fields Cotton"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Area (Acres)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={acres}
                      onChange={(e) => setAcres(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                      placeholder="e.g. 2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-1">Soil Type</label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    >
                      <option value="Clay">Clay</option>
                      <option value="Loamy">Loamy</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Silt">Silt</option>
                      <option value="Black Cotton">Black Cotton</option>
                      <option value="Peaty">Peaty</option>
                    </select>
                  </div>
                </div>

                {/* monospaced coordinates logger */}
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg font-mono text-[9px] text-zinc-400 space-y-1 max-h-28 overflow-y-auto">
                  <div className="text-[10px] font-bold text-zinc-500 border-b border-zinc-900 pb-1 mb-1 font-sans">
                    🛰️ PLOTTER COORDINATES (MIN 3 NODES)
                  </div>
                  {drawnPoints.length === 0 ? (
                    <p className="text-zinc-600 italic">No coordinates logged yet.</p>
                  ) : (
                    drawnPoints.map((point, index) => (
                      <p key={index}>
                        Node #{index + 1}: [{point[0].toFixed(5)}, {point[1].toFixed(5)}]
                      </p>
                    ))
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={clearDrawing}
                    className="btn btn-secondary w-1/2 border-zinc-800 hover:border-zinc-700 bg-white/[0.02]"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary w-1/2 cursor-pointer border-0 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-zinc-900 font-bold"
                    disabled={isSubmitting || drawnPoints.length < 3}
                  >
                    {isSubmitting ? "Saving..." : "Save Plot"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Plot List */}
          <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
            <h2 className="text-base font-bold mb-4 text-white">Registered Plots</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-zinc-900/20 rounded-lg" />
                ))}
              </div>
            ) : plots.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No plots registered yet. Click &apos;Start Boundary Calibration&apos; above to map one.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[350px]">
                {plots.map((plot, index) => (
                  <motion.div
                    key={plot.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 transition-colors group relative ${
                      plot.verification_status === "verified"
                        ? "glow-border-emerald"
                        : "glow-border-amber"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-white truncate max-w-[150px]">{plot.plot_name}</h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          📐 {plot.approximate_area_acres || 0} Acres &bull; {plot.soil_type}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                          plot.verification_status === "verified"
                            ? "bg-green-950/40 text-green-400 border border-green-500/20"
                            : plot.verification_status === "rejected"
                            ? "bg-red-950/40 text-red-400 border border-red-500/20"
                            : "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {plot.verification_status}
                      </span>
                    </div>

                    {/* Admin Verification Actions */}
                    {isAdmin && plot.verification_status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleVerify(plot.id, "verified")}
                          className="px-2 py-1 bg-green-900 hover:bg-green-800 text-white rounded text-[10px] transition-colors cursor-pointer"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleVerify(plot.id, "rejected")}
                          className="px-2 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-[10px] transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <div className="mt-3 flex justify-between items-center text-[10px] text-zinc-500">
                      <span>Mapped: {new Date(plot.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDelete(plot.id)}
                        className="text-[var(--color-danger-light)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-0.5" /> Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Leaflet Map Container */}
        <div className="lg:col-span-2">
          <MapComponent
            plots={getMapPlots()}
            isDrawing={isDrawing}
            drawnPoints={drawnPoints}
            onPointAdd={handlePointAdd}
          />
        </div>
      </div>
    </div>
  );
}
