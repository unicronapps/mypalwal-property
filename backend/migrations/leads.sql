-- ─────────────────────────────────────────────────────
-- PROPERTY REQUEST LEADS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_request_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submitter info
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  phone            TEXT NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  city             TEXT NOT NULL,
  requirement      TEXT NOT NULL CHECK (char_length(requirement) BETWEEN 10 AND 500),

  -- Lead lifecycle
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new', 'contacted', 'qualified', 'assigned', 'closed', 'spam')),
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,  -- dealer/agent assigned
  admin_notes      TEXT,

  -- Anti-spam metadata (from your rate limiting layer)
  ip_hash          TEXT,                     -- hashed IP, not raw
  form_render_ms   INTEGER,                  -- time taken to fill form (ms) — flag if < 3000
  is_bot_suspected BOOLEAN NOT NULL DEFAULT FALSE,

  -- Source tracking
  source           TEXT DEFAULT 'website'
                     CHECK (source IN ('website', 'whatsapp', 'referral', 'manual')),
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,


  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ            -- soft delete
);

-- Auto-update updated_at
CREATE TRIGGER update_property_request_leads_updated_at
  BEFORE UPDATE ON property_request_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────

-- Admin dashboard: show newest leads first
CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON property_request_leads (created_at DESC);

-- Filter by status (new, contacted, etc.)
CREATE INDEX IF NOT EXISTS idx_leads_status
  ON property_request_leads (status);

-- Assigned agent's leads
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to
  ON property_request_leads (assigned_to);

-- City-based filtering
CREATE INDEX IF NOT EXISTS idx_leads_city
  ON property_request_leads (city);

-- ─────────────────────────────────────────────────────
-- DEDUPLICATION
-- Prevent same phone + city submission within 24 hours
-- ─────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone_city_dedup
  ON property_request_leads (phone, city)
  WHERE deleted_at IS NULL
    AND created_at > NOW() - INTERVAL '24 hours';