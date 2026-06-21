-- =====================================================
-- SECURITY: Add last_prestige_at column for rate limiting
-- =====================================================

-- Add last_prestige_at column to profiles table for prestige rate limiting
-- This allows the perform-prestige edge function to enforce a cooldown

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_prestige_at TIMESTAMPTZ;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_last_prestige_at ON profiles(last_prestige_at);

-- Comment for documentation
COMMENT ON COLUMN profiles.last_prestige_at IS 'Timestamp of last prestige action. Used for rate limiting (60 second cooldown).';
