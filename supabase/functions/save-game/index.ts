// supabase/functions/save-game/index.ts
// Deno Edge Function for cloud save
// Saves game state to cloud_saves table

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SaveGameRequest {
  userId: string;
  saveData: {
    // Core game state
    academyLevel: number;
    reputation: number;
    karbovanets: number;
    historicalPrestige: number;
    
    // Heroes
    heroes: Array<{
      id: string;
      level: number;
      experience: number;
      unlocked: boolean;
    }>;
    
    // NPCs
    npcs: Array<{
      id: string;
      trust: number;
      trustLevel: number;
    }>;
    
    // Regions
    regions: Array<{
      id: string;
      unlocked: boolean;
    }>;
    
    // Expeditions
    expeditions: Array<{
      id: string;
      heroId: string;
      regionId: string;
      startedAt: number;
      completesAt: number;
      status: string;
      collected: boolean;
    }>;
    
    // Museum
    museumState: {
      completedCollections: string[];
      exhibitions: Array<{
        artifactId: string;
        slotIndex: number;
      }>;
    };
    
    // Story
    storyState: {
      currentArc: number;
      completedQuests: string[];
    };
    
    // Buildings
    buildingLevels: Record<string, number>;
    
    // Cosmetics
    ownedCosmetics: string[];
    ownedBadges: string[];
    
    // Premium
    starsBalance: number;
    expeditionBoosts: number;
    premiumTickets: number;
    
    // Effects
    activeEffects: Array<{
      id: string;
      type: string;
      expiresAt: number;
    }>;
    
    // Stats
    adsWatched: number;
    totalStarsSpent: number;
  };
  deviceId?: string;
  platform?: string;
}

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

    const { userId, saveData, deviceId, platform }: SaveGameRequest = await req.json();

    if (!userId || !saveData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Create save hash for integrity
    const saveString = JSON.stringify(saveData);
    const saveHash = await generateHash(saveString);

    // Upsert cloud save
    const { error: saveError } = await supabaseClient
      .from("cloud_saves")
      .upsert({
        telegram_id: telegramId,
        save_data: saveData,
        save_version: CURRENT_SAVE_VERSION,
        content_version: CURRENT_CONTENT_VERSION,
        save_hash: saveHash,
        device_id: deviceId || null,
        platform: platform || "telegram",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "telegram_id"
      });

    if (saveError) {
      console.error("Failed to save game:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save game" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last save timestamp locally (in profile or separate tracking)
    await supabaseClient
      .from("player_profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", userId);

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "game_saved",
        event_category: "session",
        payload: {
          save_version: CURRENT_SAVE_VERSION,
          device_id: deviceId,
          heroes_count: saveData.heroes.length,
          npcs_count: saveData.npcs.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        saveVersion: CURRENT_SAVE_VERSION,
        savedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Save game error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
