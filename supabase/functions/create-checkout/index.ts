/**
 * create-checkout Edge Function
 *
 * Creates a Stripe Checkout Session for center subscription.
 *
 * - Looks up or creates a Stripe customer for the center.
 * - Creates a checkout session with $99/month price, 30-day free trial.
 * - Returns the checkout URL.
 *
 * POST /create-checkout
 * Body: { center_profile_id: string, return_url: string }
 * Returns: { checkout_url: string }
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
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID"); // Optional: use a pre-created price

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateCheckoutRequest {
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
    const body: CreateCheckoutRequest = await req.json();

    if (!body.center_profile_id || typeof body.center_profile_id !== "string") {
      return errorResponse("'center_profile_id' is required");
    }

    if (!body.return_url || typeof body.return_url !== "string") {
      return errorResponse("'return_url' is required");
    }

    // 3. Fetch center profile
    const { data: center, error: centerError } = await supabaseAdmin
      .from("center_profiles")
      .select(`
        profile_id,
        center_name,
        email,
        stripe_customer_id,
        subscription_status,
        profile:profiles!center_profiles_profile_id_fkey(email)
      `)
      .eq("profile_id", body.center_profile_id)
      .single();

    if (centerError || !center) {
      return errorResponse("Center profile not found", 404);
    }

    // Verify the requesting user owns this center profile
    if (authResult.user.id !== center.profile_id) {
      return errorResponse("You can only create checkout sessions for your own center", 403);
    }

    // Check if already subscribed
    if (center.subscription_status === "active") {
      return errorResponse(
        "This center already has an active subscription. Use the customer portal to manage it.",
        400,
      );
    }

    // 4. Look up or create Stripe customer
    let stripeCustomerId = center.stripe_customer_id;
    const centerEmail = center.email || center.profile?.email || authResult.user.email;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: centerEmail,
        name: center.center_name,
        metadata: {
          center_profile_id: body.center_profile_id,
          platform: "littlebridge",
        },
      });

      stripeCustomerId = customer.id;

      // Store the customer ID
      await supabaseAdmin
        .from("center_profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("profile_id", body.center_profile_id);
    }

    // 5. Create or retrieve the price
    // If STRIPE_PRICE_ID is set, use it. Otherwise, create a price inline.
    let priceId = STRIPE_PRICE_ID;

    if (!priceId) {
      // Look for existing product named "LittleBridge Center Subscription"
      const products = await stripe.products.search({
        query: "name:'LittleBridge Center Subscription'",
      });

      let productId: string;

      if (products.data.length > 0) {
        productId = products.data[0].id;
        // Get the default price
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
          type: "recurring",
          limit: 1,
        });
        if (prices.data.length > 0) {
          priceId = prices.data[0].id;
        }
      }

      if (!priceId) {
        // Create product + price
        const product = await stripe.products.create({
          name: "LittleBridge Center Subscription",
          description:
            "Monthly subscription for childcare center listing on LittleBridge. Includes unlimited family leads, 5 active job listings, AI translation, and match scores.",
          metadata: { platform: "littlebridge" },
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: 9900, // $99.00 AUD
          currency: "aud",
          recurring: { interval: "month" },
          metadata: { platform: "littlebridge" },
        });

        priceId = price.id;
      }
    }

    // 6. Create Stripe Checkout Session
    const successUrl = `${body.return_url}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${body.return_url}?checkout=canceled`;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          center_profile_id: body.center_profile_id,
          platform: "littlebridge",
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        center_profile_id: body.center_profile_id,
        platform: "littlebridge",
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      tax_id_collection: { enabled: true },
    });

    return jsonResponse({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("create-checkout error:", error);
    return errorResponse(
      "Failed to create checkout session",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
