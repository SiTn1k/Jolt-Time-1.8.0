-- =====================================================
-- SECURITY: Server-authoritative energy management functions
-- =====================================================
--
-- PURPOSE: Move energy logic to server to prevent:
-- - Client clock manipulation for energy regen
-- - Energy exploit via local state manipulation
-- - Race conditions on concurrent taps
--
-- The consume_energy function is atomic and uses SECURITY DEFINER
-- to bypass RLS for service_role operations
-- =====================================================

-- =====================================================
-- consume_energy: Atomically consume energy
-- =====================================================
-- Returns: { new_energy: INT, has_boost: BOOLEAN }
-- Requires prestige_level >= 1
-- =====================================================

CREATE OR REPLACE FUNCTION consume_energy(
  p_telegram_id BIGINT,
  p_amount INT DEFAULT 1
) RETURNS JSON AS $$
DECLARE
  v_current_energy INT;
  v_max_energy INT;
  v_prestige_level INT;
  v_new_energy INT;
  v_has_boost BOOLEAN;
  v_server_time BIGINT;
BEGIN
  -- Get current state
  SELECT energy, max_energy, prestige_level
  INTO v_current_energy, v_max_energy, v_prestige_level
  FROM game_progress
  WHERE telegram_id = p_telegram_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Players without prestige don't have energy mechanic
  IF v_prestige_level < 1 THEN
    RETURN json_build_object(
      'new_energy', -1,  -- -1 means no energy system
      'has_boost', true   -- Always true for non-prestige players
    );
  END IF;
  
  -- Calculate new energy (minimum 0)
  v_new_energy := GREATEST(0, v_current_energy - p_amount);
  v_has_boost := v_new_energy > 0;
  v_server_time := EXTRACT(EPOCH FROM NOW()) * 1000;
  
  -- Atomic update
  UPDATE game_progress
  SET energy = v_new_energy,
      last_online_at = v_server_time,
      server_timestamp = v_server_time
  WHERE telegram_id = p_telegram_id;
  
  RETURN json_build_object(
    'new_energy', v_new_energy,
    'has_boost', v_has_boost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- regen_energy: Calculate and apply energy regeneration
-- =====================================================
-- Energy regenerates: +2 every 2 minutes
-- =====================================================

CREATE OR REPLACE FUNCTION regen_energy(
  p_telegram_id BIGINT
) RETURNS JSON AS $$
DECLARE
  v_current_energy INT;
  v_max_energy INT;
  v_last_online BIGINT;
  v_elapsed_ms BIGINT;
  v_cycles INT;
  v_new_energy INT;
  v_regen_amount INT := 2;
  v_regen_interval_ms INT := 120000; -- 2 minutes
  v_server_time BIGINT;
BEGIN
  -- Get current state
  SELECT energy, max_energy, last_online_at
  INTO v_current_energy, v_max_energy, v_last_online
  FROM game_progress
  WHERE telegram_id = p_telegram_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  v_server_time := EXTRACT(EPOCH FROM NOW()) * 1000;
  
  -- Calculate regeneration cycles
  v_elapsed_ms := v_server_time - COALESCE(v_last_online, v_server_time);
  v_cycles := FLOOR(v_elapsed_ms::FLOAT / v_regen_interval_ms);
  
  IF v_cycles > 0 THEN
    v_new_energy := LEAST(v_max_energy, v_current_energy + (v_cycles * v_regen_amount));
    
    -- Update with new energy
    UPDATE game_progress
    SET energy = v_new_energy,
        last_online_at = v_server_time,
        server_timestamp = v_server_time
    WHERE telegram_id = p_telegram_id;
  ELSE
    v_new_energy := v_current_energy;
  END IF;
  
  RETURN json_build_object(
    'new_energy', v_new_energy,
    'regenerated', v_cycles * v_regen_amount,
    'cycles', v_cycles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- get_energy_state: Get full energy state
-- =====================================================

CREATE OR REPLACE FUNCTION get_energy_state(
  p_telegram_id BIGINT
) RETURNS JSON AS $$
DECLARE
  v_energy INT;
  v_max_energy INT;
  v_prestige_level INT;
  v_last_online BIGINT;
  v_elapsed_ms BIGINT;
  v_cycles INT;
  v_regen_amount INT := 2;
  v_regen_interval_ms INT := 120000;
  v_current_energy INT;
  v_has_energy_system BOOLEAN;
  v_server_time BIGINT;
BEGIN
  SELECT energy, max_energy, prestige_level, last_online_at
  INTO v_energy, v_max_energy, v_prestige_level, v_last_online
  FROM game_progress
  WHERE telegram_id = p_telegram_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  v_has_energy_system := v_prestige_level >= 1;
  v_server_time := EXTRACT(EPOCH FROM NOW()) * 1000;
  
  IF NOT v_has_energy_system THEN
    -- Non-prestige players don't have energy
    RETURN json_build_object(
      'current_energy', -1,
      'max_energy', v_max_energy,
      'has_energy_system', false,
      'server_time', v_server_time
    );
  END IF;
  
  -- Calculate current energy with regeneration
  v_elapsed_ms := v_server_time - COALESCE(v_last_online, v_server_time);
  v_cycles := FLOOR(v_elapsed_ms::FLOAT / v_regen_interval_ms);
  v_current_energy := LEAST(v_max_energy, v_energy + (v_cycles * v_regen_amount));
  
  -- Update if regenerated
  IF v_cycles > 0 THEN
    UPDATE game_progress
    SET energy = v_current_energy,
        last_online_at = v_server_time,
        server_timestamp = v_server_time
    WHERE telegram_id = p_telegram_id;
  END IF;
  
  RETURN json_build_object(
    'current_energy', v_current_energy,
    'max_energy', v_max_energy,
    'has_energy_system', true,
    'cycles_regenerated', v_cycles,
    'server_time', v_server_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role (edge functions use service_role key)
GRANT EXECUTE ON FUNCTION consume_energy TO service_role;
GRANT EXECUTE ON FUNCTION regen_energy TO service_role;
GRANT EXECUTE ON FUNCTION get_energy_state TO service_role;

COMMENT ON FUNCTION consume_energy IS 
  'Atomically consume energy. Returns { new_energy, has_boost }. Requires prestige_level >= 1.';
COMMENT ON FUNCTION regen_energy IS 
  'Apply energy regeneration: +2 every 2 minutes. Returns { new_energy, regenerated, cycles }.';
COMMENT ON FUNCTION get_energy_state IS 
  'Get full energy state with server-side regen calculation.';
