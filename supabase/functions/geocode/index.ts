import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action"); // "search" or "details"
  const query = url.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if Google Places API key is available
  const googleKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

  try {
    if (googleKey && action === "search") {
      return await googleAutocomplete(query, googleKey);
    }
    if (googleKey && action === "details") {
      const placeId = url.searchParams.get("place_id") ?? "";
      return await googlePlaceDetails(placeId, googleKey);
    }

    // Fallback: Nominatim (no CORS issues from server-side)
    if (action === "search") {
      return await nominatimSearch(query);
    }
    if (action === "geocode") {
      return await nominatimGeocode(query);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Geocode function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Google Places ──────────────────────────────────────────────

async function googleAutocomplete(input: string, apiKey: string) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=geocode|establishment&components=country:us&location=33.7833,-84.3333&radius=80000&key=${apiKey}`
  );
  const data = await res.json();
  const predictions = (data.predictions ?? []).map((p: any) => ({
    description: p.description,
    place_id: p.place_id,
    source: "google",
  }));
  return new Response(JSON.stringify(predictions), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function googlePlaceDetails(placeId: string, apiKey: string) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address,geometry&key=${apiKey}`
  );
  const data = await res.json();
  if (data.result) {
    return new Response(
      JSON.stringify({
        formatted_address: data.result.formatted_address,
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify(null), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Nominatim (fallback) ──────────────────────────────────────

async function nominatimSearch(query: string) {
  const params = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    limit: "5",
    q: query,
    countrycodes: "us",
    viewbox: "-85.0,34.3667,-83.6667,33.2",
    bounded: "1",
  });
  const res = await fetch(
    `${NOMINATIM_BASE}/search?${params.toString()}`,
    { headers: { "User-Agent": "EstraMap/1.0 (lovable.app)" } }
  );
  if (!res.ok) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  const predictions = data.map((item) => ({
    description: item.display_name,
    place_id: `nominatim:${item.lat}:${item.lon}:${item.display_name}`,
    source: "nominatim",
  }));
  return new Response(JSON.stringify(predictions), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function nominatimGeocode(query: string) {
  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    q: query,
    countrycodes: "us",
  });
  const res = await fetch(
    `${NOMINATIM_BASE}/search?${params.toString()}`,
    { headers: { "User-Agent": "EstraMap/1.0 (lovable.app)" } }
  );
  if (!res.ok) {
    return new Response(JSON.stringify(null), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const data = await res.json();
  if (data.length > 0) {
    return new Response(
      JSON.stringify({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify(null), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
