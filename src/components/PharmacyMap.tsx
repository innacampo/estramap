import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import type { Tables } from "@/integrations/supabase/types";

type PharmacyReport = Tables<"pharmacy_reports">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
      transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });

const createHighlightedIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 0 0 4px ${color}33, 0 4px 16px rgba(0,0,0,0.3);
      transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    "></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });

const IN_STOCK_COLOR = "hsl(152, 60%, 38%)";
const LOW_STOCK_COLOR = "hsl(38, 92%, 50%)";
const OUT_OF_STOCK_COLOR = "hsl(0, 72%, 51%)";

function MarkerItem({ report, isHighlighted, onHover }: { report: PharmacyReport; isHighlighted: boolean; onHover: (id: string | null) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const color = report.status === "in-stock" ? IN_STOCK_COLOR : report.status === "out-of-stock" ? OUT_OF_STOCK_COLOR : LOW_STOCK_COLOR;
  const icon = isHighlighted ? createHighlightedIcon(color) : createIcon(color);

  useEffect(() => {
    if (isHighlighted && markerRef.current) markerRef.current.openPopup();
  }, [isHighlighted]);

  if (report.lat == null || report.lng == null) return null;

  return (
    <Marker
      ref={markerRef}
      position={[report.lat, report.lng]}
      icon={icon}
      eventHandlers={{ mouseover: () => onHover(report.id), mouseout: () => onHover(null) }}
    >
      <Popup>
        <div className="text-sm font-sans">
          <p className="font-semibold text-sm">{report.pharmacy_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{report.medication} {report.dose}</p>
          <p className="text-xs mt-1.5 font-medium">
            {report.status === "in-stock" ? "✅ In Stock" : report.status === "out-of-stock" ? "❌ Out of Stock" : "⚠️ Low Stock"}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

function RecenterMap({ center }: { center: [number, number] | null }) {
  const map = useMap();
  const lastCenter = useRef<string | null>(null);
  useEffect(() => {
    if (!center) { lastCenter.current = null; return; }
    if (isNaN(center[0]) || isNaN(center[1])) return;
    const key = `${center[0]},${center[1]}`;
    if (key !== lastCenter.current) { lastCenter.current = key; map.flyTo(center, 13, { duration: 1.2 }); }
  }, [center, map]);
  return null;
}

function ThemeTileLayer() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const url = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  return (
    <TileLayer
      key={isDark ? "dark" : "light"}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      url={url}
    />
  );
}

interface PharmacyMapProps {
  reports: PharmacyReport[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const PharmacyMap = ({ reports, highlightedId, onHover, userLocation }: PharmacyMapProps) => {
  const defaultCenter: [number, number] = [33.8743, -84.3133];
  const flyTo: [number, number] | null = userLocation ? [userLocation.lat, userLocation.lng] : null;

  return (
    <MapContainer center={defaultCenter} zoom={12} className="h-full w-full" style={{ minHeight: "400px" }} scrollWheelZoom>
      <RecenterMap center={flyTo} />
      <ThemeTileLayer />
      {userLocation && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={200}
          pathOptions={{ color: "hsl(168,55%,32%)", fillColor: "hsl(168,55%,32%)", fillOpacity: 0.2, weight: 2 }}
        />
      )}
      {reports.map((report) => (
        <MarkerItem key={report.id} report={report} isHighlighted={highlightedId === report.id} onHover={onHover} />
      ))}
    </MapContainer>
  );
};

export default PharmacyMap;
