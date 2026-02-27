# LittleBridge — Supabase Edge Functions

Backend Edge Functions for the LittleBridge bilingual childcare marketplace.

## Architecture

```
supabase/functions/
├── _shared/                    # Shared utilities (not deployed as functions)
│   ├── cors.ts                 # CORS headers, JSON/error response helpers
│   ├── supabase.ts             # Supabase admin + user client initialization
│   ├── auth.ts                 # JWT verification and role-based access control
│   └── resend.ts               # Email sending via Resend + bilingual HTML templates
├── translate-text/             # AI translation (English <-> Chinese) via Claude API
│   └── index.ts
├── submit-enquiry/             # Family "Book a Tour" enquiry submission
│   └── index.ts
├── submit-application/         # Educator "Express Interest" job application
│   └── index.ts
├── stripe-webhook/             # Stripe webhook event handler (subscriptions)
│   └── index.ts
├── create-checkout/            # Create Stripe Checkout session for centers
│   └── index.ts
├── manage-subscription/        # Create Stripe Customer Portal session
│   └── index.ts
└── README.md
```

## Prerequisites

1. **Supabase CLI** installed: `brew install supabase/tap/supabase`
2. **Supabase project** created at [supabase.com](https://supabase.com)
3. **Stripe account** with Products/Prices configured (or let `create-checkout` auto-create)
4. **Resend account** with a verified domain
5. **Anthropic API key** for Claude translation

## Environment Variables (Secrets)

Set these via the Supabase dashboard (Project Settings > Edge Functions > Secrets) or CLI:

```bash
# Supabase (auto-set by platform)
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY

# Anthropic (Claude API)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_ID=price_...       # Optional: pre-created price ID

# Resend
supabase secrets set RESEND_API_KEY=re_...

# App
supabase secrets set FROM_EMAIL="LittleBridge <hello@littlebridge.com.au>"
supabase secrets set APP_URL=https://littlebridge.com.au
```

## Database Prerequisites

These tables and functions must exist before the Edge Functions will work:

### Required Tables
- `profiles` — user profiles with `role`, `email`, `preferred_language`
- `family_profiles` — family details, linked to `profiles`
- `children` — child records linked to `family_profiles`
- `educator_profiles` — educator details, linked to `profiles`
- `center_profiles` — center details with `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
- `enquiries` — tour enquiry records
- `job_listings` — job posts by centers
- `job_applications` — educator applications with UNIQUE constraint on `(educator_profile_id, job_listing_id)`
- `subscriptions_log` — Stripe event log for idempotency (needs `stripe_event_id` column)

### Required Database Functions (RPC)
- `calculate_family_center_match(p_family_profile_id uuid, p_center_profile_id uuid)` — returns `{ score: number, reasons: string[] }`
- `calculate_educator_job_match(p_educator_profile_id uuid, p_job_listing_id uuid)` — returns `{ score: number, reasons: string[] }`

These are called by `submit-enquiry` and `submit-application` but are **non-critical** — if they fail, the enquiry/application is still saved without a match score.

## Deployment

### Deploy all functions at once

```bash
cd /path/to/littlebridge-app

# Deploy all functions
supabase functions deploy translate-text
supabase functions deploy submit-enquiry
supabase functions deploy submit-application
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-checkout
supabase functions deploy manage-subscription
```

> **Note:** `stripe-webhook` must be deployed with `--no-verify-jwt` because Stripe sends webhooks directly without a Supabase JWT.

### Deploy a single function

```bash
supabase functions deploy translate-text
```

### Local development

```bash
# Start all functions locally
supabase start
supabase functions serve --env-file supabase/.env.local

# Or serve a single function
supabase functions serve translate-text --env-file supabase/.env.local
```

Create `supabase/.env.local` with your development secrets:

```env
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
APP_URL=http://localhost:3000
FROM_EMAIL=LittleBridge <hello@littlebridge.com.au>
```

## Stripe Webhook Setup

1. In the [Stripe Dashboard](https://dashboard.stripe.com/webhooks), create a webhook endpoint:
   - URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

2. Copy the webhook signing secret and set it:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. For local testing, use the Stripe CLI:
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

## API Reference

### POST /translate-text

Translates text between English and Chinese.

```json
// Request
{
  "text": "我想预约参观你们的幼儿园",
  "source_language": "zh",       // optional, auto-detected
  "target_language": "en",       // optional, defaults to opposite of source
  "context": "enquiry_message"   // optional, helps translation quality
}

// Response
{
  "translated_text": "I would like to book a tour of your childcare center",
  "detected_language": "zh",
  "source_text": "我想预约参观你们的幼儿园"
}
```

### POST /submit-enquiry

Submit a "Book a Tour" enquiry. Requires authentication.

```json
// Request
{
  "family_profile_id": "uuid",
  "center_profile_id": "uuid",
  "message": "我想了解一下你们的双语课程",
  "preferred_tour_datetime": "Next Monday afternoon",
  "contact_preference": ["email", "wechat"]
}

// Response
{
  "success": true,
  "enquiry_id": "uuid",
  "match_score": 82,
  "match_reasons": ["Mandarin spoken", "Close to you", "Vacancies available"],
  "message_translated": true
}
```

### POST /submit-application

Submit an "Express Interest" job application. Requires authentication.

```json
// Request
{
  "educator_profile_id": "uuid",
  "job_listing_id": "uuid",
  "cover_note": "I am a bilingual educator with 4 years experience...",
  "available_to_start": "2 weeks notice",
  "interview_availability": "Weekdays 9am-3pm"
}

// Response
{
  "success": true,
  "application_id": "uuid",
  "match_score": 75,
  "match_reasons": ["Language match", "Qualification met"],
  "cover_note_translated": false
}
```

### POST /create-checkout

Create a Stripe Checkout session. Requires authentication.

```json
// Request
{
  "center_profile_id": "uuid",
  "return_url": "https://littlebridge.com.au/dashboard"
}

// Response
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

### POST /manage-subscription

Create a Stripe Customer Portal session. Requires authentication.

```json
// Request
{
  "center_profile_id": "uuid",
  "return_url": "https://littlebridge.com.au/dashboard"
}

// Response
{
  "portal_url": "https://billing.stripe.com/..."
}
```

### POST /stripe-webhook

Receives Stripe webhook events. No JWT required (verified via Stripe signature).

## Email Templates

All emails are bilingual (English/Chinese) and include:
- LittleBridge branding with gradient header
- Mobile-responsive HTML layout
- Unsubscribe link placeholder
- Privacy link

| Template | Trigger | Recipient |
|----------|---------|-----------|
| New Enquiry Notification | Family submits tour enquiry | Center |
| Enquiry Confirmation | Family submits tour enquiry | Family |
| New Application Notification | Educator applies for job | Center |
| Application Confirmation | Educator applies for job | Educator |
| Payment Confirmation | Invoice paid | Center |
| Payment Failed Warning | Invoice payment fails | Center |
| Subscription Canceled | Subscription deleted | Center |

## Error Handling

All functions return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details (only in 500 errors)"
}
```

HTTP status codes used:
- `200` — Success
- `400` — Validation error
- `401` — Unauthorized (missing/invalid JWT)
- `403` — Forbidden (wrong role or ownership)
- `404` — Resource not found
- `405` — Method not allowed
- `409` — Conflict (duplicate application)
- `429` — Rate limited
- `500` — Internal server error
