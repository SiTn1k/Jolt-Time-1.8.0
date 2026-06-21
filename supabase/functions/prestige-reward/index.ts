// supabase/functions/prestige-reward/index.ts
// Deno Edge Function for prestige rewards
// Server-side validation to prevent prestige abuse

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrestigeRewardRequest {
  userId: string;
  targetPrestigeLevel: number;
}

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

    const { userId, targetPrestigeLevel }: PrestigeRewardRequest = await req.json();

    if (!userId || targetPrestigeLevel === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("player_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramId = profile.telegram_id;
    const currentPrestige = profile.prestige_level || 0;

    // Validate prestige progression
    if (targetPrestigeLevel !== currentPrestige + 1) {
      return new Response(
        JSON.stringify({ error: "Invalid prestige level progression" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate rewards based on prestige level
    const rewards = calculatePrestigeRewards(targetPrestigeLevel);

    // Apply prestige reset and rewards
    const resetState = getPrestigeResetState();
    const newPrestigeResearch = {
      ...((profile.prestige_research as Record<string, unknown>) || {}),
      [`prestige_${targetPrestigeLevel}`]: {
        unlocked_at: new Date().toISOString(),
        rewards_granted: rewards
      }
    };

    // Update profile
    await supabaseClient
      .from("player_profiles")
      .update({
        prestige_level: targetPrestigeLevel,
        prestige_points: rewards.prestigePoints,
        prestige_research: newPrestigeResearch,
        level: resetState.level,
        total_xp: 0,
        currency: rewards.currency,
        ...resetState
      })
      .eq("id", userId);

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "prestige_completed",
        event_category: "gameplay",
        payload: { 
          from_level: currentPrestige, 
          to_level: targetPrestigeLevel,
          rewards 
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        newPrestigeLevel: targetPrestigeLevel,
        rewards,
        unlocks: rewards.unlocks
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Prestige reward error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface PrestigeRewards {
  prestigePoints: number;
  currency: number;
  xpBonus: number;
  unlocks: string[];
}

function calculatePrestigeRewards(level: number): PrestigeRewards {
  // Prestige 1: Basic rewards
  // Prestige 2: Academy unlock
  // Prestige 3-5: Progressive unlocks
  
  const baseMultiplier = level;
  
  return {
    prestigePoints: level * 100,
    currency: level * 500,
    xpBonus: Math.min(level * 5, 50), // Max 50%
    unlocks: getPrestigeUnlocks(level)
  };
}

function getPrestigeUnlocks(level: number): string[] {
  const unlocks: string[] = [];
  
  if (level >= 1) {
    unlocks.push("hero_kobzar");
    unlocks.push("npc_hetman");
  }
  if (level >= 2) {
    unlocks.push("academy");
    unlocks.push("hero_kmc");
    unlocks.push("expedition_slot_1");
  }
  if (level >= 3) {
    unlocks.push("hero_danylo");
    unlocks.push("region_lvivska");
    unlocks.push("story_arc_7");
  }
  if (level >= 4) {
    unlocks.push("hero_hmelnytsky");
    unlocks.push("region_zakarpatska");
    unlocks.push("collection_medieval");
  }
  if (level >= 5) {
    unlocks.push("hero_shevchenko");
    unlocks.push("legendary_quests");
    unlocks.push("secret_endings");
  }
  
  return unlocks;
}

function getPrestigeResetState(): Record<string, unknown> {
  return {
    level: 1,
    total_xp: 0,
    tap_power: 1,
    passive_xp_per_second: 0,
    owned_generators: [],
    artifact_parts: {},
    artifact_levels: {},
    completed_artifacts: []
  };
}
