/**
 * Consume Energy Edge Function
 *
 * SECURITY: Server-authoritative energy consumption for prestige players.
 * Validates initData via HMAC-SHA256 before any operations.
 * Uses atomic RPC calls to prevent race conditions.
 */

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

interface ConsumeRequest {
  initData: string;
  amount?: number;
}

interface EnergyResponse {
  success: boolean;
  error?: string;
  energy?: number;
  hasBoost?: boolean;
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
    const body: ConsumeRequest = await req.json();
    const { initData, amount = 1 } = body;

    // =====================================================
    // SECURITY: Validate initData BEFORE any DB operations
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

    if (!telegram_id) {
      return new Response(JSON.stringify({ error: "Invalid telegram_id" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =====================================================
    // ATOMIC: Consume energy using RPC
    // =====================================================
    const { data, error } = await supabase.rpc("consume_energy", {
      p_telegram_id: telegram_id,
      p_amount: amount,
    });

    if (error) {
      console.error("consume_energy error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      energy: data?.new_energy ?? 0,
      hasBoost: data?.has_boost ?? false,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("consume-energy error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
