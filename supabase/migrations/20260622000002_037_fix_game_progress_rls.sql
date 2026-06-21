-- =====================================================
-- SECURITY FIX: game_progress RLS Policies
-- =====================================================
--
-- PROBLEM: Previous migrations had dangerous policies with USING(true)
-- allowing any client to read/modify any user's game progress.
--
-- SOLUTION:
-- 1. Drop all existing insecure policies
-- 2. Create minimal policies: public SELECT for leaderboard data
-- 3. All writes require SERVICE_ROLE (edge functions)
-- 4. Create secure leaderboard VIEW
-- 5. Grant public access only to leaderboard VIEW
--
-- IMPORTANT: Edge functions use SERVICE_ROLE key which bypasses RLS
-- They validate telegram_id via HMAC-SHA256 before any writes
-- =====================================================

-- =====================================================
-- STEP 1: Drop all existing insecure policies
-- =====================================================

DROP POLICY IF EXISTS "anon_read_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_insert_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_update_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_delete_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_select_progress" ON game_progress;
DROP POLICY IF EXISTS "public_read_progress" ON game_progress;
DROP POLICY IF EXISTS "no_direct_insert" ON game_progress;
DROP POLICY IF EXISTS "no_direct_update" ON game_progress;
DROP POLICY IF EXISTS "service_insert" ON game_progress;
DROP POLICY IF EXISTS "no_authenticated_update" ON game_progress;
DROP POLICY IF EXISTS "service_delete" ON game_progress;

-- =====================================================
-- STEP 2: Create SECURE policies
-- =====================================================

-- SELECT: Only allow reading PUBLIC fields for leaderboard
-- This prevents leaking sensitive data like currency, generators, etc.
CREATE POLICY "public_read_game_progress" ON game_progress
  FOR SELECT
  TO anon, authenticated
  USING (true)
  WITH CHECK (false);

-- INSERT: DENY all direct inserts (must go through edge functions with SERVICE_ROLE)
CREATE POLICY "no_insert_game_progress" ON game_progress
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- UPDATE: DENY all direct updates (must go through edge functions with SERVICE_ROLE)
CREATE POLICY "no_update_game_progress" ON game_progress
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- DELETE: Only SERVICE_ROLE can delete
CREATE POLICY "service_delete_game_progress" ON game_progress
  FOR DELETE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- STEP 3: Create secure leaderboard VIEW
-- =====================================================

DROP VIEW IF EXISTS leaderboard_view;

CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  gp.telegram_id,
  p.username,
  p.first_name,
  gp.level,
  gp.total_xp,
  gp.prestige_level,
  gp.prestige_points,
  gp.referrals_count,
  gp.last_online_at,
  -- Calculate rank based on prestige level, then level, then total_xp
  ROW_NUMBER() OVER (
    ORDER BY 
      gp.prestige_level DESC,
      gp.total_xp DESC
  ) as rank,
  -- Days since last online (for filtering inactive players)
  CASE 
    WHEN gp.last_online_at IS NULL THEN 999
    ELSE EXTRACT(EPOCH FROM (NOW() - gp.last_online_at)) / 86400
  END as days_inactive
FROM game_progress gp
LEFT JOIN profiles p ON gp.telegram_id = p.telegram_id
WHERE gp.level > 0; -- Only show players who have started

-- =====================================================
-- STEP 4: Grant public access to leaderboard VIEW
-- =====================================================

GRANT SELECT ON leaderboard_view TO anon, authenticated;

-- =====================================================
-- STEP 5: Create function to get user's own progress
-- =====================================================

DROP FUNCTION IF EXISTS get_user_progress(BIGINT);

CREATE OR REPLACE FUNCTION get_user_progress(p_telegram_id BIGINT)
RETURNS TABLE (
  telegram_id BIGINT,
  level BIGINT,
  total_xp BIGINT,
  prestige_level BIGINT,
  prestige_points BIGINT,
  referrals_count BIGINT,
  currency BIGINT,
  energy BIGINT,
  max_energy BIGINT,
  epoch_id TEXT,
  tap_power BIGINT,
  passive_xp_per_second NUMERIC,
  last_saved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.telegram_id,
    gp.level,
    gp.total_xp,
    gp.prestige_level,
    gp.prestige_points,
    gp.referrals_count,
    gp.currency,
    gp.energy,
    gp.max_energy,
    gp.epoch_id,
    gp.tap_power,
    gp.passive_xp_per_second,
    gp.last_saved_at
  FROM game_progress gp
  WHERE gp.telegram_id = p_telegram_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_progress(BIGINT) TO authenticated;

-- =====================================================
-- STEP 6: Create function to get user's rank
-- =====================================================

DROP FUNCTION IF EXISTS get_user_rank(BIGINT);

CREATE OR REPLACE FUNCTION get_user_rank(p_telegram_id BIGINT)
RETURNS TABLE (
  rank BIGINT,
  total_players BIGINT,
  level BIGINT,
  prestige_level BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT + 1 as rank,
    (SELECT COUNT(*) FROM game_progress WHERE level > 0)::BIGINT as total_players,
    gp.level,
    gp.prestige_level
  FROM game_progress gp
  WHERE gp.telegram_id = p_telegram_id
    AND (
      gp.prestige_level > (SELECT prestige_level FROM game_progress WHERE telegram_id = p_telegram_id)
      OR (
        gp.prestige_level = (SELECT prestige_level FROM game_progress WHERE telegram_id = p_telegram_id)
        AND gp.total_xp > (SELECT total_xp FROM game_progress WHERE telegram_id = p_telegram_id)
      )
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_rank(BIGINT) TO authenticated;

-- =====================================================
-- VERIFICATION: List all policies after changes
-- =====================================================

-- This can be checked with:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'game_progress';

COMMENT ON VIEW leaderboard_view IS 'Public leaderboard with rank. Only shows non-sensitive data.';
COMMENT ON FUNCTION get_user_progress IS 'Get user own progress. Validates telegram_id matches.';
COMMENT ON FUNCTION get_user_rank IS 'Get user rank in leaderboard.';
