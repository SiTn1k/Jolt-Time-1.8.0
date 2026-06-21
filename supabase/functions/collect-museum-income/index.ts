// supabase/functions/collect-museum-income/index.ts
// Deno Edge Function for museum income collection
// Server-side calculation with anti-cheat

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollectMuseumIncomeRequest {
  userId: string;
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

    const { userId }: CollectMuseumIncomeRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile with all relevant data
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

    // Get museum state
    const { data: museumState } = await supabaseClient
      .from("museum_state")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    // Check last collection time
    const lastCollectedAt = museumState?.last_income_collected_at 
      ? new Date(museumState.last_income_collected_at).getTime() 
      : profile.created_at 
        ? new Date(profile.created_at).getTime()
        : Date.now();
    
    const now = Date.now();
    const hoursSinceLastCollection = (now - lastCollectedAt) / (1000 * 60 * 60);

    // Anti-cheat: Check for duplicate collection (minimum 1 hour between collections)
    if (hoursSinceLastCollection < 1) {
      // Log potential abuse
      await logSecurityEvent(supabaseClient, telegramId, "duplicate_museum_claim", {
        hours_since_last: hoursSinceLastCollection,
        last_collected_at: lastCollectedAt,
      });

      return new Response(
        JSON.stringify({ 
          error: "Too soon to collect",
          alreadyCollected: true,
          nextCollectionIn: Math.ceil((3600000 - (now - lastCollectedAt)) / 1000)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate museum level from exhibitions
    const exhibitions = museumState?.exhibitions || [];
    const completedCollections = museumState?.completed_collections || [];
    
    // Museum level = 1 + completed collections count (capped at 20)
    const museumLevel = Math.min(1 + completedCollections.length, 20);

    // Calculate bonuses
    const bonusesApplied: string[] = [];
    let bonusMultiplier = 1.0;

    // Base income calculation
    const baseIncomePerHour = 100 * museumLevel;
    let totalIncome = Math.floor(baseIncomePerHour * Math.min(hoursSinceLastCollection, 24)); // Max 24 hours

    // 1. Collection bonuses
    const collectionBonusPercent = completedCollections.length * 5; // 5% per collection
    if (collectionBonusPercent > 0) {
      bonusMultiplier += collectionBonusPercent / 100;
      bonusesApplied.push(`collection_bonus_${collectionBonusPercent}%`);
    }

    // 2. Prestige bonus
    const prestigeLevel = profile.prestige_level || 0;
    if (prestigeLevel >= 4) {
      bonusMultiplier += 0.1; // +10% for prestige 4+
      bonusesApplied.push("prestige_4_bonus_10%");
    }

    // 3. NPC relationship bonuses (would need NPC data)
    // For now, hardcoded based on prestige
    if (prestigeLevel >= 2) {
      bonusMultiplier += 0.05;
      bonusesApplied.push("npc_relationship_5%");
    }

    // 4. Seasonal events bonus
    const nowDate = new Date();
    const month = nowDate.getMonth();
    const day = nowDate.getDate();
    
    // Independence Day (August 20-28)
    if (month === 7 && day >= 20 && day <= 28) {
      bonusMultiplier += 0.25;
      bonusesApplied.push("independence_day_25%");
    }
    
    // Christmas (December 20 - January 7)
    if ((month === 11 && day >= 20) || (month === 0 && day <= 7)) {
      bonusMultiplier += 0.15;
      bonusesApplied.push("christmas_15%");
    }

    // Apply bonuses
    totalIncome = Math.floor(totalIncome * bonusMultiplier);

    // Cap maximum income (prevent extreme values)
    const maxIncome = 100000; // 100k per collection
    if (totalIncome > maxIncome) {
      await logSecurityEvent(supabaseClient, telegramId, "income_spike", {
        calculated_income: totalIncome,
        capped_to: maxIncome,
      });
      totalIncome = maxIncome;
    }

    // Update museum state
    await supabaseClient
      .from("museum_state")
      .update({ 
        last_income_collected_at: new Date().toISOString()
      })
      .eq("telegram_id", telegramId);

    // Grant income to player
    await supabaseClient
      .from("player_profiles")
      .update({
        currency: (profile.currency || 0) + totalIncome,
        total_currency_earned: (profile.total_currency_earned || 0) + totalIncome,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    // Log income
    await supabaseClient
      .from("museum_income_log")
      .insert({
        telegram_id: telegramId,
        income: totalIncome,
        bonus_breakdown: {
          base: baseIncomePerHour,
          hours: Math.min(hoursSinceLastCollection, 24),
          museum_level: museumLevel,
          bonus_multiplier: bonusMultiplier,
          bonuses_applied: bonusesApplied,
        }
      });

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "museum_income_collected",
        event_category: "gameplay",
        payload: {
          income: totalIncome,
          museum_level: museumLevel,
          hours_since_last: hoursSinceLastCollection,
          bonuses_applied: bonusesApplied,
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        income: totalIncome,
        museumLevel,
        bonusesApplied,
        hoursSinceLastCollection: Math.floor(hoursSinceLastCollection),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Collect museum income error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function logSecurityEvent(
  supabaseClient: ReturnType<typeof createClient>,
  telegramId: number,
  eventType: string,
  payload: Record<string, unknown>
) {
  try {
    await supabaseClient.from("security_events").insert({
      telegram_id: telegramId,
      event_type: eventType,
      payload,
    });
  } catch (e) {
    console.error("Failed to log security event:", e);
  }
}
