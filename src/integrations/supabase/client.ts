// Direct Supabase client — used only when VITE_SUPABASE_URL is set (e.g. on lovable.ai).
// When running with the Express server, the client uses /api/* instead and this is null.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Accept both names — lovable uses ANON_KEY, our docs say PUBLISHABLE_KEY
const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export const isDirectMode = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase: SupabaseClient<Database> | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;