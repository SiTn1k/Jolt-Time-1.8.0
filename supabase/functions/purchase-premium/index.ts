// supabase/functions/purchase-premium/index.ts
// Deno Edge Function for premium purchases
// Server-side validation to prevent duplicate purchases

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchasePremiumRequest {
  userId: string;
  itemId: string;
  telegramPaymentId: string;
  starsAmount: number;
}

// Valid premium items
const VALID_ITEMS: Record<string, { starsCost: number; reward: { type: string; amount: number } }> = {
  starter_pack: { starsCost: 50, reward: { type: "currency", amount: 5000 } },
  xp_boost_1h: { starsCost: 10, reward: { type: "xp_boost", amount: 3600000 } },
  xp_boost_24h: { starsCost: 50, reward: { type: "xp_boost", amount: 86400000 } },
  artifact_guaranteed: { starsCost: 100, reward: { type: "guaranteed_artifact", amount: 1 } },
  expedition_skip: { starsCost: 20, reward: { type: "skip_expedition", amount: 1 } },
  energy_pack: { starsCost: 30, reward: { type: "energy", amount: 500 } },
};

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

    const { userId, itemId, telegramPaymentId, starsAmount }: PurchasePremiumRequest = await req.json();

    if (!userId || !itemId || !telegramPaymentId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Validate item exists
    const itemConfig = VALID_ITEMS[itemId];
    if (!itemConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid item" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify stars amount matches
    if (starsAmount !== itemConfig.starsCost) {
      return new Response(
        JSON.stringify({ error: "Invalid stars amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate purchase (anti-cheat)
    const { data: existingPurchase } = await supabaseClient
      .from("purchase_history")
      .select("id")
      .eq("telegram_payment_id", telegramPaymentId)
      .single();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: "Duplicate purchase", alreadyPurchased: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process purchase
    let rewardGranted = false;
    let rewardDetails: Record<string, unknown> = {};

    // Apply reward based on type
    switch (itemConfig.reward.type) {
      case "currency":
        await supabaseClient
          .from("player_profiles")
          .update({
            currency: (profile.currency || 0) + itemConfig.reward.amount,
            total_currency_earned: (profile.total_currency_earned || 0) + itemConfig.reward.amount
          })
          .eq("id", userId);
        rewardGranted = true;
        rewardDetails = { currency: itemConfig.reward.amount };
        break;

      case "xp_boost":
        const currentBoosters = (profile.active_boosters as Record<string, unknown>) || {};
        const existingBoost = currentBoosters.xp_boost_until || 0;
        const newBoostUntil = Math.max(existingBoost as number, Date.now()) + itemConfig.reward.amount;
        
        await supabaseClient
          .from("player_profiles")
          .update({
            active_boosters: {
              ...currentBoosters,
              xp_boost_until: newBoostUntil
            }
          })
          .eq("id", userId);
        rewardGranted = true;
        rewardDetails = { xp_boost_until: newBoostUntil };
        break;

      case "energy":
        const currentEnergy = profile.energy || 0;
        const maxEnergy = profile.max_energy || 100;
        
        await supabaseClient
          .from("player_profiles")
          .update({
            energy: Math.min(currentEnergy + itemConfig.reward.amount, maxEnergy)
          })
          .eq("id", userId);
        rewardGranted = true;
        rewardDetails = { energy: itemConfig.reward.amount };
        break;

      default:
        // Mark as purchased but don't apply yet (for future items)
        rewardDetails = { pending: true };
    }

    // Record purchase in history
    await supabaseClient
      .from("purchase_history")
      .insert({
        telegram_id: telegramId,
        product_id: itemId,
        stars_amount: starsAmount,
        price_stars: itemConfig.starsCost,
        telegram_payment_id: telegramPaymentId,
        status: "completed",
        completed_at: new Date().toISOString()
      });

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "premium_purchased",
        event_category: "purchase",
        payload: { 
          item_id: itemId, 
          stars_cost: starsAmount,
          reward_granted: rewardGranted
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        rewardGranted,
        reward: rewardDetails
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Purchase premium error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
