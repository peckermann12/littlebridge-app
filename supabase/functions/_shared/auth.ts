/**
 * JWT verification helper for Supabase Edge Functions.
 *
 * Extracts and verifies the user from the Authorization header
 * using the Supabase admin client.
 */

import { supabaseAdmin } from "./supabase.ts";
import { errorResponse } from "./cors.ts";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Extracts the JWT from the Authorization header and verifies it.
 * Returns the authenticated user or an error Response.
 */
export async function verifyAuth(
  req: Request,
): Promise<{ user: AuthUser } | { error: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      error: errorResponse("Missing Authorization header", 401),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return {
      error: errorResponse("Invalid Authorization header format", 401),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      error: errorResponse("Invalid or expired token", 401),
    };
  }

  // Look up the user's role from the profiles table
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      role: profile?.role,
    },
  };
}

/**
 * Verifies auth and additionally checks that the user has one of the allowed roles.
 */
export async function verifyAuthWithRole(
  req: Request,
  allowedRoles: string[],
): Promise<{ user: AuthUser } | { error: Response }> {
  const result = await verifyAuth(req);
  if ("error" in result) return result;

  if (!result.user.role || !allowedRoles.includes(result.user.role)) {
    return {
      error: errorResponse("Insufficient permissions", 403),
    };
  }

  return result;
}
