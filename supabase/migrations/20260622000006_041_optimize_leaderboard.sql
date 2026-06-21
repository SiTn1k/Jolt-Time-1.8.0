-- =====================================================
-- PERFORMANCE: Optimized Leaderboard
-- =====================================================
--
-- Creates a materialized view for fast leaderboard queries
-- and RPC functions for rank lookups
--
-- REFRESH: Every 5 minutes via cron or manual trigger
-- =====================================================

-- Drop existing materialized view if schema changed
DROP MATERIALIZED VIEW IF EXISTS leaderboard_mv;

-- Create materialized view with precomputed rankings
CREATE MATERIALIZED VIEW leaderboard_mv AS
SELECT 
  p.telegram_id,
  p.first_name,
  p.username,
  gp.level,
  gp.total_xp,
  gp.prestige_level,
  gp.epoch_id,
  gp.referrals_count,
  gp.total_currency_earned,
  -- Ranking: first by prestige, then level, then total_xp
  ROW_NUMBER() OVER (
    ORDER BY 
      COALESCE(gp.prestige_level, 0) DESC,
      COALESCE(gp.level, 0) DESC,
      COALESCE(gp.total_xp, 0) DESC
  )::INTEGER AS rank,
  -- Include currency for tiebreaker display
  gp.total_currency_earned
FROM profiles p
INNER JOIN game_progress gp ON p.telegram_id = gp.telegram_id
WHERE gp.total_xp > 0  -- Exclude brand new accounts
WITH DATA;

-- Index for fast rank lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_telegram_id 
  ON leaderboard_mv(telegram_id);

-- Index for fast top-N queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank 
  ON leaderboard_mv(rank);

-- Index for filtering by prestige level
CREATE INDEX IF NOT EXISTS idx_leaderboard_prestige 
  ON leaderboard_mv(prestige_level DESC);

-- =====================================================
-- Function: Get user's rank
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_rank(p_telegram_id BIGINT)
RETURNS INTEGER 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rank INTEGER;
BEGIN
  SELECT rank INTO v_rank
  FROM leaderboard_mv
  WHERE telegram_id = p_telegram_id;
  
  RETURN COALESCE(v_rank, 0);
END;
$$;

-- =====================================================
-- Function: Get top N players
-- =====================================================

CREATE OR REPLACE FUNCTION get_leaderboard_top(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank INTEGER,
  telegram_id BIGINT,
  first_name TEXT,
  username TEXT,
  level INTEGER,
  total_xp BIGINT,
  prestige_level INTEGER,
  referrals_count INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lbv.rank,
    lbv.telegram_id,
    lbv.first_name,
    lbv.username,
    lbv.level,
    lbv.total_xp,
    lbv.prestige_level,
    lbv.referrals_count
  FROM leaderboard_mv lbv
  WHERE lbv.rank <= p_limit
  ORDER BY lbv.rank;
END;
$$;

-- =====================================================
-- Function: Get players around a specific user
-- =====================================================

CREATE OR REPLACE FUNCTION get_leaderboard_around(
  p_telegram_id BIGINT,
  p_range INTEGER DEFAULT 5
)
RETURNS TABLE (
  rank INTEGER,
  telegram_id BIGINT,
  first_name TEXT,
  username TEXT,
  level INTEGER,
  total_xp BIGINT,
  prestige_level INTEGER,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_rank INTEGER;
BEGIN
  -- Get user's rank
  SELECT rank INTO v_user_rank
  FROM leaderboard_mv
  WHERE telegram_id = p_telegram_id;
  
  IF v_user_rank IS NULL THEN
    -- User not in leaderboard, return top players
    RETURN QUERY
    SELECT 
      lbv.rank,
      lbv.telegram_id,
      lbv.first_name,
      lbv.username,
      lbv.level,
      lbv.total_xp,
      lbv.prestige_level,
      FALSE
    FROM leaderboard_mv lbv
    WHERE lbv.rank <= p_range * 2
    ORDER BY lbv.rank;
  ELSE
    -- Return players around the user
    RETURN QUERY
    SELECT 
      lbv.rank,
      lbv.telegram_id,
      lbv.first_name,
      lbv.username,
      lbv.level,
      lbv.total_xp,
      lbv.prestige_level,
      (lbv.telegram_id = p_telegram_id) AS is_current_user
    FROM leaderboard_mv lbv
    WHERE lbv.rank BETWEEN (v_user_rank - p_range) AND (v_user_rank + p_range)
    ORDER BY lbv.rank;
  END IF;
END;
$$;

-- =====================================================
-- Function: Get total player count
-- =====================================================

CREATE OR REPLACE FUNCTION get_leaderboard_count()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM leaderboard_mv;
  RETURN v_count;
END;
$$;

-- =====================================================
-- Grant execute permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_user_rank TO service_role;
GRANT EXECUTE ON FUNCTION get_leaderboard_top TO service_role;
GRANT EXECUTE ON FUNCTION get_leaderboard_around TO service_role;
GRANT EXECUTE ON FUNCTION get_leaderboard_count TO service_role;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON MATERIALIZED VIEW leaderboard_mv IS 
  'Precomputed leaderboard rankings. Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_mv;';
COMMENT ON FUNCTION get_user_rank IS 
  'Returns the rank of a specific user. Returns 0 if user not found.';
COMMENT ON FUNCTION get_leaderboard_top IS 
  'Returns top N players ordered by rank.';
COMMENT ON FUNCTION get_leaderboard_around IS 
  'Returns players around a specific user for "you are here" feature.';
