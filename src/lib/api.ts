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
  // Try Express server first (rate-limited + validated)
  if (_serverAvailable !== false) {
    const json = await tryServerJson<PharmacyReport>(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (json !== null) {
      _serverAvailable = true;
      return json;
    }
    _serverAvailable = false;
  }

  // Direct Supabase fallback
  const { data, error } = await supabase
    .from("pharmacy_reports")
    .insert({
      type: report.type as string,
      pharmacy_name: report.pharmacy_name as string,
      medication: report.medication as string,
      dose: report.dose as string,
      status: report.status as string,
      address: (report.address as string) || null,
      website_url: (report.website_url as string) || null,
      notes: (report.notes as string) || null,
      lat: (report.lat as number) ?? null,
      lng: (report.lng as number) ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as PharmacyReport;
}

export async function voteOnReport(
  id: string,
  voteType: "up" | "down",
): Promise<void> {
  // Try Express server first
  if (_serverAvailable !== false) {
    const json = await tryServerJson(`${API_BASE}/reports/${id}/vote`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: voteType }),
    });
    if (json !== null) {
      _serverAvailable = true;
      return;
    }
    _serverAvailable = false;
  }

  // Direct Supabase fallback — increment the appropriate column
  const column = voteType === "up" ? "upvotes" : "downvotes";
  const { data: current, error: fetchErr } = await supabase
    .from("pharmacy_reports")
    .select(column)
    .eq("id", id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const { error: updateErr } = await supabase
    .from("pharmacy_reports")
    .update({ [column]: ((current as Record<string, number>)[column] ?? 0) + 1 })
    .eq("id", id);
  if (updateErr) throw new Error(updateErr.message);
}

// ═══════════════════════════════════════════════════════════════
//  Places — via edge function (bypasses CORS)
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface PlacePrediction {
  description: string;
  place_id: string;
  source?: string;
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
      `${SUPABASE_URL}/functions/v1/geocode?action=search&q=${encodeURIComponent(input)}`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  // Nominatim results encode coords in the place_id
  if (placeId.startsWith("nominatim:")) {
    const parts = placeId.split(":");
    if (parts.length < 4) return null;
    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);
    const formatted_address = parts.slice(3).join(":");
    if (isNaN(lat) || isNaN(lng)) return null;
    return { formatted_address, lat, lng };
  }
  // Google place_id — fetch details via edge function
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/geocode?action=details&place_id=${encodeURIComponent(placeId)}&q=details`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
//  Geocoding (address → lat/lng) — via edge function
// ═══════════════════════════════════════════════════════════════

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/geocode?action=geocode&q=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
