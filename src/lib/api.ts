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
  if (_serverAvailable) {
    const json = await tryServerJson<PharmacyReport>(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (json !== null) return json;
  }

  const { data, error } = await supabase
    .from("pharmacy_reports")
    .insert(report as Tables<"pharmacy_reports">)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as PharmacyReport;
}

export async function voteOnReport(
  id: string,
  type: "up" | "down",
): Promise<void> {
  if (_serverAvailable) {
    const json = await tryServerJson(`${API_BASE}/reports/${id}/vote`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (json !== null) return;
  }

  const field = type === "up" ? "upvotes" : "downvotes";
  const { data: report, error: fetchErr } = await supabase
    .from("pharmacy_reports")
    .select("upvotes, downvotes")
    .eq("id", id)
    .single();
  if (fetchErr || !report) throw new Error("Report not found");
  const { error } = await supabase
    .from("pharmacy_reports")
    .update({ [field]: ((report as Record<string, number>)[field] ?? 0) + 1 })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════════
//  Google Places
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

  // Try server proxy first (if not already known to be unavailable)
  if (_serverAvailable !== false) {
    try {
      const res = await fetch(
        `${API_BASE}/places/autocomplete?input=${encodeURIComponent(input)}`,
      );
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("json") && res.ok) {
        _serverAvailable = true;
        const data = await res.json();
        return (data.predictions as PlacePrediction[]) ?? [];
      }
      if (!ct.includes("json")) _serverAvailable = false;
    } catch {
      _serverAvailable = false;
    }
  }

  // Fall back to Google Maps JS API (loaded via script tag in main.tsx)
  return googleAutocomplete(input);
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  if (_serverAvailable !== false) {
    try {
      const res = await fetch(
        `${API_BASE}/places/details?place_id=${encodeURIComponent(placeId)}`,
      );
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("json") && res.ok) {
        _serverAvailable = true;
        const data = await res.json();
        const result = data.result;
        if (result?.geometry?.location) {
          return {
            formatted_address: result.formatted_address,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          };
        }
      }
      if (!ct.includes("json")) _serverAvailable = false;
    } catch {
      _serverAvailable = false;
    }
  }

  return googlePlaceDetails(placeId);
}

// ═══════════════════════════════════════════════════════════════
//  Geocoding (address → lat/lng)
// ═══════════════════════════════════════════════════════════════

/** Geocode an address string to { lat, lng }.
 *  Tries: 1) server proxy, 2) Google client-side Geocoder, 3) Nominatim (OSM). */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;

  // 1) Server proxy (Google Geocoding)
  if (_serverAvailable) {
    try {
      const res = await fetch(
        `${API_BASE}/places/geocode?address=${encodeURIComponent(address)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.lat != null && data.lng != null) {
          return { lat: data.lat, lng: data.lng };
        }
      }
    } catch {
      // fall through
    }
  }

  // 2) Google Maps JS Geocoder (if loaded)
  if (typeof google !== "undefined" && google.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<{ lat: number; lng: number } | null>(
        (resolve) => {
          geocoder.geocode({ address }, (results, status) => {
            if (
              status === google.maps.GeocoderStatus.OK &&
              results?.[0]?.geometry?.location
            ) {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
              });
            } else {
              resolve(null);
            }
          });
        },
      );
      if (result) return result;
    } catch {
      // fall through
    }
  }

  // 3) Nominatim (OpenStreetMap) — no API key needed
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

// ── Google Maps JS helpers (direct / lovable mode) ─────────────

let autocompleteService: google.maps.places.AutocompleteService | null = null;
let placesService: google.maps.places.PlacesService | null = null;

function getAutocompleteService(): google.maps.places.AutocompleteService | null {
  if (autocompleteService) return autocompleteService;
  if (typeof google === "undefined" || !google.maps?.places) return null;
  autocompleteService = new google.maps.places.AutocompleteService();
  return autocompleteService;
}

function getPlacesService(): google.maps.places.PlacesService | null {
  if (placesService) return placesService;
  if (typeof google === "undefined" || !google.maps?.places) return null;
  const div = document.createElement("div");
  placesService = new google.maps.places.PlacesService(div);
  return placesService;
}

function googleAutocomplete(input: string): Promise<PlacePrediction[]> {
  const svc = getAutocompleteService();
  if (!svc) return Promise.resolve([]);

  return new Promise((resolve) => {
    svc.getPlacePredictions(
      { input, types: ["address"] },
      (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(
          predictions.map((p) => ({
            description: p.description,
            place_id: p.place_id,
          })),
        );
      },
    );
  });
}

function googlePlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const svc = getPlacesService();
  if (!svc) return Promise.resolve(null);

  return new Promise((resolve) => {
    svc.getDetails(
      { placeId, fields: ["formatted_address", "geometry"] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          resolve(null);
          return;
        }
        resolve({
          formatted_address: place.formatted_address ?? "",
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      },
    );
  });
}
