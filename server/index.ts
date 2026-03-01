import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
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

// Trust first proxy (nginx / cloud LB) so req.ip is the real client IP
app.set("trust proxy", 1);

app.use(express.json({ limit: "16kb" }));

// ── Rate limiters ─────────────────────────────────────────────

/** Read endpoints – generous limit */
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 60,                    // 60 requests / min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests – please try again later" },
});

/** Write endpoints – tighter limit */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                   // 10 reports / 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reports submitted – please slow down" },
});

/** Vote endpoint – prevent vote-spam */
const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 30,                   // 30 votes / min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many votes – please slow down" },
});

// ── Error handling ────────────────────────────────────────────

/** Map of known safe Supabase error patterns → client-facing messages.
 *  Anything not matched gets a generic 500 response. */
const SAFE_ERROR_PATTERNS: Array<{ test: RegExp | string; status: number; message: string }> = [
  { test: "Too many reports",              status: 429, message: "Too many reports submitted recently. Please try again later." },
  { test: "Report",                        status: 404, message: "Report not found." },
  { test: 'vote_type must be',             status: 400, message: 'vote_type must be "up" or "down".' },
];

interface SafeError { status: number; message: string }

/** Log the raw Supabase error, return a sanitised message for the client. */
function sanitizeDbError(err: { message: string; code?: string; details?: string }, context: string): SafeError {
  // Always log the full error server-side for debugging
  console.error(`[${context}]`, { message: err.message, code: err.code, details: err.details });

  for (const pattern of SAFE_ERROR_PATTERNS) {
    const matches = typeof pattern.test === "string"
      ? err.message.includes(pattern.test)
      : pattern.test.test(err.message);
    if (matches) return { status: pattern.status, message: pattern.message };
  }

  return { status: 500, message: "An unexpected error occurred. Please try again later." };
}

// ── Reports API ───────────────────────────────────────────────

app.get("/api/reports", readLimiter, async (_req, res) => {
  const { data, error } = await supabase
    .from("pharmacy_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    const safe = sanitizeDbError(error, "GET /api/reports");
    return res.status(safe.status).json({ error: safe.message });
  }
  res.json(data);
});

// ── Validation helpers ────────────────────────────────────────

const VALID_TYPES = new Set(["local", "online"]);
const VALID_STATUSES = new Set(["in-stock", "low-stock", "out-of-stock"]);

const MAX_LEN = {
  pharmacy_name: 200,
  address: 300,
  website_url: 500,
  medication: 200,
  dose: 100,
  notes: 2000,
} as const;

/** Trim and collapse internal whitespace; return null for empty strings. */
function clean(value: unknown, maxLen: number): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// ── POST /api/reports ─────────────────────────────────────────

app.post("/api/reports", writeLimiter, async (req, res) => {
  const body = req.body;
  if (body == null || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const errors: string[] = [];

  // --- type (required, enum) ---
  const type = clean(body.type, 10);
  if (!type || !VALID_TYPES.has(type)) {
    errors.push('type must be "local" or "online"');
  }

  // --- pharmacy_name (required) ---
  const pharmacy_name = clean(body.pharmacy_name, MAX_LEN.pharmacy_name);
  if (!pharmacy_name) {
    errors.push("pharmacy_name is required (max 200 chars)");
  }

  // --- medication (required) ---
  const medication = clean(body.medication, MAX_LEN.medication);
  if (!medication) {
    errors.push("medication is required (max 200 chars)");
  }

  // --- dose (required) ---
  const dose = clean(body.dose, MAX_LEN.dose);
  if (!dose) {
    errors.push("dose is required (max 100 chars)");
  }

  // --- status (required, enum) ---
  const status = clean(body.status, 20);
  if (!status || !VALID_STATUSES.has(status)) {
    errors.push('status must be "in-stock", "low-stock", or "out-of-stock"');
  }

  // --- address (optional, string) ---
  const address = clean(body.address, MAX_LEN.address);

  // --- website_url (optional, must be valid http(s) URL) ---
  const website_url = clean(body.website_url, MAX_LEN.website_url);
  if (website_url && !isValidUrl(website_url)) {
    errors.push("website_url must be a valid http or https URL");
  }

  // --- notes (optional, string) ---
  const notes = clean(body.notes, MAX_LEN.notes);

  // --- lat / lng (optional, must be valid coordinates) ---
  let lat: number | null = null;
  let lng: number | null = null;
  if (body.lat != null || body.lng != null) {
    if (!isFiniteNumber(body.lat) || !isFiniteNumber(body.lng)) {
      errors.push("lat and lng must both be finite numbers");
    } else if (body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180) {
      errors.push("lat must be [-90, 90] and lng must be [-180, 180]");
    } else {
      lat = body.lat;
      lng = body.lng;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const { data, error } = await supabase.rpc("create_report", {
    p_type: type,
    p_pharmacy_name: pharmacy_name,
    p_medication: medication,
    p_dose: dose,
    p_status: status,
    p_address: address,
    p_website_url: website_url,
    p_notes: notes,
    p_lat: lat,
    p_lng: lng,
  });

  if (error) {
    const safe = sanitizeDbError(error, "POST /api/reports");
    return res.status(safe.status).json({ error: safe.message });
  }
  // rpc returns an array; pick the first row
  const row = Array.isArray(data) ? data[0] : data;
  res.status(201).json(row);
});

app.patch("/api/reports/:id/vote", voteLimiter, async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  if (type !== "up" && type !== "down") {
    return res.status(400).json({ error: 'type must be "up" or "down"' });
  }

  const { error } = await supabase.rpc("vote_report", {
    report_id: id,
    vote_type: type,
  });

  if (error) {
    const safe = sanitizeDbError(error, "PATCH /api/reports/:id/vote");
    return res.status(safe.status).json({ error: safe.message });
  }
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
