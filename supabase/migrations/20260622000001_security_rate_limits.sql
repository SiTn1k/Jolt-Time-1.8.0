-- ============================================
-- Security: Rate Limiting Table
-- Version: 1.0
-- Purpose: Prevent abuse of Edge Functions
-- ============================================

-- Rate limits table for tracking request frequency
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rate limit key (format: action:telegram_id:window)
    key TEXT NOT NULL,
    
    -- Telegram user ID this applies to (NULL for anonymous)
    telegram_id BIGINT,
    
    -- The action being rate limited
    action TEXT NOT NULL,
    
    -- Count of requests in the window
    count INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamp of first request in window
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- When this record expires (for cleanup)
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_telegram_id ON rate_limits(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- TTL cleanup function (run via pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM rate_limits WHERE expires_at < NOW();
END;
$$;

-- RLS for rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (Edge Functions use service key)
CREATE POLICY "Service role can manage rate limits"
ON rate_limits
FOR ALL
TO service_role
USING (true);

-- Anonymous can only insert (for tracking)
CREATE POLICY "Anonymous can insert rate limits"
ON rate_limits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No read/delete for clients (internal use only)
-- Note: This is intentionally restrictive - clients don't need to read rate limit data

COMMENT ON TABLE rate_limits IS 'Rate limiting tracking for Edge Functions';
COMMENT ON COLUMN rate_limits.key IS 'Unique key in format: action:telegram_id:window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start of the current rate limit window';
