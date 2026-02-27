/**
 * Supabase client initialization for Edge Functions.
 *
 * Provides two clients:
 *   - supabaseAdmin: Uses the service role key (bypasses RLS). For server-side operations.
 *   - createUserClient: Creates a client scoped to the requesting user's JWT.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

/**
 * Admin client — bypasses Row Level Security.
 * Use for server-side operations where the Edge Function acts on behalf of the system.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Creates a Supabase client scoped to the requesting user's auth token.
 * Use when you want RLS to apply based on the user's session.
 */
export function createUserClient(authHeader: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
