import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADSGRAM_SECRET = Deno.env.get("ADSGRAM_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Reward configuration
const CURRENCY_REWARD = 100;
const XP_BOOST_DURATION_MS = 30 * 60 * 1000; // 30 minutes (NOT extendable)
const XP_BOOST_MULTIPLIER = 3;

/**
 * AdsGram Reward Callback Endpoint
 *
 * Accepts:
 * 1. GET requests from AdsGram server callback (with secret verification)
 * 2. POST requests from frontend SDK (after successful ad viewing)
 *
 * Response codes:
 *   - 200: Reward granted successfully
 *   - 400: Missing/invalid parameters
 *   - 403: Invalid secret (GET only)
 *   - 404: User not found
 *   - 409: Boost already active or reward already claimed
 *   - 500: Server error
 */

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Grant x3 XP boost for EXACTLY 30 minutes
 * Does NOT extend existing boost - always fresh 30 min from now
 */
async function grantXpBoost(supabase: ReturnType<typeof createClient>, telegramId: number) {
  // Get current boosters
  const { data: row, error: fetchError } = await supabase
    .from("game_progress")
    .select("active_boosters")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching boosters:", fetchError);
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

  // Update boosters - preserve other boosters
  const newBoosters = {
    ...boosters,
    xp_boost_end: newEnd,
    xp_boost_mult: XP_BOOST_MULTIPLIER,
  };

  // Remove _daily (storage-only field, handled separately)
  delete newBoosters._daily;

  const { error: updateError } = await supabase
    .from("game_progress")
    .update({ active_boosters: newBoosters })
    .eq("telegram_id", telegramId);

  if (updateError) {
    console.error("Error updating XP boost:", updateError);
    return { ok: false, error: "Failed to update boost" };
  }

  return {
    ok: true,
    boost_type: "xp_boost",
    boost_multiplier: XP_BOOST_MULTIPLIER,
    boost_ends_at: new Date(newEnd).toISOString(),
    boost_duration_minutes: 30,
  };
}

/**
 * Grant currency reward (for currency reward type)
 */
async function grantCurrency(supabase: ReturnType<typeof createClient>, telegramId: number) {
  const { data: user, error: userError } = await supabase
    .from("game_progress")
    .select("telegram_id, currency, total_currency_earned")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (userError) {
    console.error("Error finding user:", userError);
    return { ok: false, error: "Database error" };
  }

  if (!user) {
    return { ok: false, error: "User not found" };
  }

  const currentCurrency = (user.currency as number) ?? 0;
  const currentTotal = (user.total_currency_earned as number) ?? 0;

  const { error: updateError } = await supabase
    .from("game_progress")
    .update({
      currency: currentCurrency + CURRENCY_REWARD,
      total_currency_earned: currentTotal + CURRENCY_REWARD,
    })
    .eq("telegram_id", telegramId);

  if (updateError) {
    console.error("Error updating currency:", updateError);
    return { ok: false, error: "Failed to update balance" };
  }

  return {
    ok: true,
    reward_type: "currency",
    reward_amount: CURRENCY_REWARD,
    new_balance: currentCurrency + CURRENCY_REWARD,
  };
}

/**
 * Log reward and ad view statistics
 */
async function logReward(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  adId: string,
  rewardType: string
) {
  // Log to ads_rewards_log for duplicate prevention
  await supabase.from("ads_rewards_log").insert({
    telegram_id: telegramId,
    reward_type: rewardType,
    reward_amount: rewardType === "xp_boost" ? 0 : CURRENCY_REWARD,
    ad_id: adId,
  });

  // Log to ad_views for statistics
  await supabase.from("ad_views").insert({
    telegram_id: telegramId,
    ad_type: "reward",
    reward_type: rewardType,
  });
}

/**
 * Handle GET request (AdsGram server callback with secret)
 */
async function handleGetCallback(params: URLSearchParams) {
  const userid = params.get("userid");
  const secret = params.get("secret");
  const adId = params.get("ad_id") || crypto.randomUUID();
  const rewardType = params.get("reward_type") || "xp_boost";

  if (!userid) {
    return jsonResponse({ error: "Missing userid" }, 400);
  }

  if (!secret) {
    return jsonResponse({ error: "Missing secret" }, 400);
  }

  // Verify secret for GET requests
  if (!ADSGRAM_SECRET || secret !== ADSGRAM_SECRET) {
    console.warn(`Invalid AdsGram secret attempt for user ${userid}`);
    return jsonResponse({ error: "Invalid secret" }, 403);
  }

  const telegramId = parseInt(userid, 10);
  if (isNaN(telegramId) || telegramId <= 0) {
    return jsonResponse({ error: "Invalid userid" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check duplicate
  const { data: existing } = await supabase
    .from("ads_rewards_log")
    .select("id")
    .eq("telegram_id", telegramId)
    .eq("ad_id", adId)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ error: "Reward already claimed", already_claimed: true }, 409);
  }

  // Grant reward
  const result = rewardType === "xp_boost"
    ? await grantXpBoost(supabase, telegramId)
    : await grantCurrency(supabase, telegramId);

  if (!result.ok) {
    const status = result.already_active ? 409 : 404;
    return jsonResponse({ error: result.error, already_active: result.already_active }, status);
  }

  await logReward(supabase, telegramId, adId, rewardType);

  console.log(`AdsGram GET reward: user=${telegramId}, type=${rewardType}, ad_id=${adId}`);

  return jsonResponse({ success: true, ...result });
}

/**
 * Handle POST request (from frontend SDK after successful ad view)
 */
async function handlePostCallback(body: { userid?: string; ad_id?: string; reward_type?: string }) {
  const { userid, ad_id, reward_type } = body;

  if (!userid) {
    return jsonResponse({ error: "Missing userid" }, 400);
  }

  const telegramId = parseInt(userid, 10);
  if (isNaN(telegramId) || telegramId <= 0) {
    return jsonResponse({ error: "Invalid userid" }, 400);
  }

  const adId = ad_id || crypto.randomUUID();
  const rewardType = reward_type || "xp_boost";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check duplicate
  const { data: existing } = await supabase
    .from("ads_rewards_log")
    .select("id")
    .eq("telegram_id", telegramId)
    .eq("ad_id", adId)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ error: "Reward already claimed", already_claimed: true }, 409);
  }

  // Grant XP boost (default for frontend SDK)
  const result = await grantXpBoost(supabase, telegramId);

  if (!result.ok) {
    const status = result.already_active ? 409 : 404;
    return jsonResponse({ error: result.error, already_active: result.already_active }, status);
  }

  await logReward(supabase, telegramId, adId, rewardType);

  console.log(`AdsGram POST reward: user=${telegramId}, type=${rewardType}, ad_id=${adId}`);

  return jsonResponse({ success: true, ...result });
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // GET - AdsGram server callback
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      return await handleGetCallback(url.searchParams);
    } catch (err) {
      console.error("AdsGram GET error:", err);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  }

  // POST - Frontend SDK callback
  if (req.method === "POST") {
    try {
      const body = await req.json();
      return await handlePostCallback(body);
    } catch (err) {
      console.error("AdsGram POST error:", err);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
