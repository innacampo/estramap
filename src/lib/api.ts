import type { Tables } from "@/integrations/supabase/types";

type PharmacyReport = Tables<"pharmacy_reports">;

const API_BASE = "/api";

// ── Reports ────────────────────────────────────────────────────

export async function fetchReports(): Promise<PharmacyReport[]> {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function createReport(
  report: Record<string, unknown>,
): Promise<PharmacyReport> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create report");
  }
  return res.json();
}

export async function voteOnReport(
  id: string,
  type: "up" | "down",
): Promise<void> {
  const res = await fetch(`${API_BASE}/reports/${id}/vote`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) throw new Error("Failed to vote");
}

// ── Google Places (proxied through our server) ─────────────────

export interface PlacePrediction {
  description: string;
  place_id: string;
}

export async function searchPlaces(
  input: string,
): Promise<PlacePrediction[]> {
  if (!input.trim()) return [];
  const res = await fetch(
    `${API_BASE}/places/autocomplete?input=${encodeURIComponent(input)}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.predictions as PlacePrediction[]) ?? [];
}

export interface PlaceDetails {
  formatted_address: string;
  lat: number;
  lng: number;
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  const res = await fetch(
    `${API_BASE}/places/details?place_id=${encodeURIComponent(placeId)}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  const result = data.result;
  if (!result?.geometry?.location) return null;
  return {
    formatted_address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  };
}
