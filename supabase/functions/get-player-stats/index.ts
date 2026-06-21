// supabase/functions/get-player-stats/index.ts
// Deno Edge Function for getting player stats
// Server-side stats aggregation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetPlayerStatsRequest {
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

    const { userId }: GetPlayerStatsRequest = await req.json();

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

    // Get museum state
    const { data: museumState } = await supabaseClient
      .from("museum_state")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    // Get expedition state
    const { data: expeditionState } = await supabaseClient
      .from("expedition_progress")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    // Get analytics summary
    const { count: totalEvents } = await supabaseClient
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("telegram_id", telegramId);

    // Get security events count
    const { count: securityEvents } = await supabaseClient
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .eq("telegram_id", telegramId);

    // Calculate derived stats
    const completedCollections = museumState?.completed_collections || [];
    const museumLevel = Math.min(1 + completedCollections.length, 20);
    const artifacts = expeditionState?.artifacts || [];
    const totalArtifacts = Array.isArray(artifacts) ? artifacts.length : 0;

    // Calculate expedition stats
    const expeditionCount = expeditionState?.expedition_count || 0;
    const completedExpeditions = expeditionState?.completed_expeditions || 0;

    // Return full stats
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          // Profile
          profile: {
            level: profile.level,
            totalXp: profile.total_xp,
            currency: profile.currency,
            prestigeLevel: profile.prestige_level,
            prestigePoints: profile.prestige_points,
            dailyStreak: profile.daily_streak,
            bestStreak: profile.best_streak,
            lastCheckIn: profile.last_check_in,
            lastOnlineAt: profile.last_online_at,
            createdAt: profile.created_at,
          },
          
          // Museum
          museum: {
            level: museumLevel,
            completedCollections,
            totalCollections: completedCollections.length,
            exhibitions: museumState?.exhibitions || [],
            lastIncomeCollected: museumState?.last_income_collected_at,
          },
          
          // Expedition
          expedition: {
            currentExpeditionId: expeditionState?.current_expedition_id,
            isCompleted: expeditionState?.is_completed,
            completesAt: expeditionState?.completes_at,
            totalExpeditions: expeditionCount,
            completedExpeditions,
            artifacts: totalArtifacts,
          },
          
          // Analytics
          analytics: {
            totalEvents: totalEvents || 0,
            securityEvents: securityEvents || 0,
          },
          
          // Computed
          computed: {
            totalPlayTime: profile.last_online_at 
              ? Date.now() - new Date(profile.last_online_at).getTime()
              : 0,
            museumIncomeRate: museumLevel * 100, // Per hour
            nextPrestigeXp: (profile.level + 1) * 1000,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Get player stats error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
