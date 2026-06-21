// supabase/functions/validate-collection/index.ts
// Deno Edge Function for collection validation
// Server-side validation with anti-cheat

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Collection definitions (same as client-side)
const COLLECTION_DEFINITIONS: Record<string, {
  requiredArtifacts: string[];
  requiredCount: number;
  bonuses: {
    xpBonus: number;
    speedBonus: number;
    trustBonus: number;
    reputationBonus: number;
    karbovanetsBonus: number;
  };
}> = {
  early_artifacts: {
    requiredArtifacts: ["triple_ceramic", "ancient_flute", "stone_idol"],
    requiredCount: 3,
    bonuses: { xpBonus: 10, speedBonus: 5, trustBonus: 2, reputationBonus: 5, karbovanetsBonus: 100 },
  },
  ukrainian_history: {
    requiredArtifacts: ["kyiv_cross", "hetman_seal", "cossack_sword", "kobzar_instrument"],
    requiredCount: 4,
    bonuses: { xpBonus: 20, speedBonus: 10, trustBonus: 5, reputationBonus: 10, karbovanetsBonus: 250 },
  },
  medieval_ukraine: {
    requiredArtifacts: ["daniel_crown", "volyn_chalice", "galician_icon"],
    requiredCount: 3,
    bonuses: { xpBonus: 30, speedBonus: 15, trustBonus: 8, reputationBonus: 15, karbovanetsBonus: 500 },
  },
  cosmic_ukraine: {
    requiredArtifacts: ["trypillia_star", "ancient_compass", "mysterious_map", "celestial_globe"],
    requiredCount: 4,
    bonuses: { xpBonus: 50, speedBonus: 25, trustBonus: 15, reputationBonus: 25, karbovanetsBonus: 1000 },
  },
  legendary_collection: {
    requiredArtifacts: ["shevchenko_penca", "shevchenko_portrait", "kobzar_lyre", "legendary_crown"],
    requiredCount: 4,
    bonuses: { xpBonus: 100, speedBonus: 50, trustBonus: 30, reputationBonus: 50, karbovanetsBonus: 5000 },
  },
};

interface ValidateCollectionRequest {
  userId: string;
  collectionId: string;
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

    const { userId, collectionId }: ValidateCollectionRequest = await req.json();

    if (!userId || !collectionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("player_profiles")
      .select("telegram_id, level, reputation")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramId = profile.telegram_id;

    // Check if collection is already completed
    const { data: museumState } = await supabaseClient
      .from("museum_state")
      .select("completed_collections")
      .eq("telegram_id", telegramId)
      .single();

    if (!museumState) {
      return new Response(
        JSON.stringify({ error: "Museum state not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const completedCollections = museumState.completed_collections || [];
    
    if (completedCollections.includes(collectionId)) {
      await logSecurityEvent(supabaseClient, telegramId, "duplicate_collection_claim", {
        collection_id: collectionId,
      });

      return new Response(
        JSON.stringify({ 
          error: "Collection already completed",
          alreadyCompleted: true 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get collection definition
    const collectionDef = COLLECTION_DEFINITIONS[collectionId];
    if (!collectionDef) {
      return new Response(
        JSON.stringify({ error: "Invalid collection ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get player's artifacts
    const { data: expeditionData } = await supabaseClient
      .from("expedition_progress")
      .select("artifacts")
      .eq("telegram_id", telegramId)
      .single();

    const playerArtifacts = expeditionData?.artifacts || [];

    // Validate artifacts exist
    const artifactIds = new Set(playerArtifacts.map((a: { id: string }) => a.id));
    const requiredArtifacts = collectionDef.requiredArtifacts;

    // Check if player has ALL required artifacts
    const hasAllArtifacts = requiredArtifacts.every(artifactId => artifactIds.has(artifactId));

    if (!hasAllArtifacts) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required artifacts",
          missingArtifacts: requiredArtifacts.filter(id => !artifactIds.has(id)),
          collectedArtifacts: playerArtifacts.length,
          requiredCount: collectionDef.requiredCount,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate bonuses based on server-side data
    const bonuses = collectionDef.bonuses;

    // Apply bonuses to player profile
    const updates: Record<string, unknown> = {
      level: profile.level + Math.floor(bonuses.xpBonus / 10), // XP converted to levels
      reputation: (profile.reputation || 0) + bonuses.reputationBonus,
      updated_at: new Date().toISOString(),
    };

    // Check for negative values
    if (bonuses.xpBonus < 0 || bonuses.reputationBonus < 0 || bonuses.karbovanetsBonus < 0) {
      await logSecurityEvent(supabaseClient, telegramId, "negative_bonus_values", {
        collection_id: collectionId,
        bonuses,
      });

      return new Response(
        JSON.stringify({ error: "Invalid bonus values" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabaseClient
      .from("player_profiles")
      .update(updates)
      .eq("id", userId);

    // Update museum state - mark collection as completed
    await supabaseClient
      .from("museum_state")
      .update({ 
        completed_collections: [...completedCollections, collectionId]
      })
      .eq("telegram_id", telegramId);

    // Log collection completion
    await supabaseClient
      .from("collection_completion_log")
      .insert({
        telegram_id: telegramId,
        collection_id: collectionId,
        reward_data: bonuses,
      });

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "collection_completed",
        event_category: "gameplay",
        payload: {
          collection_id: collectionId,
          bonuses,
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        collectionId,
        bonuses,
        completedCollections: [...completedCollections, collectionId],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Validate collection error:", error);
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
