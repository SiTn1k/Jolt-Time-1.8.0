-- =====================================================
-- SECURITY FIX: Expedition & Museum RLS Policies
-- =====================================================
--
-- PROBLEM: Expedition and museum tables may not have proper RLS
--
-- SOLUTION: Add comprehensive RLS policies for all expedition-related tables
-- Tables: expedition_state, expedition_progress, expedition_unlocks,
--         museum_state, museum_progress, museum_income_log,
--         story_progress, collection_completion_log
--
-- All writes require SERVICE_ROLE (edge functions)
-- =====================================================

DO $$
DECLARE
  tbl TEXT;
  has_rls BOOLEAN;
BEGIN
  -- =====================================================
  -- EXPEDITION TABLES
  -- =====================================================
  
  -- expedition_state
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expedition_state') THEN
    -- Enable RLS
    ALTER TABLE expedition_state ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can access own expedition state" ON expedition_state;
    DROP POLICY IF EXISTS "Service role can access expedition state" ON expedition_state;
    DROP POLICY IF EXISTS "secure_expedition_select" ON expedition_state;
    DROP POLICY IF EXISTS "secure_expedition_insert" ON expedition_state;
    DROP POLICY IF EXISTS "secure_expedition_update" ON expedition_state;
    
    -- SELECT: Allow service_role to select (edge functions)
    CREATE POLICY "service_select_expedition_state" ON expedition_state
      FOR SELECT TO service_role USING (true);
    
    -- INSERT/UPDATE/DELETE: Service role only
    CREATE POLICY "service_all_expedition_state" ON expedition_state
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'expedition_state RLS configured';
  END IF;

  -- expedition_progress
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expedition_progress') THEN
    ALTER TABLE expedition_progress ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_all_expedition_progress" ON expedition_progress;
    
    CREATE POLICY "service_all_expedition_progress" ON expedition_progress
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'expedition_progress RLS configured';
  END IF;

  -- expedition_unlocks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expedition_unlocks') THEN
    ALTER TABLE expedition_unlocks ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_all_expedition_unlocks" ON expedition_unlocks;
    
    CREATE POLICY "service_all_expedition_unlocks" ON expedition_unlocks
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'expedition_unlocks RLS configured';
  END IF;

  -- =====================================================
  -- MUSEUM TABLES
  -- =====================================================
  
  -- museum_state
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'museum_state') THEN
    ALTER TABLE museum_state ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can access own museum state" ON museum_state;
    DROP POLICY IF EXISTS "secure_museum_state_select" ON museum_state;
    DROP POLICY IF EXISTS "secure_museum_state_insert" ON museum_state;
    DROP POLICY IF EXISTS "secure_museum_state_update" ON museum_state;
    
    CREATE POLICY "service_select_museum_state" ON museum_state
      FOR SELECT TO service_role USING (true);
    
    CREATE POLICY "service_all_museum_state" ON museum_state
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'museum_state RLS configured';
  END IF;

  -- museum_progress
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'museum_progress') THEN
    ALTER TABLE museum_progress ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_all_museum_progress" ON museum_progress;
    
    CREATE POLICY "service_all_museum_progress" ON museum_progress
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'museum_progress RLS configured';
  END IF;

  -- museum_income_log
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'museum_income_log') THEN
    ALTER TABLE museum_income_log ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_all_museum_income_log" ON museum_income_log;
    
    CREATE POLICY "service_all_museum_income_log" ON museum_income_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'museum_income_log RLS configured';
  END IF;

  -- =====================================================
  -- STORY & COLLECTION TABLES
  -- =====================================================
  
  -- story_progress
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_progress') THEN
    ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can access own story progress" ON story_progress;
    DROP POLICY IF EXISTS "Service role can access story progress" ON story_progress;
    DROP POLICY IF EXISTS "secure_story_select" ON story_progress;
    DROP POLICY IF EXISTS "secure_story_insert" ON story_progress;
    DROP POLICY IF EXISTS "secure_story_update" ON story_progress;
    
    CREATE POLICY "service_select_story_progress" ON story_progress
      FOR SELECT TO service_role USING (true);
    
    CREATE POLICY "service_all_story_progress" ON story_progress
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'story_progress RLS configured';
  END IF;

  -- collection_completion_log
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_completion_log') THEN
    ALTER TABLE collection_completion_log ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_all_collection_completion_log" ON collection_completion_log;
    
    CREATE POLICY "service_all_collection_completion_log" ON collection_completion_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'collection_completion_log RLS configured';
  END IF;

  -- =====================================================
  -- NPC & OFFLINE TABLES
  -- =====================================================
  
  -- npc_relationships (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'npc_relationships') THEN
    ALTER TABLE npc_relationships ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_all_npc_relationships" ON npc_relationships;
    
    CREATE POLICY "service_all_npc_relationships" ON npc_relationships
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'npc_relationships RLS configured';
  END IF;

  -- offline_claims
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offline_claims') THEN
    ALTER TABLE offline_claims ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_all_offline_claims" ON offline_claims;
    
    CREATE POLICY "service_all_offline_claims" ON offline_claims
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'offline_claims RLS configured';
  END IF;

END $$;

-- =====================================================
-- VERIFICATION: List tables and RLS status
-- =====================================================

-- This query shows all tables and their RLS status:
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity AS rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'expedition_state', 'expedition_progress', 'expedition_unlocks',
--     'museum_state', 'museum_progress', 'museum_income_log',
--     'story_progress', 'collection_completion_log',
--     'npc_relationships', 'offline_claims'
--   )
-- ORDER BY tablename;

COMMENT ON POLICY service_all_expedition_state ON expedition_state IS 'Service role only - edge functions bypass RLS';
COMMENT ON POLICY service_all_museum_state ON museum_state IS 'Service role only - edge functions bypass RLS';
COMMENT ON POLICY service_all_story_progress ON story_progress IS 'Service role only - edge functions bypass RLS';
