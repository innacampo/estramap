// Supabase client — always available.
// The anon key is public by design (RLS protects the data).
// On lovable.ai these may be injected via env vars; otherwise we use the project defaults.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://hcyxqttjhxzyutxiymtb.supabase.co";

const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXhxdHRqaHh6eXV0eGl5bXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzg3NTcsImV4cCI6MjA4Nzg1NDc1N30.X-7VUI1xogKXaDmKGYOSAoeNIuPdXnPqfrKQb5aTb6c";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});