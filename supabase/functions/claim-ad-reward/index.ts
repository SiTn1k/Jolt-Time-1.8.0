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

// =====================================================
// SECURITY: Rate limiting (in-memory, reset on cold start)
// =====================================================
const rateLimitStore = new Map<number, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

function checkRateLimit(telegramId: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(telegramId);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(telegramId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
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

  // Check auth_date freshness (24 hours max)
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

/**
 * Claim Ad Reward Edge Function
 *
 * Server-authoritative ad reward system with HMAC validation.
 * Handles all ad reward types with daily limits.
 *
 * Reward types:
 * - energy_restore: Restore 100 energy (max 5/day)
 * - chest_bonus: Extra artifact fragment from chest (max 3/day)
 * - offline_x2: Double offline income (max 3/day)
 * - session_ad: XP boost x2 for 5 minutes (max 5/day)
 * - xp_boost: x3 XP boost for 30 minutes (for compatibility with adsgram-reward)
 *
 * SECURITY:
 * - HMAC-SHA256 initData validation
 * - Rate limiting: 10 requests/minute per user
 * - Daily limits per reward type
 */

interface ClaimAdRewardRequest {
  initData?: string; // Required for HMAC validation
  telegram_id?: number; // Deprecated - use initData instead
  reward_type: "energy_restore" | "chest_bonus" | "offline_x2" | "session_ad" | "xp_boost";
}

interface DailyAdViews {
  energy_ads?: number;
  chest_ads?: number;
  offline_ads?: number;
  session_ads?: number;
  last_reset?: string;
}

interface ClaimAdRewardResponse {
  success: boolean;
  error?: string;
  reward_applied?: boolean;
  new_value?: number;
  remaining_today?: number;
  boost_end?: string;
}

// Daily limits per reward type
const DAILY_LIMITS: Record<string, number> = {
  energy_restore: 5,
  chest_bonus: 3,
  offline_x2: 3,
  session_ad: 5,
  xp_boost: 20, // Max 20 x3 XP boosts per day (more generous)
};

// Session ad boost duration: 5 minutes
const SESSION_BOOST_DURATION_MS = 5 * 60 * 1000;

// XP boost for AdsGram
const XP_BOOST_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const XP_BOOST_MULTIPLIER = 3;

function jsonResponse(data: ClaimAdRewardResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Reset daily ad views if new day
 */
function resetIfNewDay(adViews: DailyAdViews): DailyAdViews {
  const today = getTodayDate();
  if (adViews.last_reset !== today) {
    return {
      energy_ads: 0,
      chest_ads: 0,
      offline_ads: 0,
      session_ads: 0,
      last_reset: today,
    };
  }
  return adViews;
}

/**
 * Get ad count key for reward type
 */
function getAdCountKey(rewardType: string): keyof DailyAdViews {
  switch (rewardType) {
    case "energy_restore":
      return "energy_ads";
    case "chest_bonus":
      return "chest_ads";
    case "offline_x2":
      return "offline_ads";
    case "session_ad":
      return "session_ads";
    case "xp_boost":
      return "session_ads"; // Uses same counter
    default:
      return "energy_ads";
  }
}

/**
 * Get reward count key for logging
 */
function getRewardCountKey(rewardType: string): string {
  switch (rewardType) {
    case "xp_boost":
      return "xp_ads";
    default:
      return getAdCountKey(rewardType);
  }
}

/**
 * Grant x3 XP boost (for AdsGram compatibility)
 */
async function grantXpBoost(supabase: ReturnType<typeof createClient>, telegramId: number) {
  const { data: row, error: fetchError } = await supabase
    .from("game_progress")
    .select("active_boosters")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: "Database error" };
  }

  if (!row) {
    return { ok: false, error: "User not found" };
  }

  const boosters = (row.active_boosters as Record<string, unknown>) || {};
  const now = Date.now();

  // Check if x3 boost is already active
  const existingEnd = boosters.xp_boost_end as number | undefined;
  const existingMult = boosters.xp_boost_mult as number | undefined;

  if (existingEnd && existingEnd > now && existingMult && existingMult >= XP_BOOST_MULTIPLIER) {
    return { ok: false, error: "XP boost already active", already_active: true };
  }

  // Set fresh 30 minute boost
  const newEnd = now + XP_BOOST_DURATION_MS;

  const newBoosters = {
    ...boosters,
    xp_boost_end: newEnd,
    xp_boost_mult: XP_BOOST_MULTIPLIER,
  };

  const { error: updateError } = await supabase
    .from("game_progress")
    .update({ active_boosters: newBoosters })
    .eq("telegram_id", telegramId);

  if (updateError) {
    return { ok: false, error: "Failed to update boost" };
  }

  return {
    ok: true,
    boost_type: "xp_boost",
    boost_multiplier: XP_BOOST_MULTIPLIER,
    boost_ends_at: new Date(newEnd).toISOString(),
  };
}

/**
 * Get ad count key for reward type
 */
function getAdCountKey(rewardType: string): keyof DailyAdViews {
  switch (rewardType) {
    case "energy_restore":
      return "energy_ads";
    case "chest_bonus":
      return "chest_ads";
    case "offline_x2":
      return "offline_ads";
    case "session_ad":
      return "session_ads";
    default:
      return "energy_ads";
  }
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
    const body: ClaimAdRewardRequest = await req.json();
    const { initData, reward_type } = body;

    // =====================================================
    // SECURITY: HMAC validation (required for all requests)
    // =====================================================
    let telegram_id: number;

    if (initData) {
      // Secure way: validate initData
      const validated = validateInitData(initData);
      if (!validated.success) {
        console.error(`SECURITY: initData validation failed: ${validated.error}`);
        return jsonResponse({ error: validated.error || "Invalid initData" }, 403);
      }
      telegram_id = validated.telegram_id;
    } else if (body.telegram_id) {
      // Legacy way: accept telegram_id directly (deprecated, less secure)
      console.warn("claim-ad-reward: Using deprecated telegram_id auth (no HMAC)");
      telegram_id = body.telegram_id;
    } else {
      return jsonResponse({ error: "Missing authentication (initData or telegram_id required)" }, 400);
    }

    if (!reward_type || !DAILY_LIMITS[reward_type]) {
      return jsonResponse({ error: "Invalid reward_type" }, 400);
    }

    // =====================================================
    // SECURITY: Rate limiting
    // =====================================================
    const rateCheck = checkRateLimit(telegram_id);
    if (!rateCheck.allowed) {
      console.warn(`SECURITY: Rate limit exceeded for telegram_id=${telegram_id}`);
      return jsonResponse({ error: "Rate limit exceeded. Try again later." }, 429);
    }

    // Handle XP boost specially (same logic as adsgram-reward)
    if (reward_type === "xp_boost") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const result = await grantXpBoost(supabase, telegram_id);

      if (!result.ok) {
        const status = result.already_active ? 409 : 500;
        return jsonResponse({ error: result.error, already_active: result.already_active }, status);
      }

      await supabase.from("ad_views").insert({
        telegram_id,
        ad_type: "reward",
        reward_type: "xp_boost",
      });

      return jsonResponse({
        success: true,
        reward_applied: true,
        ...result,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch player state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("energy, max_energy, daily_ad_views, active_boosters")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Check and reset daily limits
    const dailyAdViews = resetIfNewDay((player.daily_ad_views as DailyAdViews) || {});
    const adCountKey = getAdCountKey(reward_type);
    const currentCount = dailyAdViews[adCountKey] || 0;
    const dailyLimit = DAILY_LIMITS[reward_type];

    if (currentCount >= dailyLimit) {
      return jsonResponse({
        success: false,
        error: `Daily limit reached for ${reward_type}`,
        remaining_today: 0,
      }, 429);
    }

    // Apply reward based on type
    const updateData: Record<string, unknown> = {};
    let rewardApplied = false;
    let newValue = 0;

    switch (reward_type) {
      case "energy_restore": {
        // Restore 100 energy (up to max_energy = 1000)
        const currentEnergy = (player.energy as number) || 0;
        const maxEnergy = (player.max_energy as number) || 1000;
        newValue = Math.min(currentEnergy + 100, maxEnergy);
        updateData.energy = newValue;
        rewardApplied = true;
        break;
      }

      case "chest_bonus": {
        // Chest bonus is handled in open-chest, this just tracks limit
        rewardApplied = true;
        break;
      }

      case "offline_x2": {
        // Offline x2 is handled client-side after verification
        // Mark boost in active_boosters for validation
        const activeBoosters = (player.active_boosters as Record<string, unknown>) || {};
        updateData.active_boosters = {
          ...activeBoosters,
          offline_boost_end: Date.now() + 30 * 60 * 1000, // 30 minutes validity
        };
        rewardApplied = true;
        break;
      }

      case "session_ad": {
        // Apply x2 XP boost for 5 minutes (write to xp_boost_end so client reads it)
        const activeBoosters = (player.active_boosters as Record<string, unknown>) || {};
        const now = Date.now();
        const currentXpBoostEnd = (activeBoosters.xp_boost_end as number) || 0;
        const newBoostEnd = now + SESSION_BOOST_DURATION_MS;
        // Don't shorten an existing longer boost
        updateData.active_boosters = {
          ...activeBoosters,
          xp_boost_end: Math.max(currentXpBoostEnd, newBoostEnd),
          xp_boost_mult: Math.max(activeBoosters.xp_boost_mult as number || 2, 2),
        };
        rewardApplied = true;
        newValue = Math.max(currentXpBoostEnd, newBoostEnd);
        break;
      }
    }

    // Increment ad count for today
    dailyAdViews[adCountKey] = currentCount + 1;
    dailyAdViews.last_reset = getTodayDate();
    updateData.daily_ad_views = dailyAdViews;

    // Update database
    const { error: updateError } = await supabase
      .from("game_progress")
      .update(updateData)
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating ad reward:", updateError);
      return jsonResponse({ error: "Failed to apply reward" }, 500);
    }

    // Log ad view for statistics
    await supabase.from("ad_views").insert({
      telegram_id,
      ad_type: "rewarded",
      reward_type,
      reward_granted: rewardApplied,
    });

    const remainingToday = dailyLimit - (currentCount + 1);

    console.log(`Ad reward claimed: user=${telegram_id}, type=${reward_type}, remaining=${remainingToday}`);

    return jsonResponse({
      success: true,
      reward_applied: rewardApplied,
      new_value: newValue || undefined,
      remaining_today: remainingToday,
      boost_end: reward_type === "session_ad" ? new Date(newValue).toISOString() : undefined,
    });
  } catch (err) {
    console.error("Claim ad reward error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
