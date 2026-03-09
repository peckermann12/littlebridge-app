# LittleBridge Comparison Tool — Design Document

**Date:** 2026-03-09
**Status:** Approved
**Authors:** Peter & June

---

## What We're Building

A Chinese-language childcare comparison tool that captures leads and sells them to centres. 4 pages, no auth, bilingual, mobile-first.

## Product

### Page 1: Landing Page
- Chinese-first with EN/ZH toggle
- Hero: "Find the right bilingual childcare — and see what you'll actually pay after CCS"
- 3-step "how it works": Take the quiz → Compare centres → Book a tour
- Trust signals: ACECQA data source, June's photo + bio, "helped X families"
- Single CTA: "Start comparing" → goes to quiz

### Page 2: Quiz + CCS Calculator (mobile wizard)
6 steps:
1. Suburb (autocomplete, AU postcodes)
2. Child's age (dropdown: 0-1, 1-2, 2-3, 3-4, 4-5, 5-6)
3. Days per week (1-5 selector)
4. Family income bracket (dropdown matching CCS tiers)
5. Language preference (Mandarin / Cantonese / Either / Any)
6. What matters most? (Bilingual program / Cost / Proximity / Quality rating)

Output: CCS percentage, estimated daily out-of-pocket cost

### Page 3: Results
- Top 5 matched centres, sorted by out-of-pocket cost (lowest first)
- Each card shows: name, suburb, daily fee AFTER CCS, NQS badge, languages (with staff count), programs, photo
- "Book a Tour" button on each card → opens lead capture
- Filter/sort controls: by cost, by distance, by rating
- Bottom: "Can't find what you need?" → waitlist signup

### Page 4: Lead Capture (modal or inline)
- Triggered by "Book a Tour" / "Get a Quote" on any centre
- Fields: Name, Phone, WeChat ID (optional), Child's name, Preferred contact (phone/WeChat/email)
- Pre-filled: suburb, child age, days needed (from quiz)
- Submit → success: "June will contact you within 24 hours"
- Lead stored in DB + email notification to founders

## Monetisation

### Phase 1: Pay-per-lead (Week 2+)
- Match lead to 1-3 centres manually
- Email centre with lead summary, first 3 free, then $75+GST/lead
- Convert to prepaid credit packs once relationship established:
  - Starter: 5 leads / $325 ($65/lead)
  - Growth: 15 leads / $900 ($60/lead)
  - Bulk: 30 leads / $1,500 ($50/lead)

### Phase 2: Featured placement (Month 4+)
- $199/mo to appear at top of suburb results
- Only offered once traffic data exists

### Phase 3: Platform upsell (Month 6+)
- Existing LittleBridge platform features (dashboards, profiles, jobs)
- $99/mo subscription for centres wanting self-serve

## Data

### Centre data (scraped/researched, no sign-up needed)
- Source: ACECQA National Register + centre websites + June's calls
- Fields: name, slug, address, suburb, postcode, state, phone, email, website, fees (min/max), NQS rating, programs, staff languages (language + count), age groups, CCS approved, photos, ACECQA URL
- Initial target: 50 centres in Sydney Chinese corridor
- Month 2-3: add Melbourne (Box Hill, Glen Waverley)

### CCS data (government rates, hardcoded)
- 2026 CCS schedule by income bracket
- Activity test tiers
- 3-Day Guarantee rules
- Updated when government changes rates (annually)

## Marketing

### Primary: Xiaohongshu (organic, $0)
- Account: "小桥妈妈" (LittleBridge Mum) — June is the face
- 4-5 posts/week: CCS explainers, cost comparisons, centre reviews
- No external links allowed — users DM or search brand name
- Funnel: post → DM → share link → quiz → lead

### Secondary: WeChat groups
- Join existing parent groups, provide value
- Create branded groups: "悉尼双语幼儿园交流群"
- Share calculator link directly (WeChat allows links)

### Tertiary: Google Ads (month 2+, $200-500/mo)
- Keywords: "mandarin childcare sydney", "双语幼儿园", "CCS calculator chinese"

## Tech Stack
- Frontend: React + Vite + Tailwind (reuse existing LittleBridge app)
- Backend: Express + PostgreSQL on Replit
- Email: Resend free tier (100/day)
- Payments: Stripe invoices (manual)
- Scraper: Python + BeautifulSoup + ACECQA data
- Analytics: Plausible free tier

## Timeline

| Day | Deliverable |
|-----|-------------|
| Today | Build all 4 pages + CCS calculator logic |
| Tomorrow | Scrape ACECQA for 50 centres, seed database |
| Day 3 | Launch on Replit, June creates Xiaohongshu |
| Week 1-2 | June posts daily, first leads come in |
| Week 2 | First emails to centres (free intro) |
| Week 3-4 | First paying centres |

## Revenue Projections (Conservative)

| | Month 1 | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|
| Enquiries/mo | 10-15 | 30 | 60 | 120 |
| Lead revenue | $0 (free intro) | $1,750 | $3,500 | $6,500 |
| Featured placement | $0 | $0 | $600 | $1,600 |
| **Total** | **$0** | **$1,750** | **$4,100** | **$8,100** |
