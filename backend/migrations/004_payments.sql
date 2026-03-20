-- Migration 004: Payment tables (Phase 4 — Dealer Features)
-- Standard PostgreSQL — no Supabase/RLS dependencies
-- Run after 003_activity.sql

-- ─────────────────────────────────────────────────────
-- PLANS (subscription tiers)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  price          NUMERIC NOT NULL DEFAULT 0,          -- monthly price in INR
  listing_limit  INTEGER NOT NULL DEFAULT 5,          -- -1 = unlimited
  duration_days  INTEGER NOT NULL DEFAULT 30,
  features       JSONB NOT NULL DEFAULT '[]',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 4 plans
INSERT INTO plans (name, price, listing_limit, duration_days, features, display_order) VALUES
  ('Free',      0,    5,  30, '["5 listings", "Basic support"]', 0),
  ('Basic',     499,  10, 30, '["10 listings", "Priority support", "Verified badge"]', 1),
  ('Pro',       999,  30, 30, '["30 listings", "Priority support", "Verified badge", "Analytics"]', 2),
  ('Unlimited', 1999, -1, 30, '["Unlimited listings", "Priority support", "Verified badge", "Analytics", "Featured listings"]', 3)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES plans(id),
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  amount            NUMERIC NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id    ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status     ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions (expires_at);
-- Quick lookup: active subscription for a user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON subscriptions (user_id, status) WHERE status = 'active';

-- ─────────────────────────────────────────────────────
-- BOOSTS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boosts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  amount            NUMERIC NOT NULL,
  duration_days     INTEGER NOT NULL DEFAULT 7,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boosts_property_id  ON boosts (property_id);
CREATE INDEX IF NOT EXISTS idx_boosts_user_id      ON boosts (user_id);
CREATE INDEX IF NOT EXISTS idx_boosts_status       ON boosts (status);
CREATE INDEX IF NOT EXISTS idx_boosts_expires_at   ON boosts (expires_at);

-- Add boost columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────
-- PAYMENTS (history log)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN ('subscription', 'boost')),
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  amount              NUMERIC NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  metadata            JSONB NOT NULL DEFAULT '{}',     -- plan_id, property_id, duration_days, etc.
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_type    ON payments (type);
