-- ─────────────────────────────────────────────────────
-- Migration 005: Add visitor_id to property_views
-- Enables anonymous view tracking via localStorage UUID
-- ─────────────────────────────────────────────────────

ALTER TABLE property_views
  ADD COLUMN IF NOT EXISTS visitor_id TEXT;

CREATE INDEX IF NOT EXISTS idx_property_views_visitor_id
  ON property_views (visitor_id, property_id, viewed_at DESC);
