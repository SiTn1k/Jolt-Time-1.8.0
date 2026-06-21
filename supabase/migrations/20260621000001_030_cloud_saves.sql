-- ============================================
-- Cloud Saves Table
-- Encrypted game state backup
-- Version: 1.0
-- Author: Jolt Time Team
-- ============================================

CREATE TABLE IF NOT EXISTS cloud_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    
    -- Save data (encrypted JSON)
    save_data JSONB NOT NULL,
    
    -- Versioning
    save_version INTEGER DEFAULT 1,
    content_version INTEGER DEFAULT 1,
    
    -- Metadata
    save_hash TEXT, -- SHA-256 hash for integrity check
    device_id TEXT,
    platform TEXT DEFAULT 'telegram',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cloud_saves_telegram_id ON cloud_saves(telegram_id);
CREATE INDEX IF NOT EXISTS idx_cloud_saves_updated_at ON cloud_saves(updated_at);

-- RLS Policies (SECURE)
ALTER TABLE cloud_saves ENABLE ROW LEVEL SECURITY;

-- Users can upsert their own save
CREATE POLICY "Users can upsert own cloud save"
ON cloud_saves
FOR INSERT
TO authenticated
WITH CHECK (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

CREATE POLICY "Users can update own cloud save"
ON cloud_saves
FOR UPDATE
TO authenticated
USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

-- Users can read their own save
CREATE POLICY "Users can read own cloud save"
ON cloud_saves
FOR SELECT
TO authenticated
USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

-- Service role can do everything
CREATE POLICY "Service role can manage cloud saves"
ON cloud_saves
FOR ALL
TO service_role
USING (true);

COMMENT ON TABLE cloud_saves IS 'Encrypted cloud backup for game state';
