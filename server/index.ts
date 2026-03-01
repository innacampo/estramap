import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Validate env ──────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_MAPS_API_KEY } = process.env;

if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
if (!SUPABASE_ANON_KEY) throw new Error("Missing env: SUPABASE_ANON_KEY");
if (!GOOGLE_MAPS_API_KEY) throw new Error("Missing env: GOOGLE_MAPS_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
app.use(express.json());

// ── Reports API ───────────────────────────────────────────────

app.get("/api/reports", async (_req, res) => {
  const { data, error } = await supabase
    .from("pharmacy_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/reports", async (req, res) => {
  const { type, pharmacy_name, address, website_url, medication, dose, status, notes, lat, lng } =
    req.body;

  if (!type || !pharmacy_name || !medication || !dose || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { data, error } = await supabase
    .from("pharmacy_reports")
    .insert({ type, pharmacy_name, address, website_url, medication, dose, status, notes, lat, lng })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch("/api/reports/:id/vote", async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  if (type !== "up" && type !== "down") {
    return res.status(400).json({ error: 'type must be "up" or "down"' });
  }

  const { data: report, error: fetchError } = await supabase
    .from("pharmacy_reports")
    .select("upvotes, downvotes")
    .eq("id", id)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!report) return res.status(404).json({ error: "Report not found" });

  const field = type === "up" ? "upvotes" : "downvotes";
  const currentVal = (report as Record<string, number>)[field] ?? 0;

  const { error: updateError } = await supabase
    .from("pharmacy_reports")
    .update({ [field]: currentVal + 1 })
    .eq("id", id);

  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json({ success: true });
});

// ── Google Places Proxy ───────────────────────────────────────

app.get("/api/places/autocomplete", async (req, res) => {
  const input = req.query.input as string | undefined;
  if (!input?.trim()) return res.json({ predictions: [] });

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("types", "address");
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Places autocomplete failed" });
  }
});

app.get("/api/places/details", async (req, res) => {
  const placeId = req.query.place_id as string | undefined;
  if (!placeId) return res.status(400).json({ error: "place_id required" });

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "formatted_address,geometry");
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Place details lookup failed" });
  }
});

app.get("/api/places/geocode", async (req, res) => {
  const address = req.query.address as string | undefined;
  if (!address?.trim()) return res.status(400).json({ error: "address required" });

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();
    const loc = data.results?.[0]?.geometry?.location;
    if (loc) {
      res.json({ lat: loc.lat, lng: loc.lng });
    } else {
      res.json({ lat: null, lng: null });
    }
  } catch {
    res.status(500).json({ error: "Geocoding failed" });
  }
});

// ── Static files (production) ─────────────────────────────────

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── Start ─────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3001", 10);
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
