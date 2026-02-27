// TODO: Before going live, restrict Access-Control-Allow-Origin to https://littlebridge.ai

/**
 * CORS headers for Supabase Edge Functions.
 * Allows browser requests from the LittleBridge frontend.
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * Returns an OPTIONS preflight response with CORS headers.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

/**
 * Wraps a JSON body in a Response with CORS headers and the given status.
 */
export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Returns an error response with CORS headers.
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: string,
): Response {
  const body: Record<string, unknown> = { error: message };
  if (details) body.details = details;
  return jsonResponse(body, status);
}
