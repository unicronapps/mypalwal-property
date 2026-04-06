-- Allow guest enquiries (no login required)
-- 1. Make buyer_id nullable
ALTER TABLE enquiries ALTER COLUMN buyer_id DROP NOT NULL;

-- 2. Add buyer_ip for fraud/spam tracking
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS buyer_ip INET;

-- 3. Index for guest rate-limiting by phone
CREATE INDEX IF NOT EXISTS idx_enquiries_guest_rate_limit
  ON enquiries (buyer_phone, property_id, created_at);
