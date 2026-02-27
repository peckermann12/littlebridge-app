import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when Supabase environment variables are missing.
 * Pages should check this and fall back to mock data from `@/lib/mock-data`.
 */
export const isDemoMode =
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY;

if (isDemoMode) {
  console.warn(
    "[LittleBridge] Running in DEMO MODE -- using mock data. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to a real database.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
);
