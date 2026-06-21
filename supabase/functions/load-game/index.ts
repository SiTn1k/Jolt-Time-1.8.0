// supabase/functions/load-game/index.ts
// Deno Edge Function for cloud save loading
// Loads and migrates game state from cloud_saves table

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CURRENT_SAVE_VERSION = 2;
const CURRENT_CONTENT_VERSION = 2;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's telegram_id
    const { data: profile, error: profileError } = await supabaseClient
      .from("player_profiles")
      .select("telegram_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramId = profile.telegram_id;

    // Get cloud save
    const { data: cloudSave, error: saveError } = await supabaseClient
      .from("cloud_saves")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (saveError || !cloudSave) {
      // No cloud save exists - return null to trigger fresh start
      return new Response(
        JSON.stringify({
          success: true,
          hasCloudSave: false,
          saveData: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for save version mismatch
    const savedVersion = cloudSave.save_version || 0;
    const savedContentVersion = cloudSave.content_version || 0;
    
    let migratedData = cloudSave.save_data;
    let migrationPerformed = false;

    // Run migrations if needed
    if (savedVersion < CURRENT_SAVE_VERSION) {
      migratedData = migrateSaveData(migratedData, savedVersion);
      migrationPerformed = true;
    }

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "game_loaded",
        event_category: "session",
        payload: {
          save_version: cloudSave.save_version,
          content_version: cloudSave.content_version,
          migration_performed: migrationPerformed,
          device_id: cloudSave.device_id
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        hasCloudSave: true,
        saveData: migratedData,
        metadata: {
          saveVersion: cloudSave.save_version,
          contentVersion: cloudSave.content_version,
          savedAt: cloudSave.updated_at,
          deviceId: cloudSave.device_id,
          platform: cloudSave.platform,
          migrationPerformed
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Load game error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface SaveData {
  academyLevel?: number;
  reputation?: number;
  karbovanets?: number;
  [key: string]: unknown;
}

function migrateSaveData(data: SaveData, fromVersion: number): SaveData {
  let migratedData = { ...data };
  let version = fromVersion;

  // Migration from version 0/1 to 2
  if (version < 2) {
    migratedData = {
      ...migratedData,
      // Add new fields with defaults
      historicalPrestige: migratedData.historicalPrestige || 0,
      starsBalance: migratedData.starsBalance || 0,
      expeditionBoosts: migratedData.expeditionBoosts || 0,
      premiumTickets: migratedData.premiumTickets || 0,
      // Ensure required arrays exist
      heroes: migratedData.heroes || [],
      npcs: migratedData.npcs || [],
      regions: migratedData.regions || [],
      expeditions: migratedData.expeditions || [],
      museumState: migratedData.museumState || { completedCollections: [], exhibitions: [] },
      storyState: migratedData.storyState || { currentArc: 1, completedQuests: [] },
      buildingLevels: migratedData.buildingLevels || {},
      ownedCosmetics: migratedData.ownedCosmetics || [],
      ownedBadges: migratedData.ownedBadges || [],
      activeEffects: migratedData.activeEffects || [],
      adsWatched: migratedData.adsWatched || 0,
      totalStarsSpent: migratedData.totalStarsSpent || 0,
      // V2: Add saveVersion field
      saveVersion: 2,
      migrationVersion: 2,
      // V2: Add museum income tracking
      lastMuseumIncome: migratedData.lastMuseumIncome || null,
      // V2: Add notification state
      notificationFlags: migratedData.notificationFlags || [],
      // V2: Add game events history
      gameEventsHistory: migratedData.gameEventsHistory || [],
    };
    version = 2;
  }

  // Future migrations go here
  // if (version < 3) { ... version = 3; }

  return migratedData;
}
