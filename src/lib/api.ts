import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type PharmacyReport = Tables<"pharmacy_reports">;

const API_BASE = "/api";

// ── Server-proxy auto-detection ───────────────────────────────
// null = not checked yet, true = server available, false = use Supabase directly
let _serverAvailable: boolean | null = null;

/** Try a server-proxy fetch. Returns the JSON on success,
 *  or `null` if the server isn't there (HTML / network error). */
async function tryServerJson<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("json")) return null;          // got HTML → no server
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Server error ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    // Network-level failure (server not running)
    if (err instanceof TypeError) return null;
    throw err;                                       // re-throw app errors
  }
}

// ═══════════════════════════════════════════════════════════════
//  Reports
// ═══════════════════════════════════════════════════════════════

export async function fetchReports(): Promise<PharmacyReport[]> {
  // If we already know the server isn't there, go direct
  if (_serverAvailable !== false) {
    const json = await tryServerJson<PharmacyReport[]>(`${API_BASE}/reports`);
    if (json !== null) {
      _serverAvailable = true;
      return json;
    }
    _serverAvailable = false;                        // remember for future calls
  }

  // Direct Supabase fallback
  const { data, error } = await supabase
    .from("pharmacy_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as PharmacyReport[];
}

export async function createReport(
  report: Record<string, unknown>,
): Promise<PharmacyReport> {
  // Writes must go through the Express server (rate-limited + validated).
  // No direct Supabase fallback — that would bypass all protections.
  const json = await tryServerJson<PharmacyReport>(`${API_BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (json !== null) {
    _serverAvailable = true;
    return json;
  }
  throw new Error("Unable to reach the server. Please try again later.");
}

export async function voteOnReport(
  id: string,
  type: "up" | "down",
): Promise<void> {
  // Writes must go through the Express server (rate-limited).
  const json = await tryServerJson(`${API_BASE}/reports/${id}/vote`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (json !== null) {
    _serverAvailable = true;
    return;
  }
  throw new Error("Unable to reach the server. Please try again later.");
}

// ═══════════════════════════════════════════════════════════════
//  Places (Nominatim / OpenStreetMap)
// ═══════════════════════════════════════════════════════════════

export interface PlacePrediction {
  description: string;
  place_id: string;
}

export interface PlaceDetails {
  formatted_address: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(
  input: string,
): Promise<PlacePrediction[]> {
  if (!input.trim()) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(input)}`,
      { headers: { "User-Agent": "EstraMap/1.0" } },
    );
    if (!res.ok) return [];
    const data: Array<{ display_name: string; lat: string; lon: string }> =
      await res.json();
    return data.map((item) => ({
      description: item.display_name,
      place_id: `nominatim:${item.lat}:${item.lon}:${item.display_name}`,
    }));
  } catch {
    return [];
  }
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  if (placeId.startsWith("nominatim:")) {
    const parts = placeId.split(":");
    if (parts.length < 4) return null;
    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);
    const formatted_address = parts.slice(3).join(":");
    if (isNaN(lat) || isNaN(lng)) return null;
    return { formatted_address, lat, lng };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  Geocoding (address → lat/lng)
// ═══════════════════════════════════════════════════════════════

/** Geocode an address string to { lat, lng } via Nominatim. */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { "User-Agent": "EstraMap/1.0" } },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    }
  } catch {
    // give up
  }

  return null;
}
