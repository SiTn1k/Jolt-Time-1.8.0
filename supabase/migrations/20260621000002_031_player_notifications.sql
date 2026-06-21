-- ============================================
-- Player Notifications Table
-- Stores notification preferences and history
-- Version: 1.0
-- Author: Jolt Time Team
-- ============================================

CREATE TABLE IF NOT EXISTS player_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    
    -- Notification data
    notification_type TEXT NOT NULL, -- 'expedition_complete', 'daily_challenge', etc.
    title TEXT,
    body TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    
    -- Priority
    priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_telegram_id ON player_notifications(telegram_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON player_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON player_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON player_notifications(telegram_id) WHERE is_read = false;

-- RLS Policies (SECURE)
ALTER TABLE player_notifications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications"
ON player_notifications
FOR INSERT
TO authenticated
WITH CHECK (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
ON player_notifications
FOR UPDATE
TO authenticated
USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON player_notifications
FOR SELECT
TO authenticated
USING (telegram_id = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'telegram_id')::bigint);

-- Service role can manage all
CREATE POLICY "Service role can manage notifications"
ON player_notifications
FOR ALL
TO service_role
USING (true);

COMMENT ON TABLE player_notifications IS 'Player notification preferences and history';
