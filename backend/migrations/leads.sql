-- ─────────────────────────────────────────────────────────────────
-- PROPERTY REQUEST LEADS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_request_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Submitter info ──────────────────────────────────────────────
  name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  phone               TEXT NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  requirement         TEXT NOT NULL CHECK (char_length(requirement) BETWEEN 10 AND 1000),

  -- Who submitted (if logged in as a platform user)
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- ── Property preferences ─────────────────────────────────────────
  city                TEXT NOT NULL CHECK (city IN (
                        'Gurugram','Faridabad','Panipat','Karnal',
                        'Rohtak','Ambala','Sonipat','Hisar','Other'
                      )),
  localities          TEXT[]   NOT NULL DEFAULT '{}',
  other_locality      TEXT,
  budget_min          TEXT,
  budget_max          TEXT,

  -- ── Lead lifecycle ───────────────────────────────────────────────
  status              TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN (
                          'new','contacted','qualified','assigned','closed','spam'
                        )),

  priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','very_high')),

  assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes         TEXT,

  -- ── Follow-up tracking ───────────────────────────────────────────
  last_followup_at    TIMESTAMPTZ,
  next_followup_at    TIMESTAMPTZ,

  -- ── Anti-spam ────────────────────────────────────────────────────
  ip_hash             TEXT,
  form_render_ms      INTEGER,
  is_bot_suspected    BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── Source tracking ──────────────────────────────────────────────
  source              TEXT NOT NULL DEFAULT 'website'
                        CHECK (source IN (
                          'website','whatsapp','referral','manual'
                        )),
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  -- ^ only populated when source = 'manual' (the staff member who entered it)

  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,

  -- ── Soft delete ──────────────────────────────────────────────────
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at          TIMESTAMPTZ,

  -- ── Timestamps ───────────────────────────────────────────────────
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────
-- LEAD FOLLOWUPS  (separate table, not JSONB)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_followups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES property_request_leads(id) ON DELETE CASCADE,

  followed_up_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source          TEXT NOT NULL CHECK (source IN ('whatsapp','phone','meeting','email')),
  notes           TEXT CHECK (char_length(notes) <= 1000),

  followed_up_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────
CREATE TRIGGER update_property_request_leads_updated_at
  BEFORE UPDATE ON property_request_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────────────────
-- INDEXES — property_request_leads
-- ─────────────────────────────────────────────────────────────────

-- Admin dashboard default sort
CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON property_request_leads (created_at DESC)
  WHERE is_deleted = FALSE;

-- Status filter (most common admin filter)
CREATE INDEX IF NOT EXISTS idx_leads_status
  ON property_request_leads (status)
  WHERE is_deleted = FALSE;

-- Priority filter
CREATE INDEX IF NOT EXISTS idx_leads_priority
  ON property_request_leads (priority)
  WHERE is_deleted = FALSE;

-- Agent workload view
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to
  ON property_request_leads (assigned_to)
  WHERE is_deleted = FALSE;

-- City-based filtering
CREATE INDEX IF NOT EXISTS idx_leads_city
  ON property_request_leads (city)
  WHERE is_deleted = FALSE;

-- Next followup due (for reminders/cron jobs)
CREATE INDEX IF NOT EXISTS idx_leads_next_followup
  ON property_request_leads (next_followup_at)
  WHERE is_deleted = FALSE AND next_followup_at IS NOT NULL;

-- Bot quarantine view
CREATE INDEX IF NOT EXISTS idx_leads_bot_suspected
  ON property_request_leads (is_bot_suspected)
  WHERE is_bot_suspected = TRUE;

-- Locality search (GIN for array contains queries)
CREATE INDEX IF NOT EXISTS idx_leads_localities
  ON property_request_leads USING GIN (localities);

-- All leads by a registered user (their submission history)
CREATE INDEX IF NOT EXISTS idx_leads_submitted_by_user
  ON property_request_leads (submitted_by_user_id)
  WHERE submitted_by_user_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────
-- INDEXES — lead_followups
-- ─────────────────────────────────────────────────────────────────

-- All followups for a lead (timeline view)
CREATE INDEX IF NOT EXISTS idx_followups_lead_id
  ON lead_followups (lead_id, followed_up_at DESC);

-- All followups done by a specific agent
CREATE INDEX IF NOT EXISTS idx_followups_followed_up_by
  ON lead_followups (followed_up_by);