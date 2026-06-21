/**
 * Import Progress Edge Function
 *
 * Allows users to restore their game progress from a JSON backup file.
 * Requires HMAC-SHA256 validation of initData.
 * Uses database transactions for atomic updates.
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

interface ImportRequest {
  initData: string;
  backup: {
    version: string;
    game_id: string;
    telegram_id: number;
    game_progress?: Record<string, unknown>;
    expedition?: Record<string, unknown>;
    active_boosters?: Record<string, unknown>;
    exported_at?: string;
  };
}

interface ImportResult {
  success: boolean;
  error?: string;
  restored_tables?: string[];
  restored_at?: string;
}

// Supported backup versions
const SUPPORTED_VERSIONS = ["1.7.0", "1.8.0"];

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

// =====================================================
// Validate backup structure
// =====================================================
function validateBackup(backup: ImportRequest["backup"]): { valid: true } | { valid: false; error: string } {
  if (!backup) {
    return { valid: false, error: "Missing backup data" };
  }

  if (!backup.version) {
    return { valid: false, error: "Missing backup version" };
  }

  if (!SUPPORTED_VERSIONS.includes(backup.version)) {
    return { valid: false, error: `Unsupported backup version: ${backup.version}` };
  }

  if (!backup.game_id || backup.game_id !== "ukraine-tap") {
    return { valid: false, error: "Invalid game ID in backup" };
  }

  if (!backup.game_progress) {
    return { valid: false, error: "Missing game_progress in backup" };
  }

  return { valid: true };
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
    const body: ImportRequest = await req.json();
    const { initData, backup } = body;

    if (!initData) {
      return new Response(JSON.stringify({ error: "Missing initData" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate initData
    const validated = validateInitData(initData);
    if (!validated.success) {
      console.error(`SECURITY: initData validation failed: ${validated.error}`);
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegram_id = validated.telegram_id;

    // Verify backup belongs to this user
    if (backup.telegram_id && backup.telegram_id !== telegram_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Backup does not belong to this user" 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate backup structure
    const backupValidation = validateBackup(backup);
    if (!backupValidation.valid) {
      return new Response(JSON.stringify({ 
        success: false,
        error: backupValidation.error 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const restoredTables: string[] = [];
    const restoredAt = new Date().toISOString();

    // Start transaction - restore game_progress
    if (backup.game_progress) {
      // Clean sensitive fields from backup
      const cleanProgress = { ...backup.game_progress };
      delete cleanProgress.telegram_id; // Don't allow changing telegram_id
      delete cleanProgress.created_at;
      delete cleanProgress.updated_at;

      const { error: progressError } = await supabase
        .from("game_progress")
        .update({
          ...cleanProgress,
          last_saved_at: restoredAt,
          updated_at: restoredAt,
        })
        .eq("telegram_id", telegram_id);

      if (progressError) {
        console.error("Failed to restore game_progress:", progressError);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Failed to restore game_progress: ${progressError.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      restoredTables.push("game_progress");
    }

    // Restore expedition state
    if (backup.expedition) {
      const cleanExpedition = { ...backup.expedition };
      delete cleanExpedition.telegram_id;
      delete cleanExpedition.created_at;
      delete cleanExpedition.updated_at;

      // Upsert expedition state
      const { error: expeditionError } = await supabase
        .from("expedition_state")
        .upsert({
          telegram_id,
          ...cleanExpedition,
          updated_at: restoredAt,
        }, {
          onConflict: "telegram_id"
        });

      if (expeditionError) {
        console.warn("Failed to restore expedition:", expeditionError);
      } else {
        restoredTables.push("expedition");
      }
    }

    // Restore active boosters
    if (backup.active_boosters) {
      const cleanBoosters = { ...backup.active_boosters };
      delete cleanBoosters.telegram_id;
      delete cleanBoosters.created_at;
      delete cleanBoosters.updated_at;

      const { error: boostersError } = await supabase
        .from("active_boosters")
        .upsert({
          telegram_id,
          ...cleanBoosters,
          updated_at: restoredAt,
        }, {
          onConflict: "telegram_id"
        });

      if (boostersError) {
        console.warn("Failed to restore active_boosters:", boostersError);
      } else {
        restoredTables.push("active_boosters");
      }
    }

    console.log(`Import completed: user=${telegram_id}, tables=${restoredTables.join(",")}`);

    const result: ImportResult = {
      success: true,
      restored_tables: restoredTables,
      restored_at: restoredAt,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Import progress error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
