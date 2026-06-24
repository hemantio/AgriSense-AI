"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon marker in Next.js
const initLeafletMarkerIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

interface MapComponentProps {
  plots: Array<{
    id: string;
    name: string;
    boundary_coordinates: Array<[number, number]>;
    is_verified: boolean;
  }>;
  isDrawing: boolean;
  drawnPoints: Array<[number, number]>;
  onPointAdd: (point: [number, number]) => void;
  center?: [number, number];
}

function MapEventsHandler({
  isDrawing,
  onPointAdd,
}: {
  isDrawing: boolean;
  onPointAdd: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onPointAdd([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export default function MapComponent({
  plots,
  isDrawing,
  drawnPoints,
  onPointAdd,
  center = [20.5937, 78.9629], // Default center to India
}: MapComponentProps) {
  useEffect(() => {
    initLeafletMarkerIcon();
  }, []);

  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  // If there are existing plots, center on the first one
  useEffect(() => {
    if (plots.length > 0 && plots[0].boundary_coordinates?.length > 0) {
      setMapCenter(plots[0].boundary_coordinates[0]);
    }
  }, [plots]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-[var(--border-color)] relative" style={{ minHeight: "450px" }}>
      <MapContainer
        center={mapCenter}
        zoom={plots.length > 0 ? 14 : 5}
        style={{ width: "100%", height: "100%", zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draw Map Click Handler */}
        <MapEventsHandler isDrawing={isDrawing} onPointAdd={onPointAdd} />

        {/* Existing plots */}
        {plots.map((plot) => {
          if (!plot.boundary_coordinates || plot.boundary_coordinates.length < 3) return null;
          return (
            <Polygon
              key={plot.id}
              positions={plot.boundary_coordinates}
              pathOptions={{
                color: plot.is_verified ? "var(--color-success)" : "var(--color-warning)",
                fillColor: plot.is_verified ? "var(--color-success)" : "var(--color-warning)",
                fillOpacity: 0.3,
                weight: 2,
              }}
            />
          );
        })}

        {/* Points currently being drawn */}
        {drawnPoints.map((point, index) => (
          <Marker key={index} position={point} />
        ))}

        {/* Polygon for the shape being drawn */}
        {drawnPoints.length >= 3 && (
          <Polygon
            positions={drawnPoints}
            pathOptions={{
              color: "var(--color-primary-light)",
              fillColor: "var(--color-primary-light)",
              fillOpacity: 0.4,
              dashArray: "5, 5",
            }}
          />
        )}
      </MapContainer>

      {isDrawing && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur border border-[var(--border-color)] p-2.5 rounded-lg text-xs text-[var(--text-secondary)] shadow-lg animate-pulse-soft">
          📍 Tap on the map to define plot boundary vertices (min 3 points).
        </div>
      )}
    </div>
  );
}
