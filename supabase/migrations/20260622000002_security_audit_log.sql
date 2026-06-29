-- ============================================
-- Security: Audit Logging Table
-- Version: 1.0
-- Purpose: Track security-relevant events
-- ============================================

-- Security audit log for tracking important events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Telegram user ID (NULL for anonymous/failed attempts)
    telegram_id BIGINT,
    
    -- Type of security event
    event_type TEXT NOT NULL,
    
    -- Event category for filtering
    event_category TEXT NOT NULL DEFAULT 'general',
    -- Categories: 'auth', 'purchase', 'prestige', 'abuse', 'system', 'general'
    
    -- Whether the action was successful
    success BOOLEAN NOT NULL DEFAULT true,
    
    -- IP address (if available from headers)
    ip_address TEXT,
    
    -- User agent string
    user_agent TEXT,
    
    -- Additional event details
    details JSONB DEFAULT '{}',
    
    -- Error message (if applicable)
    error_message TEXT,
    
    -- Request metadata
    request_method TEXT,
    request_path TEXT,
    
    -- Telegram data snapshot (for fraud investigation)
    telegram_init_data TEXT,
    
    -- Severity level
    severity TEXT NOT NULL DEFAULT 'info',
    -- Levels: 'debug', 'info', 'warning', 'error', 'critical'
    
    -- When the event was created
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_security_audit_telegram_id ON security_audit_log(telegram_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_category ON security_audit_log(event_category);
CREATE INDEX IF NOT EXISTS idx_security_audit_success ON security_audit_log(success);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_log(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_audit_telegram_category ON security_audit_log(telegram_id, event_category, created_at DESC);

-- RLS for security_audit_log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage security audit log"
ON security_audit_log
FOR ALL
TO service_role
USING (true);

-- No direct client access - only service role via Edge Functions
-- This is intentional for security

COMMENT ON TABLE security_audit_log IS 'Security audit log for tracking important events';
COMMENT ON COLUMN security_audit_log.event_type IS 'Event type identifier (e.g., prestige_attempt, purchase_failed)';
COMMENT ON COLUMN security_audit_log.event_category IS 'Event category for filtering';
COMMENT ON COLUMN security_audit_log.telegram_init_data IS 'Snapshot of initData for fraud investigation (should be redacted in production)';

-- Common event types for reference:
-- 'prestige_attempt' - User attempted prestige
-- 'prestige_success' - Prestige completed successfully
-- 'prestige_failed' - Prestige failed (not enough level, etc.)
-- 'purchase_attempt' - User attempted to buy booster
-- 'purchase_success' - Purchase completed
-- 'purchase_failed' - Purchase failed
-- 'invalid_init_data' - HMAC validation failed
-- 'rate_limit_exceeded' - User hit rate limit
-- 'suspicious_activity' - Detected suspicious behavior
-- 'payload_validation_failed' - Request payload was invalid
