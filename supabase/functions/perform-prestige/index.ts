import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { 
  logSecurityEvent, 
  logPrestigeEvent, 
  extractClientInfo,
  EVENT_TYPES 
} from "../_shared/security-log.ts";
import { validatePrestigeRequest, validateTelegramId } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Perform Prestige Edge Function
 *
 * Server-authoritative prestige (rebirth) system.
 * Resets player progress in exchange for permanent prestige points.
 *
 * Security features:
 * - Rate limiting: 1 prestige per hour per user
 * - Input validation
 * - Security audit logging
 *
 * Requirements:
 * - Minimum level 950
 * - Calculated prestige points based on total_xp
 */

interface PrestigeResponse {
  success: boolean;
  error?: string;
  prestige_level?: number;
  prestige_points_earned?: number;
  total_prestige_points?: number;
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

  // Extract client info for logging
  const { ipAddress, userAgent } = extractClientInfo(req);

  try {
    const body = await req.json();
    
    // Validate request payload
    const validation = validatePrestigeRequest(body);
    if (!validation.valid) {
      const errorMsg = validation.errors?.join(", ") ?? "Invalid request";
      await logSecurityEvent({
        telegramId: null,
        eventType: EVENT_TYPES.PRESTIGE_FAILED,
        eventCategory: "prestige",
        success: false,
        ipAddress,
        userAgent,
        errorMessage: errorMsg,
        details: { errors: validation.errors },
        severity: "warning",
      });
      return jsonResponse({ error: errorMsg }, 400);
    }

    const { telegram_id } = validation.sanitized!;
    const validatedTelegramId = telegram_id as number;

    // Rate limiting: 1 prestige per hour
    const rateLimitResult = await checkRateLimit(validatedTelegramId, "prestige");
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        telegramId: validatedTelegramId,
        eventType: EVENT_TYPES.RATE_LIMIT_EXCEEDED,
        eventCategory: "abuse",
        success: false,
        ipAddress,
        userAgent,
        details: { action: "prestige" },
        severity: "warning",
      });
      return rateLimitResponse(rateLimitResult);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch current player state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("level, total_xp, prestige_level, prestige_points, prestige_research, artifact_levels, completed_artifacts, active_boosters")
      .eq("telegram_id", validatedTelegramId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      await logSecurityEvent({
        telegramId: validatedTelegramId,
        eventType: EVENT_TYPES.DB_ERROR,
        eventCategory: "system",
        success: false,
        ipAddress,
        userAgent,
        errorMessage: fetchError.message,
        severity: "error",
      });
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      await logSecurityEvent({
        telegramId: validatedTelegramId,
        eventType: EVENT_TYPES.PRESTIGE_FAILED,
        eventCategory: "prestige",
        success: false,
        ipAddress,
        userAgent,
        errorMessage: "Player not found",
        severity: "warning",
      });
      return jsonResponse({ error: "Player not found" }, 404);
    }

    const currentLevel = player.level as number;

    // Check requirements
    const prestigeCheck = canPrestige(currentLevel);
    if (!prestigeCheck.canPrestige) {
      await logPrestigeEvent(
        req,
        validatedTelegramId,
        false,
        currentLevel,
        player.prestige_level as number,
        prestigeCheck.reason
      );
      return jsonResponse({ error: prestigeCheck.reason }, 400);
    }

    // Calculate prestige points
    const pointsEarned = calculatePrestigePoints(player.total_xp as number, currentLevel);
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
      .eq("telegram_id", validatedTelegramId);

    if (updateError) {
      console.error("Error updating player for prestige:", updateError);
      await logSecurityEvent({
        telegramId: validatedTelegramId,
        eventType: EVENT_TYPES.PRESTIGE_FAILED,
        eventCategory: "prestige",
        success: false,
        ipAddress,
        userAgent,
        errorMessage: updateError.message,
        severity: "error",
      });
      return jsonResponse({ error: "Failed to perform prestige" }, 500);
    }

    // Record prestige in prestige_records
    await supabase.from("prestige_records").insert({
      telegram_id: validatedTelegramId,
      prestige_number: newPrestigeLevel,
      previous_level: currentLevel,
      total_xp_at_prestige: player.total_xp,
    });

    console.log(`Prestige completed: user=${validatedTelegramId}, new_level=${newPrestigeLevel}, points_earned=${pointsEarned}`);

    // Log success
    await logPrestigeEvent(
      req,
      validatedTelegramId,
      true,
      currentLevel,
      newPrestigeLevel
    );

    return jsonResponse({
      success: true,
      prestige_level: newPrestigeLevel,
      prestige_points_earned: pointsEarned,
      total_prestige_points: newPrestigePoints,
    });
  } catch (err) {
    console.error("Prestige error:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    
    await logSecurityEvent({
      telegramId: null,
      eventType: EVENT_TYPES.EDGE_FUNCTION_ERROR,
      eventCategory: "system",
      success: false,
      ipAddress,
      userAgent,
      errorMessage: errorMsg,
      severity: "error",
    });
    
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
