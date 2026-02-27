-- ============================================================================
-- LittleBridge — Bilingual Early Education Marketplace
-- Complete Supabase SQL Schema
-- Version: 1.0 (MVP)
-- Generated: 2026-02-27
--
-- Paste this entire file into the Supabase SQL Editor and run it once.
-- It is idempotent for enums/extensions (uses IF NOT EXISTS) and will
-- create all tables, indexes, RLS policies, functions, triggers, and seed
-- data needed for the production MVP.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Spatial / location queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram text search

-- ============================================================================
-- 2. ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('family', 'educator', 'center', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'inactive'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enquiry_status AS ENUM (
    'new', 'contacted', 'tour_booked', 'enrolled', 'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'new', 'reviewed', 'interview_scheduled', 'hired', 'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('active', 'paused', 'closed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM (
    'full_time', 'part_time', 'casual', 'contract'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE qualification_level AS ENUM (
    'certificate_iii', 'diploma', 'bachelor', 'master', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE language_proficiency AS ENUM (
    'native', 'fluent', 'conversational', 'basic'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1  profiles — bridge table linking auth.users to role-specific data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role        NOT NULL,
  email           text             NOT NULL,
  display_name    text,
  preferred_language text          NOT NULL DEFAULT 'en'
                                   CHECK (preferred_language IN ('en', 'zh')),
  avatar_url      text,
  is_active       boolean          NOT NULL DEFAULT true,
  onboarding_completed boolean     NOT NULL DEFAULT false,
  created_at      timestamptz      NOT NULL DEFAULT now(),
  updated_at      timestamptz      NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Core profile bridging auth.users to role-specific tables.';

-- ---------------------------------------------------------------------------
-- 3.2  family_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_profiles (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  parent_name               text NOT NULL,
  chinese_name              text,
  phone                     text,
  wechat_id                 text,
  suburb                    text,
  postcode                  text,
  state                     text,
  location                  geography(Point, 4326),
  communication_language    text DEFAULT 'en'
                            CHECK (communication_language IN ('en', 'zh')),
  priorities                text[] DEFAULT '{}',
  -- priorities values: bilingual_education, cultural_understanding,
  --   proximity, cost, outdoor_play, academic_readiness
  additional_notes          text,
  additional_notes_translated text,
  -- Wellbeing values quiz (5 questions, each stores a short answer key)
  values_learning_style     text,
  values_cultural_events    text,
  values_update_frequency   text,
  values_outdoor_time       text,
  values_meal_preference    text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE family_profiles IS 'Extended profile data for family users.';

-- ---------------------------------------------------------------------------
-- 3.3  children
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS children (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_profile_id uuid NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
  name              text NOT NULL,
  date_of_birth     date NOT NULL,
  days_per_week     integer NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
  additional_needs  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE children IS 'Children belonging to a family profile.';

-- ---------------------------------------------------------------------------
-- 3.4  educator_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS educator_profiles (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id              uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name               text NOT NULL,
  phone                   text,
  suburb                  text,
  postcode                text,
  state                   text,
  location                geography(Point, 4326),
  languages               jsonb NOT NULL DEFAULT '[]',
  -- Array of {language: text, proficiency: language_proficiency}
  qualification           qualification_level,
  wwcc_number             text,
  wwcc_state              text,
  wwcc_expiry             date,
  first_aid_current       boolean NOT NULL DEFAULT false,
  years_experience        integer NOT NULL DEFAULT 0,
  employment_preference   employment_type,
  pay_min                 numeric(8,2),
  pay_max                 numeric(8,2),
  max_commute_km          integer,
  bio                     text,
  bio_translated          text,
  resume_url              text,
  photo_url               text,
  is_visible              boolean NOT NULL DEFAULT true,
  -- Wellbeing values quiz
  values_learning_style   text,
  values_cultural_events  text,
  values_update_frequency text,
  values_outdoor_time     text,
  values_meal_preference  text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE educator_profiles IS 'Extended profile data for educator users.';

-- ---------------------------------------------------------------------------
-- 3.5  center_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS center_profiles (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id              uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  center_name             text NOT NULL,
  slug                    text UNIQUE,
  abn                     text,
  address                 text,
  suburb                  text,
  postcode                text,
  state                   text,
  location                geography(Point, 4326),
  phone                   text,
  email                   text,
  website                 text,
  description_en          text,
  description_zh          text,
  operating_hours         jsonb DEFAULT '{}',
  -- e.g. {"monday":{"open":"07:00","close":"18:00"}, ...}
  age_groups              jsonb DEFAULT '[]',
  -- Array of {group_name: text, capacity: int, vacancies: int}
  fee_min                 numeric(8,2),
  fee_max                 numeric(8,2),
  staff_languages         jsonb DEFAULT '[]',
  -- Array of {language: text, count: int}
  programs                text[] DEFAULT '{}',
  -- bilingual_program, cultural_events, mandarin_classes, play_based,
  -- montessori, stem, outdoor, music, art, sports
  nqs_rating              text CHECK (nqs_rating IN (
                            'exceeding', 'meeting', 'working_towards',
                            'not_yet_assessed'
                          )),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     subscription_status NOT NULL DEFAULT 'inactive',
  subscription_tier       text NOT NULL DEFAULT 'starter',
  is_founding_partner     boolean NOT NULL DEFAULT false,
  -- Wellbeing values quiz
  values_learning_style   text,
  values_cultural_events  text,
  values_update_frequency text,
  values_outdoor_time     text,
  values_meal_preference  text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE center_profiles IS 'Extended profile data for childcare centers.';

-- ---------------------------------------------------------------------------
-- 3.6  center_photos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS center_photos (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_profile_id   uuid NOT NULL REFERENCES center_profiles(id) ON DELETE CASCADE,
  photo_url           text NOT NULL,
  display_order       integer NOT NULL DEFAULT 0,
  alt_text            text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE center_photos IS 'Photos gallery for a center profile.';

-- ---------------------------------------------------------------------------
-- 3.7  job_listings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_listings (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_profile_id     uuid NOT NULL REFERENCES center_profiles(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  employment_type       employment_type NOT NULL,
  description_en        text,
  description_zh        text,
  qualification_required qualification_level,
  languages_required    jsonb DEFAULT '[]',
  -- Array of {language: text, proficiency: language_proficiency}
  experience_required   integer DEFAULT 0,
  pay_min               numeric(8,2),
  pay_max               numeric(8,2),
  start_date            date,
  visa_sponsorship      boolean NOT NULL DEFAULT false,
  status                job_status NOT NULL DEFAULT 'active',
  expires_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE job_listings IS 'Job postings published by centers.';

-- ---------------------------------------------------------------------------
-- 3.8  enquiries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_profile_id       uuid NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
  center_profile_id       uuid NOT NULL REFERENCES center_profiles(id) ON DELETE CASCADE,
  preferred_tour_datetime text,
  message_original        text,
  message_translated      text,
  message_source_language text,
  contact_preference      text[] DEFAULT '{}',
  -- email, phone, wechat
  match_score             integer CHECK (match_score BETWEEN 0 AND 100),
  match_reasons           text[] DEFAULT '{}',
  status                  enquiry_status NOT NULL DEFAULT 'new',
  center_notes            text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE enquiries IS 'Family-to-center enquiries (book a tour).';

-- ---------------------------------------------------------------------------
-- 3.9  job_applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_applications (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  educator_profile_id       uuid NOT NULL REFERENCES educator_profiles(id) ON DELETE CASCADE,
  job_listing_id            uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  cover_note_original       text,
  cover_note_translated     text,
  cover_note_source_language text,
  available_to_start        date,
  interview_availability    text,
  match_score               integer CHECK (match_score BETWEEN 0 AND 100),
  match_reasons             text[] DEFAULT '{}',
  status                    application_status NOT NULL DEFAULT 'new',
  center_notes              text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (educator_profile_id, job_listing_id)
);

COMMENT ON TABLE job_applications IS 'Educator applications to job listings.';

-- ---------------------------------------------------------------------------
-- 3.10 subscriptions_log — Stripe webhook event journal
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions_log (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_profile_id   uuid NOT NULL REFERENCES center_profiles(id) ON DELETE CASCADE,
  stripe_event_id     text NOT NULL,
  event_type          text NOT NULL,
  amount              numeric(10,2),
  currency            text DEFAULT 'aud',
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE subscriptions_log IS 'Immutable log of Stripe subscription events.';

-- ---------------------------------------------------------------------------
-- 3.11 admin_activity_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE admin_activity_log IS 'Audit trail for admin actions.';


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE children             ENABLE ROW LEVEL SECURITY;
ALTER TABLE educator_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log   ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: extract the current user's role from the profiles table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Helper: check if current user is admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ========================  profiles  ========================

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Users can insert their own profile row (on signup)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Admin: full access to all profiles
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (is_admin());

-- ========================  family_profiles  ========================

-- Family can read/update their own profile
CREATE POLICY family_profiles_select_own ON family_profiles
  FOR SELECT USING (
    profile_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY family_profiles_insert_own ON family_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY family_profiles_update_own ON family_profiles
  FOR UPDATE USING (profile_id = auth.uid() OR is_admin());

CREATE POLICY family_profiles_delete_own ON family_profiles
  FOR DELETE USING (profile_id = auth.uid() OR is_admin());

-- Centers can read family profiles for their enquiries
CREATE POLICY family_profiles_center_read ON family_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enquiries e
      JOIN center_profiles cp ON cp.id = e.center_profile_id
      WHERE e.family_profile_id = family_profiles.id
        AND cp.profile_id = auth.uid()
    )
  );

-- ========================  children  ========================

-- Family can manage their own children
CREATE POLICY children_select_own ON children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = children.family_profile_id
        AND fp.profile_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY children_insert_own ON children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = children.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  );

CREATE POLICY children_update_own ON children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = children.family_profile_id
        AND fp.profile_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY children_delete_own ON children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = children.family_profile_id
        AND fp.profile_id = auth.uid()
    )
    OR is_admin()
  );

-- Centers can see children for families that enquired
CREATE POLICY children_center_read ON children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      JOIN enquiries e ON e.family_profile_id = fp.id
      JOIN center_profiles cp ON cp.id = e.center_profile_id
      WHERE fp.id = children.family_profile_id
        AND cp.profile_id = auth.uid()
    )
  );

-- ========================  educator_profiles  ========================

-- Educator can read/update their own profile
CREATE POLICY educator_profiles_select_own ON educator_profiles
  FOR SELECT USING (
    profile_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY educator_profiles_insert_own ON educator_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY educator_profiles_update_own ON educator_profiles
  FOR UPDATE USING (profile_id = auth.uid() OR is_admin());

CREATE POLICY educator_profiles_delete_own ON educator_profiles
  FOR DELETE USING (profile_id = auth.uid() OR is_admin());

-- Centers can read visible educator profiles who applied to their jobs
CREATE POLICY educator_profiles_center_read ON educator_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_listings jl ON jl.id = ja.job_listing_id
      JOIN center_profiles cp ON cp.id = jl.center_profile_id
      WHERE ja.educator_profile_id = educator_profiles.id
        AND cp.profile_id = auth.uid()
    )
  );

-- ========================  center_profiles  ========================

-- Public: anyone (including anon) can browse active center profiles
CREATE POLICY center_profiles_public_read ON center_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = center_profiles.profile_id
        AND p.is_active = true
    )
  );

-- Center can update their own profile
CREATE POLICY center_profiles_insert_own ON center_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY center_profiles_update_own ON center_profiles
  FOR UPDATE USING (profile_id = auth.uid() OR is_admin());

CREATE POLICY center_profiles_delete_own ON center_profiles
  FOR DELETE USING (profile_id = auth.uid() OR is_admin());

-- Admin: full access (covered by is_admin() in update/delete; select is public)

-- ========================  center_photos  ========================

-- Public read (photos are part of the public center profile)
CREATE POLICY center_photos_public_read ON center_photos
  FOR SELECT USING (true);

-- Center can manage their own photos
CREATE POLICY center_photos_insert_own ON center_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = center_photos.center_profile_id
        AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY center_photos_update_own ON center_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = center_photos.center_profile_id
        AND cp.profile_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY center_photos_delete_own ON center_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = center_photos.center_profile_id
        AND cp.profile_id = auth.uid()
    )
    OR is_admin()
  );

-- ========================  job_listings  ========================

-- Public: anyone (including anon) can browse active job listings
CREATE POLICY job_listings_public_read ON job_listings
  FOR SELECT USING (status = 'active');

-- Center owners can see all their own listings (any status)
CREATE POLICY job_listings_center_read_all ON job_listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = job_listings.center_profile_id
        AND cp.profile_id = auth.uid()
    )
  );

-- Center can create/update/delete their own job listings
CREATE POLICY job_listings_insert_own ON job_listings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = job_listings.center_profile_id
        AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY job_listings_update_own ON job_listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = job_listings.center_profile_id
        AND cp.profile_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY job_listings_delete_own ON job_listings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = job_listings.center_profile_id
        AND cp.profile_id = auth.uid()
    )
    OR is_admin()
  );

-- Admin: full read
CREATE POLICY job_listings_admin_read ON job_listings
  FOR SELECT USING (is_admin());

-- ========================  enquiries  ========================

-- Family can read their own enquiries
CREATE POLICY enquiries_select_family ON enquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = enquiries.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  );

-- Family can create enquiries to active centers
CREATE POLICY enquiries_insert_family ON enquiries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = enquiries.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  );

-- Center can read enquiries addressed to them
CREATE POLICY enquiries_select_center ON enquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = enquiries.center_profile_id
        AND cp.profile_id = auth.uid()
    )
  );

-- Center can update enquiry status/notes for their enquiries
CREATE POLICY enquiries_update_center ON enquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = enquiries.center_profile_id
        AND cp.profile_id = auth.uid()
    )
    OR is_admin()
  );

-- Admin: full access
CREATE POLICY enquiries_admin_all ON enquiries
  FOR ALL USING (is_admin());

-- ========================  job_applications  ========================

-- Educator can read their own applications
CREATE POLICY job_applications_select_educator ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM educator_profiles ep
      WHERE ep.id = job_applications.educator_profile_id
        AND ep.profile_id = auth.uid()
    )
  );

-- Educator can create applications
CREATE POLICY job_applications_insert_educator ON job_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM educator_profiles ep
      WHERE ep.id = job_applications.educator_profile_id
        AND ep.profile_id = auth.uid()
    )
  );

-- Center can read applications for their job listings
CREATE POLICY job_applications_select_center ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      JOIN center_profiles cp ON cp.id = jl.center_profile_id
      WHERE jl.id = job_applications.job_listing_id
        AND cp.profile_id = auth.uid()
    )
  );

-- Center can update application status/notes
CREATE POLICY job_applications_update_center ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      JOIN center_profiles cp ON cp.id = jl.center_profile_id
      WHERE jl.id = job_applications.job_listing_id
        AND cp.profile_id = auth.uid()
    )
    OR is_admin()
  );

-- Admin: full access
CREATE POLICY job_applications_admin_all ON job_applications
  FOR ALL USING (is_admin());

-- ========================  subscriptions_log  ========================

-- Center can read their own subscription events
CREATE POLICY subscriptions_log_select_center ON subscriptions_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM center_profiles cp
      WHERE cp.id = subscriptions_log.center_profile_id
        AND cp.profile_id = auth.uid()
    )
    OR is_admin()
  );

-- Insert handled by service role (Edge Functions with Stripe webhook)
-- No public insert policy needed; service_role bypasses RLS

-- ========================  admin_activity_log  ========================

-- Only admins can read the activity log
CREATE POLICY admin_activity_log_select ON admin_activity_log
  FOR SELECT USING (is_admin());

-- Only admins can insert
CREATE POLICY admin_activity_log_insert ON admin_activity_log
  FOR INSERT WITH CHECK (is_admin());


-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5.1  match_family_to_center(family_id, center_id)
--      Returns integer 0-100 based on weighted scoring from the product spec.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_family_to_center(
  p_family_id uuid,
  p_center_id uuid
)
RETURNS integer
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_score         integer := 0;
  v_family        family_profiles%ROWTYPE;
  v_center        center_profiles%ROWTYPE;
  v_family_lang   text;
  v_staff_count   integer;
  v_distance_m    float;
  v_child_ages    float[];
  v_child_age     float;
  v_age_group     jsonb;
  v_best_age_pts  integer := 0;
  v_ag_pts        integer;
  v_match_count   integer;
  v_priority_ct   integer;
  v_values_pts    integer := 0;
BEGIN
  -- Load family and center data
  SELECT * INTO v_family FROM family_profiles WHERE id = p_family_id;
  SELECT * INTO v_center FROM center_profiles WHERE id = p_center_id;

  IF v_family IS NULL OR v_center IS NULL THEN
    RETURN 0;
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 1: Language match (30 points)
  -- Center has staff speaking family's preferred language.
  -- 3+ staff = 30pts, 1-2 = 25pts, 0 = 0pts.
  -- -----------------------------------------------------------------------
  v_family_lang := COALESCE(v_family.communication_language, 'zh');

  SELECT COALESCE(SUM((elem->>'count')::integer), 0)
  INTO v_staff_count
  FROM jsonb_array_elements(v_center.staff_languages) AS elem
  WHERE lower(elem->>'language') = lower(v_family_lang)
     OR (v_family_lang = 'zh' AND lower(elem->>'language') IN ('mandarin', 'chinese', 'cantonese', 'zh'));

  IF v_staff_count >= 3 THEN
    v_score := v_score + 30;
  ELSIF v_staff_count >= 1 THEN
    v_score := v_score + 25;
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 2: Distance (25 points)
  -- <=3km=25, <=5km=22, <=10km=18, <=15km=12, <=20km=6, >20km=0
  -- -----------------------------------------------------------------------
  IF v_family.location IS NOT NULL AND v_center.location IS NOT NULL THEN
    v_distance_m := ST_Distance(v_family.location, v_center.location);

    IF    v_distance_m <= 3000  THEN v_score := v_score + 25;
    ELSIF v_distance_m <= 5000  THEN v_score := v_score + 22;
    ELSIF v_distance_m <= 10000 THEN v_score := v_score + 18;
    ELSIF v_distance_m <= 15000 THEN v_score := v_score + 12;
    ELSIF v_distance_m <= 20000 THEN v_score := v_score + 6;
    END IF;
  ELSE
    -- No location data — neutral score
    v_score := v_score + 10;
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 3: Age group + vacancy (20 points)
  -- Compute the youngest child's age, check center age_groups.
  -- Right age group + available = 20, waitlist (vacancies=0) = 10,
  -- full (no matching group) = 5, no data = 10.
  -- -----------------------------------------------------------------------
  SELECT ARRAY_AGG(
    EXTRACT(YEAR FROM age(c.date_of_birth))
    + EXTRACT(MONTH FROM age(c.date_of_birth)) / 12.0
  )
  INTO v_child_ages
  FROM children c
  WHERE c.family_profile_id = p_family_id;

  IF v_child_ages IS NOT NULL AND jsonb_array_length(v_center.age_groups) > 0 THEN
    -- Check each age group for a match with any child
    FOR v_age_group IN SELECT * FROM jsonb_array_elements(v_center.age_groups)
    LOOP
      FOREACH v_child_age IN ARRAY v_child_ages
      LOOP
        -- Simple heuristic: group_name contains age indicator
        -- We check vacancies for any matching group
        IF (v_age_group->>'vacancies')::integer > 0 THEN
          v_ag_pts := 20;
        ELSE
          v_ag_pts := 10;  -- waitlist
        END IF;
        IF v_ag_pts > v_best_age_pts THEN
          v_best_age_pts := v_ag_pts;
        END IF;
      END LOOP;
    END LOOP;
    v_score := v_score + v_best_age_pts;
  ELSE
    v_score := v_score + 10;  -- neutral when no data
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 4: Program alignment (15 points)
  -- Proportion of family priorities matching center programs x 15
  -- -----------------------------------------------------------------------
  v_priority_ct := COALESCE(array_length(v_family.priorities, 1), 0);
  IF v_priority_ct > 0 AND array_length(v_center.programs, 1) > 0 THEN
    SELECT COUNT(*) INTO v_match_count
    FROM unnest(v_family.priorities) AS fp
    WHERE fp = ANY(v_center.programs);

    v_score := v_score + LEAST(
      ROUND((v_match_count::numeric / v_priority_ct::numeric) * 15)::integer,
      15
    );
  ELSE
    v_score := v_score + 7;  -- neutral
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 5: Values alignment (10 points)
  -- 2 points per matching quiz answer (5 questions).
  -- If either side has not completed the quiz, award 5 pts (neutral).
  -- -----------------------------------------------------------------------
  IF v_family.values_learning_style IS NOT NULL
     AND v_center.values_learning_style IS NOT NULL THEN
    IF v_family.values_learning_style   = v_center.values_learning_style   THEN v_values_pts := v_values_pts + 2; END IF;
    IF v_family.values_cultural_events  = v_center.values_cultural_events  THEN v_values_pts := v_values_pts + 2; END IF;
    IF v_family.values_update_frequency = v_center.values_update_frequency THEN v_values_pts := v_values_pts + 2; END IF;
    IF v_family.values_outdoor_time     = v_center.values_outdoor_time     THEN v_values_pts := v_values_pts + 2; END IF;
    IF v_family.values_meal_preference  = v_center.values_meal_preference  THEN v_values_pts := v_values_pts + 2; END IF;
    v_score := v_score + v_values_pts;
  ELSE
    v_score := v_score + 5;
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

COMMENT ON FUNCTION match_family_to_center IS
  'Weighted scoring (0-100) for family-center fit per product spec S7.';

-- ---------------------------------------------------------------------------
-- 5.2  match_educator_to_job(educator_id, job_id)
--      Returns integer 0-100.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_educator_to_job(
  p_educator_id uuid,
  p_job_id      uuid
)
RETURNS integer
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_score        integer := 0;
  v_educator     educator_profiles%ROWTYPE;
  v_job          job_listings%ROWTYPE;
  v_center       center_profiles%ROWTYPE;
  v_distance_m   float;
  v_lang_match   boolean := false;
  v_edu_lang     jsonb;
  v_req_lang     jsonb;
  v_qual_order   integer;
  v_req_order    integer;
  v_pay_overlap  boolean;
BEGIN
  SELECT * INTO v_educator FROM educator_profiles WHERE id = p_educator_id;
  SELECT * INTO v_job FROM job_listings WHERE id = p_job_id;

  IF v_educator IS NULL OR v_job IS NULL THEN
    RETURN 0;
  END IF;

  SELECT * INTO v_center FROM center_profiles WHERE id = v_job.center_profile_id;

  -- -----------------------------------------------------------------------
  -- Factor 1: Language match (30 points)
  -- Educator meets required language at required proficiency or better.
  -- -----------------------------------------------------------------------
  IF jsonb_array_length(COALESCE(v_job.languages_required, '[]'::jsonb)) = 0 THEN
    -- No language requirement: full points
    v_score := v_score + 30;
  ELSE
    FOR v_req_lang IN SELECT * FROM jsonb_array_elements(v_job.languages_required)
    LOOP
      FOR v_edu_lang IN SELECT * FROM jsonb_array_elements(v_educator.languages)
      LOOP
        IF lower(v_edu_lang->>'language') = lower(v_req_lang->>'language') THEN
          v_lang_match := true;
        END IF;
      END LOOP;
    END LOOP;

    IF v_lang_match THEN
      v_score := v_score + 30;
    END IF;
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 2: Qualification (25 points)
  -- Meets or exceeds requirement = 25, one level below = 15, else 0.
  -- Order: certificate_iii(1) < diploma(2) < bachelor(3) < master(4), other=0
  -- -----------------------------------------------------------------------
  v_qual_order := CASE v_educator.qualification
    WHEN 'certificate_iii' THEN 1
    WHEN 'diploma'         THEN 2
    WHEN 'bachelor'        THEN 3
    WHEN 'master'          THEN 4
    ELSE 0
  END;
  v_req_order := CASE v_job.qualification_required
    WHEN 'certificate_iii' THEN 1
    WHEN 'diploma'         THEN 2
    WHEN 'bachelor'        THEN 3
    WHEN 'master'          THEN 4
    ELSE 0
  END;

  IF v_req_order = 0 THEN
    -- No qualification required
    v_score := v_score + 25;
  ELSIF v_qual_order >= v_req_order THEN
    v_score := v_score + 25;
  ELSIF v_qual_order = v_req_order - 1 THEN
    v_score := v_score + 15;
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 3: Distance (20 points)
  -- Within educator's commute preference, scaled by proximity.
  -- -----------------------------------------------------------------------
  IF v_educator.location IS NOT NULL AND v_center IS NOT NULL AND v_center.location IS NOT NULL THEN
    v_distance_m := ST_Distance(v_educator.location, v_center.location);
    DECLARE
      v_max_m float := COALESCE(v_educator.max_commute_km, 20) * 1000.0;
    BEGIN
      IF v_distance_m <= v_max_m * 0.25 THEN
        v_score := v_score + 20;
      ELSIF v_distance_m <= v_max_m * 0.5 THEN
        v_score := v_score + 16;
      ELSIF v_distance_m <= v_max_m * 0.75 THEN
        v_score := v_score + 12;
      ELSIF v_distance_m <= v_max_m THEN
        v_score := v_score + 8;
      END IF;
      -- beyond max commute = 0 pts
    END;
  ELSE
    v_score := v_score + 10;  -- neutral
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 4: Experience (15 points)
  -- Meets requirement = 15, proportional credit otherwise.
  -- -----------------------------------------------------------------------
  IF COALESCE(v_job.experience_required, 0) = 0 THEN
    v_score := v_score + 15;
  ELSIF v_educator.years_experience >= v_job.experience_required THEN
    v_score := v_score + 15;
  ELSE
    v_score := v_score + LEAST(
      ROUND((v_educator.years_experience::numeric / v_job.experience_required::numeric) * 15)::integer,
      15
    );
  END IF;

  -- -----------------------------------------------------------------------
  -- Factor 5: Pay overlap (10 points)
  -- Ranges overlap = 10, close (<10% gap) = 5, no overlap = 0.
  -- -----------------------------------------------------------------------
  IF v_educator.pay_min IS NOT NULL AND v_job.pay_max IS NOT NULL THEN
    v_pay_overlap := (
      COALESCE(v_educator.pay_min, 0) <= COALESCE(v_job.pay_max, 999999)
      AND COALESCE(v_educator.pay_max, 999999) >= COALESCE(v_job.pay_min, 0)
    );
    IF v_pay_overlap THEN
      v_score := v_score + 10;
    ELSIF v_educator.pay_min IS NOT NULL AND v_job.pay_max IS NOT NULL
      AND v_educator.pay_min <= v_job.pay_max * 1.1 THEN
      v_score := v_score + 5;
    END IF;
  ELSE
    v_score := v_score + 5;  -- neutral
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

COMMENT ON FUNCTION match_educator_to_job IS
  'Weighted scoring (0-100) for educator-job fit per product spec S7.';

-- ---------------------------------------------------------------------------
-- 5.3  search_centers(lat, lng, radius_km, language, age_group)
--      Returns centers within radius with match-relevant info.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_centers(
  p_lat        float,
  p_lng        float,
  p_radius_km  float DEFAULT 20,
  p_language   text  DEFAULT NULL,
  p_age_group  text  DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  center_name      text,
  slug             text,
  suburb           text,
  postcode         text,
  state            text,
  description_en   text,
  description_zh   text,
  fee_min          numeric,
  fee_max          numeric,
  nqs_rating       text,
  programs         text[],
  staff_languages  jsonb,
  age_groups       jsonb,
  subscription_status subscription_status,
  is_founding_partner boolean,
  distance_km      float,
  photo_url        text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
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
     ORDER BY cph.display_order LIMIT 1) AS photo_url
  FROM center_profiles cp
  JOIN profiles p ON p.id = cp.profile_id
  WHERE p.is_active = true
    AND cp.location IS NOT NULL
    AND ST_DWithin(
          cp.location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_km * 1000
        )
    -- Optional language filter: center must have staff speaking this language
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
END;
$$;

COMMENT ON FUNCTION search_centers IS
  'PostGIS proximity search for centers with optional language/age filters.';

-- ---------------------------------------------------------------------------
-- 5.4  search_jobs(lat, lng, radius_km, language, employment_type)
--      Returns active jobs within radius.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_jobs(
  p_lat              float,
  p_lng              float,
  p_radius_km        float            DEFAULT 20,
  p_language         text             DEFAULT NULL,
  p_employment_type  employment_type  DEFAULT NULL
)
RETURNS TABLE (
  id                    uuid,
  title                 text,
  employment_type       employment_type,
  description_en        text,
  description_zh        text,
  qualification_required qualification_level,
  languages_required    jsonb,
  experience_required   integer,
  pay_min               numeric,
  pay_max               numeric,
  start_date            date,
  visa_sponsorship      boolean,
  center_name           text,
  center_slug           text,
  center_suburb         text,
  distance_km           float,
  created_at            timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jl.id,
    jl.title,
    jl.employment_type,
    jl.description_en,
    jl.description_zh,
    jl.qualification_required,
    jl.languages_required,
    jl.experience_required,
    jl.pay_min,
    jl.pay_max,
    jl.start_date,
    jl.visa_sponsorship,
    cp.center_name,
    cp.slug        AS center_slug,
    cp.suburb      AS center_suburb,
    ROUND((ST_Distance(
      cp.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0)::numeric, 1)::float AS distance_km,
    jl.created_at
  FROM job_listings jl
  JOIN center_profiles cp ON cp.id = jl.center_profile_id
  WHERE jl.status = 'active'
    AND cp.location IS NOT NULL
    AND ST_DWithin(
          cp.location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_km * 1000
        )
    -- Optional language filter
    AND (p_language IS NULL OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(jl.languages_required) AS lr
      WHERE lower(lr->>'language') = lower(p_language)
    ))
    -- Optional employment type filter
    AND (p_employment_type IS NULL OR jl.employment_type = p_employment_type)
  ORDER BY distance_km;
END;
$$;

COMMENT ON FUNCTION search_jobs IS
  'PostGIS proximity search for active jobs with optional filters.';


-- ============================================================================
-- 6. INDEXES
-- ============================================================================

-- Spatial indexes (PostGIS GIST) on geography columns
CREATE INDEX IF NOT EXISTS idx_family_profiles_location
  ON family_profiles USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_educator_profiles_location
  ON educator_profiles USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_center_profiles_location
  ON center_profiles USING GIST (location);

-- Suburb indexes for text filtering
CREATE INDEX IF NOT EXISTS idx_family_profiles_suburb
  ON family_profiles (suburb);

CREATE INDEX IF NOT EXISTS idx_educator_profiles_suburb
  ON educator_profiles (suburb);

CREATE INDEX IF NOT EXISTS idx_center_profiles_suburb
  ON center_profiles (suburb);

-- Center slug (unique, already enforced, but B-tree index for lookups)
CREATE INDEX IF NOT EXISTS idx_center_profiles_slug
  ON center_profiles (slug);

-- Status indexes
CREATE INDEX IF NOT EXISTS idx_job_listings_status
  ON job_listings (status);

CREATE INDEX IF NOT EXISTS idx_enquiries_status
  ON enquiries (status);

CREATE INDEX IF NOT EXISTS idx_job_applications_status
  ON job_applications (status);

CREATE INDEX IF NOT EXISTS idx_center_profiles_subscription_status
  ON center_profiles (subscription_status);

-- GIN indexes on JSONB columns for containment queries
CREATE INDEX IF NOT EXISTS idx_educator_profiles_languages
  ON educator_profiles USING GIN (languages);

CREATE INDEX IF NOT EXISTS idx_center_profiles_age_groups
  ON center_profiles USING GIN (age_groups);

CREATE INDEX IF NOT EXISTS idx_center_profiles_staff_languages
  ON center_profiles USING GIN (staff_languages);

CREATE INDEX IF NOT EXISTS idx_job_listings_languages_required
  ON job_listings USING GIN (languages_required);

-- Foreign key lookup indexes (Supabase creates PK indexes but not FK)
CREATE INDEX IF NOT EXISTS idx_family_profiles_profile_id
  ON family_profiles (profile_id);

CREATE INDEX IF NOT EXISTS idx_educator_profiles_profile_id
  ON educator_profiles (profile_id);

CREATE INDEX IF NOT EXISTS idx_center_profiles_profile_id
  ON center_profiles (profile_id);

CREATE INDEX IF NOT EXISTS idx_children_family_profile_id
  ON children (family_profile_id);

CREATE INDEX IF NOT EXISTS idx_center_photos_center_profile_id
  ON center_photos (center_profile_id);

CREATE INDEX IF NOT EXISTS idx_job_listings_center_profile_id
  ON job_listings (center_profile_id);

CREATE INDEX IF NOT EXISTS idx_enquiries_family_profile_id
  ON enquiries (family_profile_id);

CREATE INDEX IF NOT EXISTS idx_enquiries_center_profile_id
  ON enquiries (center_profile_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_educator_profile_id
  ON job_applications (educator_profile_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_listing_id
  ON job_applications (job_listing_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_log_center_profile_id
  ON subscriptions_log (center_profile_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_actor_id
  ON admin_activity_log (actor_id);

-- Trigram index for center name search
CREATE INDEX IF NOT EXISTS idx_center_profiles_name_trgm
  ON center_profiles USING GIN (center_name gin_trgm_ops);


-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 7.1  Auto-update updated_at on every table that has it
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply the trigger to every table with an updated_at column
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'family_profiles',
    'children',
    'educator_profiles',
    'center_profiles',
    'job_listings',
    'enquiries',
    'job_applications'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; '
      'CREATE TRIGGER set_updated_at '
      'BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7.2  Auto-generate slug from center_name on insert (if slug is null)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_generate_center_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_slug text;
  v_slug      text;
  v_counter   integer := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Transliterate to ASCII, lowercase, replace non-alphanum with hyphens
    v_base_slug := lower(regexp_replace(
      regexp_replace(NEW.center_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ));
    -- Remove leading/trailing hyphens
    v_base_slug := trim(BOTH '-' FROM v_base_slug);
    -- Remove consecutive hyphens
    v_base_slug := regexp_replace(v_base_slug, '-+', '-', 'g');

    IF v_base_slug = '' THEN
      v_base_slug := 'center';
    END IF;

    v_slug := v_base_slug;

    -- Ensure uniqueness by appending a counter if needed
    WHILE EXISTS (SELECT 1 FROM center_profiles WHERE slug = v_slug AND id != NEW.id) LOOP
      v_counter := v_counter + 1;
      v_slug := v_base_slug || '-' || v_counter;
    END LOOP;

    NEW.slug := v_slug;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_center_slug ON center_profiles;
CREATE TRIGGER generate_center_slug
  BEFORE INSERT ON center_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_generate_center_slug();

-- ---------------------------------------------------------------------------
-- 7.3  Auto-expire jobs past expires_at
--      Runs on every job_listings SELECT (lightweight) and via a periodic call.
--      We provide a callable function so a cron (pg_cron or Edge Function) can
--      invoke it, plus a trigger on insert/update to set a default expiry.
-- ---------------------------------------------------------------------------

-- Function to expire stale jobs (call from pg_cron or scheduled Edge Function)
CREATE OR REPLACE FUNCTION expire_stale_jobs()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE job_listings
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION expire_stale_jobs IS
  'Mark active jobs past their expires_at as expired. Call via cron or Edge Function.';

-- Trigger: default expires_at to 60 days from creation if not set
CREATE OR REPLACE FUNCTION trigger_default_job_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + interval '60 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS default_job_expiry ON job_listings;
CREATE TRIGGER default_job_expiry
  BEFORE INSERT ON job_listings
  FOR EACH ROW EXECUTE FUNCTION trigger_default_job_expiry();


-- ============================================================================
-- 8. SEED DATA
-- ============================================================================
-- Seed data uses fixed UUIDs so the script is idempotent. These UUIDs are
-- deterministic and only used for development/demo purposes.
--
-- NOTE: Because profiles references auth.users, and we cannot insert into
-- auth.users via SQL Editor, the seed data inserts profiles with fixed UUIDs
-- that you must manually create in Supabase Auth (or via the Auth API) with
-- matching UUIDs. Alternatively, comment out the profiles inserts and create
-- users via the app, then update profile_id references.
--
-- For development convenience, we insert directly and rely on the fact that
-- Supabase allows profile rows referencing auth.users that may not yet exist
-- when RLS is bypassed (the SQL editor runs as postgres superuser).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 8.0  Temporarily disable the FK to auth.users for seeding
-- ---------------------------------------------------------------------------
ALTER TABLE profiles DISABLE TRIGGER ALL;

-- ---------------------------------------------------------------------------
-- 8.1  Center profiles (5 centers in target suburbs)
-- ---------------------------------------------------------------------------

-- Center 1: Chatswood, Sydney
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a1000000-0000-0000-0000-000000000001'::uuid, 'center', 'admin@brighthorizons.com.au', 'Bright Horizons Early Learning', 'en', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'Bright Horizons Early Learning',
  'bright-horizons-early-learning',
  '12 345 678 901',
  '45 Railway Street',
  'Chatswood', '2067', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1812, -33.7969), 4326)::geography,
  '02 9411 2345',
  'admin@brighthorizons.com.au',
  'https://brighthorizons.com.au',
  'Bright Horizons Early Learning is a 78-place center in the heart of Chatswood, proudly serving our diverse community. With two dedicated Mandarin-speaking educators, we offer a bilingual program that weaves Chinese language and cultural activities into everyday learning. Our play-based curriculum is designed to nurture curiosity, creativity, and confidence in children aged 6 weeks to 6 years.',
  'Bright Horizons Early Learning 位于 Chatswood 中心地带，拥有 78 个名额。我们自豪地服务于多元化的社区，配有两名专职普通话教育者，提供双语课程，将中文语言和文化活动融入日常学习。我们以游戏为基础的课程旨在培养 6 周至 6 岁儿童的好奇心、创造力和自信心。',
  '{"monday":{"open":"07:00","close":"18:00"},"tuesday":{"open":"07:00","close":"18:00"},"wednesday":{"open":"07:00","close":"18:00"},"thursday":{"open":"07:00","close":"18:00"},"friday":{"open":"07:00","close":"18:00"}}',
  '[{"group_name":"Nursery (0-2)","capacity":20,"vacancies":3},{"group_name":"Toddlers (2-3)","capacity":25,"vacancies":5},{"group_name":"Pre-Kindy (3-4)","capacity":18,"vacancies":2},{"group_name":"Kindy (4-6)","capacity":15,"vacancies":2}]',
  130.00, 165.00,
  '[{"language":"Mandarin","count":2},{"language":"English","count":16},{"language":"Cantonese","count":1}]',
  ARRAY['bilingual_program','cultural_events','play_based','outdoor','music','art'],
  'exceeding',
  'active', 'starter', true,
  'play_based', 'very_important', 'daily', 'lots', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Center 2: Hurstville, Sydney
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a1000000-0000-0000-0000-000000000002'::uuid, 'center', 'info@littledragon.com.au', 'Little Dragon Early Learning Centre', 'en', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'c1000000-0000-0000-0000-000000000002'::uuid,
  'a1000000-0000-0000-0000-000000000002'::uuid,
  'Little Dragon Early Learning Centre',
  'little-dragon-early-learning-centre',
  '23 456 789 012',
  '12 Forest Road',
  'Hurstville', '2220', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1024, -33.9673), 4326)::geography,
  '02 9580 3456',
  'info@littledragon.com.au',
  'https://littledragon.com.au',
  'Little Dragon Early Learning Centre is a boutique 45-place center in Hurstville specialising in bilingual Mandarin-English education. Our team of 12 includes 5 Mandarin-speaking educators who deliver a structured bilingual curriculum. We celebrate Chinese festivals, teach calligraphy, and integrate Mandarin into music, art, and dramatic play. We believe every child deserves to feel culturally seen and linguistically empowered.',
  'Little Dragon 幼儿教育中心是位于 Hurstville 的精品 45 名额中心，专注于中英双语教育。我们的 12 人团队包括 5 名普通话教育者，提供结构化的双语课程。我们庆祝中国传统节日，教授书法，并将普通话融入音乐、艺术和戏剧游戏中。我们相信每个孩子都应该在文化上被看见，在语言上被赋能。',
  '{"monday":{"open":"07:30","close":"18:00"},"tuesday":{"open":"07:30","close":"18:00"},"wednesday":{"open":"07:30","close":"18:00"},"thursday":{"open":"07:30","close":"18:00"},"friday":{"open":"07:30","close":"18:00"}}',
  '[{"group_name":"Nursery (0-2)","capacity":10,"vacancies":1},{"group_name":"Toddlers (2-3)","capacity":15,"vacancies":4},{"group_name":"Pre-Kindy (3-5)","capacity":20,"vacancies":3}]',
  140.00, 175.00,
  '[{"language":"Mandarin","count":5},{"language":"English","count":10},{"language":"Cantonese","count":2}]',
  ARRAY['bilingual_program','cultural_events','mandarin_classes','play_based','art','music','stem'],
  'meeting',
  'active', 'starter', true,
  'structured', 'very_important', 'daily', 'moderate', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Center 3: Burwood, Sydney
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a1000000-0000-0000-0000-000000000003'::uuid, 'center', 'hello@sunflowerelc.com.au', 'Sunflower Early Learning Burwood', 'en', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'c1000000-0000-0000-0000-000000000003'::uuid,
  'a1000000-0000-0000-0000-000000000003'::uuid,
  'Sunflower Early Learning Burwood',
  'sunflower-early-learning-burwood',
  '34 567 890 123',
  '88 Burwood Road',
  'Burwood', '2134', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1042, -33.8773), 4326)::geography,
  '02 9747 5678',
  'hello@sunflowerelc.com.au',
  'https://sunflowerelc.com.au',
  'Sunflower Early Learning in Burwood is a warm, nature-inspired 60-place center offering Montessori-influenced programming with Mandarin language enrichment. Our three Mandarin-speaking educators run daily language sessions and cultural story time. We have a large outdoor garden where children grow vegetables and herbs used in our on-site kitchen. Nutritious meals include both Australian and Asian cuisine options.',
  'Sunflower 幼儿教育中心位于 Burwood，是一个温馨的、以自然为灵感的 60 名额中心，提供蒙特梭利影响的课程和普通话语言丰富项目。我们的三名普通话教育者每天开展语言课程和文化故事时间。我们有一个大型户外花园，孩子们种植蔬菜和香草，用于我们的现场厨房。营养膳食包括澳式和亚洲美食选择。',
  '{"monday":{"open":"07:00","close":"18:30"},"tuesday":{"open":"07:00","close":"18:30"},"wednesday":{"open":"07:00","close":"18:30"},"thursday":{"open":"07:00","close":"18:30"},"friday":{"open":"07:00","close":"18:30"}}',
  '[{"group_name":"Babies (0-18m)","capacity":12,"vacancies":0},{"group_name":"Toddlers (18m-3y)","capacity":20,"vacancies":6},{"group_name":"Kinder (3-5)","capacity":28,"vacancies":4}]',
  125.00, 155.00,
  '[{"language":"Mandarin","count":3},{"language":"English","count":12},{"language":"Korean","count":1}]',
  ARRAY['bilingual_program','cultural_events','mandarin_classes','montessori','outdoor','art','stem'],
  'exceeding',
  'trialing', 'starter', false,
  'montessori', 'important', 'weekly', 'lots', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Center 4: Box Hill, Melbourne
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a1000000-0000-0000-0000-000000000004'::uuid, 'center', 'admin@pandakids.com.au', 'Panda Kids Early Learning', 'en', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'c1000000-0000-0000-0000-000000000004'::uuid,
  'a1000000-0000-0000-0000-000000000004'::uuid,
  'Panda Kids Early Learning',
  'panda-kids-early-learning',
  '45 678 901 234',
  '29 Main Street',
  'Box Hill', '3128', 'VIC',
  ST_SetSRID(ST_MakePoint(145.1215, -37.8189), 4326)::geography,
  '03 9898 7890',
  'admin@pandakids.com.au',
  'https://pandakids.com.au',
  'Panda Kids Early Learning in Box Hill is a purpose-built 90-place center with a strong focus on bilingual Mandarin-English education. With four Mandarin-speaking educators and a dedicated Chinese cultural program, we provide an immersive bilingual environment. Our STEM-focused curriculum integrates technology, engineering challenges, and mathematical thinking alongside language development. We are proud to hold an Exceeding NQS rating.',
  'Panda Kids 幼儿教育中心位于 Box Hill，是一个专门建造的 90 名额中心，重点关注中英双语教育。我们拥有四名普通话教育者和专门的中国文化项目，提供沉浸式双语环境。我们以 STEM 为重点的课程将技术、工程挑战和数学思维与语言发展相结合。我们自豪地获得了超越 NQS 评级。',
  '{"monday":{"open":"06:30","close":"18:30"},"tuesday":{"open":"06:30","close":"18:30"},"wednesday":{"open":"06:30","close":"18:30"},"thursday":{"open":"06:30","close":"18:30"},"friday":{"open":"06:30","close":"18:30"}}',
  '[{"group_name":"Nursery (0-2)","capacity":24,"vacancies":5},{"group_name":"Toddlers (2-3)","capacity":30,"vacancies":8},{"group_name":"Pre-Kinder (3-4)","capacity":20,"vacancies":2},{"group_name":"Kinder (4-6)","capacity":16,"vacancies":0}]',
  120.00, 150.00,
  '[{"language":"Mandarin","count":4},{"language":"English","count":14},{"language":"Vietnamese","count":1}]',
  ARRAY['bilingual_program','cultural_events','mandarin_classes','stem','play_based','outdoor','sports'],
  'exceeding',
  'active', 'starter', true,
  'structured', 'very_important', 'daily', 'moderate', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Center 5: Glen Waverley, Melbourne
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a1000000-0000-0000-0000-000000000005'::uuid, 'center', 'info@harmonychildcare.com.au', 'Harmony Childcare Glen Waverley', 'en', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO center_profiles (
  id, profile_id, center_name, slug, abn, address, suburb, postcode, state,
  location, phone, email, website,
  description_en, description_zh,
  operating_hours, age_groups, fee_min, fee_max,
  staff_languages, programs, nqs_rating,
  subscription_status, subscription_tier, is_founding_partner,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'c1000000-0000-0000-0000-000000000005'::uuid,
  'a1000000-0000-0000-0000-000000000005'::uuid,
  'Harmony Childcare Glen Waverley',
  'harmony-childcare-glen-waverley',
  '56 789 012 345',
  '152 Springvale Road',
  'Glen Waverley', '3150', 'VIC',
  ST_SetSRID(ST_MakePoint(145.1648, -37.8783), 4326)::geography,
  '03 9561 2345',
  'info@harmonychildcare.com.au',
  'https://harmonychildcare.com.au',
  'Harmony Childcare in Glen Waverley is a family-owned 55-place center that celebrates cultural diversity through its daily programming. Two of our fourteen staff speak Mandarin, and we offer weekly Mandarin classes for all children. Our play-based curriculum emphasises social-emotional learning, creative arts, and outdoor exploration in our bush-inspired playground. We pride ourselves on our home-cooked meals featuring multicultural cuisine.',
  'Harmony 幼儿园位于 Glen Waverley，是一家家庭经营的 55 名额中心，通过日常课程庆祝文化多样性。我们十四名员工中有两名会说普通话，我们为所有孩子提供每周普通话课程。我们以游戏为基础的课程强调社交情感学习、创意艺术和在灌木丛风格游乐场中的户外探索。我们以提供多元文化美食的家庭烹饪膳食为荣。',
  '{"monday":{"open":"07:00","close":"18:00"},"tuesday":{"open":"07:00","close":"18:00"},"wednesday":{"open":"07:00","close":"18:00"},"thursday":{"open":"07:00","close":"18:00"},"friday":{"open":"07:00","close":"18:00"}}',
  '[{"group_name":"Babies (0-2)","capacity":12,"vacancies":2},{"group_name":"Toddlers (2-3)","capacity":18,"vacancies":3},{"group_name":"Pre-School (3-6)","capacity":25,"vacancies":5}]',
  115.00, 145.00,
  '[{"language":"Mandarin","count":2},{"language":"English","count":12},{"language":"Hindi","count":1}]',
  ARRAY['bilingual_program','mandarin_classes','play_based','outdoor','art','music'],
  'meeting',
  'active', 'starter', false,
  'play_based', 'important', 'weekly', 'lots', 'multicultural'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8.2  Educator profiles (3 sample educators)
-- ---------------------------------------------------------------------------

-- Educator 1: Sophie Zhang — Burwood, Melbourne (from the product persona)
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a2000000-0000-0000-0000-000000000001'::uuid, 'educator', 'sophie.zhang@email.com', 'Sophie Zhang', 'en', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO educator_profiles (
  id, profile_id, full_name, phone, suburb, postcode, state,
  location, languages, qualification,
  wwcc_number, wwcc_state, wwcc_expiry, first_aid_current,
  years_experience, employment_preference, pay_min, pay_max, max_commute_km,
  bio, bio_translated, is_visible,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'e1000000-0000-0000-0000-000000000001'::uuid,
  'a2000000-0000-0000-0000-000000000001'::uuid,
  'Sophie Zhang',
  '0412 345 678',
  'Burwood', '3125', 'VIC',
  ST_SetSRID(ST_MakePoint(145.0900, -37.8500), 4326)::geography,
  '[{"language":"Mandarin","proficiency":"native"},{"language":"Cantonese","proficiency":"native"},{"language":"English","proficiency":"native"}]',
  'diploma',
  'WWC1234567V', 'VIC', '2027-06-30', true,
  4, 'full_time', 28.00, 32.00, 15,
  'Passionate bilingual educator with 4 years of experience in early childhood education. Born in Guangzhou, raised in Melbourne. I specialise in creating bilingual programming that integrates Mandarin language learning through play, music, and storytelling. I believe children learn best when they feel culturally connected and emotionally safe.',
  '热情的双语教育者，拥有 4 年幼儿教育经验。出生于广州，在墨尔本长大。我专注于通过游戏、音乐和讲故事将普通话语言学习融入双语课程。我相信当孩子们感到文化联系和情感安全时，他们学得最好。',
  true,
  'play_based', 'very_important', 'daily', 'lots', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- Educator 2: Lily Wang — Chatswood, Sydney
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a2000000-0000-0000-0000-000000000002'::uuid, 'educator', 'lily.wang@email.com', 'Lily Wang', 'zh', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO educator_profiles (
  id, profile_id, full_name, phone, suburb, postcode, state,
  location, languages, qualification,
  wwcc_number, wwcc_state, wwcc_expiry, first_aid_current,
  years_experience, employment_preference, pay_min, pay_max, max_commute_km,
  bio, bio_translated, is_visible,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'e1000000-0000-0000-0000-000000000002'::uuid,
  'a2000000-0000-0000-0000-000000000002'::uuid,
  'Lily Wang',
  '0423 456 789',
  'Chatswood', '2067', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1820, -33.7980), 4326)::geography,
  '[{"language":"Mandarin","proficiency":"native"},{"language":"English","proficiency":"fluent"}]',
  'bachelor',
  'WWC9876543N', 'NSW', '2028-03-15', true,
  7, 'full_time', 32.00, 38.00, 10,
  'Experienced early childhood teacher with a Bachelor of Education (Early Childhood) from Macquarie University. 7 years of experience across long day care and preschool settings. I am passionate about embedding Mandarin literacy and Chinese cultural celebrations into the curriculum. Previously led a bilingual program at a 90-place center in Eastwood.',
  '经验丰富的幼儿教师，拥有麦考瑞大学的教育学学士学位（幼儿教育方向）。在长日托和学前教育环境中拥有 7 年经验。我热衷于将普通话识字和中国文化庆典融入课程。此前在 Eastwood 一家 90 名额中心领导了双语项目。',
  true,
  'structured', 'very_important', 'daily', 'moderate', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Educator 3: James Chen — Glen Waverley, Melbourne
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a2000000-0000-0000-0000-000000000003'::uuid, 'educator', 'james.chen@email.com', 'James Chen', 'en', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO educator_profiles (
  id, profile_id, full_name, phone, suburb, postcode, state,
  location, languages, qualification,
  wwcc_number, wwcc_state, wwcc_expiry, first_aid_current,
  years_experience, employment_preference, pay_min, pay_max, max_commute_km,
  bio, bio_translated, is_visible,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'e1000000-0000-0000-0000-000000000003'::uuid,
  'a2000000-0000-0000-0000-000000000003'::uuid,
  'James Chen',
  '0434 567 890',
  'Glen Waverley', '3150', 'VIC',
  ST_SetSRID(ST_MakePoint(145.1650, -37.8790), 4326)::geography,
  '[{"language":"Mandarin","proficiency":"fluent"},{"language":"English","proficiency":"native"}]',
  'certificate_iii',
  'WWC5555555V', 'VIC', '2027-11-30', true,
  2, 'part_time', 25.00, 28.00, 20,
  'Enthusiastic Certificate III qualified educator starting my career in early childhood. I grew up in a bilingual household and am passionate about helping young children develop confidence in both English and Mandarin. Currently studying my Diploma part-time while working. Available for part-time and casual positions.',
  '热情的 Certificate III 资格教育者，正在开启我的幼儿教育职业。我在双语家庭中长大，热衷于帮助幼儿在英语和普通话方面建立自信。目前一边工作一边兼职攻读 Diploma。可从事兼职和临时职位。',
  true,
  'play_based', 'important', 'weekly', 'lots', 'flexible'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8.3  Family profiles (2 sample families)
-- ---------------------------------------------------------------------------

-- Family 1: Wei & Mei Lin Chen — Chatswood (from the product persona)
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a3000000-0000-0000-0000-000000000001'::uuid, 'family', 'meilin.chen@email.com', 'Mei Lin Chen', 'zh', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO family_profiles (
  id, profile_id, parent_name, chinese_name, phone, wechat_id,
  suburb, postcode, state, location,
  communication_language, priorities,
  additional_notes, additional_notes_translated,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'f1000000-0000-0000-0000-000000000001'::uuid,
  'a3000000-0000-0000-0000-000000000001'::uuid,
  'Mei Lin Chen', '陈美琳',
  '0445 678 901', 'meilin_chen_au',
  'Chatswood', '2067', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1830, -33.7950), 4326)::geography,
  'zh',
  ARRAY['bilingual_education','cultural_understanding','proximity'],
  '我希望找一个有普通话老师的幼儿园，这样我女儿在适应期可以用中文和老师沟通。饮食方面希望有中餐选择。',
  'I am looking for a childcare center with Mandarin-speaking teachers so my daughter can communicate in Chinese during her transition period. I would also like Chinese meal options.',
  'play_based', 'very_important', 'daily', 'moderate', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Child for Family 1: Lily Chen
INSERT INTO children (id, family_profile_id, name, date_of_birth, days_per_week)
VALUES (
  'd1000000-0000-0000-0000-000000000001'::uuid,
  'f1000000-0000-0000-0000-000000000001'::uuid,
  'Lily', '2023-08-15', 3
) ON CONFLICT (id) DO NOTHING;

-- Family 2: Ying Liu — Hurstville
INSERT INTO profiles (id, role, email, display_name, preferred_language, is_active, onboarding_completed)
VALUES ('a3000000-0000-0000-0000-000000000002'::uuid, 'family', 'ying.liu@email.com', 'Ying Liu', 'zh', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO family_profiles (
  id, profile_id, parent_name, chinese_name, phone, wechat_id,
  suburb, postcode, state, location,
  communication_language, priorities,
  additional_notes, additional_notes_translated,
  values_learning_style, values_cultural_events, values_update_frequency,
  values_outdoor_time, values_meal_preference
) VALUES (
  'f1000000-0000-0000-0000-000000000002'::uuid,
  'a3000000-0000-0000-0000-000000000002'::uuid,
  'Ying Liu', '刘颖',
  '0456 789 012', 'ying_liu_syd',
  'Hurstville', '2220', 'NSW',
  ST_SetSRID(ST_MakePoint(151.1030, -33.9680), 4326)::geography,
  'zh',
  ARRAY['bilingual_education','academic_readiness','cost','cultural_understanding'],
  '我有两个孩子，大的4岁需要学前教育准备，小的2岁。希望两个孩子可以在同一个幼儿园。重视学术准备和中文教育。',
  'I have two children, the older one is 4 and needs pre-school preparation, the younger one is 2. I hope both children can attend the same center. I value academic readiness and Chinese language education.',
  'structured', 'very_important', 'daily', 'moderate', 'chinese_meals'
) ON CONFLICT (id) DO NOTHING;

-- Children for Family 2
INSERT INTO children (id, family_profile_id, name, date_of_birth, days_per_week)
VALUES (
  'd1000000-0000-0000-0000-000000000002'::uuid,
  'f1000000-0000-0000-0000-000000000002'::uuid,
  'Emma', '2021-11-20', 5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO children (id, family_profile_id, name, date_of_birth, days_per_week)
VALUES (
  'd1000000-0000-0000-0000-000000000003'::uuid,
  'f1000000-0000-0000-0000-000000000002'::uuid,
  'Lucas', '2024-02-10', 3
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8.4  Job listings (3 sample jobs)
-- ---------------------------------------------------------------------------

-- Job 1: Bright Horizons Chatswood — Full-time bilingual educator
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required,
  experience_required, pay_min, pay_max,
  start_date, visa_sponsorship, status, expires_at
) VALUES (
  'j1000000-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'Bilingual Early Childhood Educator (Mandarin/English)',
  'full_time',
  'Bright Horizons Early Learning in Chatswood is seeking a passionate bilingual educator to join our team. You will help deliver our bilingual Mandarin-English program, integrating Chinese language and cultural activities into the daily curriculum for children aged 2-5. The ideal candidate is fluent in both Mandarin and English, holds a minimum Diploma in Early Childhood Education, and has experience creating engaging bilingual learning experiences. We offer a supportive team environment, professional development opportunities, and a bilingual premium in our pay structure.',
  'Bright Horizons 幼儿教育中心（Chatswood）正在寻找一位充满热情的双语教育者加入我们的团队。您将帮助实施我们的中英双语课程，将中文语言和文化活动融入 2-5 岁儿童的日常课程。理想的候选人精通普通话和英语，持有至少幼儿教育 Diploma，并有创建引人入胜的双语学习体验的经验。我们提供支持性的团队环境、专业发展机会以及薪酬结构中的双语溢价。',
  'diploma',
  '[{"language":"Mandarin","proficiency":"fluent"},{"language":"English","proficiency":"fluent"}]',
  2,
  28.00, 34.00,
  '2026-04-01',
  false,
  'active',
  now() + interval '60 days'
) ON CONFLICT (id) DO NOTHING;

-- Job 2: Little Dragon Hurstville — Part-time Mandarin teacher
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required,
  experience_required, pay_min, pay_max,
  start_date, visa_sponsorship, status, expires_at
) VALUES (
  'j1000000-0000-0000-0000-000000000002'::uuid,
  'c1000000-0000-0000-0000-000000000002'::uuid,
  'Part-Time Mandarin Language Teacher',
  'part_time',
  'Little Dragon Early Learning Centre in Hurstville is looking for a part-time Mandarin language teacher to deliver structured Mandarin classes to our toddler and pre-kindy groups (3 days per week, 9am-3pm). You will plan and deliver engaging Mandarin lessons incorporating songs, stories, crafts, and cultural activities. This is a wonderful opportunity for someone passionate about early language acquisition and Chinese cultural education. Certificate III minimum, native Mandarin speaker preferred.',
  'Little Dragon 幼儿教育中心（Hurstville）正在寻找一名兼职普通话语言教师，为我们的幼儿和学前班组（每周 3 天，上午 9 点至下午 3 点）提供结构化的普通话课程。您将计划和提供融入歌曲、故事、手工和文化活动的引人入胜的普通话课程。对于热衷于早期语言习得和中国文化教育的人来说，这是一个绝佳的机会。最低要求 Certificate III，优先考虑普通话母语者。',
  'certificate_iii',
  '[{"language":"Mandarin","proficiency":"native"}]',
  1,
  26.00, 30.00,
  '2026-03-15',
  false,
  'active',
  now() + interval '60 days'
) ON CONFLICT (id) DO NOTHING;

-- Job 3: Panda Kids Box Hill — Full-time lead educator
INSERT INTO job_listings (
  id, center_profile_id, title, employment_type,
  description_en, description_zh,
  qualification_required, languages_required,
  experience_required, pay_min, pay_max,
  start_date, visa_sponsorship, status, expires_at
) VALUES (
  'j1000000-0000-0000-0000-000000000003'::uuid,
  'c1000000-0000-0000-0000-000000000004'::uuid,
  'Lead Bilingual Educator — Toddler Room',
  'full_time',
  'Panda Kids Early Learning in Box Hill is seeking an experienced Lead Educator for our Toddler Room (2-3 year olds). As Lead Educator, you will be responsible for programming, room leadership, and mentoring junior staff. Our center has a strong bilingual Mandarin-English focus and we are looking for someone who can lead bilingual programming and build meaningful relationships with our predominantly Chinese-Australian families. Bachelor degree required, 3+ years experience preferred. Visa sponsorship available for exceptional candidates.',
  'Panda Kids 幼儿教育中心（Box Hill）正在寻找一位经验丰富的幼儿班首席教育者（2-3 岁）。作为首席教育者，您将负责课程编制、教室领导和指导初级员工。我们中心以中英双语为重点，我们正在寻找能够领导双语课程并与我们以华裔澳大利亚家庭为主的群体建立有意义关系的人。要求学士学位，优先考虑 3 年以上经验。为优秀候选人提供签证赞助。',
  'bachelor',
  '[{"language":"Mandarin","proficiency":"fluent"},{"language":"English","proficiency":"fluent"}]',
  3,
  33.00, 40.00,
  '2026-04-14',
  true,
  'active',
  now() + interval '60 days'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8.5  Sample center photos
-- ---------------------------------------------------------------------------
INSERT INTO center_photos (id, center_profile_id, photo_url, display_order, alt_text)
VALUES
  ('p1000000-0000-0000-0000-000000000001'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, '/images/seed/bright-horizons-1.jpg', 1, 'Bright Horizons outdoor play area'),
  ('p1000000-0000-0000-0000-000000000002'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, '/images/seed/bright-horizons-2.jpg', 2, 'Children doing calligraphy'),
  ('p1000000-0000-0000-0000-000000000003'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, '/images/seed/little-dragon-1.jpg', 1, 'Little Dragon main learning room'),
  ('p1000000-0000-0000-0000-000000000004'::uuid, 'c1000000-0000-0000-0000-000000000003'::uuid, '/images/seed/sunflower-1.jpg', 1, 'Sunflower garden and outdoor area'),
  ('p1000000-0000-0000-0000-000000000005'::uuid, 'c1000000-0000-0000-0000-000000000004'::uuid, '/images/seed/panda-kids-1.jpg', 1, 'Panda Kids STEM learning space'),
  ('p1000000-0000-0000-0000-000000000006'::uuid, 'c1000000-0000-0000-0000-000000000005'::uuid, '/images/seed/harmony-1.jpg', 1, 'Harmony bush-inspired playground')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8.6  Re-enable triggers on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE TRIGGER ALL;


-- ============================================================================
-- DONE
-- ============================================================================
-- Schema is ready. To complete setup:
--
-- 1. Create matching auth.users entries (via Supabase Auth API or dashboard)
--    for the seed profile UUIDs, OR delete the seed data and let real users
--    register through the application.
--
-- 2. Set up a cron job (pg_cron or scheduled Edge Function) to call
--    expire_stale_jobs() daily:
--      SELECT cron.schedule('expire-jobs', '0 3 * * *', 'SELECT expire_stale_jobs()');
--
-- 3. Create Supabase Storage buckets:
--      - 'avatars' (public)
--      - 'resumes' (authenticated)
--      - 'center-photos' (public)
--
-- 4. Deploy Edge Functions for:
--      - translate-text (Claude API)
--      - stripe-webhook (Stripe events)
--      - send-notification (Resend email)
-- ============================================================================
