import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Validate env ──────────────────────────────────────────────
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();

// Trust first proxy (nginx / cloud LB) so req.ip is the real client IP
app.set("trust proxy", 1);

// ── Security middleware ───────────────────────────────────────
app.use(helmet());

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "https://estramap.lovable.app",
  /\.lovable\.app$/,
];

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

app.use(express.json({ limit: "16kb" }));

// ── Rate limiters ─────────────────────────────────────────────

/** Read endpoints – generous limit */
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests – please try again later" },
});

/** Write endpoints – tighter limit */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reports submitted – please slow down" },
});

/** Vote endpoint – prevent vote-spam */
const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many votes – please slow down" },
});

// ── Error handling ────────────────────────────────────────────

const SAFE_ERROR_PATTERNS: Array<{ test: RegExp | string; status: number; message: string }> = [
  { test: "Too many reports", status: 429, message: "Too many reports submitted recently. Please try again later." },
  { test: "Report", status: 404, message: "Report not found." },
  { test: "vote_type must be", status: 400, message: 'vote_type must be "up" or "down".' },
];

interface SafeError { status: number; message: string }

function sanitizeDbError(err: { message: string; code?: string; details?: string }, context: string): SafeError {
  console.error(`[${context}]`, { message: err.message, code: err.code, details: err.details });

  for (const pattern of SAFE_ERROR_PATTERNS) {
    const matches = typeof pattern.test === "string"
      ? err.message.includes(pattern.test)
      : pattern.test.test(err.message);
    if (matches) return { status: pattern.status, message: pattern.message };
  }

  return { status: 500, message: "An unexpected error occurred. Please try again later." };
}

// ── Zod schemas ───────────────────────────────────────────────

const reportSchema = z.object({
  type: z.enum(["local", "online"]),
  pharmacy_name: z.string().trim().min(1, "pharmacy_name is required").max(200),
  medication: z.string().trim().min(1, "medication is required").max(200),
  dose: z.string().trim().min(1, "dose is required").max(100),
  status: z.enum(["in-stock", "low-stock", "out-of-stock"]),
  address: z.string().trim().max(300).nullish().transform((v) => v || null),
  website_url: z
    .string()
    .trim()
    .max(500)
    .url("website_url must be a valid URL")
    .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
      message: "website_url must use http or https",
    })
    .nullish()
    .transform((v) => v || null),
  notes: z.string().trim().max(2000).nullish().transform((v) => v || null),
  lat: z.number().min(-90).max(90).nullish().default(null),
  lng: z.number().min(-180).max(180).nullish().default(null),
}).refine(
  (d) => (d.lat == null) === (d.lng == null),
  { message: "lat and lng must both be provided or both omitted", path: ["lat"] }
);

const voteSchema = z.object({
  type: z.enum(["up", "down"]),
});

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

app.post("/api/reports", writeLimiter, async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    const messages = parsed.error.errors.map((e) => e.message).join("; ");
    return res.status(400).json({ error: messages });
  }

  const { type, pharmacy_name, medication, dose, status, address, website_url, notes, lat, lng } = parsed.data;

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
  const row = Array.isArray(data) ? data[0] : data;
  res.status(201).json(row);
});

app.patch("/api/reports/:id/vote", voteLimiter, async (req, res) => {
  const { id } = req.params;
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'type must be "up" or "down"' });
  }

  const { error } = await supabase.rpc("vote_report", {
    report_id: id,
    vote_type: parsed.data.type,
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
