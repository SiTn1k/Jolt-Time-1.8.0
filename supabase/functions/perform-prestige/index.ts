import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

// Rate limiting: minimum 60 seconds between prestige actions
const PRESTIGE_COOLDOWN_MS = 60000;

/**
 * Perform Prestige Edge Function
 *
 * Server-authoritative prestige (rebirth) system.
 * Resets player progress in exchange for permanent prestige points.
 *
 * SECURITY:
 * - Validates initData via HMAC-SHA256
 * - Rate limited: 1 prestige per 60 seconds
 * - Uses SERVICE_ROLE key for database operations
 *
 * Requirements:
 * - Minimum level 950
 * - Calculated prestige points based on total_xp
 */

interface PrestigeRequest {
  initData: string; // Required for HMAC validation
}

interface PrestigeResponse {
  success: boolean;
  error?: string;
  prestige_level?: number;
  prestige_points_earned?: number;
  total_prestige_points?: number;
}

// =====================================================
// SECURITY: HMAC-SHA256 initData validation
// =====================================================
function validateInitData(initData: string): { success: true; telegram_id: number } | { success: false; error: string } {
  if (!BOT_TOKEN) {
    console.error("SECURITY: TELEGRAM_BOT_TOKEN not configured!");
    return { success: false, error: "Server misconfiguration" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { success: false, error: "Missing hash" };
  }

  // Check auth_date freshness
  const authDateStr = params.get("auth_date");
  if (!authDateStr) {
    return { success: false, error: "Missing auth_date" };
  }
  const authDate = parseInt(authDateStr, 10);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || ageSeconds > 86400 || ageSeconds < 0) {
    return { success: false, error: "initData expired or invalid" };
  }

  // Build data_check_string
  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join("\n");

  // HMAC-SHA256
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) {
    return { success: false, error: "HMAC validation failed" };
  }

  // Extract user.id
  const userStr = params.get("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.id) {
        return { success: true, telegram_id: user.id };
      }
      return { success: false, error: "Missing user.id in initData" };
    } catch {
      return { success: false, error: "Invalid user JSON" };
    }
  }

  return { success: false, error: "No user in initData" };
}

function jsonResponse(data: PrestigeResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Calculate prestige points earned based on total XP
 * Formula: floor(total_xp / 100000) + level_bonus
 * Level bonus: +1 point per 50 levels over 950
 */
function calculatePrestigePoints(totalXp: number, level: number): number {
  const xpPoints = Math.floor(totalXp / 100000);
  const levelBonus = Math.floor((level - 950) / 50);
  return Math.max(1, xpPoints + levelBonus);
}

/**
 * Check if player meets prestige requirements
 */
function canPrestige(level: number): { canPrestige: boolean; reason?: string } {
  if (level < 950) {
    return { canPrestige: false, reason: `Need level 950 to prestige. Current: ${level}` };
  }
  return { canPrestige: true };
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: PrestigeRequest = await req.json();
    const { initData } = body;

    // =====================================================
    // SECURITY: Validate initData BEFORE any DB operations
    // =====================================================
    if (!initData) {
      return jsonResponse({ error: "Missing initData for validation" }, 403);
    }

    const validated = validateInitData(initData);
    if (!validated.success) {
      console.error(`SECURITY: initData validation failed: ${validated.error}`);
      return jsonResponse({ error: validated.error || "Invalid initData" }, 403);
    }

    const telegram_id = validated.telegram_id;

    if (!telegram_id) {
      return jsonResponse({ error: "Invalid telegram_id from validation" }, 403);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =====================================================
    // SECURITY: Rate limiting - check last_prestige_at
    // =====================================================
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("last_prestige_at")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile for rate limit:", profileError);
    }

    if (profile?.last_prestige_at) {
      const lastPrestige = new Date(profile.last_prestige_at).getTime();
      const now = Date.now();
      const elapsed = now - lastPrestige;

      if (elapsed < PRESTIGE_COOLDOWN_MS) {
        const remaining = Math.ceil((PRESTIGE_COOLDOWN_MS - elapsed) / 1000);
        console.warn(`SECURITY: Prestige rate limit for telegram_id=${telegram_id}. Wait ${remaining}s`);
        return jsonResponse(
          { error: `Prestige on cooldown. Try again in ${remaining} seconds.` },
          429
        );
      }
    }

    // Fetch current player state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("level, total_xp, prestige_level, prestige_points, prestige_research, artifact_levels, completed_artifacts, active_boosters")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Check requirements
    const prestigeCheck = canPrestige(player.level as number);
    if (!prestigeCheck.canPrestige) {
      return jsonResponse({ error: prestigeCheck.reason }, 400);
    }

    // Calculate prestige points
    const pointsEarned = calculatePrestigePoints(player.total_xp as number, player.level as number);
    const newPrestigeLevel = (player.prestige_level as number) + 1;
    const newPrestigePoints = (player.prestige_points as number) + pointsEarned;

    // Reset player progress while keeping prestige-related fields
    const resetData = {
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
      total_xp: 0,
      currency: 20,
      total_currency_earned: 20,
      tap_power: 1,
      passive_xp_per_second: 0,
      owned_generators: [],
      unlocked_epochs: ["trypillia"],
      epoch_id: "trypillia",
      energy: 1000,
      max_energy: 1000,
      artifact_parts: {},
      artifact_dupes: {},
      prestige_level: newPrestigeLevel,
      prestige_points: newPrestigePoints,
      last_saved_at: new Date().toISOString(),
      last_online_at: new Date().toISOString(),
      session_start_at: new Date().toISOString(),
      active_boosters: {
        purchase_log: (player.active_boosters as Record<string, unknown>)?.purchase_log || [],
      },
      daily_ad_views: {},
    };

    // Update player progress
    const { error: updateError } = await supabase
      .from("game_progress")
      .update(resetData)
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating player for prestige:", updateError);
      return jsonResponse({ error: "Failed to perform prestige" }, 500);
    }

    // =====================================================
    // SECURITY: Update last_prestige_at after successful prestige
    // =====================================================
    await supabase
      .from("profiles")
      .update({ last_prestige_at: new Date().toISOString() })
      .eq("telegram_id", telegram_id);

    // Record prestige in prestige_records
    await supabase.from("prestige_records").insert({
      telegram_id,
      prestige_number: newPrestigeLevel,
      previous_level: player.level,
      total_xp_at_prestige: player.total_xp,
    });

    console.log(`Prestige completed: user=${telegram_id}, new_level=${newPrestigeLevel}, points_earned=${pointsEarned}`);

    return jsonResponse({
      success: true,
      prestige_level: newPrestigeLevel,
      prestige_points_earned: pointsEarned,
      total_prestige_points: newPrestigePoints,
    });
  } catch (err) {
    console.error("Prestige error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
