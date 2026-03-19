-- Migration 001: Foundation tables
-- Run in Supabase SQL editor
-- Supabase RLS enabled on all tables (CLAUDE.md decision)

-- ─────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT UNIQUE,                          -- nullable for Google-only users initially
  email           TEXT UNIQUE,
  password_hash   TEXT,                                 -- nullable for Google-only users
  google_id       TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'dealer', 'admin')),
  avatar_url      TEXT,
  phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  -- Dealer-specific fields
  agency_name     TEXT,
  agency_logo_url TEXT,
  bio             TEXT,
  verified_dealer BOOLEAN NOT NULL DEFAULT FALSE,       -- admin-verified badge
  -- TODO: [PHASE-4] subscription_plan, subscription_expires_at, listing_count
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────
-- OTP TOKENS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  otp_hash    TEXT NOT NULL,                            -- SHA-256 hash, never store plain OTP
  purpose     TEXT NOT NULL CHECK (purpose IN ('register', 'login', 'forgot_password')),
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_phone_purpose ON otp_tokens (phone, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_created_at ON otp_tokens (created_at);

-- ─────────────────────────────────────────────────────
-- DEVICE TOKENS (for FCM push notifications)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),  -- NOTIF-001
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);

-- ─────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record; service role can read all (backend uses service role)
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- OTP tokens: only service role accesses (no user-level RLS needed)
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;

-- Device tokens: users manage their own tokens
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens_own" ON device_tokens
  FOR ALL USING (auth.uid() = user_id);

-- NOTE: Backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- RLS policies above protect direct client access (anon key).
