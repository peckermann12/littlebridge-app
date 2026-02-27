/**
 * stripe-webhook Edge Function
 *
 * Handles Stripe webhook events for center subscriptions.
 *
 * Events handled:
 *   - checkout.session.completed  --> activate subscription, update center profile
 *   - invoice.paid               --> log payment, ensure subscription active
 *   - customer.subscription.updated --> update subscription status
 *   - customer.subscription.deleted --> mark canceled, pause jobs, hold enquiries
 *   - invoice.payment_failed     --> mark past_due, send warning email
 *
 * Includes:
 *   - Stripe signature verification
 *   - Idempotency (checks stripe_event_id in subscriptions_log)
 *   - Error handling and logging
 *
 * POST /stripe-webhook (raw body, no auth — Stripe sends directly)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { supabaseAdmin } from "../_shared/supabase.ts";
import {
  sendEmail,
  paymentConfirmationEmail,
  paymentFailedEmail,
  subscriptionCanceledEmail,
  type PaymentConfirmationData,
  type PaymentFailedData,
  type SubscriptionCanceledData,
} from "../_shared/resend.ts";

// ---------------------------------------------------------------------------
// Stripe initialization
// ---------------------------------------------------------------------------

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// ---------------------------------------------------------------------------
// Helper: Check idempotency
// ---------------------------------------------------------------------------

async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("subscriptions_log")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  return data !== null;
}

// ---------------------------------------------------------------------------
// Helper: Log event
// ---------------------------------------------------------------------------

async function logEvent(
  eventId: string,
  eventType: string,
  centerProfileId: string | null,
  amount?: number | null,
  currency?: string | null,
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  await supabaseAdmin.from("subscriptions_log").insert({
    stripe_event_id: eventId,
    event_type: eventType,
    center_profile_id: centerProfileId,
    amount: amount ?? null,
    currency: currency ?? "aud",
    metadata: metadata ?? null,
  });
}

// ---------------------------------------------------------------------------
// Helper: Look up center by Stripe customer ID
// ---------------------------------------------------------------------------

async function getCenterByStripeCustomer(
  customerId: string,
): Promise<{ profile_id: string; center_name: string; email: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("center_profiles")
    .select(`
      profile_id,
      center_name,
      email,
      profile:profiles!center_profiles_profile_id_fkey(email)
    `)
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    profile_id: data.profile_id,
    center_name: data.center_name,
    email: data.email || data.profile?.email || "",
  };
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const centerProfileId = session.metadata?.center_profile_id;

  if (!centerProfileId) {
    console.error("checkout.session.completed: missing center_profile_id in metadata");
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  // Update center profile with Stripe IDs and activate subscription
  const { error } = await supabaseAdmin
    .from("center_profiles")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: "active",
    })
    .eq("profile_id", centerProfileId);

  if (error) {
    console.error("Failed to update center profile on checkout:", error);
    throw error;
  }

  await logEvent(event.id, event.type, centerProfileId);

  console.log(`Subscription activated for center ${centerProfileId}`);
}

async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const center = await getCenterByStripeCustomer(customerId);
  if (!center) {
    console.warn("invoice.paid: center not found for customer", customerId);
    return;
  }

  // Ensure subscription is marked active
  await supabaseAdmin
    .from("center_profiles")
    .update({ subscription_status: "active" })
    .eq("profile_id", center.profile_id);

  await logEvent(event.id, event.type, center.profile_id, invoice.amount_paid / 100, invoice.currency ?? "aud");

  // Send payment confirmation email
  if (center.email) {
    try {
      const nextBillingDate = invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toLocaleDateString("en-AU")
        : "—";

      const data: PaymentConfirmationData = {
        centerName: center.center_name,
        amountPaid: (invoice.amount_paid / 100).toFixed(2),
        invoiceDate: new Date((invoice.created ?? 0) * 1000).toLocaleDateString("en-AU"),
        nextBillingDate,
      };

      await sendEmail(paymentConfirmationEmail(data, center.email));
    } catch (emailError) {
      console.error("Failed to send payment confirmation email:", emailError);
    }
  }

  console.log(`Invoice paid for center ${center.profile_id}: $${(invoice.amount_paid / 100).toFixed(2)}`);
}

async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return;

  const center = await getCenterByStripeCustomer(customerId);
  if (!center) {
    console.warn("subscription.updated: center not found for customer", customerId);
    return;
  }

  // Map Stripe subscription status to our internal status
  let status: string;
  switch (subscription.status) {
    case "active":
    case "trialing":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
      status = "canceled";
      break;
    default:
      status = subscription.status;
  }

  await supabaseAdmin
    .from("center_profiles")
    .update({
      subscription_status: status,
      stripe_subscription_id: subscription.id,
    })
    .eq("profile_id", center.profile_id);

  await logEvent(event.id, event.type, center.profile_id);

  console.log(`Subscription updated for center ${center.profile_id}: ${status}`);
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return;

  const center = await getCenterByStripeCustomer(customerId);
  if (!center) {
    console.warn("subscription.deleted: center not found for customer", customerId);
    return;
  }

  // Mark subscription as canceled
  await supabaseAdmin
    .from("center_profiles")
    .update({ subscription_status: "canceled" })
    .eq("profile_id", center.profile_id);

  // Pause all active job listings
  await supabaseAdmin
    .from("job_listings")
    .update({ status: "paused" })
    .eq("center_profile_id", center.profile_id)
    .eq("status", "active");

  await logEvent(event.id, event.type, center.profile_id);

  // Send cancellation email
  if (center.email) {
    try {
      const endDate = subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toLocaleDateString("en-AU")
        : new Date().toLocaleDateString("en-AU");

      const data: SubscriptionCanceledData = {
        centerName: center.center_name,
        endDate,
      };

      await sendEmail(subscriptionCanceledEmail(data, center.email));
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }
  }

  console.log(`Subscription canceled for center ${center.profile_id}`);
}

async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const center = await getCenterByStripeCustomer(customerId);
  if (!center) {
    console.warn("invoice.payment_failed: center not found for customer", customerId);
    return;
  }

  // Mark subscription as past_due
  await supabaseAdmin
    .from("center_profiles")
    .update({ subscription_status: "past_due" })
    .eq("profile_id", center.profile_id);

  await logEvent(event.id, event.type, center.profile_id, invoice.amount_due / 100, invoice.currency ?? "aud");

  // Send payment failed warning email
  if (center.email) {
    try {
      const data: PaymentFailedData = {
        centerName: center.center_name,
        amountDue: `$${(invoice.amount_due / 100).toFixed(2)}`,
        nextRetryDate: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString("en-AU")
          : undefined,
      };

      await sendEmail(paymentFailedEmail(data, center.email));
    } catch (emailError) {
      console.error("Failed to send payment failed email:", emailError);
    }
  }

  console.log(`Payment failed for center ${center.profile_id}: $${(invoice.amount_due / 100).toFixed(2)}`);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // 1. Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        { status: 400 },
      );
    }

    // 3. Idempotency check
    if (await isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Route to handler
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
