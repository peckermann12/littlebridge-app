import dotenv from "dotenv";
dotenv.config();

import { pool } from "./pool";

const schema = `
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('family', 'educator', 'center', 'admin')),
  preferred_language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS center_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  center_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  suburb TEXT,
  postcode TEXT,
  state TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description_en TEXT,
  description_zh TEXT,
  fee_min NUMERIC,
  fee_max NUMERIC,
  nqs_rating TEXT,
  programs TEXT[] DEFAULT '{}',
  staff_languages JSONB DEFAULT '[]',
  age_groups JSONB DEFAULT '[]',
  is_ccs_approved BOOLEAN DEFAULT false,
  is_founding_partner BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'trial',
  subscription_trial_end TIMESTAMPTZ,
  founding_partner_expires_at TIMESTAMPTZ,
  acecqa_url TEXT,
  operating_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS center_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES center_profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES center_profiles(id),
  family_profile_id UUID REFERENCES profiles(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_wechat_id TEXT,
  guest_child_age TEXT,
  guest_child_days_needed TEXT,
  guest_suburb TEXT,
  guest_message TEXT,
  guest_message_translated TEXT,
  is_guest BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new',
  match_factors JSONB DEFAULT '[]',
  center_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id),
  family_name TEXT,
  suburb TEXT,
  postcode TEXT,
  state TEXT,
  mobile_phone TEXT,
  wechat_id TEXT,
  preferred_contact TEXT DEFAULT 'email',
  priorities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
  child_name TEXT,
  date_of_birth DATE,
  days_needed TEXT[] DEFAULT '{}',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS educator_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  suburb TEXT,
  languages TEXT[] DEFAULT '{}',
  qualification TEXT,
  wwcc_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  suburb TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function setup() {
  console.log("Setting up database schema...");
  try {
    await pool.query(schema);
    console.log("Database schema created successfully.");
  } catch (err) {
    console.error("Error setting up database:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
