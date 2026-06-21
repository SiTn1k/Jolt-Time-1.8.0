-- =====================================================
-- SECURITY: Add server_timestamp column for trusted timestamps
-- =====================================================
--
-- PURPOSE: Provides server-authoritative timestamps for:
-- - Offline calculations (prevent client clock manipulation)
-- - Rate limiting synchronization
-- - Game state timestamp validation
--
-- The server_timestamp is automatically updated via trigger
-- on every INSERT/UPDATE operation
-- =====================================================

-- Add server_timestamp column
ALTER TABLE game_progress 
ADD COLUMN IF NOT EXISTS server_timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;

-- Create trigger function to auto-update server_timestamp
CREATE OR REPLACE FUNCTION update_server_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.server_timestamp = EXTRACT(EPOCH FROM NOW()) * 1000;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_server_timestamp ON game_progress;

-- Create trigger for auto-update on UPDATE
CREATE TRIGGER trigger_server_timestamp
  BEFORE UPDATE ON game_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_server_timestamp();

-- Also update on INSERT to set initial value
DROP TRIGGER IF EXISTS trigger_server_timestamp_insert ON game_progress;

CREATE TRIGGER trigger_server_timestamp_insert
  BEFORE INSERT ON game_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_server_timestamp();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_progress_server_timestamp 
  ON game_progress(server_timestamp);

-- Comment for documentation
COMMENT ON COLUMN game_progress.server_timestamp IS 
  'Server-authoritative timestamp in milliseconds. Auto-updated via trigger. Used for offline calculations and anti-cheat.';
