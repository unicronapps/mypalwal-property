-- Migration 003: Activity tables (Phase 3)
-- Standard PostgreSQL — no Supabase/RLS dependencies
-- Run after 001_foundation.sql and 002_properties.sql

-- ─────────────────────────────────────────────────────
-- ENQUIRIES
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_name    TEXT,
  buyer_phone   TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_enquiries_property_id ON enquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_buyer_id    ON enquiries (buyer_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_owner_id    ON enquiries (owner_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status      ON enquiries (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at  ON enquiries (created_at DESC);
-- Rate limit index: buyer + property within 24h
CREATE INDEX IF NOT EXISTS idx_enquiries_rate_limit  ON enquiries (buyer_id, property_id, created_at);

-- ─────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                    -- e.g. 'new_enquiry', 'listing_approved', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB NOT NULL DEFAULT '{}',      -- extra payload (property_id, enquiry_id, etc.)
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read       ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- ─────────────────────────────────────────────────────
-- REPORTS (flag listings)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK (reason IN ('spam', 'fake', 'inappropriate', 'wrong_info', 'duplicate', 'other')),
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, reporter_id)              -- one report per user per property
);

CREATE INDEX IF NOT EXISTS idx_reports_property_id ON reports (property_id);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports (status);
