/**
 * Export Progress Edge Function
 *
 * Allows users to export their game progress as a JSON backup file.
 * Requires HMAC-SHA256 validation of initData.
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

interface ExportRequest {
  initData: string;
}

// =====================================================
// HMAC-SHA256 initData validation
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

  const authDateStr = params.get("auth_date");
  if (!authDateStr) {
    return { success: false, error: "Missing auth_date" };
  }
  const authDate = parseInt(authDateStr, 10);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || ageSeconds > 86400 || ageSeconds < 0) {
    return { success: false, error: "initData expired or invalid" };
  }

  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) {
    return { success: false, error: "HMAC validation failed" };
  }

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
    const body: ExportRequest = await req.json();
    const { initData } = body;

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch all user data in parallel
    const [
      profileResult,
      progressResult,
      expeditionResult,
      boostersResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("telegram_id", telegram_id).single(),
      supabase.from("game_progress").select("*").eq("telegram_id", telegram_id).single(),
      supabase.from("expedition_state").select("*").eq("telegram_id", telegram_id).maybeSingle(),
      supabase.from("active_boosters").select("*").eq("telegram_id", telegram_id).maybeSingle(),
    ]);

    const exportData = {
      version: "1.8.0",
      exported_at: new Date().toISOString(),
      game_id: "ukraine-tap",
      telegram_id,
      profile: profileResult.data || null,
      game_progress: progressResult.data || null,
      expedition: expeditionResult.data || null,
      active_boosters: boostersResult.data || null,
      export_hash: createHmac("sha256", telegram_id.toString()).update(
        JSON.stringify({
          progress: progressResult.data,
          expedition: expeditionResult.data,
        })
      ).digest("hex").substring(0, 16),
    };

    console.log(`Export requested: user=${telegram_id}`);

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="jolt-time-backup-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    console.error("Export progress error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
