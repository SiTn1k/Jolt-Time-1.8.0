-- Unified Game State Migration
-- Consolidates all game state into single table

-- Game State table (replaces expedition_state)
CREATE TABLE IF NOT EXISTS game_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    state_data JSONB NOT NULL DEFAULT '{}',
    version INT DEFAULT 1,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id)
);

-- RLS Policies
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can access own game state"
ON game_state FOR ALL
USING (telegram_id = (current_setting('app.telegram_id', true)::BIGINT))
WITH CHECK (telegram_id = (current_setting('app.telegram_id', true)::BIGINT));

-- Service role can access all
CREATE POLICY "Service role can access game state"
ON game_state FOR ALL
USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_state_telegram_id ON game_state(telegram_id);
CREATE INDEX IF NOT EXISTS idx_game_state_updated_at ON game_state(updated_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_game_state_updated_at ON game_state;
CREATE TRIGGER update_game_state_updated_at
    BEFORE UPDATE ON game_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE game_state IS 'Unified game state - expeditions, museum, story, heroes, artifacts';
COMMENT ON COLUMN game_state.state_data IS 'Full game state as JSONB including museum and story progress';
COMMENT ON COLUMN game_state.version IS 'State schema version for migrations';

-- Drop old expedition_state table (migrate data first if needed)
-- DROP TABLE IF EXISTS expedition_state;
