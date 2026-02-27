# LittleBridge -- Lovable Build Guide v2

**Step-by-step prompts to build LittleBridge in Lovable, revised based on consolidated feedback from 5 expert reviewers.**

Every prompt is designed to be pasted directly into Lovable. Each references exact Supabase tables, shadcn/ui components, Tailwind classes, and the LittleBridge color scheme.

**What changed from v1:** This guide incorporates all P0 and P1 findings from the review panel (Rachel Torres, PM; Yuki Tanaka, UX; Karen Mitchell, Center Director; Mei Lin Chen, Family; Sophie Zhang, Educator). Key changes: auth gate removed before enquiry, all forms shortened, empty search results handled aggressively, values quiz cut from onboarding, match score labels replaced with factor badges, center dashboard simplified to one page, AI translation UX improved, "Book a Tour" renamed to "Send Enquiry", educator flow deferred, Google OAuth cut. The guide is shorter and more focused on the core family-to-center enquiry loop.

---

## Pre-Lovable Checklist

Before opening Lovable, make sure every item below is ready.

### Accounts & Projects

- [ ] **Supabase project** created at https://supabase.com -- note the Project URL and Anon Key
- [ ] **Stripe account** created (test mode) -- note Publishable Key and Secret Key
- [ ] **Stripe Product + Price** created: "LittleBridge Center Subscription", $99/month AUD, 30-day trial
- [ ] **Resend account** created -- note the API key and verified sending domain
- [ ] **Claude API key** from Anthropic console (for translation Edge Functions)
- [ ] **Twilio account** created -- note Account SID, Auth Token, and a sending phone number (for SMS notifications to centers)
- [ ] **Domain** registered (e.g., littlebridge.com.au)
- [ ] **GitHub repo** created (Lovable will export here)

> **Changed from v1:** Added Twilio for SMS notifications to centers. Removed Mapbox (deferred -- "Open in Google Maps" link is sufficient for 10-15 centers). Changed trial from 14 days to 30 days per Karen Mitchell's feedback that childcare decisions take longer.

### Environment Variables You Will Need

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Server-side (Supabase Edge Function secrets -- set via `supabase secrets set`):

```
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
ANTHROPIC_API_KEY=sk-ant-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+61...
```

> **Changed from v1:** Removed VITE_MAPBOX_ACCESS_TOKEN (deferred). Added Twilio env vars.

### Supabase Database Tables (already created)

The following tables should exist before you start building in Lovable. If they do not exist yet, create them first using the SQL migration files.

- `profiles` (id, role, email, preferred_language, is_active, onboarding_completed, created_at, updated_at)
- `family_profiles` (id, profile_id, parent_name, chinese_name, phone, wechat_id, suburb, postcode, state, location geography(Point, 4326), communication_language, priorities, additional_notes, additional_notes_translated, values_learning_style, values_cultural_events, values_update_frequency, values_outdoor_time, values_meal_preference, created_at, updated_at)
- `children` (id, family_profile_id, name, date_of_birth, days_per_week, additional_needs, created_at, updated_at)
- `educator_profiles` (id, profile_id, full_name, phone, suburb, postcode, state, location geography(Point, 4326), languages jsonb, qualification, wwcc_number, wwcc_state, wwcc_expiry, first_aid_current, years_experience, employment_preference, pay_min, pay_max, max_commute_km, bio, bio_translated, resume_url, photo_url, is_visible, values_learning_style, values_cultural_events, values_update_frequency, values_outdoor_time, values_meal_preference, created_at, updated_at)
- `center_profiles` (id, profile_id, center_name, slug, abn, address, suburb, postcode, state, location geography(Point, 4326), phone, email, website, description_en, description_zh, operating_hours jsonb, age_groups jsonb, fee_min, fee_max, is_ccs_approved, staff_languages jsonb, programs text[], nqs_rating, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_tier, is_founding_partner, subscription_trial_end, mobile_phone, notification_preference, qr_code_url, founding_partner_expires_at, acecqa_url, values_learning_style, values_cultural_events, values_update_frequency, values_outdoor_time, values_meal_preference, created_at, updated_at)
  - **Note:** `acecqa_url text` -- direct link to the center's ACECQA profile page (e.g., `https://www.acecqa.gov.au/resources/national-registers/search?provider=CENTERNAME`). Populated during onboarding or by admin. Used on the center detail page to link families to the independent government quality report.
- `center_photos` (id, center_profile_id, photo_url, display_order, created_at)
- `enquiries` (id, family_profile_id [nullable], center_profile_id, preferred_tour_datetime, guest_name, guest_email, guest_phone, guest_wechat_id, guest_child_age, guest_child_days_needed, guest_suburb, guest_preferred_language, message_original, message_translated, message_source_language, contact_preference, match_score, match_factors jsonb, status, center_notes, translation_approved, client_ip, is_guest, created_at, updated_at)
- `waitlist` (id, email, suburb, postcode, preferred_language, languages_wanted text[], child_age, created_at)
- `job_listings` (id, center_profile_id, title, employment_type, description_en, description_zh, qualification_required, languages_required jsonb, experience_required, pay_min, pay_max, start_date, visa_sponsorship, status, expires_at, created_at, updated_at)
- `job_applications` (id, educator_profile_id, job_listing_id, cover_note_original, cover_note_translated, cover_note_source_language, available_to_start, interview_availability, match_score, match_factors jsonb, status, center_notes, translation_approved, created_at, updated_at)
- `admin_activity_log` (id, actor_id, action, entity_type, entity_id, metadata, created_at)
- `educator_leads` (id, full_name, email, phone, suburb, languages jsonb, qualification, has_wwcc, preferred_language, created_at) -- NEW: lead capture for educator sign up, no auth required

> **Changed from v1:** Added guest enquiry fields (guest_name, guest_email, guest_phone, guest_wechat_id, guest_child_age, guest_child_days_needed, guest_suburb, guest_preferred_language) to enquiries table so enquiries can be sent without an account. Added client_ip (rate limiting), is_guest, and translation_approved columns. Added `waitlist` table for empty search result capture. Added `is_ccs_approved` and `mobile_phone` to center_profiles. Renamed match_reasons to match_factors (jsonb) throughout. Removed preferred_tour_datetime from enquiries (we are "Send Enquiry" now, not "Book a Tour").

### i18n Files

June should have the `src/i18n/en.json` and `src/i18n/zh.json` files written with all static UI copy before you start. At minimum, have placeholder files with the landing page, navigation, auth, and common labels translated.

**Trust & confidence feature keys** (add to both en.json and zh.json):

| Key | English | Chinese |
|-----|---------|---------|
| `centerDetail.acecqaLink` | "View government quality report →" | "查看政府质量报告 →" |
| `centerDetail.acecqaHelp` | "Independent quality assessment by the Australian Government" | "澳大利亚政府独立质量评估" |
| `centerDetail.foundingPartner` | "Founding Partner · Personally Verified" | "创始合作伙伴 · 亲自验证" |
| `centerDetail.foundingPartnerTooltip` | "This center was personally visited and verified by our founder June." | "该中心由我们的创始人June亲自访问并验证。" |
| `centerDetail.reviews.title` | "What families say" | "家长评价" |
| `centerDetail.reviews.empty` | "Be the first family to share your experience with {centerName}" | "成为第一个分享您在{centerName}体验的家庭" |
| `centerDetail.reviews.comingSoon` | "Reviews coming soon" | "评价功能即将上线" |

### Design Tokens Reference

Paste these into every Lovable prompt as needed:

- Primary blue: `#2563EB` (Tailwind `blue-600`)
- Accent warm orange: `#F59E0B` (Tailwind `amber-500`)
- Background: white `#FFFFFF`
- Text primary: `#1F2937` (Tailwind `gray-800`)
- Text secondary: `#6B7280` (Tailwind `gray-500`)
- Success green: `#10B981` (Tailwind `emerald-500`)
- Error red: `#EF4444` (Tailwind `red-500`) -- use sparingly; prefer amber for warnings to avoid Chinese cultural conflict with red
- Border/divider: `#E5E7EB` (Tailwind `gray-200`)
- Font: Inter (headings), system sans-serif (body), add Chinese font stack: `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- Border radius: `rounded-lg` for cards, `rounded-md` for buttons and inputs
- Minimum touch target: 44x44px on all interactive elements

> **Changed from v1:** Added Chinese font stack per Yuki's recommendation. Added touch target minimum. Added note about red color cultural sensitivity.

---

## Phase 1: Project Setup & Landing Page

### Prompt 1 -- Initial Project Setup

**Paste into Lovable:**

```
Create a new React + TypeScript project with the following setup:

1. Tailwind CSS configured with this custom color palette in tailwind.config.ts:
   - primary: "#2563EB" (blue-600)
   - accent: "#F59E0B" (amber-500)
   - background: "#FFFFFF"
   - foreground: "#1F2937" (gray-800)
   - muted: "#6B7280" (gray-500)
   Add the Chinese font stack to fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' as a fallback after the default sans-serif.

2. shadcn/ui installed and configured with the "default" theme. Import these components: Button, Card, Input, Label, Select, Textarea, Badge, Dialog, Sheet, Tabs, Avatar, Separator, Toast, DropdownMenu, Checkbox, RadioGroup, Switch.

3. Supabase client configured in src/lib/supabase.ts using environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Export a single supabase client instance.

4. React Router v6 configured in src/App.tsx with these routes:
   - / (landing page)
   - /about (about us / founder story)
   - /search (center search)
   - /centers/:slug (center detail)
   - /centers/:slug/enquiry (guest enquiry form -- NO auth required)
   - /ccs-guide (CCS explainer page)
   - /signin (sign in)
   - /signup (sign up)
   - /verify-email (email verification)
   - /forgot-password (forgot password)
   - /family/profile (family profile, protected)
   - /family/enquiries (my enquiries, protected)
   - /educators/signup (educator lead capture)
   - /center/onboard (center onboarding landing page)
   - /center/profile (center profile setup, protected)
   - /center/dashboard (center dashboard, protected)
   - /center/dashboard/subscription (subscription management, protected)
   - /admin (admin dashboard, protected + admin role)

5. A simple i18n context provider in src/contexts/LanguageContext.tsx:
   - Stores current language ("en" or "zh") in React context AND in a cookie (not just localStorage -- cookies are more reliable in WeChat's in-app browser)
   - Auto-detects browser language on first visit (navigator.language starts with "zh" -> "zh", else "en")
   - Provides a useLanguage() hook that returns { language, setLanguage, t }
   - The t() function takes a dot-path key (like "landing.hero.title") and looks it up from JSON translation files at src/i18n/en.json and src/i18n/zh.json
   - Falls back to English if a key is missing in Chinese

6. A ProtectedRoute wrapper component in src/components/ProtectedRoute.tsx that checks for Supabase auth session and redirects to /signin if not authenticated. Pass a returnUrl query param so the user returns to their intended destination after signing in.

7. A simple AuthContext in src/contexts/AuthContext.tsx that:
   - Subscribes to Supabase auth state changes
   - Provides { user, session, profile, loading, signOut } via useAuth() hook
   - Fetches the user's profile from the "profiles" table on auth state change

Use TypeScript throughout. Do NOT add any page content yet -- just placeholder components that say the page name. The app should compile and run with a working router.
```

> **Changed from v1:** Removed routes for values quiz (cut from onboarding), educator profile/quiz/apply (educator flow deferred), and multi-page center dashboard (simplified to one page). Added routes for /about, /ccs-guide, /family/enquiries, /educators/signup (lead capture), and guest enquiry form (no auth required). Changed language persistence from localStorage to cookie. Added returnUrl to ProtectedRoute. Removed Slider from shadcn imports (not needed with simplified forms).
>
> **Changed from v2 initial:** Replaced /educators (coming soon) with /educators/signup (lead capture page). The educator flow is still deferred but we now collect structured lead data (name, languages, suburb, qualification) instead of just an email.

**Supabase tables:** `profiles` (read on auth state change)
**Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
**Claude Code fixes needed:** Verify cookie-based language persistence works in WeChat browser. Wire up ProtectedRoute returnUrl parameter. Add WeChat user agent detection utility in src/lib/wechat.ts (export isWeChat() function that checks for /MicroMessenger/i in navigator.userAgent).

---

### Prompt 2 -- Navigation / Header Component

**Paste into Lovable:**

```
Create a responsive Header/Navigation component at src/components/Header.tsx for LittleBridge, a bilingual childcare marketplace.

Design requirements:
- Sticky top navigation bar with white background, subtle bottom border (border-gray-200), and a gentle shadow (shadow-sm).
- Left side: LittleBridge logo. Use a simple text logo: "LittleBridge" in font-bold text-xl, with "Little" in the primary blue (#2563EB) and "Bridge" in warm orange (#F59E0B). Clicking it navigates to /.
- Center (desktop) / hamburger menu (mobile): Navigation links:
  - "Find Centers" -> /search
  - "Find Jobs" -> /educators/signup (educator lead capture -- links here until full job search is built)
  - "For Centers" -> /center/onboard
  - "About" -> /about
- Right side:
  - Language toggle: Two buttons "EN" and "中文" side by side. The active language has bg-blue-600 text-white, inactive has bg-gray-100 text-gray-600. Use the useLanguage() hook to toggle. Each button must be at least 44px tall for touch targets. Use text-sm, px-3 py-2.
  - If NOT logged in: "Sign In" ghost button (text-blue-600).
  - If logged in: User avatar/initials dropdown (using shadcn DropdownMenu) with links to "My Profile" (route depends on role), "My Enquiries" (for family role, -> /family/enquiries), "Dashboard" (for center role, -> /center/dashboard), and "Sign Out".

Mobile behavior:
- On screens below md breakpoint, collapse nav links into a Sheet (shadcn) that slides in from the right.
- Language toggle and Sign In button remain visible in the mobile header (not hidden in the Sheet).
- Sheet contains nav links, and when logged in, the profile/dashboard links.
- All touch targets in the Sheet must be at least 44px tall with adequate spacing.

Use the useAuth() hook from AuthContext to check login state and get the user profile. Use the useLanguage() hook for the language toggle. All text labels should use the t() translation function with keys like "nav.findCenters", "nav.forCenters", "nav.about", "nav.signIn", "nav.myProfile", "nav.myEnquiries", "nav.dashboard", "nav.signOut".

The header should be included in the App.tsx layout so it appears on every page.
```

> **Changed from v1:** Removed "Find Jobs" nav link (educator flow deferred). Added "About" link. Changed language toggle from "ZH" to "中文" for clarity. Increased touch target sizes. Removed "Sign Up" button from header (reduce decision points -- Sign In page has a sign up link). Added "My Enquiries" to dropdown for family role.
>
> **Changed from v2 initial:** Re-added "Find Jobs" nav link, now pointing to /educators/signup (lead capture page) instead of /jobs. This gives educators a clear entry point from the header while the full job search flow is deferred to Month 2.

**Supabase tables:** `profiles` (via AuthContext)
**Environment variables:** None
**Claude Code fixes needed:** Verify DropdownMenu routes correctly based on user role. Add aria labels for accessibility. Test in WeChat in-app browser.

---

### Prompt 3 -- Landing Page

**Paste into Lovable:**

```
Create a conversion-focused, trust-first landing page at src/pages/Landing.tsx for LittleBridge -- a bilingual childcare marketplace connecting Chinese/Mandarin-speaking families and childcare centers in Australia.

This page must feel warm, personal, and trustworthy -- NOT like a SaaS template. Design mobile-first. Use all text from the t() translation function (useLanguage hook).

SECTION 1 -- Hero:
- Full-width section with a soft gradient background from blue-50 to white.
- Left side (or stacked on mobile):
  - Large heading: t("landing.hero.title") -- style: text-3xl md:text-5xl font-bold text-gray-800, max-w-2xl. The Chinese version should lead with educational aspiration, not language deficit.
  - Subheading: t("landing.hero.subtitle") -- text-lg text-gray-600, max-w-xl, mt-4.
  - Single prominent CTA button: t("landing.hero.cta") e.g., "Find Centers Near You" / "搜索附近的中心" -- bg-blue-600 text-white text-lg px-8 py-4 rounded-md hover:bg-blue-700, minimum 44px tall. Links to /search.
  - Below the CTA: a subtle trust line with a real number: t("landing.hero.trust") -- text-sm text-gray-500, e.g., "Helping 200+ families find bilingual childcare in Sydney and Melbourne"
- Right side (hidden on mobile): placeholder for a warm photo of a Chinese-Australian family (div with rounded-2xl bg-blue-50 h-80 w-full max-w-md). Do NOT use a generic stock photo placeholder -- leave it as a styled div with a small ImageIcon and text "Family photo".

SECTION 2 -- Founder Story (TRUST SIGNAL -- immediately after hero):
- Soft background section (bg-white py-12).
- Flex row (stack on mobile): Left side is a circular placeholder photo area (w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg) for June's photo. Right side:
  - Quote: t("landing.founder.quote") -- text-lg italic text-gray-700, e.g., "I built LittleBridge because I watched too many Chinese families struggle to find childcare that understood their language and culture."
  - Name: t("landing.founder.name") -- "June, Founder" in font-semibold text-gray-800.
  - Brief bio: t("landing.founder.bio") -- text-sm text-gray-500, e.g., "Early childhood educator. Chinese-Australian mum. 10+ years in childcare."
  - Link: "Read our story" -> /about, text-sm text-blue-600.
- Below the quote: a row of trust badges (flex flex-wrap gap-4 mt-6):
  - "Australian Business" with a small shield icon (text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1 border border-gray-200)
  - "Your data stays in Australia" (same style)
  - "{X} Centers Listed" (same style)

SECTION 3 -- How It Works (3 steps, simple):
- Section heading: t("landing.howItWorks.heading") -- text-2xl font-bold text-center.
- Three steps in a horizontal flow (grid grid-cols-1 md:grid-cols-3 gap-8 mt-8), each centered:
  - Step 1: Number badge "1" (bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto), title: t("landing.howItWorks.step1.title") e.g., "Search by suburb", description: t("landing.howItWorks.step1.description")
  - Step 2: Number "2", title: "View center profiles" (bilingual descriptions, staff languages, photos)
  - Step 3: Number "3", title: "Send an enquiry in Chinese or English" (the center receives a translated version)
- On desktop, connect steps with a subtle dashed line (border-dashed border-gray-300).

SECTION 4 -- Social Proof:
- Soft gray background (bg-gray-50 py-16).
- Section heading: t("landing.social.heading")
- Two testimonial cards side by side (grid grid-cols-1 md:grid-cols-2 gap-6, max-w-3xl mx-auto):
  - Each card: white bg, rounded-lg, p-6, shadow-sm. Italic quote text, name + suburb below. Use warm style, not star ratings.
  - Use t("landing.social.testimonial1.quote"), t("landing.social.testimonial1.name"), etc.
- Below: a single centered stat: t("landing.social.stat") e.g., "Connecting families with {X} bilingual centers across Sydney and Melbourne" in text-lg font-medium text-gray-700.

SECTION 5 -- For Centers CTA Banner:
- Full-width section with bg-blue-600 text-white py-12 text-center.
- Heading: t("landing.centerCta.heading") -- text-2xl font-bold, e.g., "Are you a childcare center?"
- Subtext: t("landing.centerCta.subtitle") -- text-lg opacity-90, e.g., "Connect with Mandarin-speaking families actively looking for bilingual care in your area."
- Button: t("landing.centerCta.button") -- bg-white text-blue-600 font-semibold rounded-md px-6 py-3 hover:bg-blue-50. Links to /center/onboard.

SECTION 6 -- Chinese-language Privacy Statement:
- Small, centered text section (max-w-2xl mx-auto py-8 text-center).
- Only visible when language is "zh".
- t("landing.privacy") -- text-sm text-gray-500, e.g., a brief statement in Chinese about data being stored in Australia, not shared with overseas entities, and only shared with centers the family contacts.

Make the page fully responsive and mobile-first. Use consistent spacing: py-12 or py-16 for sections, max-w-5xl mx-auto px-4 for content width. All text uses the t() function. Add CSS `overscroll-behavior: none` on this page.
```

> **Changed from v1:** Restructured to lead with trust signals (founder story, privacy, real numbers) instead of feature cards per Yuki/Mei Lin feedback. Removed the three value-prop cards (too SaaS-like). Removed "I'm an Educator" CTA (educator flow deferred). Added founder story section prominently. Added Chinese privacy statement. Added trust badges. Simplified to single CTA in hero ("Find Centers Near You"). Reduced testimonials from 3 to 2 (less is more at launch). Added overscroll-behavior CSS for WeChat. All touch targets 44px minimum.

**Supabase tables:** None (static page)
**Environment variables:** None
**Claude Code fixes needed:** Add proper Open Graph meta tags for WeChat sharing (both EN and ZH versions with Chinese title/description/image). Add structured data (JSON-LD) for SEO. Replace placeholder divs with actual photos once available. Wire up the real center count from database (or hardcode for launch). Ensure OG tags produce proper Chinese preview card when shared in WeChat.

---

### Prompt 4 -- Footer Component

**Paste into Lovable:**

```
Create a Footer component at src/components/Footer.tsx for LittleBridge.

Design:
- Background: bg-gray-900 text-white py-12.
- Max width container: max-w-5xl mx-auto px-4.
- Three-column grid on desktop (grid-cols-1 md:grid-cols-3 gap-8), stacking on mobile.

Column 1 -- Brand:
- "LittleBridge" logo text (same style as header but in white).
- Tagline: t("footer.tagline") in text-sm text-gray-400, mt-2.
- Language toggle (same EN/中文 buttons as header, styled for dark background: active = bg-white text-gray-900, inactive = bg-gray-700 text-gray-300).

Column 2 -- For Families:
- Heading: t("footer.families.heading") in text-sm font-semibold uppercase tracking-wide text-gray-400.
- Links (text-gray-300 hover:text-white text-sm space-y-2):
  - t("footer.families.search") -> /search
  - t("footer.families.ccsGuide") -> /ccs-guide
  - t("footer.families.about") -> /about

Column 3 -- For Centers:
- Heading: t("footer.centers.heading")
- Links:
  - t("footer.centers.listCenter") -> /center/onboard
  - t("footer.centers.pricing") -> /center/onboard#pricing
  - t("footer.centers.login") -> /signin

Bottom bar:
- Separator (border-t border-gray-700 mt-8 pt-8).
- Flex row with:
  - Left: t("footer.copyright") in text-sm text-gray-500.
  - Right: Links to Privacy Policy and Terms of Service (text-sm text-gray-500 hover:text-gray-300, spaced with mx-4). Link to /privacy and /terms (placeholder pages).

Include the Footer in App.tsx layout so it appears on every page below the main content. Make sure the main content area has min-h-screen so the footer is always pushed to the bottom.
```

> **Changed from v1:** Reduced from 4 columns to 3 (removed Educator column since flow is deferred). Added CCS Guide link. Simplified overall.

**Supabase tables:** None
**Environment variables:** None
**Claude Code fixes needed:** Create placeholder /privacy and /terms pages. Add dynamic copyright year.

---

### Prompt 5 -- About Us / Founder Story Page

**Paste into Lovable:**

```
Create an About Us page at src/pages/About.tsx for LittleBridge.

This page is a key trust signal, especially for Chinese-speaking families. It should feel personal, warm, and genuine.

Layout:
- Max-w-3xl mx-auto py-12 px-4.

Section 1 -- June's Story:
- Large circular photo placeholder (w-32 h-32 rounded-full bg-gray-200 mx-auto) for June's photo.
- Heading: t("about.title") -- text-3xl font-bold text-center text-gray-800, mt-6. E.g., "The Story Behind LittleBridge"
- Body text: t("about.story") -- text-lg text-gray-600 leading-relaxed mt-4. This should be a personal, warm narrative in first person from June about why she built LittleBridge. 3-4 paragraphs.

Section 2 -- Our Mission:
- Heading: t("about.mission.title") -- text-2xl font-bold text-gray-800 mt-12.
- Body: t("about.mission.body") -- text-gray-600 leading-relaxed.
- Three brief value statements in a grid (grid-cols-1 md:grid-cols-3 gap-6 mt-8):
  - Each: Card with p-4, icon (Heart, Globe, Shield from Lucide, text-blue-600 w-8 h-8), title, short description.
  - Values: "Every family deserves to be understood", "Language should never be a barrier", "Your data, your control"

Section 3 -- Contact:
- Simple section: "Questions? Reach out to June directly" with email link.
- WeChat QR code placeholder (w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 mx-auto mt-4) with text "Scan to add on WeChat".

CTA at bottom:
- "Find Centers Near You" button -> /search. Primary blue, centered.

All text uses t() under "about.*". Page should be fully bilingual.
```

> **New in v2:** This page did not exist in v1. Added based on unanimous reviewer feedback that June's personal story is the strongest trust signal for Chinese families. Dr. Liu's cultural review emphasized that trust flows from personal relationships, not brands.

**Supabase tables:** None
**Environment variables:** None
**Claude Code fixes needed:** Add actual WeChat QR code image. Add OG meta tags for sharing.

---

## Phase 2: Authentication

### Prompt 6 -- Sign Up Page

**Paste into Lovable:**

```
Create a Sign Up page at src/pages/SignUp.tsx for LittleBridge.

Layout:
- Centered card layout: white card (max-w-md mx-auto mt-12 p-8 rounded-lg shadow-sm border border-gray-200) on a bg-gray-50 min-h-screen page.
- LittleBridge logo text at the top of the card, centered.
- Heading: t("auth.signup.title") -- text-2xl font-bold text-center text-gray-800.
- Subtitle: t("auth.signup.subtitle") -- text-sm text-gray-500 text-center mt-1.

Step 1 -- Role Selection:
- Before showing the form, show 2 role selection cards (families can send enquiries without an account, so this signup is for those who want to track enquiries or are centers):
  - "I'm a Family" -- icon: Users, description: t("auth.signup.familyDesc") e.g., "Track your enquiries and get notified when centers respond", value: "family"
  - "I'm a Center Director" -- icon: Building2, description: t("auth.signup.centerDesc") e.g., "List your center and receive family enquiries", value: "center"
- Cards are stacked vertically, border border-gray-200 rounded-md p-4 cursor-pointer. Selected card has border-blue-600 bg-blue-50 ring-2 ring-blue-600. Each card has a radio circle indicator on the left.
- All touch targets 44px minimum height.
- "Continue" button below (disabled until a role is selected).

Step 2 -- Registration Form (shown after role selection):
- Show a "Back" link to return to role selection.
- Form fields (using shadcn Input + Label):
  - Email (type email, required)
  - Password (type password, required, min 8 characters)
  - Confirm Password (type password, required, must match)
- Each field has a Label above and validation error text below in text-sm text-red-500.
- "Create Account" button: full width, bg-blue-600 text-white, loading spinner when submitting. Minimum 44px height.
- NO Google OAuth button.

Behavior:
- On submit, call Supabase auth.signUp({ email, password }) with metadata { role: selectedRole }.
- After successful signup, insert a row into the "profiles" table with { id: user.id, role: selectedRole, email: email, preferred_language: current language from useLanguage() }.
- DO NOT block the user at email verification. Navigate directly based on role:
  - family -> /family/profile
  - center -> /center/profile
- Send verification email in the background but let the user continue immediately.
- Show toast errors for any Supabase auth errors.
- If URL has query param ?role=center, pre-select the center role.
- If URL has query param ?returnUrl=..., store it and redirect there after signup.

Bottom of card:
- t("auth.signup.hasAccount") + link to /signin -- text-sm text-center text-gray-500.
- Additional note: t("auth.signup.guestNote") -- text-xs text-gray-400 text-center mt-4, e.g., "You can also send enquiries to centers without creating an account."

All text labels use the t() function with keys under "auth.signup.*".
```

> **Changed from v1:** Removed Google OAuth entirely (breaks in WeChat browser, primary audience does not use Google). Removed educator role from signup (educator flow deferred). Email verification is non-blocking -- user proceeds immediately. Added returnUrl support. Added guest enquiry note. Reduced to 2 role choices.

**Supabase tables:** `auth.users` (write via signUp), `profiles` (write)
**Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
**Claude Code fixes needed:** Handle the profiles table insert (check if trigger already creates the row). Handle returnUrl redirect. Send verification email non-blocking. Test in WeChat browser.

---

### Prompt 7 -- Sign In Page

**Paste into Lovable:**

```
Create a Sign In page at src/pages/SignIn.tsx for LittleBridge.

Layout:
- Same centered card layout as Sign Up page.
- LittleBridge logo text at top, centered.
- Heading: t("auth.signin.title") -- text-2xl font-bold text-center.
- Subtitle: t("auth.signin.subtitle") -- text-sm text-gray-500 text-center.

Form fields:
- Email (type email, required)
- Password (type password, required)
- "Forgot password?" link below the password field, right-aligned, text-sm text-blue-600 hover:underline -> /forgot-password.

Button:
- "Sign In" -- full width, bg-blue-600 text-white, loading spinner. Min 44px height.
- NO Google OAuth button.

Behavior:
- On submit, call Supabase auth.signInWithPassword({ email, password }).
- On success, check for returnUrl query param first. If present, navigate there.
- Otherwise navigate based on user role:
  - If role is "family" and onboarding_completed is false -> /family/profile
  - If role is "center" and onboarding_completed is false -> /center/profile
  - Otherwise, navigate to / (home).
- Show toast errors for invalid credentials.

Bottom:
- t("auth.signin.noAccount") + link to /signup.

All labels use t() with keys under "auth.signin.*".
```

> **Changed from v1:** Removed Google OAuth. Added returnUrl support. Simplified.

**Supabase tables:** `auth.users` (read via signIn), `profiles` (read for role + onboarding status)
**Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
**Claude Code fixes needed:** Implement returnUrl redirect. Test the role-based redirect logic.

---

### Prompt 8 -- Forgot Password Flow

**Paste into Lovable:**

```
Create two pages for the forgot password flow:

PAGE 1: src/pages/ForgotPassword.tsx
- Same centered card layout as Sign In.
- Heading: t("auth.forgot.title") -- text-2xl font-bold.
- Description: t("auth.forgot.description") -- text-gray-600 text-sm.
- Email input field with Label.
- "Send Reset Link" button: full width, bg-blue-600 text-white. Min 44px height.
- On submit: call supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' }).
- After submit: show a success state (replace form with confirmation message + mail icon). Show "Back to Sign In" link.

PAGE 2: src/pages/ResetPassword.tsx (add route /reset-password to the router)
- Same card layout.
- Heading: t("auth.reset.title") -- text-2xl font-bold.
- Two fields: New Password + Confirm New Password (both required, min 8 chars).
- "Reset Password" button: full width, bg-blue-600 text-white.
- On submit: call supabase.auth.updateUser({ password: newPassword }).
- On success: show success toast, navigate to /signin after 2 seconds.
- Handle errors with toast messages.

All labels use t() under "auth.forgot.*" and "auth.reset.*".
```

**Supabase tables:** `auth.users` (password reset)
**Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
**Claude Code fixes needed:** Configure reset redirect URL in Supabase dashboard. Test end-to-end.

---

## Phase 3: Family Flow

### Prompt 9 -- Family Profile Creation (Simplified)

**Paste into Lovable:**

```
Create a Family Profile creation page at src/pages/family/FamilyProfile.tsx.

This is the onboarding form families fill out after signing up. It must be SHORT -- 4 required fields only. Everything else is collected progressively later.

Route: /family/profile (protected)

Layout:
- Max-w-lg mx-auto py-8 px-4.
- Heading: t("family.profile.title") -- text-2xl font-bold text-gray-800, e.g., "Tell us a little about your family"
- Subtitle: t("family.profile.subtitle") -- text-gray-600 text-sm mt-1, e.g., "This takes about 30 seconds. You can add more details later."

Form (ONLY 4 fields -- this is critical):

1. Your name (Input, required, placeholder: t("family.profile.namePlaceholder") e.g., "Your name / 您的名字")

2. Your child's age (Select dropdown, required -- NOT a date picker):
   - Options: "Under 1 year", "1 year", "1.5 years", "2 years", "2.5 years", "3 years", "3.5 years", "4 years", "4.5 years", "5 years", "5+ years"
   - Label: t("family.profile.childAge")
   - This is faster and more natural for Chinese parents than a date picker.

3. Your suburb (Input, required, placeholder: "e.g., Chatswood / 车士活")
   - Label: t("family.profile.suburb")

4. Preferred language (RadioGroup with two options, required):
   - "Mandarin / 中文" (default to "zh" if current UI language is zh)
   - "English"
   - Label: t("family.profile.preferredLanguage")

That's it. Four fields.

Below the form:
- "Save & Start Browsing" primary button (bg-blue-600 text-white px-6 py-3 rounded-md, full width, min 44px height). This is the ONLY button.
- Below button: text-xs text-gray-400: t("family.profile.moreNote") -- "You can add more details about your family later to get better recommendations."

Behavior:
- On submit, upsert to the "family_profiles" table: { profile_id, parent_name, suburb, communication_language }.
- Also insert a child into the "children" table with the approximate DOB calculated from the age selection.
- Update the "profiles" table: set onboarding_completed = true.
- Navigate to /search (start browsing centers immediately).
- Show loading spinner on button while saving.
- Show toast on error.
- Add auto-save: save partial form data to a cookie every time a field changes, so if the user navigates away and comes back, fields are pre-filled.

All labels use t() under "family.profile.*".
```

> **Changed from v1:** Drastically reduced from 15+ fields to 4 required fields. Removed: Chinese name, phone, WeChat ID, children sub-form with DOB date picker and days/week, priorities multi-select checkboxes, additional notes textarea, and "Save & Continue to Values Quiz" flow. Replaced DOB date picker with age dropdown (faster, works in all browsers, matches how Chinese parents think about age). Removed progress indicator (no more multi-step onboarding). Added auto-save via cookie. This is the single biggest time-saving change per all 5 reviewers.

**Supabase tables:** `family_profiles` (upsert), `children` (insert), `profiles` (update onboarding_completed)
**Environment variables:** None
**Claude Code fixes needed:** Calculate approximate DOB from age selection for the children table. Add suburb geocoding (lat/lng) -- use a static JSON of Australian suburbs for now. Add auto-save cookie logic. Build "Edit Profile" page later with the additional fields (phone, WeChat, children details, priorities) as progressive collection.

---

### Prompt 10 -- Center Search Page

**Paste into Lovable:**

```
Create a Center Search page at src/pages/Search.tsx for LittleBridge.

This is the main discovery page. It must be fast, mobile-first, and NEVER show a blank "no results" page.

Layout:
- Mobile-first single column. On desktop, filters in a collapsible panel, not an always-visible sidebar.
- Top section:
  - Page heading: t("search.title") -- text-2xl font-bold.
  - Search bar: prominent Input with Search icon (Lucide), placeholder: t("search.placeholder") e.g., "Enter suburb or postcode / 输入区域名称...". Full width, h-12, text-lg, border-2 border-gray-200 focus:border-blue-600 rounded-lg. Min 44px height.
  - Below search bar: a filter bar row with:
    - "Filters" button (outline style, with SlidersHorizontal icon) that opens a Sheet (mobile) or toggles a collapsible panel (desktop) with filters.
    - Sort dropdown (Select, compact): "Nearest" (default), "Newest".
    - Result count: t("search.resultCount", { count }) in text-sm text-gray-500.

Filters (in Sheet on mobile, collapsible panel on desktop):
1. Distance: Select dropdown (not slider) with options: 5 km, 10 km (default), 15 km, 20 km, Any distance. Only enabled if a suburb is entered.
2. Languages: Checkbox group (vertical, each 44px touch target):
   - Mandarin
   - Cantonese
   - English
3. Age Group: Checkbox group:
   - 0-2 years (Nursery)
   - 2-3 years (Toddler)
   - 3-5 years (Preschool)
- "Apply" button in Sheet footer (mobile). "Clear All" text link.

Results area:
- Grid of CenterCard components: grid grid-cols-1 md:grid-cols-2 gap-4.
- Each CenterCard (create as src/components/CenterCard.tsx):
  - Card with border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer.
  - Top: photo area (h-40, bg-gray-100, object-cover). If no photo, show a placeholder with Building2 icon and center name.
  - Body (p-4):
    - If center_profiles.is_founding_partner = true: show a small "Founding Partner · Personally Verified" badge at the top of the body. Style: bg-amber-50 border border-amber-300 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2 inline-flex items-center gap-1, with a Shield icon (w-3 h-3). Use t("centerDetail.foundingPartner") for the label.
    - Center name: text-lg font-semibold text-gray-800 truncate.
    - Suburb + distance: text-sm text-gray-500 (e.g., "Chatswood -- 2.3 km").
    - FACTOR BADGES row (flex flex-wrap gap-1.5 mt-2): These are the key information. Show as small Badge components:
      - Language badges: "Mandarin spoken" (bg-red-50 text-red-700), "Cantonese spoken" (bg-orange-50 text-orange-700) -- only show languages the center has.
      - Distance badge: "2.3 km away" (bg-blue-50 text-blue-700) -- only if user entered a suburb.
      - Vacancy badge: "Vacancies available" (bg-emerald-50 text-emerald-700) if any age group has vacancies. OR "Waitlist" (bg-amber-50 text-amber-700).
      - Program badges: "Bilingual program" (bg-purple-50 text-purple-700) if applicable.
    - Fee range: text-sm text-gray-500 mt-2 (e.g., "$95 - $140 / day").
    - NO match score label. Factor badges ARE the match information.
  - Bottom: CTA area with "Send Enquiry" text-link in text-blue-600 text-sm font-medium.
  - Clicking the card navigates to /centers/{slug}.

Loading state: Show 4 skeleton cards (animated placeholder shapes) while data loads.

EMPTY STATE (THIS IS CRITICAL -- never show a blank page):
When search returns 0 results for the entered suburb:
1. Auto-expand: Immediately fetch and show the nearest 3-5 centers regardless of distance. Show them with a heading: t("search.nearby") e.g., "Centers nearest to [suburb]:" with their actual distance.
2. Waitlist capture: Below the nearby results, show a prominent Card (bg-blue-50 border-blue-200 rounded-lg p-6 text-center):
   - Heading: t("search.waitlist.title") e.g., "No centers in [suburb] yet"
   - Body: t("search.waitlist.body") e.g., "We're growing! Leave your email and we'll notify you when a center joins in your area."
   - Email input + "Notify Me" button (inline, bg-blue-600 text-white).
   - On submit: insert into "waitlist" table: { email, suburb, postcode, preferred_language }.
   - Success state: checkmark + "We'll let you know!"
3. Below waitlist: t("search.waitlist.knowCenter") e.g., "Know a center that should be on LittleBridge?" with a link to a mailto: or /center/onboard.
NEVER show just "No results found. Try broadening your search." That message kills the product.

Data fetching:
- Fetch from "center_profiles" where subscription_status in ('active', 'trialing', 'founding_partner') and is_active = true.
- Also fetch the first photo for each center from "center_photos" (where display_order = 0).
- Apply filters client-side for MVP.
- This page does NOT require authentication.
- Use match_score for sort order behind the scenes, but do not display it.

All text labels use t() under "search.*".
```

> **Changed from v1:** Filters moved to collapsible panel/Sheet instead of always-visible sidebar (mobile-first). Replaced match score badges with factor badges on cards per reviewer consensus. Built aggressive empty state handling with auto-expand radius, waitlist capture, and center recommendation prompt per Rachel/Yuki/Mei Lin. Distance filter changed from Slider to Select (simpler, faster). Removed "Vacancies Only" switch and Programs filter (too many filters for 10-15 centers). All touch targets 44px. Sort options simplified (removed "Best Match" label). Added "Send Enquiry" text link on cards. Renamed from "Book a Tour" throughout.

**Supabase tables:** `center_profiles` (read), `center_photos` (read), `waitlist` (insert)
**Environment variables:** None
**Claude Code fixes needed:** Implement distance calculation (PostGIS or client-side haversine). Wire up the nearest-centers fallback for empty results. Add suburb geocoding. Add URL query param persistence for filters. Add pagination for future growth.

---

### Prompt 11 -- Center Detail / Profile Page

**Paste into Lovable:**

```
Create a Center Detail page at src/pages/CenterDetail.tsx.

Route: /centers/:slug

This is the public profile page for a childcare center. It must feel trustworthy and informative, with a clear path to enquiry.

Layout:
- Full width content, max-w-4xl mx-auto px-4 py-6.

Photo Section (top):
- If photos exist: show a simple grid. First photo large (h-48 md:h-64, w-full, object-cover, rounded-lg). If 2-4 photos exist, show them in a 2x2 grid below (h-24 each, rounded-md). No fullscreen carousel.
- If no photos: show a large placeholder (h-48 bg-gray-100 rounded-lg) with Building2 icon centered and center name.

Content (single column on mobile, two-column on desktop: left 2/3, right 1/3):

LEFT COLUMN:

1. Center name: text-2xl md:text-3xl font-bold text-gray-800.
2. Suburb + NQS rating + ACECQA link inline: suburb in text-gray-500, NQS as a Badge (e.g., "Exceeding NQS" in bg-emerald-100 text-emerald-700). Add a small info tooltip on the NQS badge: t("centerDetail.nqsExplainer") e.g., "NQS is the Australian government quality rating. 'Exceeding' is the highest level."
   - Below the NQS badge, show a link: t("centerDetail.acecqaLink") -- "View government quality report →" styled as text-sm text-blue-600 hover:underline. Opens in a new tab (target="_blank" rel="noopener noreferrer"). URL comes from center_profiles.acecqa_url, or falls back to https://www.acecqa.gov.au/resources/national-registers/search?provider={center_name_url_encoded}. Only show if nqs_rating is not null.
   - Below the link, add helper text: t("centerDetail.acecqaHelp") -- "Independent quality assessment by the Australian Government" in text-xs text-gray-400.

3. Founding Partner badge (conditional):
   - If center_profiles.is_founding_partner = true, show a special badge ABOVE the factor badges row:
   - Badge style: bg-amber-50 border border-amber-300 text-amber-800 rounded-full px-4 py-1.5 text-sm font-semibold, with a Shield icon (Lucide, w-4 h-4 inline mr-1).
   - Label: t("centerDetail.foundingPartner") -- "Founding Partner · Personally Verified" / "创始合作伙伴 · 亲自验证"
   - Add a tooltip (shadcn Tooltip or title attribute): t("centerDetail.foundingPartnerTooltip") -- "This center was personally visited and verified by our founder June."

4. Factor badges row (flex flex-wrap gap-2 mt-3): same badges as search cards but larger (text-sm px-3 py-1):
   - "Mandarin spoken (3 staff)" in bg-red-50 text-red-700
   - "Cantonese spoken (1 staff)" if applicable
   - "Bilingual program" if applicable
   - "CCS Approved" in bg-emerald-50 text-emerald-700 (if is_ccs_approved is true)
   - "Vacancies available" if applicable

5. Bilingual Description section:
   - Show description in the user's current language (description_en or description_zh).
   - Below, a toggle link: "View Chinese version / 查看中文版" or "View English version" that reveals the other language in a bg-gray-50 rounded-md p-3.
   - If showing the AI-generated Chinese version, show a subtle label: t("centerDetail.bilingualNote") -- "Chinese version / 中文版" in text-xs text-gray-400. Do NOT say "Translated by AI". Just present it as the bilingual version.
   - Always show both the original and the other language available.

6. Programs & Features section:
   - Heading: t("centerDetail.programs")
   - Flex wrap of program badges (rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-sm).

7. Age Groups & Vacancies section:
   - Simple list showing each offered age group with vacancy status:
   - Green dot + "Available" / Amber dot + "Waitlist" / Gray dot + "Full" (NOT red for "Full" -- red has positive connotations in Chinese culture).

8. Fee & CCS section:
   - Fee range: "$X - $X per day" in text-lg font-medium.
   - CCS callout Card (bg-blue-50 border-blue-200 rounded-md p-3 mt-2):
     - t("centerDetail.ccsNote") -- brief text: "Most families receive the Child Care Subsidy (CCS), which can reduce fees by 50-90% depending on income."
     - Link: "Learn about CCS / 了解儿童保育补贴" -> /ccs-guide

9. Location section:
   - Address text displayed.
   - "Open in Google Maps" link (prominent, with MapPin icon) that links to https://www.google.com/maps?q={lat},{lng}. Min 44px touch target.
   - No embedded map (deferred).

10. Parent Reviews section (placeholder for Month 2):
   - Heading: t("centerDetail.reviews.title") -- "What families say / 家长评价" in text-xl font-semibold text-gray-800, mt-8.
   - Empty state (shown for now): a Card with bg-gray-50 border border-gray-200 rounded-lg p-6 text-center.
     - MessageSquare icon (Lucide, w-10 h-10 text-gray-300 mx-auto).
     - Text: t("centerDetail.reviews.empty") -- "Be the first family to share your experience with {centerName}" in text-sm text-gray-500 mt-2. Interpolate the center name.
     - Button: "Write a Review" -- outline style, disabled, with a "Coming soon" tooltip. Use t("centerDetail.reviews.comingSoon") -- "Reviews coming soon" as the button text or tooltip.
   - Note for developers: Reviews will be enabled once the center has received 3+ enquiries through LittleBridge. The review system is planned for Month 2.

11. QR Code section (small, bottom of left column):
   - Heading: t("centerDetail.share") -- "Share this center"
   - A placeholder div (w-32 h-32 bg-gray-100 rounded-lg border border-gray-200) for a QR code that links to this center's page.
   - "Copy Link" button with Link2 icon.
   - Pre-formatted share text for WeChat: t("centerDetail.shareText") e.g., "[Center Name] - Mandarin-speaking staff, [suburb]. View on LittleBridge: [URL]"

RIGHT COLUMN (sticky on desktop, top-20 -- appears first on mobile as a bottom-sticky CTA bar):

1. Enquiry CTA Card:
   - Card with border-2 border-blue-600 rounded-lg p-6.
   - Heading: t("centerDetail.enquiryCta") -- text-xl font-bold, e.g., "Contact this center / 联系这家中心"
   - Fee summary: "From $X/day" in text-gray-600. If is_ccs_approved: "CCS approved -- subsidy may apply" in text-sm text-emerald-600.
   - Vacancy summary: e.g., "Vacancies in Toddler and Preschool" in text-sm text-emerald-600.
   - "Send Enquiry / 发送咨询" button: full width, bg-blue-600 text-white py-3 text-lg font-semibold rounded-md hover:bg-blue-700. Min 44px.
   - Button links to /centers/{slug}/enquiry. NO auth required.
   - Below button: t("centerDetail.enquiryNote") -- text-xs text-gray-400, "No account needed. Write in Chinese or English."

2. On MOBILE: the CTA card becomes a bottom-sticky bar (fixed bottom-0, bg-white border-t border-gray-200 p-3, z-50) showing just the "Send Enquiry / 发送咨询" button, full width. Tapping scrolls to top or navigates to enquiry form.

Data fetching:
- Fetch from "center_profiles" where slug = :slug.
- Fetch photos from "center_photos" ordered by display_order.
- Handle 404 if slug not found.
- No auth required.

All text uses t() under "centerDetail.*".
```

> **Changed from v1:** Replaced match score card with factor badges. Renamed "Book a Tour" to "Send Enquiry / 联系这家中心" throughout. Enquiry button links to guest enquiry form (no auth required). Added CCS callout with link to explainer page. Changed "Full" vacancy from red to gray (cultural sensitivity). Replaced fullscreen photo carousel with simple grid. Replaced "Translated by AI" label with neutral "Chinese version" per reviewer consensus. Added QR code section for WeChat sharing. Added bottom-sticky CTA bar on mobile. Added NQS explainer tooltip. Removed Mapbox map (deferred), replaced with "Open in Google Maps" link. Removed contact info card (contact goes through enquiry form). Added WeChat share pre-formatted text. **Added in trust update:** ACECQA government quality report link, Founding Partner badge (conditional on is_founding_partner), and parent reviews placeholder section (empty state for Month 2).

**Supabase tables:** `center_profiles` (read by slug, including acecqa_url and is_founding_partner), `center_photos` (read)
**Environment variables:** None
**Claude Code fixes needed:** Generate QR codes (use a library like qrcode.react). Add dynamic OG meta tags for WeChat sharing (center name + first photo + Chinese description). Build the bottom-sticky CTA bar for mobile. Handle 404. Build ACECQA URL fallback logic (URL-encode center name if acecqa_url is null). Ensure Founding Partner badge renders on both CenterCard and CenterDetail.

---

### Prompt 12 -- Guest Enquiry Form (No Auth Required)

**Paste into Lovable:**

```
Create a Guest Enquiry Form page at src/pages/EnquiryForm.tsx.

Route: /centers/:slug/enquiry -- this page does NOT require authentication.

This is the most important conversion page in the entire app. A family can send an enquiry without creating an account. The form captures everything the center needs.

Layout:
- Max-w-lg mx-auto py-6 px-4.
- Back link at top: "< Back to {center name}" linking to /centers/{slug}. Min 44px touch target.

Context card at top:
- Small Card showing the center they're enquiring about: center name, suburb, first photo thumbnail (or Building2 icon). Fetched from "center_profiles" by slug.

Form:
- Heading: t("enquiry.title") -- text-2xl font-bold, "Send an Enquiry / 发送咨询"
- Subtitle: t("enquiry.subtitle") -- text-gray-600 text-sm, e.g., "The center will receive your message in English (we'll translate if needed). No account required."

Fields (use a step-by-step wizard on mobile -- one group per screen with a progress bar. On desktop, show all fields on one page):

STEP 1 -- About You:
1. Your name (Input, required, placeholder: "Your name / 您的名字")
2. Email (Input, type email, required, placeholder: "your@email.com")
3. Phone or WeChat (Input, optional, placeholder: "Phone number or WeChat ID / 电话或微信号")

STEP 2 -- About Your Child:
4. Child's age (Select dropdown, required -- same options as family profile: "Under 1", "1 year", "1.5 years", ... "5+ years")
5. Days per week needed (Select dropdown, optional: "1 day", "2 days", "3 days", "4 days", "5 days", "Not sure yet")

STEP 3 -- Your Message:
6. Message (Textarea, 6 rows, required):
   - Placeholder: t("enquiry.messagePlaceholder") -- "Tell the center about your family and what you're looking for. Write in Chinese, English, or both -- we'll make sure the center can read it. / 请告诉中心您的需求，中英文均可。"
   - Character count (bottom right): "{count}/2000"

On desktop, show all fields at once without wizard steps. On mobile, use 3 wizard steps with a progress bar (3 dots) at the top, "Next" button to advance, and "Back" link to go back. Each step should feel quick.

TRANSLATION PREVIEW (shown after clicking "Next" on Step 3 or "Preview" on desktop):
- If the message appears to contain Chinese characters, show a translation preview step:
  - Heading: t("enquiry.preview.title") -- "Preview your enquiry / 预览您的咨询"
  - Show the original message with label "Your message / 您的消息:"
  - Below, show the translated version with label "The center will also see: / 中心也会看到:" (initially show a loading spinner while the translation is being fetched from an Edge Function).
  - Show both side by side on desktop, stacked on mobile.
  - "Edit message" link to go back and change.
  - "Looks good, send it / 确认发送" button (primary, full width).
- If the message is in English only, skip the preview step and go straight to confirmation.

Submit button (if no translation preview needed):
- "Send Enquiry / 发送咨询" -- full width, bg-blue-600 text-white py-3 text-lg rounded-md, min 44px. With Send icon.
- Below button: t("enquiry.privacyNote") -- "Your contact details will be shared with this center only. Your data is stored in Australia. / 您的联系方式仅与该中心共享。数据存储在澳大利亚。" text-xs text-gray-400.

Behavior:
- On submit, insert into "enquiries" table:
  - If user is logged in: { family_profile_id, center_profile_id, message_original, message_source_language, contact_preference: ['email'], status: 'new' }
  - If user is NOT logged in (guest): { center_profile_id, guest_name, guest_email, guest_phone, guest_wechat_id, guest_child_age, guest_child_days_needed, is_guest: true, message_original, message_source_language, status: 'new' }
  - family_profile_id is null for guest enquiries.
- Translation and email notification handled server-side by Edge Function.
- After successful submit, navigate to a confirmation state (see below).
- Rate limit: if the same email has sent 5 enquiries today, show an error.

SUCCESS STATE (replace the form, don't navigate away):
- Large green CheckCircle icon (w-16 h-16 text-emerald-500 mx-auto).
- Heading: t("enquiry.success.title") -- "Enquiry Sent! / 咨询已发送!"
- Body: t("enquiry.success.body") -- bilingual text explaining the center will receive the message and typically responds within 24-48 hours.
- "What happens next" steps (simple list):
  1. "The center receives your enquiry" (with check, completed)
  2. "They review your message" -- "Usually within 24-48 hours"
  3. "They contact you directly" -- "Via email, phone, or WeChat"
- Account upsell Card (bg-blue-50 rounded-lg p-4 mt-6):
  - t("enquiry.success.accountPrompt") -- "Want to track your enquiry? Create a free account."
  - "Create Account" button (outline, -> /signup?returnUrl=/family/enquiries)
  - "No thanks" dismiss link (text-sm text-gray-400).
- "Browse more centers" link -> /search.

Add auto-save on all form fields (save to cookie so data persists if user navigates away).
Add CSS overscroll-behavior: none on this page.

All text uses t() under "enquiry.*".
```

> **Changed from v1:** This is the biggest structural change. The enquiry form is now accessible WITHOUT any account (guest enquiry). Renamed from "Book a Tour" to "Send Enquiry" throughout. Added translation preview step (family writes in Chinese, sees the English translation, can edit or confirm before sending). Added step-by-step wizard on mobile. Added account upsell AFTER the enquiry is sent (not before). Added auto-save. Added Chinese privacy statement. Form is much shorter (6 fields vs. pre-filled + editable fields). Success state is inline (not a separate page). This change alone is estimated to increase enquiry volume 3-5x per Rachel Torres.

**Supabase tables:** `enquiries` (insert), `center_profiles` (read by slug)
**Environment variables:** None
**Claude Code fixes needed:** Build the translate-enquiry Edge Function (detect language, call Claude API, return translation). Build the translation preview API call (quick round-trip). Build the email notification to center (via Resend) with comprehensive lead info per Karen's requirements: child age, days needed, suburb, phone, translated message. Build SMS notification to center (via Twilio). Build confirmation email to family. Rate limiting check. Auto-save cookie logic. Detect Chinese characters for translation preview trigger (regex for CJK characters).

---

### Prompt 13 -- CCS Explainer Page

**Paste into Lovable:**

```
Create a CCS (Child Care Subsidy) Explainer page at src/pages/CCSGuide.tsx.

Route: /ccs-guide

This is a simple, bilingual information page explaining Australia's Child Care Subsidy to Chinese-speaking families. This is a major trust-builder and anxiety-reducer.

Layout:
- Max-w-3xl mx-auto py-8 px-4.
- Heading: t("ccs.title") -- text-3xl font-bold, e.g., "Understanding the Child Care Subsidy / 了解儿童保育补贴 (CCS)"
- Subtitle: t("ccs.subtitle") -- text-gray-600, e.g., "Most Australian families pay much less than the listed daily fee."

Section 1 -- What is CCS:
- Simple paragraph: t("ccs.what") -- explain in plain language that the Australian Government helps families pay for childcare, and that most families receive between 50-90% of fees covered.

Section 2 -- Rough Cost Table:
- A simple table (or Card-based layout) showing approximate out-of-pocket costs:
  - Heading: t("ccs.costTable.title") -- "Approximate daily cost after subsidy"
  - Table columns: "Family Income", "Subsidy %", "Before Subsidy", "After Subsidy"
  - Row 1: Under $80K -> 90% -> $120/day -> ~$12/day
  - Row 2: $80K-$175K -> 85-50% -> $120/day -> ~$18-$60/day
  - Row 3: $175K-$350K -> 50-20% -> $120/day -> ~$60-$96/day
  - Row 4: Over $350K -> 0% -> $120/day -> $120/day
  - Note below: t("ccs.costTable.note") -- "These are approximate. Your actual subsidy depends on your income, activity level, and the center's fees. Use the official MyGov calculator for an exact estimate."
  - Style the table rows with alternating bg-gray-50 / white. Use text-lg font-semibold text-emerald-600 for the "After Subsidy" column to highlight the lower costs.

Section 3 -- How to Apply:
- Numbered steps (simple list with number badges):
  1. Create a MyGov account
  2. Link to Centrelink
  3. Complete a Child Care Subsidy assessment
  4. Provide your CRN (Customer Reference Number) to your center
- t("ccs.howToApply.link") -- "Visit the official government guide" with link to servicesaustralia.gov.au/childcaresubsidy (opens in new tab).

Section 4 -- CTA:
- Card: "Ready to find a center?" with "Browse Centers / 搜索中心" button -> /search.

All text uses t() under "ccs.*". The entire page must be fully bilingual with high-quality Chinese translations (Tier 1 -- human-translated by June, not AI).
```

> **New in v2:** This page did not exist in v1. Added based on Rachel/Mei Lin/Karen feedback that CCS information is critically missing and causes major anxiety when families see listed daily fees. Mei Lin said a CCS calculator would add 2 points to her overall score. Even a rough table is a significant improvement. This page may become a top landing page from Xiaohongshu content about childcare costs.

**Supabase tables:** None (static page)
**Environment variables:** None
**Claude Code fixes needed:** Verify CCS rates are current (rates change annually). Add OG meta tags for sharing. This page could rank well for "child care subsidy Chinese" searches -- add SEO meta tags.

---

### Prompt 14 -- Family Enquiry Tracking Page

**Paste into Lovable:**

```
Create a Family Enquiries page at src/pages/family/FamilyEnquiries.tsx.

Route: /family/enquiries (protected, role = family)

This page lets families see the status of their sent enquiries. It gives them a reason to return to the platform.

Layout:
- Max-w-2xl mx-auto py-8 px-4.
- Heading: t("family.enquiries.title") -- text-2xl font-bold, e.g., "My Enquiries / 我的咨询"
- Subtitle: text-gray-600 text-sm, e.g., "Track the status of your enquiries to centers."

Enquiry list:
- Stack of cards (space-y-4).
- Each card:
  - Center name (font-semibold) linked to /centers/{slug}.
  - Date sent (text-sm text-gray-400, e.g., "Sent 2 days ago").
  - Status badge:
    - "Sent" (bg-blue-100 text-blue-700) -- initial status
    - "Viewed" (bg-amber-100 text-amber-700) -- center has seen it
    - "Responded" (bg-emerald-100 text-emerald-700) -- center has contacted the family
  - Message preview (text-sm text-gray-600, line-clamp-2).

Empty state:
- If no enquiries: friendly message "No enquiries yet. Browse centers to find the right fit for your family." with button -> /search.

CTA at bottom:
- "Browse more centers" button -> /search.

Data fetching:
- Fetch from "enquiries" where family_profile_id = current user's family profile, ordered by created_at desc.
- Join with "center_profiles" for center name and slug.

All text uses t() under "family.enquiries.*".
```

> **New in v2:** This page did not exist in v1. Added based on Rachel's feedback that families need a reason to return to the platform and visibility into their enquiry status. This is the "complete your profile" hook -- families who sign up to track enquiries become registered users.

**Supabase tables:** `enquiries` (read), `center_profiles` (read, joined)
**Environment variables:** None
**Claude Code fixes needed:** Map enquiry status values to display labels. Build the family notification emails (triggered when center updates status).

---

## Phase 4: Center Flow

### Prompt 15 -- Center Onboarding / Sales Page

**Paste into Lovable:**

```
Create a Center Onboarding page at src/pages/center/CenterOnboard.tsx.

Route: /center/onboard (public -- this is a marketing page for centers)

This page convinces center directors to sign up. Lead with real numbers, not features. Karen Mitchell needs to find three answers in under 60 seconds: How many families? How many educators? What does it cost?

Layout:
- Full-width sections.

SECTION 1 -- Hero:
- Background: subtle gradient from blue-50 to white.
- Heading: t("centerOnboard.hero.title") -- text-3xl md:text-4xl font-bold, e.g., "Fill Your Vacancies with Families Who Want Bilingual Care"
- Subtitle: t("centerOnboard.hero.subtitle")
- THREE key numbers front and center (grid grid-cols-3 gap-4 mt-6, text-center):
  - "{X} Families" (text-3xl font-bold text-blue-600) + "searching for bilingual care" (text-sm text-gray-500)
  - "{X} Suburbs" (same) + "covered in Sydney & Melbourne"
  - "$99/mo" (same) + "flat rate, cancel anytime"
- CTA: "Start Your 30-Day Free Trial" button, large, bg-blue-600 text-white px-8 py-4 text-lg rounded-md. Min 44px. Links to /signup?role=center.

SECTION 2 -- What You Get (simple list, NOT cards):
- Heading: "Everything included" text-xl font-semibold.
- Bullet list with Check icons (text-emerald-500):
  - "Bilingual center profile (English + Chinese)"
  - "Unlimited family enquiries with contact details"
  - "AI translation -- enquiries arrive in English regardless of what language the family writes"
  - "SMS + email notifications when new enquiries arrive"
  - "Enquiry management dashboard"
- Each item text-gray-700, py-2.

SECTION 3 -- ROI Comparison:
- Two cards side by side:
  - Left (bg-red-50 border border-red-200 rounded-lg p-5): "Without LittleBridge" -- "$40-80 per Google Ad lead", "$3,000-5,000 per agency educator placement"
  - Right (bg-emerald-50 border border-emerald-200 rounded-lg p-5): "With LittleBridge" -- "$99/month flat", "Unlimited family leads", "AI-powered translation included"
- Callout: "Each enrolled family = $15,000-25,000/year in revenue" text-lg font-semibold text-center mt-4.

SECTION 4 -- Founding Partner Offer:
- id="founding" anchor.
- Prominent Card (bg-amber-50 border-2 border-amber-300 rounded-xl p-8 max-w-lg mx-auto text-center):
  - Badge: "Limited -- First 10 Centers" bg-amber-100 text-amber-800 rounded-full px-4 py-1 text-sm font-semibold.
  - Heading: "Founding Partner Offer" text-2xl font-bold.
  - Body: "3 months completely free. We'll personally ensure you receive at least 5 qualified enquiries, or we extend the free period."
  - "{X} of 10 spots remaining" in text-lg font-bold text-amber-700.
  - "Claim Your Spot" button: bg-amber-500 text-white px-6 py-3 rounded-md hover:bg-amber-600. -> /signup?role=center.

SECTION 5 -- Pricing:
- id="pricing" anchor.
- Single pricing card, centered, max-w-md:
  - Card with border-2 border-blue-600 rounded-xl p-8 shadow-lg.
  - Price: "$99" text-5xl font-bold + "/month" text-gray-500 + "(incl. GST)" text-xs text-gray-400.
  - "30-day free trial" badge in bg-blue-100 text-blue-700.
  - Feature list with Check icons.
  - "Start Free Trial" button: full width, bg-blue-600 text-white py-3 text-lg. -> /signup?role=center.
  - "No lock-in. Cancel anytime." text-xs text-gray-400 text-center mt-2.

All text uses t() under "centerOnboard.*".
```

> **Changed from v1:** Led with real numbers per Karen's "60 second" test. Changed founding partner offer from badge to performance guarantee ("5 qualified enquiries or we extend"). Changed trial from 14 days to 30 days per Karen's feedback. Added SMS notification mention. Simplified and sharpened ROI section. Made founding partner offer time-limited and prominent with spots remaining counter.

**Supabase tables:** None (static marketing page)
**Environment variables:** None
**Claude Code fixes needed:** Wire ?role=center to pre-select center role on signup. Pull real family/suburb counts from database (or hardcode for launch). Track founding partner spots claimed.

---

### Prompt 16 -- Center Profile Setup Form (Simplified & Progressive)

**Paste into Lovable:**

```
Create a Center Profile Setup page at src/pages/center/CenterProfileSetup.tsx.

Route: /center/profile (protected, role = center)

This form must be completable in under 5 minutes. Centers fill in the basics to go live, then add more details over time. Use a step-by-step wizard on mobile.

Layout:
- Max-w-2xl mx-auto py-8 px-4.
- Heading: t("center.profile.title") -- "Set Up Your Center Profile"
- Subtitle: t("center.profile.subtitle") -- "Fill in the basics to go live. You can add photos and more details later."

STEP 1 -- Basics (required to go live):
1. Center name (Input, required)
2. Suburb (Input, required, placeholder: "e.g., Chatswood")
3. Contact email (Input, type email, required -- pre-filled from auth email)
4. Phone for SMS notifications (Input, type tel, optional, label: "Mobile number for SMS alerts when enquiries arrive")
5. Staff languages: Which languages do your staff speak? (Checkbox group, at least one required):
   - Mandarin
   - Cantonese
   - English
   - Other (with text input)

STEP 2 -- Details (optional, can complete later):
6. Address (Input, optional, placeholder: "Full street address")
7. Description in English (Textarea, 4 rows, optional, placeholder: "Describe your center and what makes it special...")
   - Note: "We'll automatically create a Chinese version."
8. NQS Rating (Select, optional: Exceeding, Meeting, Working Towards, Not Yet Assessed)
9. CCS Approved (Checkbox: "Our center is approved for the Child Care Subsidy (CCS)")
10. Fee range: two inputs side by side ($ min/day and $ max/day, optional)

STEP 3 -- Photo (optional, strongly encouraged):
11. Photo upload: single file upload area (border-2 border-dashed border-gray-300 rounded-lg p-6 text-center) with ImagePlus icon.
   - "Upload a photo of your center" + "JPG or PNG, max 5MB"
   - Show preview after selection.
   - Just ONE photo for now. "You can add more photos later."

On mobile: show as 3 wizard steps with a progress bar (Step 1 of 3, Step 2 of 3, Step 3 of 3). "Next" and "Back" buttons. "Skip" link on Steps 2 and 3.
On desktop: show all three sections on one page with clear section headings.

Buttons:
- "Go Live" primary button at the end (bg-blue-600 text-white, full width).
- If Step 2 and 3 are skipped: still allow going live with just Step 1.

Behavior:
- Upload photo to Supabase Storage bucket "center-photos" (path: {centerProfileId}/photo-1.{ext}). Get public URL. Insert into "center_photos".
- Upsert to "center_profiles" table with all provided fields.
- Generate slug from center name (lowercase, hyphenated).
- Store mobile_phone for SMS notifications.
- Update "profiles" table: onboarding_completed = true.
- Navigate to /center/dashboard.
- Auto-save form data to cookie on every field change.
- Show success toast.

All text uses t() under "center.profile.*".
```

> **Changed from v1:** Dramatically simplified from 20+ fields across 6 sections to 5 required fields + 6 optional fields + 1 photo. Removed: ABN (not needed to go live), website, age groups & vacancies grid, programs checkboxes, operating hours, staff language counts, fee range (made optional), drag-and-drop photo reordering, profile completeness indicator. Added SMS phone field. Made description optional (center can go live without it). Reduced to single photo upload. Added step-by-step wizard for mobile. Added auto-save. This means a center director can go live in under 5 minutes per Karen's requirements. Additional fields are added later via progressive collection.

**Supabase tables:** `center_profiles` (upsert), `center_photos` (insert), `profiles` (update), Supabase Storage: `center-photos` bucket
**Environment variables:** None
**Claude Code fixes needed:** Create center-photos Storage bucket. Implement slug generation with uniqueness check. Add geocoding for suburb -> lat/lng. Trigger description translation Edge Function on save. Auto-save cookie logic. Build a separate "Complete Your Profile" prompt shown in the dashboard that encourages adding more details progressively.

---

### Prompt 17 -- Center Dashboard (Single Page)

**Paste into Lovable:**

```
Create a Center Dashboard page at src/pages/center/CenterDashboard.tsx.

Route: /center/dashboard (protected, role = center)

This is ONE single page -- not a multi-tab dashboard. Centers manage everything from here. The email notifications are the real product; this is the backup interface.

Layout:
- Max-w-3xl mx-auto py-8 px-4.
- Top bar: center name (text-2xl font-bold) + "Edit Profile" link (text-blue-600) -> /center/profile.

Section 1 -- Subscription Status:
- A compact status bar at the top:
  - If active: green dot + "Subscription active" + "Manage" link -> /center/dashboard/subscription.
  - If trialing: amber dot + "Free trial -- {X} days remaining" + "Manage" link.
  - If founding_partner: gold star + "Founding Partner -- Free access until {date}".
  - If canceled/expired: red dot + "Subscription inactive" + "Reactivate" link.

Section 2 -- Enquiries:
- Heading: "Family Enquiries" text-xl font-semibold + count badge.
- List of enquiry cards (space-y-3). Each card:
  - Card with border border-gray-200 rounded-lg p-4.
  - Top row: Family name (or guest_name) in font-semibold + date (text-sm text-gray-400 right-aligned).
  - Key info row (THIS IS WHAT KAREN NEEDS -- lead with practical details, not match scores):
    - Child's age badge (bg-blue-50 text-blue-700 text-sm rounded-full px-2 py-0.5)
    - Days needed badge (if available)
    - Suburb badge
    - Contact method: phone icon + number, or WeChat icon + ID, or email icon
  - Message: truncated to 2 lines (text-sm text-gray-600). "Show more" to expand.
  - If message was in Chinese: show the English translation as primary, with "Original (Chinese)" collapsible below. Label as "Bilingual version" not "AI translated".
  - Status toggle: a compact Select dropdown (width auto) with options:
    - "New" (blue)
    - "Contacted" (amber)
    - "Tour Booked" (green)
    - "Enrolled" (emerald, bold)
    - "Declined" (gray)
  - On status change: update "enquiries" table and show toast confirmation.
  - Private notes: small Textarea (1 row, placeholder: "Add a note...") that saves to enquiries.center_notes on blur.

If no enquiries: friendly empty state "No enquiries yet. Make sure your profile is complete -- centers with photos and descriptions receive 3x more enquiries." with link to edit profile.

Filter tabs above the list (compact): "All", "New ({count})", "In Progress", "Completed". "New" is the default active tab.

Section 3 -- Quick Actions:
- Two buttons side by side:
  - "Edit Profile" (outline) -> /center/profile
  - "View Public Listing" (outline) -> /centers/{slug} (opens in new tab)

Data fetching:
- Fetch center_profiles for the current user.
- Fetch enquiries where center_profile_id = myCenter.id, ordered by created_at desc.
- For each enquiry: if family_profile_id is not null, join with family_profiles and children for details. If null (guest enquiry), use the guest_* fields.

All text uses t() under "center.dashboard.*".
```

> **Changed from v1:** Collapsed from 7 separate dashboard pages (overview, enquiries list, applications list, post a job, manage jobs, subscription, sidebar navigation) into ONE single page. Removed: stat cards, applications section (educator flow deferred), job management section (deferred), sidebar navigation, separate enquiry detail view. Enquiry cards now lead with Karen's decision criteria (child age, days, suburb, phone) instead of match scores. Status management is inline (compact Select, not a separate modal). Private notes inline. Translation label changed from "AI translated" to "Bilingual version". This saves 2-3 days of build time and matches how center directors actually work per Karen's review.

**Supabase tables:** `center_profiles` (read), `enquiries` (read + update status + update center_notes), `family_profiles` (read, joined), `children` (read, joined)
**Environment variables:** None
**Claude Code fixes needed:** Wire up status change to trigger family notification email. Handle the join for guest vs. registered enquiries. Add pagination for large enquiry lists. Age calculation from children DOB.

---

### Prompt 18 -- Center Subscription Management

**Paste into Lovable:**

```
Create a Subscription Management page at src/pages/center/Subscription.tsx.

Route: /center/dashboard/subscription (protected, role = center)

Layout:
- Max-w-lg mx-auto py-8 px-4.
- Back link: "< Back to Dashboard" -> /center/dashboard.

Content depends on subscription state:

STATE 1: No subscription:
- Heading: "Start Your Subscription"
- Pricing card (same as center onboard page): $99/month, 30-day trial, feature list.
- "Start Free Trial" button: bg-blue-600 text-white, full width, py-3.
- On click: call Supabase Edge Function "create-checkout-session". Redirect to Stripe Checkout.

STATE 2: Active or Trialing:
- Green status card: check icon + "Your subscription is active".
- If trialing: "Trial ends on {date}" with days remaining.
- "Manage Subscription" button: outline. Calls Edge Function "create-portal-session". Opens Stripe Customer Portal in new tab.
- Compact feature reminder list.

STATE 3: Cancelled / Past Due:
- Amber/red status card: "Your subscription has ended" or "Payment failed".
- What's affected: "Your profile is still visible but new enquiry notifications are paused."
- "Reactivate" button -> new Stripe Checkout Session.

STATE 4: Founding Partner:
- Gold card: star icon + "Founding Partner -- Free Access"
- "Thank you for being one of our first 10 centers!"
- "Valid until {date}".
- All features listed.

All text uses t() under "center.subscription.*".
```

> **Changed from v1:** Simplified by removing from the multi-page dashboard context. Same core functionality but cleaner layout. Changed trial to 30 days.

**Supabase tables:** `center_profiles` (read subscription fields)
**Environment variables:** `VITE_STRIPE_PUBLISHABLE_KEY`
**Claude Code fixes needed:** Build create-checkout-session Edge Function. Build create-portal-session Edge Function. Build stripe-webhook Edge Function. Configure Stripe webhook endpoint. Handle founding_partner status override.

---

## Phase 5: Educator Lead Capture

### Prompt 19 -- Educator Lead Capture Page

**Paste into Lovable:**

```
Create an Educator Sign Up page at src/pages/educators/EducatorSignUp.tsx for LittleBridge -- a bilingual childcare marketplace.

This is a SIMPLE lead capture page, not a full profile builder. The goal is to collect interested bilingual educators so we can tell centers "we have X educators in your area."

Layout:
- Max-width container (max-w-2xl mx-auto py-12 px-4) on white background.
- Left/right split on desktop (md:grid-cols-2 gap-12), stacked on mobile.

LEFT SIDE -- Value proposition:
- Heading: t("educators.signup.title") -- e.g., "Find centers that truly value your bilingual skills" -- text-3xl font-bold text-gray-800.
- Subtitle: t("educators.signup.subtitle") -- text-gray-600 mt-4.
- Three benefit bullets with check icons (Lucide CheckCircle in text-emerald-500):
  - t("educators.signup.benefit1") -- "Jobs at centers with real bilingual programs"
  - t("educators.signup.benefit2") -- "No recruitment agency fees"
  - t("educators.signup.benefit3") -- "We match you based on your languages, location, and preferences"
- Below benefits: a trust line -- t("educators.signup.trust") -- e.g., "Join 20+ bilingual educators already registered" -- text-sm text-gray-400 mt-8.
- Optional: placeholder for June's photo + quote about why educators matter.

RIGHT SIDE -- Simple form:
- Card with border border-gray-200 rounded-lg p-6 shadow-sm.
- Heading inside card: t("educators.signup.formTitle") -- "Register your interest" -- text-xl font-bold.
- Form fields (using shadcn Input + Label):
  1. Full name (Input, required)
  2. Email (Input type email, required)
  3. Phone (Input type tel, optional)
  4. Suburb (Input, required, placeholder "e.g., Chatswood, 2067")
  5. Languages spoken (multi-select checkboxes: Mandarin, Cantonese, English, Other -- at least one required)
  6. Highest qualification (Select dropdown: Certificate III, Diploma, Bachelor, Master/PhD, Other)
  7. Do you have a current WWCC? (RadioGroup: Yes / No / Not sure)
- Submit button: full width, bg-blue-600 text-white, "Register My Interest" / "提交注册意向"
- Below button: privacy line -- t("educators.signup.privacy") -- "We'll only contact you about relevant job opportunities. Your information is never shared without your permission." -- text-xs text-gray-400.

Behavior:
- On submit, insert a row into the "educator_leads" table via Supabase client (anon key, no auth required):
  { full_name, email, phone, suburb, languages (jsonb array), qualification, has_wwcc (text: "yes"/"no"/"unsure"), preferred_language: current UI language, created_at }
- Show a success state replacing the form: checkmark icon, heading "You're on the list!" / "您已成功注册！", body text "We'll notify you when centers in [suburb] are looking for bilingual educators." and a "Browse Centers" link to /search.
- Show toast error if insert fails (duplicate email → "You're already registered! We'll be in touch soon.").
- No account creation, no auth required.

Mobile: stack left/right vertically. Benefits above, form below. Form card should have no shadow on mobile (shadow-none md:shadow-sm).

All text uses t() with keys under "educators.signup.*". Include the language toggle in the header as usual.
```

> **Changed from v1:** The original v1 had 7 prompts for the educator flow (Prompts 16-22: educator profile, educator quiz, job search, job detail, express interest, application confirmation). All of these are deferred to Month 2. This single page replaces them. The PM (Rachel Torres) estimated cutting the educator flow saves 5-7 days. The consolidated review agreed the MVP hypothesis is "Will centers pay for access to families?" -- the educator marketplace is a separate question.
>
> **Changed from v2 initial:** Replaced the simple "Coming Soon" email capture with a proper lead capture form. Instead of just collecting an email into the `waitlist` table, we now collect full_name, email, phone, suburb, languages, qualification, and WWCC status into a dedicated `educator_leads` table. This lets us tell centers "we have X bilingual educators in your area" with real data. The page uses a value-proposition + form layout instead of a centered placeholder. Route changed from /educators to /educators/signup.

**Supabase tables:** `educator_leads` (new table -- will need to be created. See note below.)
**Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
**Claude Code fixes needed:** Create the `educator_leads` table in Supabase (see schema addition below). Add RLS policy allowing anonymous inserts. Add a unique constraint on email to prevent duplicates. Wire up the success state to show the suburb they entered. Add rate limiting (max 3 signups per IP per day via edge function, or rely on RLS + Supabase rate limits).

**Schema addition needed:**
```sql
CREATE TABLE IF NOT EXISTS educator_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  suburb text NOT NULL,
  languages jsonb NOT NULL DEFAULT '[]',
  qualification text,
  has_wwcc text DEFAULT 'unsure',
  preferred_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE educator_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY educator_leads_insert_anon ON educator_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY educator_leads_select_admin ON educator_leads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
```

---

## Phase 6: Admin (Simplified)

### Prompt 20 -- Admin Dashboard (Single Page)

**Paste into Lovable:**

```
Create a simplified Admin Dashboard at src/pages/admin/AdminDashboard.tsx.

Route: /admin (protected, must check profile.role = 'admin')

This is a single page for Peter and June to monitor the platform. No tabs, no complex tables.

Layout:
- Max-w-4xl mx-auto py-8 px-4.
- Heading: "LittleBridge Admin" + current user's email in text-sm text-gray-500.

Section 1 -- Key Metrics (grid grid-cols-2 md:grid-cols-4 gap-4):
- Card 1: "Families" -- count from family_profiles + "this week" delta in green/red text-sm.
- Card 2: "Centers" -- count from center_profiles.
- Card 3: "Enquiries" -- count from enquiries + this week delta.
- Card 4: "Paying Centers" -- count where subscription_status in ('active', 'trialing').
Each card: white bg, border, number in text-3xl font-bold, label in text-sm text-gray-500.

Section 2 -- Waitlist:
- Heading: "Waitlist Signups" + count.
- Simple table: email, suburb, date. From "waitlist" table, ordered by created_at desc, limit 20.

Section 3 -- Recent Enquiries:
- Heading: "Recent Enquiries" + total count.
- Simple table: family name (or guest_name), center name, date, status badge. From "enquiries" joined with center_profiles, ordered by created_at desc, limit 20.

Section 4 -- Centers:
- Heading: "Centers" + count.
- Simple table: center name, suburb, subscription status badge, enquiries received count, joined date. From center_profiles.
- Actions column: "Override Status" Select dropdown (active, trialing, founding_partner, canceled) that updates center_profiles.subscription_status directly.

Section 5 -- Families:
- Heading: "Families" + count.
- Simple table: name, email, suburb, enquiries sent count, joined date. From family_profiles joined with profiles.

All data in English only (admin dashboard does not need i18n).
```

> **Changed from v1:** Collapsed from 5 tabs (Overview, Families, Educators, Centers, Activity Log) with sortable tables, search filters, WWCC verification, and CSV export into a single page with basic tables. Removed: Educators tab (flow deferred), Activity Log (use Supabase dashboard directly), complex table features (sorting, filtering, click-through). Added waitlist monitoring. This saves 1-2 days of build time. Peter and June can use the Supabase dashboard directly for anything more complex.

**Supabase tables:** `profiles` (read + update), `family_profiles` (read + count), `center_profiles` (read + count + update subscription_status), `enquiries` (read + count), `waitlist` (read)
**Environment variables:** None
**Claude Code fixes needed:** RLS policies for admin role. "This week" delta calculation. The subscription override should also handle Stripe state if applicable.

---

## Phase 7: Shared Components

### Prompt 21 -- Factor Badges Component

**Paste into Lovable:**

```
Create a reusable FactorBadges component at src/components/FactorBadges.tsx.

This replaces the old MatchScoreBadge component. Instead of showing a composite score label ("Great Match"), we show individual factor badges that are more useful and less anxiety-inducing.

Props:
- factors: Array<{ type: string, label: string }>
- size: "sm" | "md" (default "sm")

Factor types and their styles:
- "language_mandarin": bg-red-50 text-red-700 (Chinese cultural color)
- "language_cantonese": bg-orange-50 text-orange-700
- "language_english": bg-blue-50 text-blue-700
- "distance": bg-blue-50 text-blue-700
- "vacancy": bg-emerald-50 text-emerald-700
- "bilingual_program": bg-purple-50 text-purple-700
- "is_ccs_approved": bg-emerald-50 text-emerald-700
- default: bg-gray-100 text-gray-700

Display:
- Render as a flex flex-wrap gap-1.5 row of Badge components.
- sm: text-xs px-2 py-0.5 rounded-full
- md: text-sm px-3 py-1 rounded-full

Examples of labels: "Mandarin spoken", "2.3 km away", "Vacancies available", "Bilingual program", "CCS approved".

Export for use in CenterCard, CenterDetail, and anywhere factor information is shown.
```

> **Changed from v1:** Replaced the MatchScoreBadge component entirely. The old component showed composite labels ("Great Match", "Good Match", "Possible Match") based on a 0-100 score. The new component shows individual factor badges. Match scores are still calculated behind the scenes for sort order but are never shown to users. This addresses the consensus finding from Rachel/Yuki/Karen that composite scores create negative signaling.

**Supabase tables:** None (pure UI component)
**Environment variables:** None
**Claude Code fixes needed:** Minimal.

---

### Prompt 22 -- Bilingual Text Display Component

**Paste into Lovable:**

```
Create a BilingualText component at src/components/BilingualText.tsx.

Props:
- textEn: string (English version)
- textZh: string | null (Chinese version, may be null)
- sourceLanguage?: "en" | "zh" (which was the original)
- showBoth?: boolean (default false)

Behavior:
- By default, show the text in the user's current language (from useLanguage() hook).
- Below the primary text, show a toggle link:
  - If showing English: "查看中文版 / View Chinese version" with ChevronDown icon.
  - If showing Chinese: "View English version" with ChevronDown icon.
  - Clicking expands the other language in a bg-gray-50 rounded-md p-3 mt-2.
- If the displayed text is the auto-translated version (sourceLanguage opposite to what's shown), show a subtle label: "中文版 / Chinese version" or "English version" in text-xs text-gray-400. Do NOT use "Translated by AI" or "AI翻译". Just present it as the bilingual version.
- If textZh is null and current language is "zh", show textEn with a note: "Chinese version coming soon / 中文版即将推出" in text-xs text-gray-400.
- If showBoth is true: show both versions stacked with a Separator, labeled "English" and "中文".

Style the secondary (toggled) text in slightly smaller text (text-sm) with the soft background.
```

> **Changed from v1:** Removed all "Translated by AI" labeling. Content is now presented as "Chinese version" / "English version" with no qualifier. This addresses the consensus finding from Yuki/Mei Lin/Sophie that the AI label undermines trust. June will review the first 20-30 center translations manually (Tier 1), and auto-translated content uses softer "bilingual version" framing (Tier 2).

**Supabase tables:** None
**Environment variables:** None
**Claude Code fixes needed:** Minimal. Ensure proper `lang="zh-Hans"` attribute on Chinese text blocks for screen readers.

---

## Post-Lovable Fixes (Claude Code)

Work through these after building all the pages in Lovable.

### P0 -- Must Fix Before Launch

1. **Supabase RLS Policies:** Create policies for every table:
   - Public (anon): can read active center_profiles and center_photos. Can insert into enquiries (for guest enquiries). Can insert into waitlist.
   - Families: can read/write their own family_profiles and children. Can read active center_profiles. Can insert enquiries. Can read their own enquiries.
   - Centers: can read/write their own center_profiles and center_photos. Can read their own enquiries. Can update enquiry status and center_notes.
   - Admin: can read/write everything.

2. **Edge Functions (Backend Logic):**
   - `translate-text`: Takes text + target language, calls Claude Haiku API, returns translation. System prompt includes childcare terminology glossary. Handles mixed Chinese-English input correctly.
   - `process-enquiry`: Triggered after enquiry insert. Detects source language, translates message, sends email to center via Resend (lead with: child age, days needed, suburb, phone, translated message -- NOT match score), sends SMS to center via Twilio ("New enquiry from a Mandarin-speaking family on LittleBridge. Check your email for details."), sends confirmation email to family.
   - `translate-preview`: Quick endpoint called from the enquiry form to show translation preview before sending. Returns the English translation of a Chinese message within 2-3 seconds.
   - `translate-description`: Translates center description EN->ZH on save.
   - `create-checkout-session`: Creates Stripe Checkout Session with 30-day trial, returns URL.
   - `create-portal-session`: Creates Stripe Customer Portal session, returns URL.
   - `stripe-webhook`: Handles Stripe webhook events, updates subscription_status.
   - `notify-family-status`: Triggered when center updates enquiry status. Sends bilingual email to family: "Good news! [Center Name] has seen your enquiry."

3. **Supabase Storage Buckets:**
   - `center-photos` (public read, authenticated write to own center folder)

4. **Environment Variables:** Set all env vars in both Lovable (VITE_ prefixed) and Supabase Edge Functions.

5. **Database Trigger:** Add trigger on auth.users that auto-creates a profiles row with the role from user metadata.

6. **WeChat Browser Compatibility (Day 1, not Week 3):**
   - Cookie-based language persistence (not localStorage)
   - Detect WeChat UA and hide any OAuth buttons
   - CSS `overscroll-behavior: none` on all form pages
   - Test every page in WeChat's in-app browser
   - Test on both iOS and Android WeChat

7. **Email Templates:** Build bilingual HTML email templates for:
   - New enquiry notification to center (lead with: child age, days, suburb, start date, phone -- not match score)
   - Enquiry confirmation to family
   - Enquiry status update to family ("Center has responded")
   - Subscription confirmation
   - Payment failure alert

8. **SMS Integration:** Twilio SMS on new enquiry to center's mobile_phone number. Short message: "New enquiry from a Mandarin-speaking family on LittleBridge. Check your email for details." Cost: ~$0.05/SMS.

9. **Guest Enquiry Flow:** Ensure the enquiry form works end-to-end without authentication. Guest enquiries populate the guest_* fields. The center sees the same enquiry card regardless of whether the family has an account.

10. **Translation Preview:** Wire up the translate-preview Edge Function to the enquiry form. Show loading state while translating. Allow the family to edit their message and re-translate. Only trigger for messages containing CJK characters.

### P1 -- Fix Before Soft Launch

11. **Geocoding:** Replace placeholder suburb inputs with autocomplete using a static JSON of Australian suburbs (include Chinese suburb names: 车士活/Chatswood, 好事围/Hurstville, etc.). Store lat/lng on save.

12. **Match Score Calculation (for sort order only):** Implement the weighted scoring algorithm client-side. Use for search result sort order. Never display the score to users. Show factor badges instead.

13. **Form Validation:**
    - Email format validation
    - Password strength requirements
    - Required field enforcement
    - File size/type validation for photo uploads

14. **Auth Flow Polish:**
    - returnUrl parameter handling throughout
    - Session refresh handling
    - Non-blocking email verification
    - Sign out cleanup

15. **SEO & Sharing:**
    - Dynamic Open Graph meta tags per page (center name + photo + Chinese description for WeChat)
    - Chinese OG tags with proper zh-Hans language tag
    - Sitemap generation
    - QR code generation on center profile pages (use qrcode.react library)

16. **Progressive Profile Collection:** Build prompts that appear in the dashboard/profile encouraging users to add more details:
    - Family: "Add your phone number so centers can call you", "Tell us more about what matters to you"
    - Center: "Add a description to get 3x more enquiries", "Upload photos", "Add your age groups and vacancies"

17. **Values Quiz (Post-First-Action):** Build the values quiz as an optional "Improve your matches" prompt shown to families after their first enquiry and to centers after their first week. Do NOT include in onboarding. Link from the profile page.

### P2 -- Fix After Launch

18. **Performance:** Code splitting, lazy loading, image optimization, pagination.

19. **Accessibility:** Proper aria labels, keyboard navigation, `lang="zh-Hans"` on Chinese text blocks, color contrast fixes (replace text-gray-400 with text-gray-500 for all informational text).

20. **Error Handling:** Global error boundary, offline detection, Supabase error handling, Stripe error handling.

21. **Analytics:** Vercel Analytics or Plausible. Track: page views, enquiry submissions (guest vs. registered), search queries, signup completions, waitlist signups. UTM parameter tracking for Xiaohongshu and WeChat referrals.

22. **i18n Completeness:** Audit every page for hardcoded English strings. Ensure all error messages and toasts are translated. Test full flow in Chinese language mode.

23. **Educator Flow (Month 2):** When ready, build: educator profile (simplified: name, suburb, languages, qualification, WWCC, bio), job search, job detail, express interest form, application confirmation. Add job posting to center dashboard. Add applications list to center dashboard. Reference the original v1 prompts 16-22 as a starting point but apply the same simplification principles from this v2 guide.

24. **Lovable-Specific Quirks:**
    - Convert any inline styles to Tailwind classes
    - Verify shadcn component import paths
    - Add proper TypeScript interfaces for all data
    - Test every page at 375px (mobile), 768px (tablet), and 1440px (desktop) widths
    - Test every page in WeChat's in-app browser on both iOS and Android
    - Verify all form onSubmit handlers are wired to Supabase
    - Check that all interactive elements meet 44px minimum touch target

---

## Build Order Summary

| Phase | Prompts | Est. Time | What You Get |
|-------|---------|-----------|--------------|
| 1. Setup & Landing | Prompts 1-5 | 1.5 days | Project skeleton, landing page with trust signals, about page, navigation, footer |
| 2. Auth | Prompts 6-8 | 0.5 days | Sign up, sign in, forgot password (no Google OAuth, non-blocking verification) |
| 3. Family Flow | Prompts 9-14 | 2 days | Simplified family profile, center search with empty state handling, center detail, guest enquiry with translation preview, CCS guide, enquiry tracking |
| 4. Center Flow | Prompts 15-18 | 1.5 days | Center sales page, simplified center profile, single-page dashboard, subscription |
| 5. Educator Lead Capture | Prompt 19 | 0.5 days | Lead capture page with form (name, email, suburb, languages, qualification, WWCC) + `educator_leads` table |
| 6. Admin | Prompt 20 | 0.5 days | Single-page admin with key metrics |
| 7. Shared Components | Prompts 21-22 | 0.25 days | Factor badges, bilingual text display |
| **Post-Lovable Fixes** | P0 items | 2-3 days | Edge Functions, RLS, email/SMS, WeChat compatibility, translation preview |
| **Total** | **22 prompts** | **~8-10 days** | **Core family-to-center enquiry loop, fully functional** |

> **Changed from v1:** Original had 36 prompts across 7 phases with an estimated 15+ days. This v2 has 22 prompts with an estimated 8-10 days. We cut 14 prompts by removing: values quiz (2 prompts), full educator flow (7 prompts), multi-page center dashboard (4 prompts), fullscreen photo gallery (1 prompt), complex match score badge (replaced), and Mapbox map component (deferred). We added 5 new prompts: about page, guest enquiry form, CCS guide, family enquiry tracking, and educator lead capture page (upgraded from email-only "coming soon" to a full lead capture form with dedicated `educator_leads` table).

---

*This is v2 of the Lovable Build Guide, revised 27 February 2026 based on consolidated feedback from Rachel Torres (PM), Yuki Tanaka (UX), Karen Mitchell (Center Director), Mei Lin Chen (Family), Sophie Zhang (Educator), and Dr. James Liu (Cultural Advisor). The guide prioritizes the core family-to-center enquiry loop and cuts everything that does not directly serve it.*
