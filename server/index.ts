import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Validate env ──────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
if (!SUPABASE_ANON_KEY) throw new Error("Missing env: SUPABASE_ANON_KEY");

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
