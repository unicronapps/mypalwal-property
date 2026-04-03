-- ─────────────────────────────────────────────────────────────────
-- PAPERWORK LEADS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paperwork_leads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Submitter info ──────────────────────────────────────────────
  name                 TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  phone                TEXT NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  city                 TEXT NOT NULL CHECK (city IN (
                         'Gurugram','Faridabad','Panipat','Karnal',
                         'Rohtak','Ambala','Sonipat','Hisar','Other'
                       )),
  service              TEXT NOT NULL CHECK (service IN (
                         'registry','mutation','noc','loan_noc','other'
                       )),
  message              TEXT NOT NULL DEFAULT 'NA',

  -- ── Urgency (from form) ─────────────────────────────────────────
  urgency              TEXT NOT NULL DEFAULT 'not_sure'
                         CHECK (urgency IN (
                           'urgent',      -- within a week
                           'this_month',  -- within a month
                           'exploring',   -- just looking
                           'not_sure'     -- didn't answer
                         )),

  -- ── Who submitted / who created ────────────────────────────────
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- ^ logged-in platform user who filled the form (null if guest)

  created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  -- ^ staff member who manually entered the lead (null if self-submitted)

  -- ── Lead lifecycle ──────────────────────────────────────────────
  status               TEXT NOT NULL DEFAULT 'new'
                         CHECK (status IN (
                           'new','contacted','in_progress','completed','closed','spam'
                         )),

  priority             TEXT NOT NULL DEFAULT 'medium'
                         CHECK (priority IN ('low','medium','high','very_high')),

  assigned_to          UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes          TEXT,

  -- ── Follow-up tracking ─────────────────────────────────────────
  last_followup_at     TIMESTAMPTZ,
  next_followup_at     TIMESTAMPTZ,

  -- Followups stored as JSONB array in same row
  -- Each entry shape:
  -- {
  --   "id":             "uuid-v4",
  --   "followed_up_by": "uuid",         -- users.id
  --   "name":           "Ravi Sharma",  -- denormalised for display
  --   "source":         "whatsapp" | "phone" | "meeting" | "email",
  --   "notes":          "Called, said documents ready next week.",
  --   "followed_up_at": "2025-04-01T10:30:00Z"
  -- }
  followups            JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- ── Anti-spam ───────────────────────────────────────────────────
  ip_hash              TEXT,
  form_render_ms       INTEGER,
  is_bot_suspected     BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── Source tracking ─────────────────────────────────────────────
  source               TEXT NOT NULL DEFAULT 'website'
                         CHECK (source IN (
                           'website','whatsapp','referral','manual'
                         )),
  utm_source           TEXT,
  utm_medium           TEXT,
  utm_campaign         TEXT,

  -- ── Soft delete ─────────────────────────────────────────────────
  is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at           TIMESTAMPTZ,

  -- ── Timestamps ──────────────────────────────────────────────────
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER update_paperwork_leads_updated_at
  BEFORE UPDATE ON paperwork_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_paperwork_leads_created_at
  ON paperwork_leads (created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_paperwork_leads_status
  ON paperwork_leads (status)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_paperwork_leads_priority
  ON paperwork_leads (priority)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_paperwork_leads_urgency
  ON paperwork_leads (urgency)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_paperwork_leads_assigned_to
  ON paperwork_leads (assigned_to)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_paperwork_leads_next_followup
  ON paperwork_leads (next_followup_at)
  WHERE is_deleted = FALSE AND next_followup_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_paperwork_leads_service
  ON paperwork_leads (service)
  WHERE is_deleted = FALSE;

-- GIN index for querying inside the followups JSONB array
CREATE INDEX IF NOT EXISTS idx_paperwork_leads_followups
  ON paperwork_leads USING GIN (followups);