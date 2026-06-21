// supabase/functions/expedition-complete/index.ts
// Deno Edge Function for expedition completion
// Validates and processes expedition rewards server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpeditionCompleteRequest {
  userId: string;
  expeditionId: string;
  heroId: string;
  regionId: string;
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
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, expeditionId, heroId, regionId }: ExpeditionCompleteRequest = await req.json();

    if (!userId || !expeditionId || !heroId || !regionId) {
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

    // Check expedition_progress
    const { data: expedition, error: expError } = await supabaseClient
      .from("expedition_progress")
      .select("*")
      .eq("telegram_id", telegramId)
      .eq("id", expeditionId)
      .single();

    if (expError || !expedition) {
      return new Response(
        JSON.stringify({ error: "Expedition not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already completed (anti-cheat)
    if (expedition.is_completed) {
      return new Response(
        JSON.stringify({ error: "Expedition already completed", alreadyClaimed: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify timer completion
    const now = new Date();
    const completesAt = new Date(expedition.completes_at);
    if (now < completesAt) {
      return new Response(
        JSON.stringify({ error: "Expedition timer not complete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate rewards server-side
    const rewards = generateExpeditionRewards(regionId, expedition.difficulty || 1);
    
    // Mark expedition completed
    await supabaseClient
      .from("expedition_progress")
      .update({ 
        is_completed: true,
        completed_at: now.toISOString(),
        rewards_granted: rewards
      })
      .eq("id", expeditionId);

    // Grant rewards via RPC
    await supabaseClient.rpc("grant_expedition_rewards", {
      p_telegram_id: telegramId,
      p_karbovanets: rewards.karbovanets,
      p_xp: rewards.xp,
      p_artifact: rewards.artifact
    });

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "expedition_completed",
        event_category: "gameplay",
        payload: { expedition_id: expeditionId, region_id: regionId, hero_id: heroId, rewards }
      });

    return new Response(
      JSON.stringify({ success: true, rewards, expedition: { ...expedition, is_completed: true } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Expedition complete error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateExpeditionRewards(regionId: string, difficulty: number) {
  const baseRewards = {
    karbovanets: Math.floor(100 * difficulty * (1 + Math.random() * 0.5)),
    xp: Math.floor(50 * difficulty * (1 + Math.random() * 0.3)),
    artifact: null as { id: string; name: string; rarity: string; era: string } | null
  };

  // 30% chance for artifact
  if (Math.random() < 0.3) {
    const rarities = [
      { name: "common", weight: 60 },
      { name: "rare", weight: 25 },
      { name: "epic", weight: 12 },
      { name: "legendary", weight: 3 }
    ];

    const roll = Math.random() * 100;
    let cumulative = 0;
    let selectedRarity = "common";

    for (const r of rarities) {
      cumulative += r.weight;
      if (roll < cumulative) {
        selectedRarity = r.name;
        break;
      }
    }

    baseRewards.artifact = {
      id: crypto.randomUUID(),
      name: `${regionId}_artifact_${Date.now()}`,
      rarity: selectedRarity,
      era: regionId
    };
  }

  return baseRewards;
}
