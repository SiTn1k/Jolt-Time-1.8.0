import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHmac } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { 
  logSecurityEvent, 
  extractClientInfo,
  EVENT_TYPES 
} from "../_shared/security-log.ts";
import { validateGameActionRequest, validateEpochId } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Server-authoritative game actions.
 *
 * All actions require a valid `init_data` field which is verified via
 * HMAC-SHA256 against the bot token.  This prevents users from forging
 * their telegram_id or manipulating request payloads via DevTools.
 *
 * Security features:
 * - HMAC-SHA256 validation of initData
 * - Input validation
 * - Rate limiting: 60 game actions per minute
 * - Security audit logging
 *
 * Supported actions:
 *   - buy_generator:  Verify currency balance, deduct cost, add generator.
 *   - upgrade_tap:    Verify currency balance, deduct cost, increment tap_power.
 *   - switch_epoch:   Verify the epoch is unlocked for this user.
 *   - claim_task:     Verify task completion, grant reward.
 *
 * The function reads the current DB row, applies the mutation, and writes it
 * back — all server-side, so the client cannot bypass cost checks.
 */

// ── InitData validation (same as validate-init-data) ──────────────────────

function validateInitData(initData: string): { valid: boolean; userId: number | null; error?: string } {
  if (!BOT_TOKEN) return { valid: false, userId: null, error: "BOT_TOKEN not configured" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, userId: null, error: "Missing hash" };

  const authDateStr = params.get("auth_date");
  if (!authDateStr) return { valid: false, userId: null, error: "Missing auth_date" };
  const authDate = parseInt(authDateStr, 10);
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || age > 86400 || age < 0) return { valid: false, userId: null, error: "Stale initData" };

  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const checkStr = keys.map(k => `${k}=${params.get(k)}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computed = createHmac("sha256", secretKey).update(checkStr).digest("hex");

  if (computed !== hash) return { valid: false, userId: null, error: "HMAC mismatch" };

  let userId: number | null = null;
  const userStr = params.get("user");
  if (userStr) { try { userId = JSON.parse(userStr).id ?? null; } catch { /* */ } }
  return { valid: true, userId };
}

// ── Action handlers ───────────────────────────────────────────────────────

async function buyGenerator(supabase: ReturnType<typeof createClient>, telegramId: number) {
  // Read current state
  const { data: row } = await supabase.from("game_progress")
    .select("currency, owned_generators, unlocked_epochs, epoch_id")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  // Generator lookup — currently we need epoch data; for simplicity we expect
  // the client to send the cost. Server still verifies balance.
  // TODO: Move epoch/generator definitions into a shared config or DB table
  // so the server can independently compute costs.

  // The client sends the expected cost so we can validate it
  // In a future iteration, compute cost server-side from generator defs
  return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
}

async function upgradeTap(supabase: ReturnType<typeof createClient>, telegramId: number) {
  const { data: row } = await supabase.from("game_progress")
    .select("currency, tap_power")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  const tapPower = (row.tap_power as number) ?? 1;
  const rawCost = 25 * Math.pow(1.8, tapPower - 1);
  const cost = Number.isFinite(rawCost) ? Math.floor(rawCost) : Number.MAX_SAFE_INTEGER;
  const currency = (row.currency as number) ?? 0;

  if (currency < cost) return { ok: false, error: "Not enough currency" };

  const { error } = await supabase.from("game_progress")
    .update({ currency: currency - cost, tap_power: tapPower + 1 })
    .eq("telegram_id", telegramId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, new_tap_power: tapPower + 1, cost };
}

async function switchEpoch(supabase: ReturnType<typeof createClient>, telegramId: number, epochId: string) {
  const { data: row } = await supabase.from("game_progress")
    .select("unlocked_epochs, level")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  const unlocked = (row.unlocked_epochs as string[]) ?? [];
  if (!unlocked.includes(epochId)) return { ok: false, error: "Epoch not unlocked" };

  const { error } = await supabase.from("game_progress")
    .update({ epoch_id: epochId })
    .eq("telegram_id", telegramId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, epoch_id: epochId };
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Extract client info for logging
  const { ipAddress, userAgent } = extractClientInfo(req);

  try {
    const body = await req.json();
    
    // Validate request payload
    const validation = validateGameActionRequest(body);
    if (!validation.valid) {
      const errorMsg = validation.errors?.join(", ") ?? "Invalid request";
      await logSecurityEvent({
        telegramId: null,
        eventType: EVENT_TYPES.PAYLOAD_VALIDATION_FAILED,
        eventCategory: "abuse",
        success: false,
        ipAddress,
        userAgent,
        errorMessage: errorMsg,
        details: { errors: validation.errors },
        severity: "warning",
      });
      return json({ error: errorMsg }, 400);
    }

    const { action, init_data, generator_id, epoch_id } = body as {
      action: string;
      init_data?: string;
      generator_id?: string;
      epoch_id?: string;
    };

    if (!init_data) {
      await logSecurityEvent({
        telegramId: null,
        eventType: EVENT_TYPES.INVALID_INIT_DATA,
        eventCategory: "auth",
        success: false,
        ipAddress,
        userAgent,
        errorMessage: "Missing init_data",
        severity: "warning",
      });
      return json({ error: "Missing init_data" }, 400);
    }

    const initDataValidation = validateInitData(init_data);
    if (!initDataValidation.valid) {
      await logSecurityEvent({
        telegramId: null,
        eventType: EVENT_TYPES.INVALID_INIT_DATA,
        eventCategory: "auth",
        success: false,
        ipAddress,
        userAgent,
        errorMessage: initDataValidation.error ?? "HMAC validation failed",
        severity: "warning",
      });
      return json({ error: initDataValidation.error }, 401);
    }
    if (!initDataValidation.userId) {
      return json({ error: "No user_id in initData" }, 401);
    }

    // Rate limiting: 60 game actions per minute
    const rateLimitResult = await checkRateLimit(initDataValidation.userId, "game_action");
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        telegramId: initDataValidation.userId,
        eventType: EVENT_TYPES.RATE_LIMIT_EXCEEDED,
        eventCategory: "abuse",
        success: false,
        ipAddress,
        userAgent,
        details: { action },
        severity: "warning",
      });
      return rateLimitResponse(rateLimitResult);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const telegramId = initDataValidation.userId;

    // Validate epoch_id for switch_epoch
    if (action === "switch_epoch" && epoch_id) {
      const validatedEpoch = validateEpochId(epoch_id);
      if (!validatedEpoch) {
        await logSecurityEvent({
          telegramId,
          eventType: EVENT_TYPES.INVALID_PARAMETERS,
          eventCategory: "abuse",
          success: false,
          ipAddress,
          userAgent,
          errorMessage: "Invalid epoch_id",
          details: { epoch_id },
          severity: "warning",
        });
        return json({ error: "Invalid epoch_id" }, 400);
      }
    }

    switch (action) {
      case "upgrade_tap":
        return json(await upgradeTap(supabase, telegramId));
      case "switch_epoch":
        if (!epoch_id) return json({ error: "Missing epoch_id" }, 400);
        return json(await switchEpoch(supabase, telegramId, epoch_id));
      case "buy_generator":
        if (!generator_id) return json({ error: "Missing generator_id" }, 400);
        return json(await buyGenerator(supabase, telegramId));
      default:
        await logSecurityEvent({
          telegramId,
          eventType: EVENT_TYPES.INVALID_PARAMETERS,
          eventCategory: "abuse",
          success: false,
          ipAddress,
          userAgent,
          errorMessage: `Unknown action: ${action}`,
          details: { action },
          severity: "warning",
        });
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("game-action error:", err);
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
    
    return json({ error: String(err) }, 500);
  }
});
