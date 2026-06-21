/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TELEGRAM INITDATA VALIDATION EDGE FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SECURITY: Validates Telegram WebApp initData using HMAC-SHA256.
 *
 * Algorithm (per Telegram docs):
 *   1. Parse initData as URLSearchParams
 *   2. Sort all key-value pairs alphabetically by key
 *   3. Join with "\n" as "key=value" lines → data_check_string
 *   4. Compute HMAC-SHA256(key=SHA256(bot_token), msg=data_check_string)
 *   5. Compare hex digest to the `hash` parameter
 *
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-a-web-app
 *
 * Usage:
 *   POST /functions/v1/validate-telegram
 *   Body: { "initData": "query_id=...&user=...&auth_date=...&hash=..." }
 *
 * Response:
 *   Success: { success: true, telegram_id: number, user: {...} }
 *   Error:   { success: false, error: string }
 * ═══════════════════════════════════════════════════════════════════════════
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHmac, createHash } from "node:crypto";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_AUTH_DATE_AGE_SECONDS = 86400; // 24 hours

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface ValidationRequest {
  initData: string;
}

interface ValidationSuccess {
  success: true;
  telegram_id: number;
  user: TelegramUser;
  auth_date: number;
}

interface ValidationError {
  success: false;
  error: string;
}

type ValidationResult = ValidationSuccess | ValidationError;

// ═══════════════════════════════════════════════════════════════════════════
// CORE VALIDATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse user JSON string from initData
 */
function parseUser(userStr: string | null): TelegramUser | null {
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    // Validate required fields
    if (typeof user.id !== "number" || user.id <= 0) {
      return null;
    }
    return user as TelegramUser;
  } catch {
    return null;
  }
}

/**
 * Validate Telegram initData using HMAC-SHA256
 *
 * According to Telegram docs, the validation algorithm is:
 * 1. Sort all received fields alphabetically by their key
 * 2. Join them with \n as key=value pairs (format: key=value)
 * 3. Create a secret key by computing HMAC-SHA256 of "WebAppData" with bot token
 * 4. Compute HMAC-SHA256 of the sorted string using the secret key
 * 5. Compare with the hash parameter (must be case-insensitive match)
 */
function validateInitData(initData: string): ValidationResult {
  // Step 1: Check BOT_TOKEN configuration
  if (!BOT_TOKEN) {
    console.error("[validate-telegram] FATAL: TELEGRAM_BOT_TOKEN not configured!");
    return { success: false, error: "Server misconfiguration: BOT_TOKEN not set" };
  }

  // Step 2: Parse initData
  const params = new URLSearchParams(initData);

  // Step 3: Extract hash from parameters
  const hash = params.get("hash");
  if (!hash) {
    return { success: false, error: "Missing required parameter: hash" };
  }

  // Step 4: Validate auth_date (must exist and not be too old)
  const authDateStr = params.get("auth_date");
  if (!authDateStr) {
    return { success: false, error: "Missing required parameter: auth_date" };
  }

  const authDate = parseInt(authDateStr, 10);
  if (isNaN(authDate) || authDate <= 0) {
    return { success: false, error: "Invalid auth_date format" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageSeconds = nowSeconds - authDate;

  if (ageSeconds < 0) {
    return { success: false, error: "auth_date is in the future" };
  }

  if (ageSeconds > MAX_AUTH_DATE_AGE_SECONDS) {
    return {
      success: false,
      error: `initData expired. auth_date is ${Math.floor(ageSeconds / 3600)} hours old (max 24 hours)`,
    };
  }

  // Step 5: Build data_check_string
  // Sort all parameters alphabetically by key, EXCLUDING the "hash" field
  const keys = [...params.keys()].filter((key) => key !== "hash").sort();
  const dataCheckString = keys.map((key) => `${key}=${params.get(key)}`).join("\n");

  // Step 6: Compute secret key = HMAC-SHA256("WebAppData", bot_token)
  const secretKey = createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  // Step 7: Compute HMAC-SHA256 of data_check_string using secret key
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Step 8: Compare hashes (case-insensitive per Telegram docs)
  if (computedHash.toLowerCase() !== hash.toLowerCase()) {
    console.error(
      `[validate-telegram] HMAC mismatch! computed=${computedHash.substring(0, 16)}..., received=${hash.substring(0, 16)}...`
    );
    return { success: false, error: "HMAC validation failed: data may be tampered" };
  }

  // Step 9: Extract and validate user
  const user = parseUser(params.get("user"));
  if (!user) {
    return { success: false, error: "Missing or invalid user in initData" };
  }

  // Success!
  return {
    success: true,
    telegram_id: user.id,
    user,
    auth_date: authDate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════

function jsonResponse(data: ValidationResult, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: `Method ${req.method} not allowed. Use POST.` },
      405
    );
  }

  try {
    // Parse request body
    let body: ValidationRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { success: false, error: "Invalid JSON body" },
        400
      );
    }

    // Validate request structure
    if (!body.initData || typeof body.initData !== "string") {
      return jsonResponse(
        { success: false, error: "Missing or invalid 'initData' field" },
        400
      );
    }

    // Validate initData length (reasonable limit)
    if (body.initData.length > 65536) {
      return jsonResponse(
        { success: false, error: "initData too long (max 64KB)" },
        400
      );
    }

    // Perform validation
    const result = validateInitData(body.initData);

    if (!result.success) {
      console.log(`[validate-telegram] Validation failed: ${result.error}`);
      return jsonResponse(result, 401);
    }

    // Log successful validation (for monitoring)
    console.log(`[validate-telegram] Success: telegram_id=${result.telegram_id}`);

    return jsonResponse({
      success: true,
      telegram_id: result.telegram_id,
      user: result.user,
      auth_date: result.auth_date,
    });

  } catch (err) {
    console.error("[validate-telegram] Unexpected error:", err);
    return jsonResponse(
      { success: false, error: "Internal server error" },
      500
    );
  }
});
