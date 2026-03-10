import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type PharmacyReport = Tables<"pharmacy_reports">;

// ═══════════════════════════════════════════════════════════════
//  Reports
// ═══════════════════════════════════════════════════════════════

export async function fetchReports(): Promise<PharmacyReport[]> {
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
  const { data, error } = await supabase.rpc("create_report", {
    p_type: report.type as string,
    p_pharmacy_name: report.pharmacy_name as string,
    p_medication: report.medication as string,
    p_dose: report.dose as string,
    p_status: report.status as string,
    p_address: (report.address as string) || null,
    p_website_url: (report.website_url as string) || null,
    p_notes: (report.notes as string) || null,
    p_lat: (report.lat as number) ?? null,
    p_lng: (report.lng as number) ?? null,
  });
  if (error) throw new Error(error.message);
  const rows = data as unknown as PharmacyReport[];
  return rows[0];
}

export async function voteOnReport(
  id: string,
  voteType: "up" | "down",
): Promise<void> {
  const { error } = await supabase.rpc("vote_report", {
    report_id: id,
    vote_type: voteType,
  });
  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════════
//  Places — via edge function (bypasses CORS)
// ═══════════════════════════════════════════════════════════════

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

async function invokeGeocode<T>(payload: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke("geocode", {
      body: payload,
    });
    if (error) return null;
    return (data ?? null) as T | null;
  } catch {
    return null;
  }
}

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
  const query = input.trim();
  if (!query) return [];

  const data = await invokeGeocode<unknown>({ action: "search", q: query });
  if (!Array.isArray(data)) return [];

  return data.filter((item): item is PlacePrediction => {
    if (!isRecord(item)) return false;
    return typeof item.description === "string" && typeof item.place_id === "string";
  });
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
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { formatted_address, lat, lng };
  }

  const data = await invokeGeocode<unknown>({ action: "details", place_id: placeId });
  if (!isRecord(data)) return null;

  const lat = typeof data.lat === "number" ? data.lat : NaN;
  const lng = typeof data.lng === "number" ? data.lng : NaN;
  const formattedAddress = typeof data.formatted_address === "string" ? data.formatted_address : "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !formattedAddress) return null;
  return { formatted_address: formattedAddress, lat, lng };
}

// ═══════════════════════════════════════════════════════════════
//  Geocoding (address → lat/lng) — via edge function
// ═══════════════════════════════════════════════════════════════

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = address.trim();
  if (!query) return null;

  const data = await invokeGeocode<unknown>({ action: "geocode", q: query });
  if (!isRecord(data)) return null;

  const lat = typeof data.lat === "number" ? data.lat : NaN;
  const lng = typeof data.lng === "number" ? data.lng : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}
