// supabase/functions/claim-daily-reward/index.ts
// Deno Edge Function for daily reward claims
// Server-side validation to prevent abuse

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClaimDailyRewardRequest {
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId }: ClaimDailyRewardRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
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
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const lastCheckIn = profile.last_check_in;

    // Check if already claimed today (anti-cheat)
    if (lastCheckIn === today) {
      return new Response(
        JSON.stringify({ error: "Already claimed today", alreadyClaimed: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate streak
    let newStreak = 1;
    if (lastCheckIn) {
      const lastDate = new Date(lastCheckIn);
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        newStreak = (profile.daily_streak || 0) + 1;
      } else if (daysDiff === 2) {
        // Grace period - streak continues but no bonus
        newStreak = (profile.daily_streak || 0) + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Calculate reward based on streak
    const reward = calculateDailyReward(newStreak);

    // Update profile
    const { error: updateError } = await supabaseClient
      .from("player_profiles")
      .update({
        last_check_in: today,
        daily_streak: newStreak,
        best_streak: Math.max(profile.best_streak || 0, newStreak),
        currency: (profile.currency || 0) + reward.currency,
        total_currency_earned: (profile.total_currency_earned || 0) + reward.currency,
        active_boosters: {
          ...((profile.active_boosters as Record<string, unknown>) || {}),
          xp_boost_until: reward.xpBoost ? Date.now() + 30 * 60 * 1000 : null
        }
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to claim reward" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "daily_reward_claimed",
        event_category: "gameplay",
        payload: { streak: newStreak, reward }
      });

    return new Response(
      JSON.stringify({
        success: true,
        streak: newStreak,
        reward
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Claim daily reward error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateDailyReward(streak: number) {
  // Reward increases with streak
  const baseCurrency = 100;
  const streakMultiplier = 1 + Math.min(streak, 30) * 0.1;
  
  return {
    currency: Math.floor(baseCurrency * streakMultiplier),
    xpBoost: streak >= 7, // XP boost every 7 days
    bonusMultiplier: streak >= 30 ? 2 : 1 // Double bonus at 30 days
  };
}
