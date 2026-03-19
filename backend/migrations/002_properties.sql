-- Migration 002: Property Core tables
-- Standard PostgreSQL — no Supabase/RLS dependencies
-- Run after 001_foundation.sql

-- ─────────────────────────────────────────────────────
-- PROPERTIES
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       TEXT NOT NULL UNIQUE,                    -- 5-char alphanumeric e.g. A3K9P (SEARCH-001)
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core fields
  title             TEXT NOT NULL,
  description       TEXT,
  property_type     TEXT NOT NULL CHECK (property_type IN (
                      'flat','house','plot','commercial','agricultural',
                      'farmhouse','pg','warehouse','shop','office',
                      'villa','independent_house'
                    )),
  category          TEXT NOT NULL CHECK (category IN ('sale', 'rent', 'lease', 'pg')),
  price             NUMERIC NOT NULL CHECK (price >= 0),
  price_negotiable  BOOLEAN NOT NULL DEFAULT FALSE,
  price_unit        TEXT NOT NULL DEFAULT 'total' CHECK (price_unit IN ('total','per_sqft','per_month','per_year')),

  -- Area (always stored as sqft)
  area_sqft         NUMERIC NOT NULL,
  area_display_value NUMERIC,                                -- original value user entered
  area_display_unit  TEXT,                                   -- original unit user entered

  -- Status
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending','sold','rented')),
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  possession_status TEXT CHECK (possession_status IN ('ready','under_construction','new_launch')),

  -- Contact preferences
  contact_call      BOOLEAN NOT NULL DEFAULT TRUE,
  contact_whatsapp  BOOLEAN NOT NULL DEFAULT FALSE,
  contact_enquiry   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Type-specific attributes (JSONB for flexible schema)
  attributes        JSONB NOT NULL DEFAULT '{}',

  -- Stats
  view_count        INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  listed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_owner_id     ON properties (owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_category     ON properties (category);
CREATE INDEX IF NOT EXISTS idx_properties_status       ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_price        ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_area_sqft    ON properties (area_sqft);
CREATE INDEX IF NOT EXISTS idx_properties_listed_at    ON properties (listed_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_is_featured  ON properties (is_featured) WHERE is_featured = TRUE;
-- GIN index on attributes JSONB for filter queries
CREATE INDEX IF NOT EXISTS idx_properties_attributes   ON properties USING GIN (attributes);
-- Full-text search index on title + description
CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- ─────────────────────────────────────────────────────
-- PROPERTY LOCATIONS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  city         TEXT NOT NULL,
  locality     TEXT NOT NULL,
  pincode      TEXT,
  landmark     TEXT,
  address_line TEXT,
  state        TEXT NOT NULL DEFAULT 'Haryana',
  latitude     NUMERIC(10, 7),
  longitude    NUMERIC(10, 7),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_locations_city     ON property_locations (city);
CREATE INDEX IF NOT EXISTS idx_property_locations_locality ON property_locations (locality);
CREATE INDEX IF NOT EXISTS idx_property_locations_pincode  ON property_locations (pincode);
CREATE INDEX IF NOT EXISTS idx_property_locations_city_locality ON property_locations (city, locality);

-- ─────────────────────────────────────────────────────
-- PROPERTY MEDIA
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_media (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  s3_key         TEXT NOT NULL,
  url            TEXT NOT NULL,
  media_type     TEXT NOT NULL CHECK (media_type IN ('photo', 'video', 'floor_plan', 'document')),
  is_cover       BOOLEAN NOT NULL DEFAULT FALSE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  uploaded_by    UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media (property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_cover       ON property_media (property_id, is_cover) WHERE is_cover = TRUE;

-- ─────────────────────────────────────────────────────
-- PROPERTY AMENITIES
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_amenities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, amenity)
);

CREATE INDEX IF NOT EXISTS idx_property_amenities_property_id ON property_amenities (property_id);

-- ─────────────────────────────────────────────────────
-- PROPERTY VIEWS (analytics + dedup)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_hash     TEXT,                                          -- hashed IP for anonymous tracking
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views (property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user_property ON property_views (user_id, property_id);

-- ─────────────────────────────────────────────────────
-- CITIES & LOCALITIES (for autocomplete)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  state      TEXT NOT NULL DEFAULT 'Haryana',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS localities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  city_id    UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  pincode    TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, city_id)
);

CREATE INDEX IF NOT EXISTS idx_localities_city_id ON localities (city_id);

-- Seed initial Haryana tier-2 cities
INSERT INTO cities (name, state) VALUES
  ('Gurugram', 'Haryana'),
  ('Faridabad', 'Haryana'),
  ('Panipat', 'Haryana'),
  ('Ambala', 'Haryana'),
  ('Yamunanagar', 'Haryana'),
  ('Rohtak', 'Haryana'),
  ('Hisar', 'Haryana'),
  ('Karnal', 'Haryana'),
  ('Sonipat', 'Haryana'),
  ('Panchkula', 'Haryana'),
  ('Bhiwani', 'Haryana'),
  ('Sirsa', 'Haryana'),
  ('Bahadurgarh', 'Haryana'),
  ('Jind', 'Haryana'),
  ('Thanesar', 'Haryana'),
  ('Kaithal', 'Haryana'),
  ('Palwal', 'Haryana'),
  ('Rewari', 'Haryana'),
  ('Hansi', 'Haryana'),
  ('Narnaul', 'Haryana')
ON CONFLICT (name) DO NOTHING;
