-- ============================================
-- Museum Security & Logging Tables
-- Version: 1.0
-- ============================================

-- Museum Income Log
CREATE TABLE IF NOT EXISTS museum_income_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    
    -- Income details
    income BIGINT NOT NULL,
    bonus_breakdown JSONB NOT NULL, -- { base, hours, museum_level, bonuses_applied, etc. }
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_museum_income_telegram_id ON museum_income_log(telegram_id);
CREATE INDEX IF NOT EXISTS idx_museum_income_created_at ON museum_income_log(created_at);

-- Collection Completion Log
CREATE TABLE IF NOT EXISTS collection_completion_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    
    -- Collection details
    collection_id TEXT NOT NULL,
    reward_data JSONB NOT NULL, -- { xpBonus, speedBonus, trustBonus, reputationBonus, karbovanetsBonus }
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_log_telegram_id ON collection_completion_log(telegram_id);
CREATE INDEX IF NOT EXISTS idx_collection_log_collection_id ON collection_completion_log(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_log_created_at ON collection_completion_log(created_at);

-- Security Events (Anti-Cheat)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL, -- 'duplicate_museum_claim', 'duplicate_collection_claim', 'income_spike', 'negative_values', 'repeated_requests'
    payload JSONB, -- Additional context
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_telegram_id ON security_events(telegram_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- RLS Policies (SECURE)
ALTER TABLE museum_income_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_completion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Service role only for all tables (no direct user access)
CREATE POLICY "Service role can manage museum income log"
ON museum_income_log
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role can manage collection completion log"
ON collection_completion_log
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role can manage security events"
ON security_events
FOR ALL
TO service_role
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON museum_income_log TO service_role;
GRANT ALL ON collection_completion_log TO service_role;
GRANT ALL ON security_events TO service_role;

COMMENT ON TABLE museum_income_log IS 'Audit log for museum income collection';
COMMENT ON TABLE collection_completion_log IS 'Audit log for collection completions';
COMMENT ON TABLE security_events IS 'Security events and potential abuse attempts';
