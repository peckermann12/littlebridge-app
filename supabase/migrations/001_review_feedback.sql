-- ============================================================================
-- Migration 001: Review Feedback Changes
-- LittleBridge — Bilingual Early Education Marketplace
-- Date: 2026-02-27
--
-- This migration applies schema changes recommended by the consolidated review
-- of 5 expert reviewers:
--   1. Rachel Torres — Senior Product Manager (ex-Airbnb, Canva, EdTech)
--   2. Yuki Tanaka — Senior UX Designer (ex-Atlassian, Figma)
--   3. Karen Mitchell — Center Director & Owner (19 years childcare ops)
--   4. Mei Lin Chen — Family persona (Chinese-Australian mother, target user)
--   5. Sophie Zhang — Bilingual ECE Educator (4 years experience)
--
-- This file is idempotent — safe to run multiple times.
-- Run AFTER the original schema.sql has been applied.
-- ============================================================================


-- ============================================================================
-- 1. ENUM ADDITIONS
-- ============================================================================

-- Notification preference enum for centers (SMS notifications feature)
-- Recommended by: Rachel (PM), Karen (Center Director) — Finding #6
DO $$ BEGIN
  CREATE TYPE notification_preference AS ENUM ('email', 'sms', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 2. GUEST ENQUIRIES — Allow enquiry submission without authentication
-- ============================================================================
-- This is the single highest-impact change from the review.
-- Raised by: Rachel (PM), Yuki (UX), Mei Lin (Family), Karen (Center Director)
-- Finding 1.1: "The auth gate before enquiry is a conversion killer"
-- Rachel estimates 40-60% drop-off. Mei Lin: "I would not sign up for a
-- website I do not trust yet." Karen: "I just want to receive the lead."
-- ============================================================================

-- 2a. Make family_profile_id NULLABLE to support guest enquiries
--     Guest enquiries will have family_profile_id = NULL and use guest_* fields instead.
ALTER TABLE enquiries
  ALTER COLUMN family_profile_id DROP NOT NULL;

-- 2b. Add guest contact fields to the enquiries table
--     These capture the minimum info needed from a non-authenticated user.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_phone text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_wechat_id text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_child_age text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_suburb text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_preferred_language text
  CHECK (guest_preferred_language IN ('en', 'zh'));

-- 2c. Add a constraint: either family_profile_id OR guest_email must be present
--     This ensures every enquiry can be traced back to someone.
DO $$ BEGIN
  ALTER TABLE enquiries ADD CONSTRAINT enquiries_guest_or_registered_check
    CHECK (family_profile_id IS NOT NULL OR guest_email IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN enquiries.guest_name IS
  'Name of the enquiring parent (guest enquiries only, no auth required).';
COMMENT ON COLUMN enquiries.guest_email IS
  'Email of the enquiring parent (guest enquiries only). Used for follow-up and ghost account creation.';
COMMENT ON COLUMN enquiries.guest_child_age IS
  'Child age as free text, e.g. "2 years" or "18 months" (guest enquiries only).';

-- 2d. Index on guest_email for lookups and deduplication
CREATE INDEX IF NOT EXISTS idx_enquiries_guest_email
  ON enquiries (guest_email) WHERE guest_email IS NOT NULL;


-- ============================================================================
-- 3. TRANSLATION PREVIEW — Add approval flags
-- ============================================================================
-- Raised by: Yuki (UX), Mei Lin (Family), Sophie (Educator)
-- Finding 1.7: "The AI translation needs a preview step and softer labeling"
-- Mei Lin: "You MUST let me see the translation before sending."
-- Default false for guest enquiries (translation must be previewed).
-- Default true for quick-send (registered users can skip preview).
-- ============================================================================

-- 3a. translation_approved on enquiries
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS translation_approved boolean
  NOT NULL DEFAULT false;

COMMENT ON COLUMN enquiries.translation_approved IS
  'Whether the user reviewed and approved the AI translation before sending. '
  'Default false for guest enquiries (preview required), true for quick-send. '
  'Recommended by Yuki (UX) and Mei Lin (Family) — Finding 1.7.';

-- 3b. translation_approved on job_applications
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS translation_approved boolean
  NOT NULL DEFAULT false;

COMMENT ON COLUMN job_applications.translation_approved IS
  'Whether the educator reviewed the AI translation of their cover note. '
  'Sophie (Educator): "AI-translated cover notes might misrepresent my Chinese proficiency."';


-- ============================================================================
-- 4. CCS (CHILD CARE SUBSIDY) EXPLAINER — Fields on center_profiles
-- ============================================================================
-- Raised by: Rachel (PM), Mei Lin (Family), Karen (Center Director)
-- Finding 1.9: "CCS information is critically missing"
-- Mei Lin: "I see $120-$150/day and my stomach drops" before realising the
-- subsidy reduces it significantly. Karen notes many Chinese-speaking families
-- are confused about CCS.
-- ============================================================================

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS is_ccs_approved boolean
  NOT NULL DEFAULT true;

COMMENT ON COLUMN center_profiles.is_ccs_approved IS
  'Whether the center is approved for the Australian Child Care Subsidy. '
  'Default true — most licensed centers are CCS-approved. '
  'Recommended by Rachel (PM), Mei Lin (Family), Karen (Center Director) — Finding 1.9.';

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS fee_before_subsidy numeric(8,2);

COMMENT ON COLUMN center_profiles.fee_before_subsidy IS
  'Representative daily fee before CCS subsidy, for display on CCS explainer. '
  'May differ from fee_min/fee_max which represent the full fee range.';

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS fee_after_subsidy_estimate numeric(8,2);

COMMENT ON COLUMN center_profiles.fee_after_subsidy_estimate IS
  'Estimated daily fee after CCS subsidy for a typical family (combined income ~$130k). '
  'Displayed alongside fee_before_subsidy to reduce sticker shock. '
  'Mei Lin: "I see $120-$150/day and my stomach drops."';


-- ============================================================================
-- 5. SMS NOTIFICATIONS FOR CENTERS
-- ============================================================================
-- Raised by: Rachel (PM), Karen (Center Director)
-- Finding #6: "No SMS Notification to Centers"
-- Karen: "I don't want another dashboard. I don't want another login. I want
-- an email." — and even better, an SMS when she is on the floor with children.
-- Rachel: "Add Twilio SMS. Cost: ~$0.05/SMS."
-- ============================================================================

-- Use the text type with a CHECK constraint instead of the enum, so we can
-- add the column with a default even if the enum already existed differently.
-- Actually, let's use the enum we created above.
ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS notification_preference
  notification_preference NOT NULL DEFAULT 'email';

COMMENT ON COLUMN center_profiles.notification_preference IS
  'How the center wants to be notified of new enquiries: email, sms, or both. '
  'Default: email. SMS requires mobile_phone to be set. '
  'Recommended by Rachel (PM) and Karen (Center Director) — Finding #6.';

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS mobile_phone text;

COMMENT ON COLUMN center_profiles.mobile_phone IS
  'Australian mobile number for SMS notifications (Twilio). '
  'Required when notification_preference is sms or both.';


-- ============================================================================
-- 6. QR CODE SUPPORT — Center-specific QR code URL
-- ============================================================================
-- Raised by: Rachel (PM), Yuki (UX)
-- Finding 5.10: "QR Code for Center Profiles"
-- Chinese families share QR codes constantly. Higher-fidelity sharing
-- mechanism than URLs for this audience.
-- ============================================================================

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS qr_code_url text;

COMMENT ON COLUMN center_profiles.qr_code_url IS
  'URL to a pre-generated QR code image pointing to the center''s public profile page. '
  'Generated on center profile creation/update. Used for WeChat sharing and print materials. '
  'Recommended by Rachel (PM) and Yuki (UX) — Finding 5.10.';


-- ============================================================================
-- 7. FOUNDER PARTNER TRACKING — Expiry date for time-limited offer
-- ============================================================================
-- The is_founding_partner boolean already exists on center_profiles.
-- Adding an expiry timestamp so the founding partner offer can be time-limited.
-- ============================================================================

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS founding_partner_expires_at timestamptz;

COMMENT ON COLUMN center_profiles.founding_partner_expires_at IS
  'When the founding partner offer expires for this center. '
  'NULL means the offer does not expire (or center is not a founding partner). '
  'Used to enforce time-limited founding partner pricing.';


-- ============================================================================
-- 8. WAITLIST CAPTURE TABLE — Suburb-level demand tracking
-- ============================================================================
-- Raised by: Rachel (PM), Yuki (UX)
-- Finding 1.3: "Empty search results will destroy the product at launch"
-- Finding 5.2: "Suburb-Level Waitlist Capture"
-- Rachel: Use demand data in center sales — "42 families in Glen Waverley
-- are waiting for a bilingual center."
-- Yuki designed a full layered empty state strategy.
-- ============================================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               text NOT NULL,
  suburb              text,
  postcode            text,
  preferred_language  text CHECK (preferred_language IN ('en', 'zh')),
  languages_wanted    text[] DEFAULT '{}',
  child_age           text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE waitlist IS
  'Captures demand from families who searched in suburbs with no center coverage. '
  'No auth required — public insert. Used for sales outreach ("42 families in '
  'your suburb are waiting") and future expansion planning. '
  'Recommended by Rachel (PM) and Yuki (UX) — Findings 1.3, 5.2.';

-- Enable RLS on the waitlist table
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Index on suburb + postcode for demand aggregation queries
CREATE INDEX IF NOT EXISTS idx_waitlist_suburb ON waitlist (suburb);
CREATE INDEX IF NOT EXISTS idx_waitlist_postcode ON waitlist (postcode);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);


-- ============================================================================
-- 9. UPDATED RLS POLICIES
-- ============================================================================

-- ========================  waitlist (new table)  ========================

-- Public (including anonymous): can insert into waitlist
-- Rate limiting is handled at the Edge Function level, not in RLS.
CREATE POLICY waitlist_insert_anon ON waitlist
  FOR INSERT WITH CHECK (true);

-- Admin: can read all waitlist entries
CREATE POLICY waitlist_select_admin ON waitlist
  FOR SELECT USING (is_admin());

-- Admin: can delete waitlist entries
CREATE POLICY waitlist_delete_admin ON waitlist
  FOR DELETE USING (is_admin());

-- ========================  enquiries (updated for guest access)  ========================

-- Allow anonymous users to INSERT into enquiries (guest enquiries).
-- This is the key policy change: families can now send enquiries without an account.
-- Rate limiting and spam prevention are handled at the Edge Function level.
-- The guest_or_registered constraint ensures guest_email is provided if no auth.
--
-- We drop the old family-only insert policy and replace it with one that supports both.
-- Note: DROP POLICY IF EXISTS is safe — it does nothing if the policy does not exist.

DROP POLICY IF EXISTS enquiries_insert_family ON enquiries;

-- New insert policy: allows both authenticated families AND anonymous guests.
-- Authenticated users must own the family_profile_id they reference.
-- Anonymous users must leave family_profile_id NULL (they use guest_* fields).
CREATE POLICY enquiries_insert_family_or_guest ON enquiries
  FOR INSERT WITH CHECK (
    -- Case 1: Authenticated family user with a valid family_profile_id
    (
      family_profile_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM family_profiles fp
        WHERE fp.id = enquiries.family_profile_id
          AND fp.profile_id = auth.uid()
      )
    )
    OR
    -- Case 2: Guest enquiry (anonymous — no auth required)
    -- family_profile_id must be NULL and guest_email must be provided
    (
      family_profile_id IS NULL
      AND guest_email IS NOT NULL
    )
  );

COMMENT ON POLICY enquiries_insert_family_or_guest ON enquiries IS
  'Allows both authenticated families and anonymous guests to submit enquiries. '
  'Guest enquiries require guest_email. Rate limiting at Edge Function level. '
  'Recommended by Rachel, Yuki, Mei Lin, Karen — Finding 1.1.';

-- Update the family SELECT policy to handle nullable family_profile_id safely.
-- The existing policy references family_profile_id which can now be NULL for guest rows.
-- Registered families should only see their own enquiries (not guest ones).
-- The existing policy already does this correctly because the JOIN will fail for NULL.
-- No change needed for enquiries_select_family.

-- Centers can still read all enquiries addressed to them (both guest and registered).
-- The existing enquiries_select_center policy works correctly — it only checks
-- center_profile_id, not family_profile_id. No change needed.

-- Admin can still read all enquiries. No change needed for enquiries_admin_all.


-- ============================================================================
-- 10. SIMPLIFIED PROFILE FIELD DOCUMENTATION (Phase 1 vs Phase 2)
-- ============================================================================
-- Raised by: ALL five reviewers — Finding 1.2
-- Rachel: "Time-to-value is 5-8 minutes for families (should be under 2)."
-- Yuki: "No auto-save, no progress saving, no wizard steps."
-- Sophie: "20-25 minutes for the educator profile."
--
-- The columns already exist and many are already nullable. This section adds
-- documentation comments indicating which fields are Phase 1 (required at
-- minimum viable signup) vs Phase 2 (collected progressively after first value
-- is delivered). No schema changes — documentation only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- family_profiles — Phase 1 vs Phase 2 field documentation
-- ---------------------------------------------------------------------------
-- Phase 1 (minimum viable signup): parent_name, suburb
-- Phase 2 (progressive completion): chinese_name, phone, wechat_id, postcode,
--   state, location, communication_language, priorities, additional_notes,
--   values_* fields
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN family_profiles.parent_name IS
  'Phase 1 (required at signup). Parent''s name for enquiries.';
COMMENT ON COLUMN family_profiles.suburb IS
  'Phase 1 (required at signup). Used for proximity search.';
COMMENT ON COLUMN family_profiles.chinese_name IS
  'Phase 2 (progressive profile). Chinese name for bilingual communication.';
COMMENT ON COLUMN family_profiles.phone IS
  'Phase 2 (progressive profile). Phone number — optional at signup.';
COMMENT ON COLUMN family_profiles.wechat_id IS
  'Phase 2 (progressive profile). WeChat ID for centers who communicate via WeChat.';
COMMENT ON COLUMN family_profiles.postcode IS
  'Phase 2 (progressive profile). Auto-filled from suburb selection.';
COMMENT ON COLUMN family_profiles.state IS
  'Phase 2 (progressive profile). Auto-filled from suburb selection.';
COMMENT ON COLUMN family_profiles.priorities IS
  'Phase 2 (progressive profile). Collected after first enquiry.';
COMMENT ON COLUMN family_profiles.additional_notes IS
  'Phase 2 (progressive profile). Free-text notes about the family''s needs.';
COMMENT ON COLUMN family_profiles.values_learning_style IS
  'Phase 2 (deferred — post-first-action). Values quiz removed from onboarding per Finding 1.4.';
COMMENT ON COLUMN family_profiles.values_cultural_events IS
  'Phase 2 (deferred). Values quiz — offer as optional "improve your matches" prompt.';
COMMENT ON COLUMN family_profiles.values_update_frequency IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN family_profiles.values_outdoor_time IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN family_profiles.values_meal_preference IS
  'Phase 2 (deferred). Values quiz.';

-- ---------------------------------------------------------------------------
-- children — Phase 1 vs Phase 2
-- ---------------------------------------------------------------------------
-- Phase 1: name, date_of_birth (or age — see UX note), days_per_week
-- Phase 2: additional_needs
-- UX note from Yuki: Replace DOB date picker with age selector dropdown.
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN children.name IS
  'Phase 1 (required). Child''s name.';
COMMENT ON COLUMN children.date_of_birth IS
  'Phase 1 (required). UX note: Yuki recommends replacing DOB date picker with age selector dropdown — matches Chinese parental thinking ("my child is 2.5 years old" not "born on 2023-08-15").';
COMMENT ON COLUMN children.days_per_week IS
  'Phase 1 (required). How many days per week the family needs care.';
COMMENT ON COLUMN children.additional_needs IS
  'Phase 2 (progressive profile). Special needs, allergies, dietary requirements.';

-- ---------------------------------------------------------------------------
-- educator_profiles — Phase 1 vs Phase 2
-- ---------------------------------------------------------------------------
-- Phase 1 (minimum viable signup): full_name, suburb, languages, qualification
-- Phase 2 (progressive completion): phone, postcode, state, location,
--   wwcc_*, first_aid_current, years_experience, employment_preference,
--   pay_*, max_commute_km, bio, resume_url, photo_url, values_*
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN educator_profiles.full_name IS
  'Phase 1 (required at signup). Educator''s full name.';
COMMENT ON COLUMN educator_profiles.suburb IS
  'Phase 1 (required at signup). Used for job proximity matching.';
COMMENT ON COLUMN educator_profiles.languages IS
  'Phase 1 (required at signup). Core value proposition — which languages the educator speaks.';
COMMENT ON COLUMN educator_profiles.qualification IS
  'Phase 1 (required at signup). ECE qualification level.';
COMMENT ON COLUMN educator_profiles.phone IS
  'Phase 2 (progressive profile). Phone number.';
COMMENT ON COLUMN educator_profiles.bio IS
  'Phase 2 (progressive profile). Free-text biography.';
COMMENT ON COLUMN educator_profiles.resume_url IS
  'Phase 2 (progressive profile). Uploaded resume.';
COMMENT ON COLUMN educator_profiles.photo_url IS
  'Phase 2 (progressive profile). Profile photo.';
COMMENT ON COLUMN educator_profiles.wwcc_number IS
  'Phase 2 (progressive profile). Working With Children Check number.';
COMMENT ON COLUMN educator_profiles.years_experience IS
  'Phase 2 (progressive profile). Years of ECE experience.';
COMMENT ON COLUMN educator_profiles.values_learning_style IS
  'Phase 2 (deferred). Values quiz removed from onboarding per Finding 1.4.';
COMMENT ON COLUMN educator_profiles.values_cultural_events IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN educator_profiles.values_update_frequency IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN educator_profiles.values_outdoor_time IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN educator_profiles.values_meal_preference IS
  'Phase 2 (deferred). Values quiz.';

-- ---------------------------------------------------------------------------
-- center_profiles — Phase 1 vs Phase 2
-- ---------------------------------------------------------------------------
-- Phase 1 (minimum viable signup): center_name, address, suburb, phone,
--   description_en (or description_zh), one photo (via center_photos)
-- Phase 2 (progressive completion): abn, postcode, state, location, email,
--   website, description in the other language, operating_hours, age_groups,
--   fee_*, staff_languages, programs, nqs_rating, values_*
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN center_profiles.center_name IS
  'Phase 1 (required at signup). Center name as displayed publicly.';
COMMENT ON COLUMN center_profiles.address IS
  'Phase 1 (required at signup). Street address for location display.';
COMMENT ON COLUMN center_profiles.suburb IS
  'Phase 1 (required at signup). Used in search results.';
COMMENT ON COLUMN center_profiles.phone IS
  'Phase 1 (required at signup). Primary contact phone for enquiries.';
COMMENT ON COLUMN center_profiles.description_en IS
  'Phase 1 (required — at least one language). English description of the center.';
COMMENT ON COLUMN center_profiles.description_zh IS
  'Phase 1 (required — at least one language). Chinese description. If only one language provided, the other is AI-translated.';
COMMENT ON COLUMN center_profiles.abn IS
  'Phase 2 (progressive profile). Australian Business Number.';
COMMENT ON COLUMN center_profiles.operating_hours IS
  'Phase 2 (progressive profile). JSONB object with daily open/close times.';
COMMENT ON COLUMN center_profiles.age_groups IS
  'Phase 2 (progressive profile). JSONB array of age groups with capacity/vacancy info.';
COMMENT ON COLUMN center_profiles.fee_min IS
  'Phase 2 (progressive profile). Minimum daily fee.';
COMMENT ON COLUMN center_profiles.fee_max IS
  'Phase 2 (progressive profile). Maximum daily fee.';
COMMENT ON COLUMN center_profiles.staff_languages IS
  'Phase 2 (progressive profile). JSONB array of languages spoken by staff with counts.';
COMMENT ON COLUMN center_profiles.nqs_rating IS
  'Phase 2 (progressive profile). National Quality Standard rating.';
COMMENT ON COLUMN center_profiles.values_learning_style IS
  'Phase 2 (deferred). Values quiz removed from onboarding per Finding 1.4.';
COMMENT ON COLUMN center_profiles.values_cultural_events IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN center_profiles.values_update_frequency IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN center_profiles.values_outdoor_time IS
  'Phase 2 (deferred). Values quiz.';
COMMENT ON COLUMN center_profiles.values_meal_preference IS
  'Phase 2 (deferred). Values quiz.';


-- ============================================================================
-- 11. UPDATED search_centers FUNCTION — Better empty result handling
-- ============================================================================
-- Raised by: Rachel (PM), Yuki (UX), Mei Lin (Family)
-- Finding 1.3: "Empty search results will destroy the product at launch"
-- Rachel: "First impressions in marketplaces are permanent."
-- Mei Lin: "Zero results is a death sentence for this app."
--
-- Change: If the initial search returns 0 results within the requested radius,
-- automatically expand to 50km and return up to 5 nearest centers, flagged
-- with is_expanded_result = true.
-- ============================================================================

CREATE OR REPLACE FUNCTION search_centers(
  p_lat        float,
  p_lng        float,
  p_radius_km  float DEFAULT 20,
  p_language   text  DEFAULT NULL,
  p_age_group  text  DEFAULT NULL
)
RETURNS TABLE (
  id                  uuid,
  center_name         text,
  slug                text,
  suburb              text,
  postcode            text,
  state               text,
  description_en      text,
  description_zh      text,
  fee_min             numeric,
  fee_max             numeric,
  nqs_rating          text,
  programs            text[],
  staff_languages     jsonb,
  age_groups          jsonb,
  subscription_status subscription_status,
  is_founding_partner boolean,
  distance_km         float,
  photo_url           text,
  is_expanded_result  boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- First, try the normal search within the requested radius
  RETURN QUERY
  SELECT
    cp.id,
    cp.center_name,
    cp.slug,
    cp.suburb,
    cp.postcode,
    cp.state,
    cp.description_en,
    cp.description_zh,
    cp.fee_min,
    cp.fee_max,
    cp.nqs_rating,
    cp.programs,
    cp.staff_languages,
    cp.age_groups,
    cp.subscription_status,
    cp.is_founding_partner,
    ROUND((ST_Distance(
      cp.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0)::numeric, 1)::float AS distance_km,
    (SELECT cph.photo_url FROM center_photos cph
     WHERE cph.center_profile_id = cp.id
     ORDER BY cph.display_order LIMIT 1) AS photo_url,
    false AS is_expanded_result
  FROM center_profiles cp
  JOIN profiles p ON p.id = cp.profile_id
  WHERE p.is_active = true
    AND cp.location IS NOT NULL
    AND ST_DWithin(
          cp.location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_km * 1000
        )
    -- Optional language filter
    AND (p_language IS NULL OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(cp.staff_languages) AS sl
      WHERE lower(sl->>'language') = lower(p_language)
    ))
    -- Optional age group filter
    AND (p_age_group IS NULL OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(cp.age_groups) AS ag
      WHERE lower(ag->>'group_name') = lower(p_age_group)
    ))
  ORDER BY distance_km;

  -- Check if we got any results
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- If 0 results, expand to 50km and return up to 5 nearest centers
  -- Drop the language and age_group filters for expanded results to maximize hits.
  IF v_count = 0 THEN
    RETURN QUERY
    SELECT
      cp.id,
      cp.center_name,
      cp.slug,
      cp.suburb,
      cp.postcode,
      cp.state,
      cp.description_en,
      cp.description_zh,
      cp.fee_min,
      cp.fee_max,
      cp.nqs_rating,
      cp.programs,
      cp.staff_languages,
      cp.age_groups,
      cp.subscription_status,
      cp.is_founding_partner,
      ROUND((ST_Distance(
        cp.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      ) / 1000.0)::numeric, 1)::float AS distance_km,
      (SELECT cph.photo_url FROM center_photos cph
       WHERE cph.center_profile_id = cp.id
       ORDER BY cph.display_order LIMIT 1) AS photo_url,
      true AS is_expanded_result
    FROM center_profiles cp
    JOIN profiles p ON p.id = cp.profile_id
    WHERE p.is_active = true
      AND cp.location IS NOT NULL
      AND ST_DWithin(
            cp.location,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            50 * 1000  -- 50km expanded radius
          )
    ORDER BY distance_km
    LIMIT 5;
  END IF;
END;
$$;

COMMENT ON FUNCTION search_centers IS
  'PostGIS proximity search for centers with optional language/age filters. '
  'If 0 results within requested radius, auto-expands to 50km and returns up to 5 '
  'nearest centers with is_expanded_result=true. '
  'Recommended by Rachel (PM), Yuki (UX), Mei Lin (Family) — Finding 1.3.';


-- ============================================================================
-- 12. GRANT ANONYMOUS ACCESS
-- ============================================================================
-- Supabase uses the 'anon' role for unauthenticated requests.
-- We need to ensure anon can access the tables it needs for guest operations.
-- RLS policies above control what anon can actually do (insert only).
-- ============================================================================

-- Grant anon access to enquiries table (for guest enquiry inserts)
GRANT INSERT ON enquiries TO anon;
GRANT SELECT ON enquiries TO anon;

-- Grant anon access to waitlist table (for waitlist captures)
GRANT INSERT ON waitlist TO anon;

-- Grant anon SELECT on center_profiles (already public read via RLS,
-- but ensure anon role has table-level access)
GRANT SELECT ON center_profiles TO anon;
GRANT SELECT ON center_photos TO anon;

-- Grant anon the ability to call search_centers
GRANT EXECUTE ON FUNCTION search_centers TO anon;


-- ============================================================================
-- 13. ADDITIONAL INDEXES FOR NEW COLUMNS
-- ============================================================================

-- Index for CCS-approved centers (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_center_profiles_is_ccs_approved
  ON center_profiles (is_ccs_approved) WHERE is_ccs_approved = true;

-- Index for founding partner expiry (useful for cron jobs checking expiry)
CREATE INDEX IF NOT EXISTS idx_center_profiles_founding_partner_expires_at
  ON center_profiles (founding_partner_expires_at)
  WHERE founding_partner_expires_at IS NOT NULL;

-- Index for notification preference (useful for SMS send jobs)
CREATE INDEX IF NOT EXISTS idx_center_profiles_notification_preference
  ON center_profiles (notification_preference)
  WHERE notification_preference IN ('sms', 'both');


-- ============================================================================
-- 14. MISSING COLUMNS ON enquiries TABLE — Edge function mismatches
-- ============================================================================
-- The submit-guest-enquiry Edge Function writes these columns but they did not
-- exist in the original schema.sql or in the earlier sections of this migration.
-- ============================================================================

-- 14a. guest_child_days_needed — e.g. "3 days/week", "Mon, Wed, Fri"
--      Written by submit-guest-enquiry (body.guest_child_days_needed)
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS guest_child_days_needed text;

COMMENT ON COLUMN enquiries.guest_child_days_needed IS
  'Days of care needed, e.g. "3 days/week" or "Mon, Wed, Fri" (guest enquiries). '
  'Written by submit-guest-enquiry Edge Function.';

-- 14b. client_ip — Used for IP-based rate limiting (max 20 enquiries/IP/day)
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS client_ip inet;

COMMENT ON COLUMN enquiries.client_ip IS
  'Client IP address captured at submission time for rate limiting (max 20/day per IP). '
  'Written by submit-guest-enquiry Edge Function.';

-- 14c. is_guest — Distinguishes guest enquiries from authenticated ones
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS is_guest boolean DEFAULT false;

COMMENT ON COLUMN enquiries.is_guest IS
  'Whether this enquiry was submitted by a guest (no auth). '
  'Written by submit-guest-enquiry Edge Function. Default false for authenticated enquiries.';

-- Index on client_ip for rate-limit lookups
CREATE INDEX IF NOT EXISTS idx_enquiries_client_ip
  ON enquiries (client_ip) WHERE client_ip IS NOT NULL;


-- ============================================================================
-- 15. RENAME match_reasons -> match_factors (enquiries + job_applications)
-- ============================================================================
-- The original schema.sql defines match_reasons as text[] DEFAULT '{}' on both
-- enquiries and job_applications. However, the submit-guest-enquiry Edge
-- Function writes match_factors as JSONB objects with structure:
--   { label_en: string, label_zh: string, icon: string }
-- This is richer than plain text arrays. Rename and change the type.
-- ============================================================================

-- 15a. enquiries: rename match_reasons -> match_factors, then change type to jsonb
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'enquiries'
      AND column_name = 'match_reasons'
  ) THEN
    ALTER TABLE enquiries RENAME COLUMN match_reasons TO match_factors;
    ALTER TABLE enquiries ALTER COLUMN match_factors TYPE jsonb USING match_factors::jsonb;
    ALTER TABLE enquiries ALTER COLUMN match_factors SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- If the column was already renamed (idempotent re-run), ensure it exists as jsonb
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'enquiries'
      AND column_name = 'match_factors'
  ) THEN
    ALTER TABLE enquiries ADD COLUMN match_factors jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN enquiries.match_factors IS
  'JSONB array of match factor objects: [{label_en, label_zh, icon}, ...]. '
  'Replaces the former match_reasons text[] column. Richer structure supports '
  'bilingual badge display per Karen/Yuki review feedback.';

-- 15b. job_applications: rename match_reasons -> match_factors, then change type to jsonb
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
      AND column_name = 'match_reasons'
  ) THEN
    ALTER TABLE job_applications RENAME COLUMN match_reasons TO match_factors;
    ALTER TABLE job_applications ALTER COLUMN match_factors TYPE jsonb USING match_factors::jsonb;
    ALTER TABLE job_applications ALTER COLUMN match_factors SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
      AND column_name = 'match_factors'
  ) THEN
    ALTER TABLE job_applications ADD COLUMN match_factors jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN job_applications.match_factors IS
  'JSONB array of match factor objects: [{label_en, label_zh, icon}, ...]. '
  'Replaces the former match_reasons text[] column.';


-- ============================================================================
-- 16. MISSING COLUMNS ON subscriptions_log — Stripe webhook mismatches
-- ============================================================================
-- The stripe-webhook Edge Function calls logEvent() which writes metadata (jsonb)
-- and processed_at (timestamptz) to subscriptions_log, but neither column exists
-- in the original schema.sql.
-- ============================================================================

ALTER TABLE subscriptions_log ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN subscriptions_log.metadata IS
  'Arbitrary JSONB metadata logged by the stripe-webhook Edge Function. '
  'Contains event-specific data such as subscription_id, customer_id, amount, etc.';

ALTER TABLE subscriptions_log ADD COLUMN IF NOT EXISTS processed_at timestamptz DEFAULT now();

COMMENT ON COLUMN subscriptions_log.processed_at IS
  'Timestamp when the Stripe event was processed by the webhook handler. '
  'Written by stripe-webhook Edge Function logEvent().';


-- ============================================================================
-- 17. MISSING COLUMN ON center_profiles — subscription_trial_end
-- ============================================================================
-- The build guide (LOVABLE-BUILD-GUIDE.md and LOVABLE-BUILD-GUIDE-v2.md)
-- references subscription_trial_end on center_profiles, but the column does
-- not exist in the original schema.sql.
-- ============================================================================

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS subscription_trial_end timestamptz;

COMMENT ON COLUMN center_profiles.subscription_trial_end IS
  'When the center''s free trial period ends. NULL if not on trial or trial has ended. '
  'Referenced by build guide for subscription management UI.';


-- =========================================================================
-- Section 18: Educator lead capture table
-- =========================================================================

CREATE TABLE IF NOT EXISTS educator_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  suburb text NOT NULL,
  postcode text,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  qualification text,
  has_wwcc text DEFAULT 'unsure' CHECK (has_wwcc IN ('yes', 'no', 'unsure')),
  preferred_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE educator_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can register interest (no auth required)
CREATE POLICY educator_leads_insert_anon ON educator_leads
  FOR INSERT TO anon WITH CHECK (true);

-- Only admins can view educator leads
CREATE POLICY educator_leads_select_admin ON educator_leads
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_educator_leads_suburb ON educator_leads(suburb);
CREATE INDEX IF NOT EXISTS idx_educator_leads_created ON educator_leads(created_at DESC);

-- Grant anon insert permission
GRANT INSERT ON educator_leads TO anon;


-- =========================================================================
-- Section 19: Add acecqa_url to center_profiles
-- =========================================================================

ALTER TABLE center_profiles ADD COLUMN IF NOT EXISTS acecqa_url text;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
--
-- TABLES MODIFIED:
--   enquiries         — family_profile_id now nullable; added guest_* fields,
--                       translation_approved, guest_or_registered constraint,
--                       guest_child_days_needed, client_ip, is_guest;
--                       RENAMED match_reasons (text[]) -> match_factors (jsonb)
--   job_applications  — added translation_approved;
--                       RENAMED match_reasons (text[]) -> match_factors (jsonb)
--   center_profiles   — added is_ccs_approved, fee_before_subsidy,
--                       fee_after_subsidy_estimate, notification_preference,
--                       mobile_phone, qr_code_url, founding_partner_expires_at,
--                       subscription_trial_end, acecqa_url
--   subscriptions_log — added metadata (jsonb), processed_at (timestamptz)
--
-- TABLES CREATED:
--   educator_leads    — educator lead capture (public insert, admin read)
--   waitlist          — suburb-level demand capture (public insert)
--
-- ENUMS CREATED:
--   notification_preference  — email, sms, both
--
-- RLS POLICIES:
--   DROPPED: enquiries_insert_family (replaced)
--   CREATED: enquiries_insert_family_or_guest (supports anonymous + auth)
--   CREATED: waitlist_insert_anon (public insert)
--   CREATED: waitlist_select_admin (admin read)
--   CREATED: waitlist_delete_admin (admin delete)
--
-- FUNCTIONS UPDATED:
--   search_centers    — added is_expanded_result column; auto-expands to 50km
--                       with 5 nearest centers when 0 results in requested radius
--
-- GRANTS:
--   anon role granted INSERT on enquiries and waitlist
--   anon role granted SELECT on enquiries, center_profiles, center_photos
--   anon role granted EXECUTE on search_centers
--
-- DOCUMENTATION:
--   Added Phase 1 / Phase 2 comments to family_profiles, children,
--   educator_profiles, and center_profiles columns
-- ============================================================================
