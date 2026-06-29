-- ============================================
-- Jolt Time - RLS Fixes and Secrets Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- 1. DISABLE RLS for service-only tables (Edge Functions use service_role)
ALTER TABLE ads_rewards_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE ad_views DISABLE ROW LEVEL SECURITY;

-- 2. Enable RLS back with proper policies
ALTER TABLE ads_rewards_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for service_role to bypass RLS
CREATE POLICY "Service role full access on ads_rewards_log" ON ads_rewards_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ad_views" ON ad_views
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Create policy for authenticated users on game_progress
CREATE POLICY "Users can read own game_progress" ON game_progress
  FOR SELECT USING (auth.uid()::text = telegram_id::text);

CREATE POLICY "Users can update own game_progress" ON game_progress
  FOR UPDATE USING (auth.uid()::text = telegram_id::text);

-- 5. Create policy for expedition_progress
CREATE POLICY "Users can read own expedition_progress" ON expedition_progress
  FOR SELECT USING (auth.uid()::text = telegram_id::text);

CREATE POLICY "Users can insert own expedition_progress" ON expedition_progress
  FOR INSERT WITH CHECK (auth.uid()::text = telegram_id::text);

CREATE POLICY "Users can update own expedition_progress" ON expedition_progress
  FOR UPDATE USING (auth.uid()::text = telegram_id::text);

-- 6. Verify tables exist and have data
SELECT 'game_progress' as table_name, count(*) as row_count FROM game_progress
UNION ALL
SELECT 'ads_rewards_log', count(*) FROM ads_rewards_log
UNION ALL
SELECT 'ad_views', count(*) FROM ad_views
UNION ALL
SELECT 'expedition_progress', count(*) FROM expedition_progress;
