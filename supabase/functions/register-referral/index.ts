/**
 * Register Referral Edge Function
 *
 * SECURITY: Server-side referral registration with full validation:
 * - HMAC-SHA256 initData validation
 * - Referral ID format validation
 * - Self-referral prevention
 * - Referrer existence verification
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";
import { validateReferrerId, verifyReferrerExists } from "../_shared/referralValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

interface RegisterReferralRequest {
  initData: string;
  referrer_id?: number | string;
}

interface ReferralResponse {
  success: boolean;
  error?: string;
  bonus?: number;
  referrer_id?: number;
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: RegisterReferralRequest = await req.json();
    const { initData, referrer_id } = body;

    // =====================================================
    // SECURITY: Validate initData BEFORE any operations
    // =====================================================
    if (!initData) {
      return new Response(JSON.stringify({ error: "Missing initData" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validated = validateInitData(initData);
    if (!validated.success) {
      console.error(`SECURITY: initData validation failed: ${validated.error}`);
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegram_id = validated.telegram_id;

    // If no referrer, just return success (no bonus)
    if (!referrer_id) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =====================================================
    // SECURITY: Validate referrer_id
    // =====================================================
    const validation = validateReferrerId(referrer_id);
    if (!validation.valid) {
      console.warn(`Invalid referrer_id: ${validation.error}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: validation.error || "Invalid referrer" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validatedReferrerId = validation.referrerId!;

    // =====================================================
    // SECURITY: Check self-referral
    // =====================================================
    if (validatedReferrerId === telegram_id) {
      console.warn(`Self-referral attempt: telegram_id=${telegram_id}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Cannot refer yourself" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =====================================================
    // SECURITY: Verify referrer exists
    // =====================================================
    const referrerExists = await verifyReferrerExists(supabase, validatedReferrerId);
    if (!referrerExists) {
      console.warn(`Referrer not found: ${validatedReferrerId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Referrer not found" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =====================================================
    // Apply referral bonus
    // =====================================================
    const REFERRER_BONUS = 100;
    const NEW_USER_BONUS = 50;

    // Update referrer's currency and referrals_count
    const { error: updateError } = await supabase.rpc("increment_referral", {
      p_telegram_id: validatedReferrerId,
      p_amount: REFERRER_BONUS
    });

    if (updateError) {
      console.error("Failed to apply referral bonus:", updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to process referral" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update new user's referrer_id
    await supabase
      .from('game_progress')
      .update({ 
        referrer_id: validatedReferrerId,
        currency: 20 + NEW_USER_BONUS
      })
      .eq('telegram_id', telegram_id);

    console.log(`Referral registered: user=${telegram_id}, referrer=${validatedReferrerId}`);

    return new Response(JSON.stringify({
      success: true,
      bonus: NEW_USER_BONUS,
      referrer_id: validatedReferrerId
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("register-referral error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
