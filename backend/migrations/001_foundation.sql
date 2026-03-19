-- Migration 001: Foundation tables
-- Standard PostgreSQL — no Supabase/RLS dependencies
-- Run in Supabase SQL editor OR any Postgres instance

-- ─────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT,                                         -- nullable: filled in complete-profile step
  phone           TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'dealer', 'admin')),
  avatar_url      TEXT,
  phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  -- Dealer-specific fields
  agency_name     TEXT,
  agency_logo_url TEXT,
  bio             TEXT,
  verified_dealer BOOLEAN NOT NULL DEFAULT FALSE,
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);

-- ─────────────────────────────────────────────────────
-- OTP TOKENS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  otp_hash    TEXT NOT NULL,                            -- SHA-256 hash, never store plain OTP
  purpose     TEXT NOT NULL CHECK (purpose IN ('login_or_register')),
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_phone_purpose ON otp_tokens (phone, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_created_at ON otp_tokens (created_at);

-- ─────────────────────────────────────────────────────
-- DEVICE TOKENS (for FCM push notifications — Phase 6)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  platform     TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);
