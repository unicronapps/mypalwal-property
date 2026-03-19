-- Migration 001b: Patch users table for OTP-only auth
-- Run after 001_foundation.sql
-- Removes password/google fields, allows empty name for new users

-- Allow empty name (new users fill it in complete-profile step)
ALTER TABLE users ALTER COLUMN name SET DEFAULT '';
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Remove password and google auth fields (no longer used)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS google_id;
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- Update otp_tokens purpose to support unified login_or_register
ALTER TABLE otp_tokens DROP CONSTRAINT IF EXISTS otp_tokens_purpose_check;
ALTER TABLE otp_tokens ADD CONSTRAINT otp_tokens_purpose_check
  CHECK (purpose IN ('login_or_register'));

-- Add index for phone lookup
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
