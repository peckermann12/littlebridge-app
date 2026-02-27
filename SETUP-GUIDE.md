# LittleBridge -- Setup & Deployment Guide

**From zero to deployed MVP for a bilingual early education marketplace.**

Stack: Lovable + Supabase + Stripe + Cloudflare + Claude API + Resend + Vercel

Last updated: 27 February 2026

---

## Table of Contents

1. [Domain & DNS Setup (Cloudflare)](#1-domain--dns-setup-cloudflare)
2. [Supabase Project Setup](#2-supabase-project-setup)
3. [Stripe Setup](#3-stripe-setup)
4. [Resend Setup](#4-resend-setup)
5. [Claude API Setup](#5-claude-api-setup)
6. [Lovable Project Setup](#6-lovable-project-setup)
7. [GitHub Repository Setup](#7-github-repository-setup)
8. [Local Development Setup](#8-local-development-setup)
9. [Production Deployment Checklist](#9-production-deployment-checklist)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Cost Tracking](#11-cost-tracking)
12. [Monitoring & Alerts](#12-monitoring--alerts)
13. [Go-Live Checklist](#13-go-live-checklist)

---

## 1. Domain & DNS Setup (Cloudflare)

### 1.1 Register or Transfer the Domain

**Option A -- Register directly on Cloudflare (recommended):**

1. Go to https://dash.cloudflare.com/ and sign up / log in.
2. Navigate to **Domain Registration > Register Domains**.
3. Search for `littlebridge.ai`.
4. Purchase the domain (Cloudflare sells at cost -- typically ~$12-15/year for `.ai`).
5. Cloudflare is now both registrar and DNS provider. No transfer needed.

**Option B -- Transfer from another registrar:**

1. Unlock the domain at your current registrar and obtain the EPP/transfer code.
2. In Cloudflare, go to **Domain Registration > Transfer Domains**.
3. Enter `littlebridge.ai`, paste the transfer code, and follow the prompts.
4. Wait for transfer to complete (up to 5 days, usually faster).

> **Note:** The product spec references `.com.au` in URLs. You may want to register `littlebridge.com.au` as well (requires an Australian ABN) and redirect it. For the MVP, `.ai` is fine.

### 1.2 DNS Records

Once the domain is active in Cloudflare, add these DNS records.

**For Vercel hosting (primary deployment target):**

| Type  | Name | Content               | Proxy | TTL  |
|-------|------|-----------------------|-------|------|
| CNAME | @    | cname.vercel-dns.com  | On    | Auto |
| CNAME | www  | cname.vercel-dns.com  | On    | Auto |

After adding these, go to Vercel (Section 6) and add `littlebridge.ai` and `www.littlebridge.ai` as custom domains in your project settings. Vercel will verify the DNS.

**If using Lovable's built-in hosting instead of Vercel:**

| Type  | Name | Content                           | Proxy | TTL  |
|-------|------|-----------------------------------|-------|------|
| CNAME | @    | (Lovable provides this value)     | On    | Auto |
| CNAME | www  | (Lovable provides this value)     | On    | Auto |

Check Lovable's custom domain docs for the exact CNAME target.

**For Resend email sending (added in Section 4):**

These records will be provided by Resend during domain verification. Typical set:

| Type | Name                        | Content                                    | Proxy | TTL  |
|------|-----------------------------|--------------------------------------------|-------|------|
| TXT  | @                           | v=spf1 include:amazonses.com ~all          | Off   | Auto |
| CNAME | resend._domainkey          | (provided by Resend)                       | Off   | Auto |
| CNAME | (second DKIM selector)     | (provided by Resend)                       | Off   | Auto |
| TXT  | _dmarc                      | v=DMARC1; p=quarantine; rua=mailto:dmarc@littlebridge.ai | Off | Auto |

> Important: Email-related DNS records (SPF, DKIM, DMARC) must have the orange cloud **turned OFF** (DNS only, no proxy). Cloudflare proxying breaks email authentication.

### 1.3 Cloudflare Settings

Navigate to each section in the Cloudflare dashboard for `littlebridge.ai`:

**SSL/TLS (Security > SSL/TLS):**

- Encryption mode: **Full (strict)**
- Edge Certificates: Enable **Always Use HTTPS**
- Enable **Automatic HTTPS Rewrites**
- Minimum TLS Version: **TLS 1.2**

**Security (Security > Settings):**

- Security Level: **Medium** (increase to High if you see bot traffic)
- Challenge Passage: 30 minutes
- Browser Integrity Check: **On**

**Speed (Speed > Optimization):**

- Auto Minify: Enable for JavaScript, CSS, HTML
- Brotli: **On**

**Caching (Caching > Configuration):**

- Caching Level: **Standard**
- Browser Cache TTL: **4 hours**

**Cache Rules (Caching > Cache Rules) -- Exclude API and auth routes from caching:**

Create a rule:

- Rule name: `Bypass cache for API and auth`
- When: URI Path contains `/api/` OR URI Path contains `/auth/` OR URI Path contains `/supabase/`
- Then: Cache eligibility = **Bypass cache**

Create a second rule:

- Rule name: `Cache static assets aggressively`
- When: URI Path contains `/assets/` OR File extension is in `{js, css, png, jpg, webp, svg, woff2}`
- Then: Edge TTL = 1 month, Browser TTL = 1 week

**Page Rules (legacy, use only if Cache Rules not available on your plan):**

| URL Pattern                  | Setting            | Value    |
|------------------------------|--------------------|----------|
| `*littlebridge.ai/api/*`    | Cache Level        | Bypass   |
| `*littlebridge.ai/auth/*`   | Cache Level        | Bypass   |
| `*littlebridge.ai/assets/*` | Cache Level        | Cache Everything |
| `*littlebridge.ai/assets/*` | Edge Cache TTL     | 1 month  |

**WAF (Security > WAF):**

On the free plan, Cloudflare provides managed rulesets. Enable:

- Cloudflare Managed Ruleset: **On**
- Cloudflare OWASP Core Ruleset: **On** (set sensitivity to Low initially to avoid false positives)

Create a custom WAF rule if you see abuse:

- Rule name: `Rate limit enquiry submissions`
- When: URI Path equals `/api/enquiries` AND Request Method equals `POST`
- Then: Rate limit (10 requests per minute per IP), action = Block

### 1.4 Email Routing (for receiving email)

Cloudflare Email Routing lets you receive email at `@littlebridge.ai` without running a mail server.

1. Go to **Email > Email Routing**.
2. Enable Email Routing and add destination addresses:

| Catch-all / Address         | Forward to                     |
|-----------------------------|--------------------------------|
| team@littlebridge.ai        | peter@your-personal-email.com  |
| support@littlebridge.ai     | peter@your-personal-email.com  |
| june@littlebridge.ai        | june@her-personal-email.com    |
| Catch-all                   | peter@your-personal-email.com  |

3. Cloudflare will ask you to verify each destination email (click the link in the verification email sent to each destination).
4. Cloudflare will automatically add the required MX and TXT records to your DNS.

> Note: Cloudflare Email Routing is for **receiving** email only. **Sending** email (transactional notifications) is handled by Resend (Section 4).

---

## 2. Supabase Project Setup

### 2.1 Create the Project

1. Go to https://supabase.com/dashboard and sign up / log in.
2. Click **New Project**.
3. Organization: Create one (e.g., "LittleBridge") or use your existing org.
4. Project name: `littlebridge`
5. Database password: Generate a strong password and **save it in your password manager**. You will need it for direct database connections.
6. Region: **Southeast Asia (Singapore)** (`ap-southeast-1`).
   - Supabase does not have a Sydney region. Singapore is the closest option with ~50ms latency to Sydney.
   - If `ap-southeast-2` (Sydney) becomes available, prefer that.
7. Pricing plan: **Free** (sufficient for MVP -- 500MB database, 1GB storage, 50K auth users, 500K Edge Function invocations/month).
8. Click **Create new project** and wait ~2 minutes for provisioning.

### 2.2 Note Your Project Credentials

Once the project is ready, go to **Project Settings > API** (https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api).

Record these values (you will need them throughout this guide):

| Key | Where to find | Example format |
|-----|--------------|----------------|
| Project URL | Settings > API > Project URL | `https://abcdefghij.supabase.co` |
| Anon (public) key | Settings > API > Project API keys | `eyJhbGciOi...` (long JWT) |
| Service role key | Settings > API > Project API keys (reveal) | `eyJhbGciOi...` (long JWT) |
| Project ref | From the URL or Settings > General | `abcdefghij` |
| Database password | You set this in step 5 | (your password) |
| Direct DB connection | Settings > Database > Connection string > URI | `postgresql://postgres:...` |

> **Security:** The service role key bypasses Row Level Security. Never expose it in frontend code. Only use it in Edge Functions and server-side scripts.

### 2.3 Enable Required Extensions

1. Go to **Database > Extensions** (https://supabase.com/dashboard/project/YOUR_PROJECT_REF/database/extensions).
2. Search for and enable each of these:

| Extension | Purpose | How to enable |
|-----------|---------|---------------|
| `uuid-ossp` | UUID generation for primary keys | Usually enabled by default. Verify it is on. |
| `postgis` | Geospatial queries (distance-based center search) | Search "postgis", click Enable |
| `pg_trgm` | Trigram-based fuzzy text search | Search "pg_trgm", click Enable |

Alternatively, run this in the **SQL Editor** (Database > SQL Editor):

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2.4 Run the Database Schema

The schema defines all tables, indexes, RLS policies, and functions for LittleBridge.

1. Go to **SQL Editor** in your Supabase dashboard.
2. Open the schema file at `/Users/peter/littlebridge-app/supabase/schema.sql`.
3. Copy the entire contents and paste into the SQL Editor.
4. Click **Run**.

If the schema file does not exist yet, you will create it as part of the development process. The schema should include:

- `profiles` table (bridge between auth.users and role-specific tables)
- `family_profiles` table
- `children` table
- `educator_profiles` table
- `center_profiles` table
- `center_photos` table
- `job_listings` table
- `enquiries` table
- `job_applications` table
- `admin_activity_log` table
- All RLS policies
- PostGIS spatial indexes
- Trigger functions (e.g., auto-create profile on signup)

**Verify the schema deployed correctly:**

```sql
-- Run in SQL Editor to confirm all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see all the tables listed above.

### 2.5 Configure Authentication

Navigate to **Authentication > Providers** (https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/providers).

**Email auth (enabled by default):**

1. Confirm **Email** provider is enabled.
2. Enable **Confirm email** (users must verify their email).
3. Set **Minimum password length** to 8.

**Google OAuth:**

1. Go to https://console.cloud.google.com/ and create a project (or use existing).
2. Navigate to **APIs & Services > Credentials > Create Credentials > OAuth Client ID**.
3. Application type: **Web application**
4. Name: `LittleBridge`
5. Authorized JavaScript origins:
   - `http://localhost:5173` (local dev)
   - `https://littlebridge.ai` (production)
6. Authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**.
8. Back in Supabase, go to **Authentication > Providers > Google**.
9. Enable Google, paste the Client ID and Client Secret, and save.

**Auth Settings (Authentication > URL Configuration):**

| Setting | Value |
|---------|-------|
| Site URL | `https://littlebridge.ai` (set to `http://localhost:5173` during development) |
| Redirect URLs | `http://localhost:5173/**`, `https://littlebridge.ai/**` |

**Email Templates (Authentication > Email Templates):**

Customize each template to be bilingual. For each template type (Confirm signup, Magic link, Reset password, Invite):

1. Click the template name to edit.
2. Replace the default content with bilingual HTML. Example for **Confirm signup**:

```html
<h2>Welcome to LittleBridge / 欢迎加入 LittleBridge</h2>
<p>Please confirm your email address by clicking the link below.</p>
<p>请点击以下链接确认您的邮箱地址。</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email / 确认邮箱</a></p>
<p>If you did not create an account, please ignore this email.</p>
<p>如果您未创建账户，请忽略此邮件。</p>
```

Repeat for each template type with appropriate bilingual copy.

### 2.6 Configure Storage Buckets

Navigate to **Storage** (https://supabase.com/dashboard/project/YOUR_PROJECT_REF/storage/buckets).

Create three buckets:

**Bucket 1: `photos` (center photos)**

1. Click **New bucket**.
2. Name: `photos`
3. Public bucket: **Yes** (photos are publicly viewable on center profiles)
4. File size limit: `5242880` (5 MB)
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

**Bucket 2: `resumes` (educator resumes)**

1. Click **New bucket**.
2. Name: `resumes`
3. Public bucket: **No** (private -- only accessible to the educator and centers they apply to)
4. File size limit: `10485760` (10 MB)
5. Allowed MIME types: `application/pdf`

**Bucket 3: `avatars` (profile photos)**

1. Click **New bucket**.
2. Name: `avatars`
3. Public bucket: **Yes**
4. File size limit: `2097152` (2 MB)
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

**Storage RLS Policies:**

Go to **Storage > Policies** and add policies for each bucket. You can run these in the SQL Editor:

```sql
-- photos bucket: anyone can view, authenticated centers can upload/update their own
CREATE POLICY "Public read access for photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Centers can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Centers can update own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Centers can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- resumes bucket: only the uploader can read/write
CREATE POLICY "Educators can upload own resume"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Educators can read own resume"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars bucket: anyone can view, users can upload their own
CREATE POLICY "Public read access for avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

> **File naming convention:** Upload files with the user's UUID as the folder name. Example: `photos/{user_id}/center-front.jpg`, `resumes/{user_id}/resume.pdf`, `avatars/{user_id}/profile.jpg`. This makes RLS policies simple and predictable.

### 2.7 Deploy Edge Functions

Edge Functions handle server-side logic: Stripe webhooks, Claude API translation, email sending, and match scoring.

**Install the Supabase CLI (if not already installed):**

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

**Log in to Supabase:**

```bash
supabase login
```

This opens a browser window. Authorize the CLI and paste the token back into the terminal.

**Link to your project:**

```bash
cd /Users/peter/littlebridge-app
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with the project ref from Section 2.2 (the alphanumeric ID from your Supabase URL).

**Create the Edge Functions:**

The following Edge Functions are needed for the MVP:

```
supabase/functions/
  _shared/
    cors.ts          (already exists)
    supabase.ts      (already exists)
    auth.ts          (already exists)
  translate-text/
    index.ts         # Claude API translation
  stripe-checkout/
    index.ts         # Create Stripe Checkout session
  stripe-webhook/
    index.ts         # Handle Stripe webhook events
  send-notification/
    index.ts         # Send email via Resend
  compute-match/
    index.ts         # Calculate match scores
```

Create the function directories:

```bash
supabase functions new translate-text
supabase functions new stripe-checkout
supabase functions new stripe-webhook
supabase functions new send-notification
supabase functions new compute-match
```

Each command creates a `supabase/functions/<name>/index.ts` scaffold. Replace the scaffold contents with your implementation code.

**Deploy all functions:**

```bash
supabase functions deploy translate-text
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy send-notification
supabase functions deploy compute-match
```

> Important: `stripe-webhook` must be deployed with `--no-verify-jwt` because Stripe sends requests directly (not through Supabase Auth). The function itself verifies the Stripe signature instead.

**Deploy all at once (alternative):**

```bash
supabase functions deploy
```

This deploys all functions in the `supabase/functions/` directory.

### 2.8 Set Edge Function Secrets

These secrets are available to all Edge Functions via `Deno.env.get("SECRET_NAME")`.

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
supabase secrets set STRIPE_SECRET_KEY=sk_test_your-key-here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
supabase secrets set RESEND_API_KEY=re_your-key-here
supabase secrets set STRIPE_PRICE_ID=price_your-price-id-here
supabase secrets set APP_URL=https://littlebridge.ai
supabase secrets set FROM_EMAIL=hello@littlebridge.ai
```

> Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically available to Edge Functions. You do not need to set them manually.

**Verify secrets are set:**

```bash
supabase secrets list
```

You should see all the above secrets listed (values are hidden).

---

## 3. Stripe Setup

### 3.1 Create a Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up with your email.
3. During onboarding:
   - Country: **Australia**
   - Business type: Select appropriate type (Sole trader or Company)
   - Currency: **AUD**
4. Complete identity verification (required before going live -- Stripe may ask for ID and ABN).

> You can start building immediately in **test mode** without completing verification. Verification is only required to process real payments.

### 3.2 Create the Subscription Product and Price

1. Go to **Product catalog** (https://dashboard.stripe.com/test/products) -- note the `/test/` in the URL for test mode.
2. Click **Add product**.
3. Fill in:
   - Name: `LittleBridge Center Subscription`
   - Description: `Monthly subscription for childcare centers. Includes profile listing, unlimited family leads, up to 5 active job postings, AI-powered bilingual translation, and match scoring.`
   - Image: Upload the LittleBridge logo (optional).
4. Under **Price information**:
   - Pricing model: **Standard pricing**
   - Price: `99.00`
   - Currency: `AUD`
   - Billing period: **Monthly**
   - Tax behavior: **Inclusive** (the $99 includes GST)
5. Click **Save product**.
6. On the product detail page, copy the **Price ID** (starts with `price_`). You will need this in your environment variables.

### 3.3 Configure the Customer Portal

The Customer Portal lets center directors manage their own subscription (cancel, update payment method) without contacting you.

1. Go to **Settings > Billing > Customer portal** (https://dashboard.stripe.com/test/settings/billing/portal).
2. Configure:

| Section | Setting |
|---------|---------|
| **Functionality > Subscriptions** | Cancel subscriptions: **Enabled** |
| | Cancellation reason: **Enabled** |
| | Switch plans: **Enabled** (for future multi-tier pricing) |
| **Functionality > Payment methods** | Update payment methods: **Enabled** |
| **Functionality > Invoice history** | Invoice history: **Enabled** |
| **Branding > Appearance** | |
| | Headline: `Manage Your LittleBridge Subscription` |
| | Primary color: (your brand color) |
| | Logo: Upload LittleBridge logo |
| **Business information** | |
| | Privacy policy URL: `https://littlebridge.ai/privacy` |
| | Terms of service URL: `https://littlebridge.ai/terms` |

3. Click **Save changes**.

### 3.4 Create a Webhook Endpoint

Webhooks notify your backend when payment events occur (successful payment, failed payment, subscription cancelled, etc.).

1. Go to **Developers > Webhooks** (https://dashboard.stripe.com/test/webhooks).
2. Click **Add endpoint**.
3. Endpoint URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
   - Replace `YOUR_PROJECT_REF` with your Supabase project ref.
4. Description: `LittleBridge Supabase Edge Function`
5. Listen to events -- select these specific events:

| Event | Why |
|-------|-----|
| `checkout.session.completed` | New subscription created, activate the center's account |
| `invoice.paid` | Recurring payment successful, extend subscription |
| `invoice.payment_failed` | Payment failed, notify center, may need to restrict access |
| `customer.subscription.updated` | Subscription changed (e.g., cancel at period end) |
| `customer.subscription.deleted` | Subscription fully cancelled, deactivate premium features |
| `customer.subscription.trial_will_end` | 3 days before trial ends, send reminder email |

6. Click **Add endpoint**.
7. On the endpoint detail page, click **Reveal** under **Signing secret**.
8. Copy the signing secret (starts with `whsec_`). This is your `STRIPE_WEBHOOK_SECRET`.

### 3.5 Note All Keys

Go to **Developers > API keys** (https://dashboard.stripe.com/test/apikeys).

| Key | Prefix | Usage |
|-----|--------|-------|
| Publishable key | `pk_test_` | Frontend (safe to expose in browser) |
| Secret key | `sk_test_` | Backend / Edge Functions only (never in frontend) |
| Webhook signing secret | `whsec_` | Edge Function (verify webhook signatures) |
| Price ID | `price_` | Both frontend and backend |

### 3.6 Set Up the Free Trial

Stripe supports free trials natively. Configure the trial in your checkout session code:

```typescript
// In your stripe-checkout Edge Function:
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer_email: userEmail,
  line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
  subscription_data: {
    trial_period_days: 14,
    metadata: { center_profile_id: centerProfileId },
  },
  success_url: `${APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/pricing`,
  metadata: { user_id: userId, center_profile_id: centerProfileId },
});
```

### 3.7 Test Mode vs. Live Mode Checklist

**Stay in Test Mode until you are ready for real payments.** Test mode uses separate keys (`pk_test_`, `sk_test_`) and no real money is charged.

Test card numbers for development:

| Scenario | Card Number |
|----------|-------------|
| Successful payment | `4242 4242 4242 4242` |
| Requires authentication (3D Secure) | `4000 0025 0000 3155` |
| Payment declined | `4000 0000 0000 9995` |
| Insufficient funds | `4000 0000 0000 9995` |

Use any future expiry date, any 3-digit CVC, and any 5-digit postcode.

**When ready to go live:**

1. Complete Stripe account verification (ID, ABN, bank account).
2. In the Stripe dashboard, toggle from **Test mode** to **Live mode** (top-right toggle).
3. Get new live-mode API keys (`pk_live_`, `sk_live_`).
4. Create a new webhook endpoint in live mode with the same URL and events.
5. Get the new live-mode webhook signing secret.
6. Update all environment variables (Supabase secrets and frontend env vars) with live keys.
7. Create the same Product and Price in live mode (or use the Stripe "Copy to live mode" feature).
8. Update the `STRIPE_PRICE_ID` to the live-mode price ID.
9. Test the full flow once more with a real card (charge $0.50 or use the live-mode test clock feature).

---

## 4. Resend Setup

### 4.1 Create an Account

1. Go to https://resend.com/signup and sign up.
2. Resend's free tier includes 3,000 emails/month and 100 emails/day -- sufficient for MVP.

### 4.2 Add and Verify Your Sending Domain

1. Go to **Domains** (https://resend.com/domains).
2. Click **Add Domain**.
3. Enter: `littlebridge.ai`
4. Region: Select **Sydney (ap-southeast-2)** if available, otherwise the closest region.
5. Resend will provide DNS records to add.

### 4.3 Add DNS Records in Cloudflare

Resend will show you records like these. Add them in Cloudflare DNS:

**Record 1 -- SPF (TXT):**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| TXT  | @    | `v=spf1 include:amazonses.com ~all` | Off (DNS only) |

> If you already have an SPF record, merge the `include:` into the existing record. You can only have one SPF record per domain.

**Record 2 -- DKIM (CNAME):**

| Type  | Name                  | Content                          | Proxy |
|-------|-----------------------|----------------------------------|-------|
| CNAME | resend._domainkey     | (provided by Resend, e.g., `resend.domainkey.xxx.amazonses.com`) | Off |

**Record 3 -- Second DKIM (CNAME):**

| Type  | Name                   | Content             | Proxy |
|-------|------------------------|---------------------|-------|
| CNAME | (provided by Resend)   | (provided by Resend) | Off  |

**Record 4 -- DMARC (TXT):**

| Type | Name    | Content | Proxy |
|------|---------|---------|-------|
| TXT  | _dmarc  | `v=DMARC1; p=quarantine; rua=mailto:dmarc@littlebridge.ai; pct=100` | Off |

> Critical: All email DNS records must have the Cloudflare orange cloud **turned OFF** (grey cloud / DNS only). Proxying breaks email authentication.

### 4.4 Wait for Verification

1. Back in Resend, click **Verify DNS Records**.
2. DNS propagation typically takes 5-60 minutes.
3. Once verified, the domain status will show **Verified** with green checkmarks.

### 4.5 Create an API Key

1. Go to **API Keys** (https://resend.com/api-keys).
2. Click **Create API Key**.
3. Name: `littlebridge-production`
4. Permission: **Sending access**
5. Domain: `littlebridge.ai`
6. Copy the API key (starts with `re_`). You will only see it once.
7. Set it as a Supabase Edge Function secret (see Section 2.8).

### 4.6 Test Sending

Use the Resend dashboard or API to send a test email:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "LittleBridge <hello@littlebridge.ai>",
    "to": "your-test-email@gmail.com",
    "subject": "Test from LittleBridge",
    "html": "<h1>It works!</h1><p>LittleBridge email sending is configured correctly.</p>"
  }'
```

Check that the email arrives and is not in spam. Check the email headers to confirm SPF, DKIM, and DMARC all pass.

---

## 5. Claude API Setup

### 5.1 Create an Anthropic Account

1. Go to https://console.anthropic.com/ and sign up.
2. If you already have an account, log in.

### 5.2 Create an API Key

1. Navigate to **Settings > API Keys** (https://console.anthropic.com/settings/keys).
2. Click **Create Key**.
3. Name: `littlebridge-production`
4. Copy the key (starts with `sk-ant-api03-`). Store it securely.
5. Set it as a Supabase Edge Function secret (see Section 2.8).

### 5.3 Set Up Billing and Usage Limits

1. Go to **Settings > Plans & Billing** (https://console.anthropic.com/settings/billing).
2. Add a payment method.
3. Set a **monthly spend limit** of `$50` to prevent runaway costs.
   - At ~$0.001-0.005 per translation using Claude Haiku, $50/month supports roughly 10,000-50,000 translations.
4. Go to **Settings > Limits** and set rate limits appropriate for your usage.

### 5.4 Model Selection

LittleBridge uses **Claude Haiku** (currently `claude-haiku-4-20250414` or latest available) for translations. Reasons:

- Fast (< 2 seconds per translation)
- Cheap (~$0.25 per million input tokens, ~$1.25 per million output tokens)
- Sufficient quality for bilingual childcare content translation
- Falls well within the $50/month budget for MVP traffic

In your `translate-text` Edge Function, use:

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-20250414',
    max_tokens: 1024,
    system: `You are a professional translator specializing in Australian childcare and early education terminology. Translate between English and Simplified Chinese (Mandarin). Preserve meaning, tone, and cultural nuance. Key terminology: CCS = 育儿补贴, WWCC = 儿童工作检查, NQS = 国家质量标准, Long Day Care = 全日制托儿所, Family Day Care = 家庭式托儿. Always maintain a warm, professional tone appropriate for parents and educators.`,
    messages: [{ role: 'user', content: textToTranslate }],
  }),
});
```

---

## 6. Lovable Project Setup

### 6.1 Create a New Project

1. Go to https://lovable.dev/ and sign up / log in.
2. Click **New Project**.
3. Name: `LittleBridge`
4. Description: Provide a brief summary for Lovable's AI context:
   > Bilingual (English/Chinese) childcare marketplace for Australia. Three user types: families, educators, and childcare centers. Features include search with location filters, bilingual profiles, enquiry system, job board, and Stripe subscription for centers. Uses Supabase for backend, shadcn/ui for components, Tailwind CSS for styling.
5. Click **Create**.

### 6.2 Connect to GitHub

1. In your Lovable project, go to **Settings** (gear icon) or look for the GitHub integration option.
2. Click **Connect to GitHub**.
3. Authorize Lovable to access your GitHub account.
4. Select the repository: `littlebridge-app` (create it first -- see Section 7).
5. Lovable will push code changes to the `main` branch (or a branch you specify).

### 6.3 Configure Supabase Integration

1. In Lovable, go to **Settings > Integrations** or **Supabase**.
2. Click **Connect Supabase**.
3. Enter:
   - Project URL: `https://YOUR_PROJECT_REF.supabase.co`
   - Anon key: (your anon key from Section 2.2)
4. Lovable will now be able to generate code that uses Supabase client libraries.

### 6.4 Set Environment Variables in Lovable

Lovable manages environment variables through its UI or through the generated code's `.env` handling. Set:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `VITE_STRIPE_PRICE_ID` | Your Stripe Price ID |
| `VITE_MAPBOX_TOKEN` | Your Mapbox access token |
| `VITE_APP_URL` | `https://littlebridge.ai` |

> Note: Lovable may handle these differently depending on its hosting setup. If deploying to Vercel instead of Lovable hosting, set these in Vercel (see Section 9).

### 6.5 Export to GitHub Early

From Day 1, ensure all code generated by Lovable is pushed to GitHub. This allows:

- Claude Code to work on backend logic and Edge Functions in the same repo.
- Version control and rollback capability.
- Deployment to Vercel if Lovable's built-in hosting is not sufficient.

In Lovable, use the **Export** or **Push to GitHub** feature after each significant change.

---

## 7. GitHub Repository Setup

### 7.1 Create the Repository

If you have not already:

1. Go to https://github.com/new
2. Repository name: `littlebridge-app`
3. Visibility: **Private** (you can make it public later if desired)
4. Do NOT initialize with README, .gitignore, or license (Lovable will populate the repo).
5. Click **Create repository**.

### 7.2 Clone Locally

```bash
cd /Users/peter
git clone https://github.com/YOUR_USERNAME/littlebridge-app.git
cd littlebridge-app
```

If the repo already exists locally at `/Users/peter/littlebridge-app`:

```bash
cd /Users/peter/littlebridge-app
git remote add origin https://github.com/YOUR_USERNAME/littlebridge-app.git
```

### 7.3 Set Up Branch Protection

1. Go to your repo on GitHub > **Settings > Branches**.
2. Click **Add rule** (or **Add branch protection rule**).
3. Branch name pattern: `main`
4. Enable:
   - **Require a pull request before merging** (optional for solo development, recommended once you have contributors)
   - **Require status checks to pass before merging** (once CI is set up)
5. Click **Create** or **Save changes**.

For solo MVP development, branch protection is optional. You can work directly on `main`.

### 7.4 Add .gitignore

Ensure the repo has a `.gitignore` that excludes sensitive files:

```gitignore
# Dependencies
node_modules/

# Environment variables (NEVER commit these)
.env
.env.local
.env.production
.env.*.local

# Build output
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Supabase local
supabase/.temp/
supabase/.branches/

# Logs
*.log
```

### 7.5 Add .env.example

The `.env.example` file has already been created at `/Users/peter/littlebridge-app/.env.example`. This file is committed to the repo so that anyone cloning the project knows which environment variables are required.

---

## 8. Local Development Setup

### 8.1 Prerequisites

Install these tools if not already present:

```bash
# Node.js (v18 or later)
# Check: node --version
brew install node

# Supabase CLI
brew install supabase/tap/supabase

# Stripe CLI (for webhook testing)
brew install stripe/stripe-cli/stripe

# Git (usually pre-installed on macOS)
git --version
```

### 8.2 Clone and Install

```bash
cd /Users/peter
git clone https://github.com/YOUR_USERNAME/littlebridge-app.git
cd littlebridge-app
npm install
```

### 8.3 Create .env.local

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all the values:

```bash
# Edit with your preferred editor
code .env.local
# or
nano .env.local
```

Fill in each value using the credentials from Sections 2-5. For local development:

| Variable | Local Development Value |
|----------|----------------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (same as production) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key (same as production) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Test-mode publishable key (`pk_test_...`) |
| `VITE_STRIPE_PRICE_ID` | Test-mode price ID |
| `VITE_MAPBOX_TOKEN` | Your Mapbox token |
| `VITE_APP_URL` | `http://localhost:5173` |
| `VITE_DEFAULT_LANGUAGE` | `en` |

### 8.4 Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. Vite provides hot module replacement -- changes to source files are reflected instantly in the browser.

### 8.5 Test Supabase Edge Functions Locally

You can run Edge Functions locally using the Supabase CLI:

```bash
# Start the Supabase local development stack (includes Edge Functions runtime)
supabase start

# Or serve a specific function:
supabase functions serve translate-text --env-file supabase/.env.local
```

Create a `supabase/.env.local` file with the secrets your Edge Functions need:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-local-webhook-secret
RESEND_API_KEY=re_your-key
STRIPE_PRICE_ID=price_your-price-id
APP_URL=http://localhost:5173
FROM_EMAIL=hello@littlebridge.ai
```

> Note: `supabase/.env.local` is for local Edge Function development only. Do NOT commit it. Add `supabase/.env.local` to `.gitignore`.

Test a function with curl:

```bash
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/translate-text' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"text": "I am looking for a bilingual childcare center near Chatswood", "targetLanguage": "zh"}'
```

### 8.6 Test Stripe Webhooks Locally

The Stripe CLI can forward webhook events to your local Edge Function:

**Step 1 -- Log in to Stripe CLI:**

```bash
stripe login
```

Follow the prompts to authenticate via browser.

**Step 2 -- Forward webhooks to your local Supabase function:**

```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

The CLI will print a webhook signing secret (starts with `whsec_`). Use this as the `STRIPE_WEBHOOK_SECRET` in your local `supabase/.env.local`.

**Step 3 -- Trigger test events:**

In a separate terminal:

```bash
# Simulate a successful checkout
stripe trigger checkout.session.completed

# Simulate a failed payment
stripe trigger invoice.payment_failed

# Simulate a subscription cancellation
stripe trigger customer.subscription.deleted
```

Watch the output of `stripe listen` to see events being forwarded and your function's responses.

### 8.7 Local Development Workflow Summary

Open three terminal tabs:

| Tab | Command | Purpose |
|-----|---------|---------|
| 1 | `npm run dev` | Frontend dev server on `:5173` |
| 2 | `supabase functions serve --env-file supabase/.env.local` | Edge Functions on `:54321` |
| 3 | `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook` | Stripe webhook forwarding |

---

## 9. Production Deployment Checklist

### Deployment to Vercel

1. Go to https://vercel.com/ and sign up / log in with your GitHub account.
2. Click **Add New > Project**.
3. Import your `littlebridge-app` repository.
4. Framework preset: **Vite** (Vercel should auto-detect).
5. Build command: `npm run build` (or `vite build`).
6. Output directory: `dist`.
7. Set all environment variables (see Section 10 for the complete list).
8. Click **Deploy**.

**Add custom domain in Vercel:**

1. Go to your project in Vercel > **Settings > Domains**.
2. Add `littlebridge.ai`.
3. Add `www.littlebridge.ai`.
4. Vercel will show you DNS records to add. You already added these in Section 1.2, so verification should succeed.

### Pre-Launch Checklist

Work through each item before announcing the launch:

**Infrastructure:**

- [ ] Domain `littlebridge.ai` resolving correctly (check: `dig littlebridge.ai`)
- [ ] SSL certificate active and showing "Full (strict)" in Cloudflare
- [ ] HTTPS redirect working (http://littlebridge.ai redirects to https://littlebridge.ai)
- [ ] www redirect working (www.littlebridge.ai redirects to littlebridge.ai, or vice versa)

**Database & Backend:**

- [ ] Supabase schema deployed (all tables exist)
- [ ] All RLS policies in place and tested (try accessing data as different user roles)
- [ ] PostGIS extension enabled and spatial indexes created
- [ ] Storage buckets created with correct public/private settings
- [ ] Storage RLS policies applied

**Edge Functions:**

- [ ] `translate-text` deployed and returning correct translations
- [ ] `stripe-checkout` deployed and creating checkout sessions
- [ ] `stripe-webhook` deployed with `--no-verify-jwt` and processing events
- [ ] `send-notification` deployed and sending emails
- [ ] `compute-match` deployed and returning scores

**Authentication:**

- [ ] Email signup and login working
- [ ] Email verification emails arriving (check spam folder)
- [ ] Google OAuth working
- [ ] Password reset flow working
- [ ] Site URL set to `https://littlebridge.ai` in Supabase Auth settings
- [ ] Redirect URLs include both `https://littlebridge.ai/**` and `http://localhost:5173/**`

**Payments:**

- [ ] Stripe account in **live mode** (toggle in Stripe dashboard)
- [ ] Live-mode API keys set in all environment variables
- [ ] Live-mode webhook endpoint created and active
- [ ] Live-mode webhook signing secret set in Supabase secrets
- [ ] Live-mode Product and Price created
- [ ] Customer Portal configured in live mode
- [ ] Test a real payment (charge $0.99 to your own card, then refund)

**Email:**

- [ ] Resend domain verified (SPF, DKIM, DMARC all passing)
- [ ] Test email received and not in spam
- [ ] All notification email templates rendering correctly in both languages
- [ ] Unsubscribe links working (Spam Act compliance)

**Frontend:**

- [ ] All pages load correctly on desktop and mobile
- [ ] Language toggle (EN/ZH) works on all pages
- [ ] Open Graph meta tags set for WeChat sharing
- [ ] Pages work in WeChat's in-app browser
- [ ] Forms validate correctly with bilingual error messages
- [ ] Maps display correctly on center profiles

**Security:**

- [ ] No API keys exposed in frontend code (check browser dev tools > Sources)
- [ ] CORS configured correctly (only your domain, not `*` in production)
- [ ] Rate limiting on sensitive endpoints (enquiry submission, auth)
- [ ] Cloudflare WAF rules active

**Monitoring (see Section 12 for detailed setup):**

- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (PostHog or Cloudflare Web Analytics)
- [ ] Uptime monitoring configured (UptimeRobot or similar)
- [ ] Stripe webhook delivery dashboard reviewed

---

## 10. Environment Variables Reference

### Complete List

| Variable | Where to get it | Set in Frontend (Vercel/Lovable) | Set in Supabase Secrets | Set in .env.local |
|----------|----------------|----------------------------------|------------------------|-------------------|
| `VITE_SUPABASE_URL` | Supabase > Settings > API | Yes | Auto | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Settings > API | Yes | Auto | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe > Developers > API keys | Yes | No | Yes |
| `VITE_STRIPE_PRICE_ID` | Stripe > Product catalog > Price | Yes | Yes | Yes |
| `VITE_MAPBOX_TOKEN` | Mapbox > Account > Access tokens | Yes | No | Yes |
| `VITE_APP_URL` | Your domain | Yes | No | Yes |
| `VITE_DEFAULT_LANGUAGE` | Your choice (`en`) | Yes | No | Yes |
| `VITE_SENTRY_DSN` | Sentry > Project > Settings > DSN | Yes (optional) | No | Yes (optional) |
| `VITE_POSTHOG_KEY` | PostHog > Project > Settings | Yes (optional) | No | Yes (optional) |
| `VITE_POSTHOG_HOST` | PostHog (default: `https://app.posthog.com`) | Yes (optional) | No | Yes (optional) |
| `VITE_FROM_EMAIL` | Your choice (`hello@littlebridge.ai`) | Yes | No | Yes |
| `STRIPE_SECRET_KEY` | Stripe > Developers > API keys | No (server only) | Yes | supabase/.env.local |
| `STRIPE_WEBHOOK_SECRET` | Stripe > Developers > Webhooks > Signing secret | No (server only) | Yes | supabase/.env.local |
| `ANTHROPIC_API_KEY` | Anthropic > Settings > API Keys | No (server only) | Yes | supabase/.env.local |
| `RESEND_API_KEY` | Resend > API Keys | No (server only) | Yes | supabase/.env.local |
| `APP_URL` | Your domain | No | Yes | supabase/.env.local |
| `FROM_EMAIL` | Your choice | No | Yes | supabase/.env.local |

> **Important distinction:**
> - Variables prefixed with `VITE_` are exposed to the browser (Vite injects them at build time). Only put public/safe values here.
> - Variables WITHOUT the `VITE_` prefix are server-side only. Set them in Supabase secrets for Edge Functions.
> - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected into Edge Functions by Supabase. You do not need to set them manually.

### Setting Variables in Vercel

1. Go to your Vercel project > **Settings > Environment Variables**.
2. For each `VITE_*` variable, add it with:
   - Environment: **Production**, **Preview**, and **Development** (or select as appropriate)
3. After adding/changing variables, trigger a redeployment:
   - Go to **Deployments** > click the three dots on the latest deployment > **Redeploy**.

### Setting Variables in Supabase (Edge Function Secrets)

```bash
cd /Users/peter/littlebridge-app

supabase secrets set ANTHROPIC_API_KEY="sk-ant-api03-your-live-key"
supabase secrets set STRIPE_SECRET_KEY="sk_live_your-live-key"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your-live-webhook-secret"
supabase secrets set RESEND_API_KEY="re_your-live-key"
supabase secrets set STRIPE_PRICE_ID="price_your-live-price-id"
supabase secrets set APP_URL="https://littlebridge.ai"
supabase secrets set FROM_EMAIL="hello@littlebridge.ai"
```

---

## 11. Cost Tracking

### Monthly Cost Breakdown by Usage Level

All prices in AUD unless noted. Assumes current (February 2026) pricing for free tiers.

#### Tier 1: 0-100 Users (Months 1-2)

| Service | Free Tier Limit | Expected Usage | Monthly Cost |
|---------|----------------|----------------|--------------|
| **Supabase** (Free) | 500MB DB, 1GB storage, 50K MAU, 500K function invocations | Well within limits | $0 |
| **Vercel** (Hobby) | 100GB bandwidth, serverless functions | Well within limits | $0 |
| **Stripe** | 1.7% + $0.30 per transaction (Australian cards) | 5-10 subscriptions x $99 = ~$500-1000 revenue | ~$12-20 |
| **Claude API** (Haiku) | Pay per use | ~500 translations/month | ~$1-3 |
| **Resend** (Free) | 3,000 emails/month | ~200-500 emails | $0 |
| **Mapbox** (Free) | 50,000 map loads/month | ~1,000 loads | $0 |
| **Cloudflare** (Free) | Unlimited DNS, basic CDN/WAF | Well within limits | $0 |
| **Domain** (.ai) | Annual, amortised | 1 domain | ~$1.25 |
| **Sentry** (Free) | 5K errors/month | Minimal errors | $0 |
| **PostHog** (Free) | 1M events/month | ~10K events | $0 |
| **Total** | | | **~$14-24** |

#### Tier 2: 100-500 Users (Months 3-6)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Supabase** (Free or Pro $25) | $0-25 | May need Pro for 8GB DB, daily backups |
| **Vercel** (Hobby) | $0 | Still within limits |
| **Stripe** | $50-100 | 20-50 subscriptions |
| **Claude API** | $5-15 | ~2,000-5,000 translations |
| **Resend** (Free) | $0 | ~1,000-2,500 emails |
| **Mapbox** | $0 | ~5,000-20,000 loads |
| **Cloudflare** | $0 | Free plan sufficient |
| **Domain** | ~$1.25 | Same |
| **Sentry** | $0 | Free tier sufficient |
| **PostHog** | $0 | Free tier sufficient |
| **Total** | | **~$56-141** |

#### Tier 3: 500-1,000 Users (Months 6-12)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Supabase Pro** | $25 | 8GB DB, 100GB storage, 100K MAU |
| **Vercel Pro** | $20 | Needed for team features, more bandwidth |
| **Stripe** | $200-500 | 50-150 subscriptions |
| **Claude API** | $20-50 | ~5,000-20,000 translations |
| **Resend** (Pro $20) | $20 | 50K emails/month |
| **Mapbox** | $0 | Likely still within free tier |
| **Cloudflare** | $0 | Free plan sufficient |
| **Domain** | ~$1.25 | Same |
| **Sentry** (Team $26) | $26 | More error volume, team features |
| **PostHog** | $0 | Free tier likely sufficient |
| **Total** | | **~$312-642** |

#### Tier 4: 1,000+ Users (Year 2+)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Supabase Pro** | $25-75 | May need add-ons for compute/storage |
| **Vercel Pro** | $20 | Scale as needed |
| **Stripe** | $500-2,000+ | 150-500+ subscriptions |
| **Claude API** | $50-200 | High translation volume |
| **Resend** (Business $80) | $80 | 100K+ emails/month |
| **Mapbox** | $0-50 | May exceed free tier |
| **Cloudflare Pro** ($20) | $20 | WAF rules, image optimization |
| **Domain** | ~$1.25 | Same |
| **Sentry** (Team $26) | $26 | Same |
| **PostHog** | $0-50 | May exceed free tier |
| **Total** | | **~$722-2,522** |

### Revenue vs. Cost (Break-Even Analysis)

| Paying Centers | Monthly Revenue | Estimated Monthly Cost | Net |
|---------------|-----------------|----------------------|-----|
| 5 | $495 | ~$20 | +$475 |
| 15 | $1,485 | ~$100 | +$1,385 |
| 50 | $4,950 | ~$400 | +$4,550 |
| 100 | $9,900 | ~$700 | +$9,200 |

LittleBridge is profitable from the first paying customer. Infrastructure costs are negligible relative to subscription revenue.

---

## 12. Monitoring & Alerts

### 12.1 Supabase Dashboard Monitoring

The Supabase dashboard (https://supabase.com/dashboard/project/YOUR_PROJECT_REF) provides built-in monitoring:

**Database (Reports > Database):**

- Active connections
- Database size
- Query performance (slow queries)
- Cache hit rate (should be > 99%)

**Auth (Reports > Auth):**

- Daily active users
- Signups over time
- Auth errors

**Storage (Reports > Storage):**

- Storage usage by bucket
- Bandwidth usage

**Edge Functions (Reports > Edge Functions):**

- Invocation count
- Error rate
- Execution time (p50, p95, p99)
- Function-by-function breakdown

**Check these weekly:** Look for slow queries (> 1s), rising error rates, or unexpected usage spikes.

### 12.2 Stripe Dashboard Monitoring

The Stripe dashboard (https://dashboard.stripe.com/) provides payment monitoring:

**Key pages to check regularly:**

| Page | What to watch |
|------|---------------|
| **Home** | Revenue overview, successful payments, failed payments |
| **Payments** | Individual payment status, disputes |
| **Subscriptions** | Active count, churn, trial conversions |
| **Customers** | Customer count, revenue per customer |
| **Developers > Webhooks** | Webhook delivery success rate, failed deliveries |
| **Developers > Logs** | API request logs, error rates |

**Set up Stripe email alerts:**

1. Go to **Settings > Notifications** (https://dashboard.stripe.com/settings/notifications).
2. Enable alerts for:
   - Successful payments (optional -- can be noisy)
   - Failed payments (important)
   - Disputes (critical)
   - Subscription cancellations (important)

### 12.3 Cloudflare Analytics

**Cloudflare Analytics (Analytics & Logs > Traffic):**

- Requests over time
- Bandwidth
- Threats blocked
- Top traffic countries (expect primarily Australia)
- Cache hit ratio (aim for > 80% on static assets)

**Cloudflare Web Analytics (free, privacy-friendly alternative to Google Analytics):**

1. Go to **Analytics & Logs > Web Analytics**.
2. Click **Setup** and add the JavaScript snippet to your app's `<head>`.
3. Provides: page views, visitors, referrers, device types, core web vitals.

This is a lightweight option if you do not want PostHog.

### 12.4 Error Tracking (Sentry -- Free Tier)

Sentry captures JavaScript errors, unhandled promise rejections, and performance issues in your frontend.

**Setup:**

1. Go to https://sentry.io/signup/ and create a free account.
2. Create a new project:
   - Platform: **React**
   - Project name: `littlebridge-frontend`
3. Install the SDK:

```bash
npm install @sentry/react
```

4. Initialize Sentry in your app's entry point (e.g., `src/main.tsx`):

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,  // 10% of transactions for performance monitoring
  replaysSessionSampleRate: 0.0,  // No session replays (save quota)
  replaysOnErrorSampleRate: 1.0,  // Capture replay on errors
  environment: import.meta.env.MODE,
});
```

5. Set the `VITE_SENTRY_DSN` environment variable in Vercel and `.env.local`.

**Sentry free tier includes:** 5,000 errors/month, 10,000 performance transactions/month, 50 session replays.

**Set up alerts in Sentry:**

1. Go to **Alerts > Create Alert Rule**.
2. Create a rule: "When more than 10 errors occur in 1 hour, send email notification."
3. Add your email as the notification target.

### 12.5 Analytics (PostHog -- Free Tier)

PostHog provides product analytics (event tracking, funnels, session recordings) with a generous free tier (1 million events/month).

**Setup:**

1. Go to https://app.posthog.com/signup and create a free account.
2. Create a new project: `LittleBridge`
3. Install the SDK:

```bash
npm install posthog-js
```

4. Initialize PostHog in your app's entry point:

```typescript
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
  autocapture: true,  // Automatically capture clicks, page views, etc.
  capture_pageview: true,
  capture_pageleave: true,
});
```

5. Set the `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` environment variables.

**Key events to track (add custom events beyond autocapture):**

```typescript
// Track when a user completes an enquiry
posthog.capture('enquiry_submitted', {
  center_id: centerId,
  match_score: matchScore,
  language: userLanguage,
});

// Track when a center subscribes
posthog.capture('subscription_started', {
  center_id: centerId,
  plan: 'monthly_99',
});

// Track language toggle usage
posthog.capture('language_toggled', {
  from: previousLanguage,
  to: newLanguage,
});
```

**Create funnels in PostHog for key conversion metrics:**

| Funnel | Steps |
|--------|-------|
| Family signup to enquiry | Landing page view -> Signup -> Profile created -> Enquiry submitted |
| Center signup to subscription | Landing page view -> Signup -> Profile created -> Checkout started -> Subscription active |
| Educator signup to application | Landing page view -> Signup -> Profile created -> Job viewed -> Application submitted |

### 12.6 Uptime Monitoring (Free Options)

Choose one of these free uptime monitoring services to get alerted if your site goes down:

**Option A -- UptimeRobot (recommended, free for 50 monitors):**

1. Go to https://uptimerobot.com/ and create a free account.
2. Add monitors:

| Monitor Name | Type | URL/Host | Interval |
|-------------|------|----------|----------|
| LittleBridge Website | HTTP(S) | `https://littlebridge.ai` | 5 min |
| Supabase API | HTTP(S) | `https://YOUR_PROJECT_REF.supabase.co/rest/v1/` | 5 min |
| Stripe Webhook Endpoint | HTTP(S) | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook` (expect 401, that is OK -- monitor for 5xx) | 5 min |

3. Set up alert contacts: add your email and optionally a Slack webhook or SMS number.
4. UptimeRobot will email you when any monitor goes down and again when it recovers.

**Option B -- Better Stack (formerly Better Uptime, free for 10 monitors):**

1. Go to https://betterstack.com/uptime and create a free account.
2. Add the same monitors as above.
3. Better Stack has a nicer status page feature if you want a public status page later.

**Option C -- Cloudflare Health Checks (if on a paid Cloudflare plan):**

1. In Cloudflare, go to **Traffic > Health Checks**.
2. Add health checks for your endpoints.
3. Available on Pro plan and above.

### 12.7 Monitoring Dashboard Summary

After setup, you will monitor the health of LittleBridge across these dashboards:

| What | Where | Frequency |
|------|-------|-----------|
| Site up/down | UptimeRobot (email alerts) | Automatic, 24/7 |
| JavaScript errors | Sentry (email alerts) | Automatic, review weekly |
| Traffic & performance | Cloudflare Analytics | Review weekly |
| Product metrics (signups, enquiries) | PostHog | Review daily during launch, weekly after |
| Database health & Edge Function errors | Supabase Dashboard | Review weekly |
| Payment health | Stripe Dashboard | Review daily during launch, weekly after |
| Revenue & subscriptions | Stripe Dashboard | Review weekly |

### 12.8 Alerts to Set Up Before Launch

| Alert | Service | Condition | Notify via |
|-------|---------|-----------|-----------|
| Site down | UptimeRobot | HTTPS check fails | Email + SMS |
| High error rate | Sentry | > 10 errors in 1 hour | Email |
| Payment failed | Stripe | `invoice.payment_failed` event | Email (Stripe notifications) |
| Subscription cancelled | Stripe | `customer.subscription.deleted` event | Email |
| Edge Function errors | Supabase | Check manually or set up log drain | Weekly review |
| Low disk/database space | Supabase | Approaching free tier limit | Weekly review |

---

## 13. Go-Live Checklist

Before flipping from test/development to production, verify ALL of the following:

### Accounts & Registration
- [ ] ABN registered at abr.gov.au (required for Stripe live mode and .com.au domain)
- [ ] Business name registered (if trading as "LittleBridge")
- [ ] GST registration if expecting >$75K revenue within 12 months

### Domain & DNS
- [ ] Domain registered (littlebridge.ai)
- [ ] DNS pointed to Cloudflare
- [ ] SSL certificate active (Cloudflare provides this automatically)
- [ ] Email routing configured (hello@littlebridge.ai)

### Supabase
- [ ] Site URL updated from localhost to https://littlebridge.ai (Auth > URL Configuration)
- [ ] Redirect URLs include production domain
- [ ] All Edge Function secrets set for production values
- [ ] RLS policies tested (try accessing data as anon, as wrong user, as admin)
- [ ] Database backup plan in place (upgrade to Pro $25/mo for daily backups, or manual pg_dump weekly)

### Stripe
- [ ] Switch from test keys to live keys (Publishable + Secret)
- [ ] Create new webhook endpoint in LIVE mode pointing to production Edge Function URL
- [ ] Update STRIPE_WEBHOOK_SECRET to live webhook secret
- [ ] Update STRIPE_PRICE_ID to live price ID
- [ ] Verify Stripe account identity verification is complete (required for live payouts)
- [ ] Test a real $1 charge and refund it

### Email (Resend)
- [ ] Sending domain verified with SPF + DKIM records
- [ ] DMARC record configured
- [ ] Test email delivery to: Gmail, Outlook, QQ Mail (qq.com), 163.com (NetEase)
- [ ] From address set to hello@littlebridge.ai (not sandbox)

### Content
- [ ] Privacy Policy page live at /privacy with accurate data residency info
- [ ] Terms of Service page live at /terms
- [ ] June's founder story + photo added to landing page and About page
- [ ] Seed data replaced with real center profiles (or verified as accurate)
- [ ] Testimonials section removed or replaced with real quotes
- [ ] All placeholder text replaced with real copy

### Error Monitoring
- [ ] Sentry account created and DSN configured (free tier is fine)
- [ ] Test that errors are captured (throw a test error, verify it appears in Sentry)

### Final Smoke Test
- [ ] Browse centers as anonymous user (no login)
- [ ] Send a guest enquiry in Chinese → verify center receives bilingual email
- [ ] Send a guest enquiry in English → verify no translation step
- [ ] Create a family account → verify email verification works
- [ ] Create a center account → verify Stripe checkout + 30-day trial
- [ ] Open site in WeChat browser → verify language auto-detects to Chinese
- [ ] Share a center page link in WeChat → verify OG preview shows correctly
- [ ] Open on mobile (iPhone + Android) → verify responsive layout
- [ ] Check /privacy and /terms pages load in both languages

---

## Appendix A: Quick Reference Commands

```bash
# --- Supabase CLI ---
supabase login                                    # Authenticate CLI
supabase link --project-ref YOUR_REF              # Link local project to remote
supabase db push                                  # Push local migrations to remote
supabase functions deploy                         # Deploy all Edge Functions
supabase functions deploy translate-text           # Deploy a single function
supabase functions serve --env-file supabase/.env.local  # Run functions locally
supabase secrets set KEY=value                    # Set Edge Function secret
supabase secrets list                             # List all secrets

# --- Stripe CLI ---
stripe login                                      # Authenticate CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook  # Forward webhooks
stripe trigger checkout.session.completed          # Test webhook event
stripe products list                              # List products
stripe prices list                                # List prices

# --- Development ---
npm install                                       # Install dependencies
npm run dev                                       # Start Vite dev server
npm run build                                     # Production build
npm run preview                                   # Preview production build locally

# --- Git ---
git status                                        # Check current state
git add -A && git commit -m "message"            # Stage and commit
git push origin main                              # Push to GitHub (triggers Vercel deploy)

# --- Vercel CLI (optional) ---
npx vercel                                        # Deploy to Vercel preview
npx vercel --prod                                 # Deploy to production
```

## Appendix B: Troubleshooting

### "CORS error" when calling Edge Functions from localhost

The `_shared/cors.ts` file sets `Access-Control-Allow-Origin: *`. This should work for local development. If you see CORS errors:

1. Verify the Edge Function is deployed and running.
2. Check that the function handles the OPTIONS preflight request (the `handleCors` helper does this).
3. Check the browser console for the exact error. A 500 error from the function will also appear as a CORS error.

### Supabase Edge Function returning 500

1. Check function logs: `supabase functions logs translate-text`
2. Common causes:
   - Missing environment secret (check `supabase secrets list`).
   - Import error in Deno (wrong URL or version).
   - Runtime error in function code.

### Stripe webhook events not arriving

1. Check Stripe Dashboard > Developers > Webhooks > your endpoint. Look at the event log.
2. Common causes:
   - Wrong endpoint URL (must include `/functions/v1/stripe-webhook`).
   - Function deployed WITH JWT verification (must use `--no-verify-jwt`).
   - Wrong webhook signing secret.
3. For local testing, ensure `stripe listen` is running.

### Emails going to spam

1. Verify SPF, DKIM, and DMARC records are all passing. Use https://www.mail-tester.com/ to check.
2. Ensure you are sending from the verified domain (`hello@littlebridge.ai`), not a different address.
3. Avoid spam trigger words in subject lines.
4. Start with a small sending volume and build reputation gradually.

### Google OAuth redirect error

1. Verify the redirect URI in Google Cloud Console matches exactly: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
2. Verify the Site URL in Supabase Auth settings matches your app URL.
3. Ensure both `http://localhost:5173` and `https://littlebridge.ai` are in Authorized JavaScript origins.

### PostGIS queries failing

1. Verify the PostGIS extension is enabled: run `SELECT PostGIS_Version();` in the SQL Editor.
2. Ensure lat/lng columns use the correct data type (`double precision` or `geography`).
3. For distance queries, use `ST_DWithin` with geography type for accurate distance in meters.
