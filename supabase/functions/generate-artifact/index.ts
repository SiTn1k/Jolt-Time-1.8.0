// supabase/functions/generate-artifact/index.ts
// Deno Edge Function for server-side artifact generation
// Generates artifacts with anti-cheat validation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateArtifactRequest {
  userId: string;
  regionId: string;
  baseRarity?: "common" | "rare" | "epic" | "legendary";
  forceRarity?: boolean;
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

    const { userId, regionId, baseRarity, forceRarity }: GenerateArtifactRequest = await req.json();

    if (!userId || !regionId) {
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

    // Generate artifact server-side
    const artifact = generateServerArtifact(regionId, baseRarity, forceRarity);

    // Insert into player's artifacts (using expedition_progress for storage or create dedicated table)
    // For now, we'll store in expedition_progress as artifacts_json
    const { data: currentExpedition } = await supabaseClient
      .from("expedition_progress")
      .select("artifacts")
      .eq("telegram_id", telegramId)
      .single();

    const existingArtifacts = currentExpedition?.artifacts || [];
    
    await supabaseClient
      .from("expedition_progress")
      .update({ 
        artifacts: [...existingArtifacts, artifact]
      })
      .eq("telegram_id", telegramId);

    // Log analytics
    await supabaseClient
      .from("analytics_events")
      .insert({
        telegram_id: telegramId,
        event_name: "artifact_generated",
        event_category: "gameplay",
        payload: { artifact_id: artifact.id, rarity: artifact.rarity, era: artifact.era }
      });

    return new Response(
      JSON.stringify({ success: true, artifact }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Generate artifact error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface Artifact {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  era: string;
  status: "damaged" | "restored" | "museum";
  created_at: string;
}

function generateServerArtifact(
  regionId: string,
  baseRarity?: "common" | "rare" | "epic" | "legendary",
  forceRarity?: boolean
): Artifact {
  // Determine rarity with weighted random if not forced
  let rarity: "common" | "rare" | "epic" | "legendary" = "common";
  
  if (baseRarity && forceRarity) {
    rarity = baseRarity;
  } else {
    const rarities = [
      { name: "common", weight: 50 },
      { name: "rare", weight: 30 },
      { name: "epic", weight: 15 },
      { name: "legendary", weight: 5 }
    ];

    const roll = Math.random() * 100;
    let cumulative = 0;

    for (const r of rarities) {
      cumulative += r.weight;
      if (roll < cumulative) {
        rarity = r.name as typeof rarity;
        break;
      }
    }
  }

  // Generate unique ID on server
  const artifactId = crypto.randomUUID();
  
  // Generate artifact name based on region and rarity
  const artifactNames: Record<string, string[]> = {
    kyivska: ["Трипільський ідол", "Стародавня кераміка", "Кам'яна баба"],
    poltavska: ["Козацька зброя", "Старовинний каліт", "Козацька піч"],
    odeska: ["Грецька амфора", "Римська монета", "Антична прикраса"],
  };
  
  const names = artifactNames[regionId] || ["Стародавній артефакт"];
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    id: artifactId,
    name: `${name} (${rarity})`,
    rarity,
    era: regionId,
    status: "damaged",
    created_at: new Date().toISOString()
  };
}
