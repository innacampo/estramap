import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import type { Tables } from "@/integrations/supabase/types";

type PharmacyReport = Tables<"pharmacy_reports">;

// Fix default marker icons in leaflet + bundlers
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
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

const createHighlightedIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 0 0 4px ${color}44, 0 2px 12px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      transition:all 0.2s;
    "></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

const IN_STOCK_COLOR = "hsl(152, 60%, 40%)";
const LOW_STOCK_COLOR = "hsl(38, 92%, 50%)";
const OUT_OF_STOCK_COLOR = "hsl(0, 72%, 51%)";

function MarkerItem({
  report,
  isHighlighted,
  onHover,
}: {
  report: PharmacyReport;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const color =
    report.status === "in-stock"
      ? IN_STOCK_COLOR
      : report.status === "out-of-stock"
        ? OUT_OF_STOCK_COLOR
        : LOW_STOCK_COLOR;
  const icon = isHighlighted ? createHighlightedIcon(color) : createIcon(color);

  useEffect(() => {
    if (isHighlighted && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isHighlighted]);

  if (report.lat == null || report.lng == null) return null;

  return (
    <Marker
      ref={markerRef}
      position={[report.lat, report.lng]}
      icon={icon}
      eventHandlers={{
        mouseover: () => onHover(report.id),
        mouseout: () => onHover(null),
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-semibold">{report.pharmacy_name}</p>
          <p>{report.medication} {report.dose}</p>
          <p className="text-xs mt-1">
            {report.status === "in-stock"
              ? "✅ In Stock"
              : report.status === "out-of-stock"
                ? "❌ Out of Stock"
                : "⚠️ Low Stock"}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

/** Imperatively fly/pan the map when `center` changes */
function RecenterMap({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

interface PharmacyMapProps {
  reports: PharmacyReport[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
}

/** Swap tile layer when theme changes */
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

const PharmacyMap = ({ reports, highlightedId, onHover, userLocation }: PharmacyMapProps) => {
  const defaultCenter: [number, number] = [33.8743, -84.3133];
  const flyTo: [number, number] | null = userLocation
    ? [userLocation.lat, userLocation.lng]
    : null;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      className="h-full w-full rounded-lg"
      style={{ minHeight: "400px" }}
      scrollWheelZoom
    >
      <RecenterMap center={flyTo} />
      <ThemeTileLayer />

      {userLocation && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={200}
          pathOptions={{ color: "hsl(221,83%,53%)", fillColor: "hsl(221,83%,53%)", fillOpacity: 0.3, weight: 2 }}
        />
      )}

      {reports.map((report) => (
        <MarkerItem
          key={report.id}
          report={report}
          isHighlighted={highlightedId === report.id}
          onHover={onHover}
        />
      ))}
    </MapContainer>
  );
};

export default PharmacyMap;