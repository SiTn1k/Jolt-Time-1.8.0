-- ============================================
-- Jolt Time - RLS Fixes + Retention Table
-- Run this in Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/iyxhzisfwcdfhuxuqxso/sql/new
-- ============================================

-- 1. Create retention_notifications table (for push deduplication)
CREATE TABLE IF NOT EXISTS retention_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  notification_type TEXT NOT NULL,
  payload JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for retention_notifications
ALTER TABLE retention_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for service_role to bypass RLS
CREATE POLICY "Service role full access on retention_notifications" ON retention_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Create index for faster deduplication queries
CREATE INDEX IF NOT EXISTS idx_retention_notifications_telegram_type_time
ON retention_notifications (telegram_id, notification_type, sent_at DESC);

-- 3. Ensure ads_rewards_log has proper RLS
ALTER TABLE ads_rewards_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on ads_rewards_log" ON ads_rewards_log;
CREATE POLICY "Service role full access on ads_rewards_log" ON ads_rewards_log
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Ensure ad_views has proper RLS
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on ad_views" ON ad_views;
CREATE POLICY "Service role full access on ad_views" ON ad_views
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Verify all tables
SELECT 'game_progress' as table_name, count(*) as row_count FROM game_progress
UNION ALL
SELECT 'ads_rewards_log', count(*) FROM ads_rewards_log
UNION ALL
SELECT 'ad_views', count(*) FROM ad_views
UNION ALL
SELECT 'expedition_progress', count(*) FROM expedition_progress
UNION ALL
SELECT 'retention_notifications', count(*) FROM retention_notifications;
