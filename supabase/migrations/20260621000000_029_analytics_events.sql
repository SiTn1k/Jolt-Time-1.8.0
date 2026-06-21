-- ============================================
-- Analytics Events Table
-- Stores all game events for analytics
-- Version: 1.0
-- Author: Jolt Time Team
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    
    -- Event data
    event_name TEXT NOT NULL,
    event_category TEXT, -- 'gameplay', 'social', 'purchase', 'session'
    payload JSONB DEFAULT '{}'::jsonb,
    
    -- Context
    screen_name TEXT,
    device_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_telegram_id ON analytics_events(telegram_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics_events(event_category);

-- RLS Policies (SECURE)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own events
CREATE POLICY "Users can insert own analytics"
ON analytics_events
FOR INSERT
TO authenticated
WITH CHECK (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

-- Service role can read all
CREATE POLICY "Service role can read analytics"
ON analytics_events
FOR SELECT
TO service_role
USING (true);

COMMENT ON TABLE analytics_events IS 'Stores all game events for Firebase/Supabase/Amplitude analytics';
