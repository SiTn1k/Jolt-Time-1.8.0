-- ============================================
-- RPC Functions for Edge Functions
-- Version: 1.0
-- ============================================

-- grant_expedition_rewards: Grants rewards from completed expedition
CREATE OR REPLACE FUNCTION grant_expedition_rewards(
  p_telegram_id BIGINT,
  p_karbovanets BIGINT,
  p_xp BIGINT,
  p_artifact JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile JSONB;
BEGIN
  -- Get current profile
  SELECT jsonb_build_object(
    'currency', currency,
    'total_xp', total_xp,
    'level', level,
    'total_currency_earned', total_currency_earned
  ) INTO v_profile
  FROM player_profiles
  WHERE telegram_id = p_telegram_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- Update currency
  UPDATE player_profiles
  SET 
    currency = currency + p_karbovanets,
    total_currency_earned = total_currency_earned + p_karbovanets,
    updated_at = NOW()
  WHERE telegram_id = p_telegram_id;

  -- Calculate new XP and level
  DECLARE
    v_new_xp BIGINT := (v_profile->>'total_xp')::BIGINT + p_xp;
    v_new_level INT := (v_profile->>'level')::INT;
    v_xp_for_next BIGINT;
  BEGIN
    -- Simple level calculation: 100 XP per level
    WHILE v_new_xp >= 100 * v_new_level LOOP
      v_new_xp := v_new_xp - (100 * v_new_level);
      v_new_level := v_new_level + 1;
    END LOOP;

    UPDATE player_profiles
    SET 
      total_xp = total_xp + p_xp,
      level = v_new_level,
      updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
  END;

  -- Handle artifact if present
  IF p_artifact IS NOT NULL THEN
    -- Store artifact in expedition_progress for now
    UPDATE expedition_progress
    SET artifacts = COALESCE(artifacts, '[]'::jsonb) || jsonb_build_array(p_artifact)
    WHERE telegram_id = p_telegram_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'karbovanets', p_karbovanets,
    'xp', p_xp,
    'artifact', p_artifact
  );
END;
$$;

-- claim_daily_reward_internal: Internal function for daily rewards
CREATE OR REPLACE FUNCTION claim_daily_reward_internal(
  p_telegram_id BIGINT,
  p_streak INT,
  p_currency BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE player_profiles
  SET 
    currency = currency + p_currency,
    total_currency_earned = total_currency_earned + p_currency,
    daily_streak = p_streak,
    best_streak = GREATEST(best_streak, p_streak),
    last_check_in = CURRENT_DATE,
    updated_at = NOW()
  WHERE telegram_id = p_telegram_id;

  RETURN jsonb_build_object(
    'success', true,
    'streak', p_streak,
    'currency', p_currency
  );
END;
$$;

-- prestige_internal: Internal function for prestige
CREATE OR REPLACE FUNCTION prestige_internal(
  p_telegram_id BIGINT,
  p_new_level INT,
  p_currency BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset player state but keep prestige
  UPDATE player_profiles
  SET 
    level = p_new_level,
    total_xp = 0,
    currency = p_currency,
    prestige_level = prestige_level + 1,
    prestige_points = prestige_points + 100,
    prestige_research = jsonb_insert(
      COALESCE(prestige_research, '{}'::jsonb),
      ARRAY[format('prestige_%s', prestige_level + 1)],
      jsonb_build_object(
        'unlocked_at', NOW()::text,
        'rewards_granted', jsonb_build_object(
          'currency', p_currency,
          'prestige_points', 100
        )
      )
    ),
    updated_at = NOW()
  WHERE telegram_id = p_telegram_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_prestige', prestige_level + 1
  )
  FROM player_profiles
  WHERE telegram_id = p_telegram_id;
END;
$$;

-- analytics_event_internal: Internal function for analytics
CREATE OR REPLACE FUNCTION analytics_event_internal(
  p_telegram_id BIGINT,
  p_event_name TEXT,
  p_event_category TEXT,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    telegram_id,
    event_name,
    event_category,
    payload
  ) VALUES (
    p_telegram_id,
    p_event_name,
    p_event_category,
    COALESCE(p_payload, '{}'::jsonb)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION grant_expedition_rewards IS 'Grants expedition rewards and updates profile';
COMMENT ON FUNCTION claim_daily_reward_internal IS 'Internal daily reward claim function';
COMMENT ON FUNCTION prestige_internal IS 'Internal prestige function';
COMMENT ON FUNCTION analytics_event_internal IS 'Internal analytics event logging';
