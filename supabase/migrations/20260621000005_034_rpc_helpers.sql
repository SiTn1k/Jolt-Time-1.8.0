-- ============================================
-- RPC Helper Functions
-- Version: 2.0 (for Save Version 2)
// ============================================

-- Get player prestige level
CREATE OR REPLACE FUNCTION get_player_prestige(p_telegram_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'prestige_level', COALESCE(prestige_level, 0),
    'prestige_points', COALESCE(prestige_points, 0),
    'prestige_research', COALESCE(prestige_research, '{}'::jsonb)
  ) INTO v_result
  FROM player_profiles
  WHERE telegram_id = p_telegram_id;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('error', 'Player not found');
  END IF;

  RETURN v_result;
END;
$$;

-- Get player museum level and state
CREATE OR REPLACE FUNCTION get_player_museum_level(p_telegram_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile JSONB;
  v_museum JSONB;
  v_result JSONB;
BEGIN
  -- Get profile for prestige
  SELECT jsonb_build_object(
    'prestige_level', COALESCE(prestige_level, 0)
  ) INTO v_profile
  FROM player_profiles
  WHERE telegram_id = p_telegram_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Player not found');
  END IF;

  -- Get museum state
  SELECT jsonb_build_object(
    'museum_level', COALESCE(
      (
        SELECT COUNT(*) + 1
        FROM jsonb_array_elements_text(
          COALESCE(completed_collections, '[]'::jsonb)
        )
      ), 1
    ),
    'completed_collections', COALESCE(completed_collections, '[]'::jsonb),
    'exhibitions', COALESCE(exhibitions, '[]'::jsonb),
    'last_income_collected_at', last_income_collected_at
  ) INTO v_museum
  FROM museum_state
  WHERE telegram_id = p_telegram_id;

  IF v_museum IS NULL THEN
    v_museum := jsonb_build_object(
      'museum_level', 1,
      'completed_collections', '[]'::jsonb,
      'exhibitions', '[]'::jsonb,
      'last_income_collected_at', NULL
    );
  END IF;

  RETURN v_profile || v_museum;
END;
$$;

-- Get player collections status
CREATE OR REPLACE FUNCTION get_player_collections(p_telegram_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_museum JSONB;
  v_expedition JSONB;
  v_result JSONB;
BEGIN
  -- Get museum state
  SELECT completed_collections, exhibitions INTO v_museum
  FROM museum_state
  WHERE telegram_id = p_telegram_id;

  -- Get artifacts
  SELECT artifacts INTO v_expedition
  FROM expedition_progress
  WHERE telegram_id = p_telegram_id;

  RETURN jsonb_build_object(
    'completed_collections', COALESCE(v_museum.completed_collections, '[]'::jsonb),
    'exhibitions', COALESCE(v_museum.exhibitions, '[]'::jsonb),
    'artifacts', COALESCE(v_expedition.artifacts, '[]'::jsonb),
    'total_artifacts', COALESCE(
      (
        SELECT COUNT(*) 
        FROM jsonb_array_elements(COALESCE(v_expedition.artifacts, '[]'::jsonb))
      ), 0
    )
  );
END;
$$;

-- Get player full stats (for dashboard)
CREATE OR REPLACE FUNCTION get_player_stats(p_telegram_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile JSONB;
  v_museum JSONB;
  v_expedition JSONB;
BEGIN
  SELECT row_to_json(t) INTO v_profile
  FROM (
    SELECT 
      level,
      total_xp,
      currency,
      prestige_level,
      prestige_points,
      daily_streak,
      best_streak,
      last_check_in,
      last_online_at
    FROM player_profiles
    WHERE telegram_id = p_telegram_id
  ) t;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Player not found');
  END IF;

  -- Get expedition progress
  SELECT row_to_json(t) INTO v_expedition
  FROM (
    SELECT 
      current_expedition_id,
      is_completed,
      completes_at,
      artifacts
    FROM expedition_progress
    WHERE telegram_id = p_telegram_id
  ) t;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'expedition', v_expedition,
    'museum', get_player_museum_level(p_telegram_id),
    'collections', get_player_collections(p_telegram_id)
  );
END;
$$;

-- Log security event (internal)
CREATE OR REPLACE FUNCTION log_security_event(
  p_telegram_id BIGINT,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    telegram_id,
    event_type,
    payload
  ) VALUES (
    p_telegram_id,
    p_event_type,
    COALESCE(p_payload, '{}'::jsonb)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION get_player_prestige IS 'Get player prestige level and research';
COMMENT ON FUNCTION get_player_museum_level IS 'Get player museum level and state';
COMMENT ON FUNCTION get_player_collections IS 'Get player collection status';
COMMENT ON FUNCTION get_player_stats IS 'Get player full stats for dashboard';
COMMENT ON FUNCTION log_security_event IS 'Log security event for anti-cheat';
