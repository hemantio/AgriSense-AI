"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Shield, ShieldCheck, ShieldAlert, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

// Dynamically import MapComponent with no SSR
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[240px] bg-zinc-950 flex items-center justify-center rounded-xl border border-zinc-900">
      <p className="text-[10px] text-zinc-500 font-mono animate-pulse-soft">Loading Satellites Map...</p>
    </div>
  ),
});

interface Plot {
  id: string;
  plot_name: string;
  latitude: number | null;
  longitude: number | null;
  coordinates_geojson: string | null;
  approximate_area_acres: number | null;
  soil_type: string | null;
  verification_status: string;
}

export default function FarmerPlots() {
  const { user } = useAuthStore();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Array<[number, number]>>([]);

  // Form states
  const [plotName, setPlotName] = useState("");
  const [acres, setAcres] = useState("");
  const [soilType, setSoilType] = useState("Clay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPlots = async () => {
    setLoading(true);
    try {
      const response = await api.listPlots();
      setPlots(response.data.plots || []);
    } catch (error) {
      console.error("Error fetching plots:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handlePointAdd = (point: [number, number]) => {
    setDrawnPoints((prev) => [...prev, point]);
    toast.success(`Boundary node added.`);
  };

  const handleClearDrawing = () => {
    setDrawnPoints([]);
    setIsDrawing(false);
    setFormError("");
  };

  const handleSubmitPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!plotName.trim()) {
      setFormError("Please enter a field name.");
      return;
    }
    if (drawnPoints.length < 3) {
      setFormError("Tap the map to mark at least 3 corner boundary points.");
      return;
    }

    setIsSubmitting(true);

    // Compute average lat/lng as center point
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
        approximate_area_acres: parseFloat(acres) || 1.0,
        soil_type: soilType,
        coordinates_geojson: JSON.stringify(geojson),
      });

      toast.success("Field plot registered successfully!");
      setPlotName("");
      setAcres("");
      setSoilType("Clay");
      setDrawnPoints([]);
      setIsDrawing(false);
      fetchPlots();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to register field plot. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this field plot?")) return;
    try {
      await api.deletePlot(id);
      toast.success("Field plot deleted.");
      fetchPlots();
    } catch {
      toast.error("Failed to delete plot.");
    }
  };

  // Convert database plots into coordinates for MapComponent
  const mapPlots = plots
    .filter((p) => p.coordinates_geojson)
    .map((p) => {
      try {
        const parsed = JSON.parse(p.coordinates_geojson!);
        // GeoJSON coordinates are [lng, lat]
        const ring = parsed.coordinates[0];
        const coords = ring.map((pt: any) => [pt[1], pt[0]] as [number, number]);
        return {
          id: p.id,
          name: p.plot_name,
          boundary_coordinates: coords,
          is_verified: p.verification_status === "verified",
        };
      } catch {
        return null;
      }
    })
    .filter((p) => p !== null) as any[];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/farmer" className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-white">Registered Fields</h1>
          <p className="text-[10px] text-zinc-500">View and mark field boundaries on satellite maps</p>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="space-y-3">
        <div className="h-[260px] rounded-2xl overflow-hidden border border-zinc-900 relative shadow-inner">
          <MapComponent
            plots={mapPlots}
            isDrawing={isDrawing}
            drawnPoints={drawnPoints}
            onPointAdd={handlePointAdd}
            center={plots.length > 0 && plots[0].latitude && plots[0].longitude ? [plots[0].latitude, plots[0].longitude] : undefined}
          />

          {isDrawing && (
            <div className="absolute top-3 left-3 right-3 z-30 bg-[#030303]/90 border border-zinc-800 p-2.5 rounded-xl text-[10px] text-zinc-300 font-mono flex items-center justify-between">
              <span>Outline mode active. Tap on the map to add boundary points.</span>
              <button 
                onClick={handleClearDrawing} 
                className="p-1 text-red-400 hover:bg-zinc-900 rounded cursor-pointer"
                title="Cancel Drawing"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Map Drawing Controls */}
        {!isDrawing ? (
          <button
            onClick={() => setIsDrawing(true)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-zinc-850 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#10b981]" /> Add New Field Plot
          </button>
        ) : (
          <div className="text-[10px] text-zinc-500 text-center font-mono">
            {drawnPoints.length} points placed. Mark at least 3 points, then fill out the form below.
          </div>
        )}
      </div>

      {/* Drawing Form details */}
      {isDrawing && (
        <form onSubmit={handleSubmitPlot} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">New Field Details</h3>

          {formError && (
            <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-medium">
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono block mb-1">Field/Plot Name</label>
            <input
              type="text"
              value={plotName}
              onChange={(e) => setPlotName(e.target.value)}
              placeholder="e.g. North Wheat field"
              className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-lg p-2.5 text-xs outline-none focus:border-[#34d399] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono block mb-1">Area (Acres)</label>
              <input
                type="number"
                step="0.01"
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-lg p-2.5 text-xs outline-none focus:border-[#34d399] transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono block mb-1">Soil Type</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-lg p-2.5 text-xs outline-none focus:border-[#34d399] transition-colors"
              >
                <option value="Clay">Clay</option>
                <option value="Silt">Silt</option>
                <option value="Sand">Sand</option>
                <option value="Loam">Loam</option>
                <option value="Peat">Peat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearDrawing}
              className="py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 bg-[#10b981] hover:bg-[#34d399] text-zinc-950 text-xs font-bold rounded-xl cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Field"}
            </button>
          </div>
        </form>
      )}

      {/* Field Registry List */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Registry Ledger</span>
        
        {loading && plots.length === 0 ? (
          <p className="text-[10px] text-zinc-500 font-mono text-center py-4">Syncing registry...</p>
        ) : plots.length === 0 ? (
          <p className="text-[10px] text-zinc-500 font-mono text-center py-4">No fields registered yet.</p>
        ) : (
          plots.map((plot) => (
            <div key={plot.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-white">{plot.plot_name}</h4>
                <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px] text-zinc-500">
                  <span>Soil: {plot.soil_type || "N/A"}</span>
                  <span>•</span>
                  <span>Area: {plot.approximate_area_acres || 0} Acres</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Verification indicator */}
                {plot.verification_status === "verified" ? (
                  <span className="text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded flex items-center gap-1 text-[9px] font-mono font-bold" title="Verified Plot">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                ) : plot.verification_status === "rejected" ? (
                  <span className="text-red-400 bg-red-500/5 px-2 py-0.5 border border-red-500/10 rounded flex items-center gap-1 text-[9px] font-mono font-bold" title="Rejected Plot">
                    <ShieldAlert className="w-3 h-3" /> REJECTED
                  </span>
                ) : (
                  <span className="text-amber-400 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded flex items-center gap-1 text-[9px] font-mono font-bold" title="Pending Verification">
                    <Shield className="w-3 h-3 animate-pulse" /> PENDING
                  </span>
                )}
                
                <button
                  onClick={() => handleDeletePlot(plot.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete Plot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
