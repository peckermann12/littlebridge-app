/**
 * manage-subscription Edge Function
 *
 * Creates a Stripe Customer Portal session for centers to manage their subscription.
 * Centers can update payment methods, view invoices, and cancel.
 *
 * POST /manage-subscription
 * Body: { center_profile_id: string, return_url: string }
 * Returns: { portal_url: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import { verifyAuth } from "../_shared/auth.ts";

// ---------------------------------------------------------------------------
// Stripe initialization
// ---------------------------------------------------------------------------

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManageSubscriptionRequest {
  center_profile_id: string;
  return_url: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    // 1. Verify auth
    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;

    // 2. Parse and validate input
    const body: ManageSubscriptionRequest = await req.json();

    if (!body.center_profile_id || typeof body.center_profile_id !== "string") {
      return errorResponse("'center_profile_id' is required");
    }

    if (!body.return_url || typeof body.return_url !== "string") {
      return errorResponse("'return_url' is required");
    }

    // 3. Fetch center profile
    const { data: center, error: centerError } = await supabaseAdmin
      .from("center_profiles")
      .select("profile_id, stripe_customer_id, center_name")
      .eq("profile_id", body.center_profile_id)
      .single();

    if (centerError || !center) {
      return errorResponse("Center profile not found", 404);
    }

    // 4. Verify the requesting user owns this center profile
    if (authResult.user.id !== center.profile_id) {
      return errorResponse("You can only manage subscriptions for your own center", 403);
    }

    // 5. Ensure the center has a Stripe customer ID
    if (!center.stripe_customer_id) {
      return errorResponse(
        "No subscription found for this center. Please subscribe first.",
        400,
      );
    }

    // 6. Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: center.stripe_customer_id,
      return_url: body.return_url,
    });

    return jsonResponse({
      portal_url: portalSession.url,
    });
  } catch (error) {
    console.error("manage-subscription error:", error);
    return errorResponse(
      "Failed to create portal session",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
