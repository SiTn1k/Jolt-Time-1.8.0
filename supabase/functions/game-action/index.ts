import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHmac } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

// Server-side generator definitions (must match epochs.ts)
const GENERATOR_DEFS: Record<string, { baseCost: number; costMultiplier: number; baseProduction: number }> = {
  // Trypillia
  clay_pit:      { baseCost: 10,    costMultiplier: 1.15, baseProduction: 2 },
  pottery:       { baseCost: 50,    costMultiplier: 1.15, baseProduction: 8 },
  settlement:    { baseCost: 300,   costMultiplier: 1.15, baseProduction: 40 },
  megastructure: { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 200 },
  temple:        { baseCost: 30000, costMultiplier: 1.15, baseProduction: 1000 },
  // Scythia
  pasture:       { baseCost: 10,    costMultiplier: 1.15, baseProduction: 5 },
  gold_mine:     { baseCost: 50,    costMultiplier: 1.15, baseProduction: 20 },
  kurgan:        { baseCost: 300,   costMultiplier: 1.15, baseProduction: 100 },
  fortress:      { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 500 },
  royal_tomb:    { baseCost: 30000, costMultiplier: 1.15, baseProduction: 2500 },
  // Antiquity
  port:          { baseCost: 10,    costMultiplier: 1.15, baseProduction: 10 },
  agora:         { baseCost: 50,    costMultiplier: 1.15, baseProduction: 40 },
  colony:        { baseCost: 300,   costMultiplier: 1.15, baseProduction: 200 },
  amphitheater:  { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 1000 },
  acropolis:     { baseCost: 30000, costMultiplier: 1.15, baseProduction: 5000 },
  // Kyiv Rus
  field:         { baseCost: 10,    costMultiplier: 1.15, baseProduction: 15 },
  craft_workshop:{ baseCost: 50,    costMultiplier: 1.15, baseProduction: 60 },
  city:          { baseCost: 300,   costMultiplier: 1.15, baseProduction: 300 },
  saint_sophia:  { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 1500 },
  golden_gate:   { baseCost: 30000, costMultiplier: 1.15, baseProduction: 7500 },
  // Halych-Volhynia
  salt_mine:     { baseCost: 10,    costMultiplier: 1.15, baseProduction: 20 },
  caravan:       { baseCost: 50,    costMultiplier: 1.15, baseProduction: 80 },
  castle:        { baseCost: 300,   costMultiplier: 1.15, baseProduction: 400 },
  cathedral:     { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 2000 },
  principality:  { baseCost: 30000, costMultiplier: 1.15, baseProduction: 10000 },
  // Polish-Lithuanian
  manor:         { baseCost: 10,    costMultiplier: 1.15, baseProduction: 25 },
  market:        { baseCost: 50,    costMultiplier: 1.15, baseProduction: 100 },
  cossack_sich:  { baseCost: 300,   costMultiplier: 1.15, baseProduction: 500 },
  brotherhood:   { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 2500 },
  university:    { baseCost: 30000, costMultiplier: 1.15, baseProduction: 12500 },
  // Cossack
  homestead:     { baseCost: 10,    costMultiplier: 1.15, baseProduction: 30 },
  cannon:        { baseCost: 50,    costMultiplier: 1.15, baseProduction: 120 },
  regiment:      { baseCost: 300,   costMultiplier: 1.15, baseProduction: 600 },
  fortress_sich: { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 3000 },
  hetman_capital:{ baseCost: 30000, costMultiplier: 1.15, baseProduction: 15000 },
  // Hetmanate
  farm:          { baseCost: 10,    costMultiplier: 1.15, baseProduction: 40 },
  factory:       { baseCost: 50,    costMultiplier: 1.15, baseProduction: 160 },
  gymnasium:     { baseCost: 300,   costMultiplier: 1.15, baseProduction: 800 },
  theater:       { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 4000 },
  railway:       { baseCost: 30000, costMultiplier: 1.15, baseProduction: 20000 },
  // Empire
  estate:        { baseCost: 10,    costMultiplier: 1.15, baseProduction: 50 },
  enterprise:    { baseCost: 50,    costMultiplier: 1.15, baseProduction: 200 },
  bank:          { baseCost: 300,   costMultiplier: 1.15, baseProduction: 1000 },
  ministry:      { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 5000 },
  imperial_palace:{ baseCost: 30000, costMultiplier: 1.15, baseProduction: 25000 },
  // Revolution
  print_shop:    { baseCost: 10,    costMultiplier: 1.15, baseProduction: 60 },
  warehouse:     { baseCost: 50,    costMultiplier: 1.15, baseProduction: 240 },
  militia:       { baseCost: 300,   costMultiplier: 1.15, baseProduction: 1200 },
  radio_station: { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 6000 },
  parliament:    { baseCost: 30000, costMultiplier: 1.15, baseProduction: 30000 },
  // Soviet
  collective:    { baseCost: 10,    costMultiplier: 1.15, baseProduction: 80 },
  soviet_farm:  { baseCost: 50,    costMultiplier: 1.15, baseProduction: 320 },
  industrial_complex:{ baseCost: 300, costMultiplier: 1.15, baseProduction: 1600 },
  khrushchevka: { baseCost: 3000,  costMultiplier: 1.15, baseProduction: 8000 },
  kremlin:      { baseCost: 30000, costMultiplier: 1.15, baseProduction: 40000 },
  // Independence
  startup:       { baseCost: 10,    costMultiplier: 1.15, baseProduction: 100 },
  mall:          { baseCost: 50,    costMultiplier: 1.15, baseProduction: 400 },
  tech_park:     { baseCost: 300,   costMultiplier: 1.15, baseProduction: 2000 },
  stock_exchange:{ baseCost: 3000,  costMultiplier: 1.15, baseProduction: 10000 },
  independence_monument:{ baseCost: 30000, costMultiplier: 1.15, baseProduction: 50000 },
};

function getGeneratorCost(generatorId: string, currentLevel: number): number {
  const def = GENERATOR_DEFS[generatorId];
  if (!def) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costMultiplier, currentLevel));
}

async function buyGenerator(supabase: ReturnType<typeof createClient>, telegramId: number, generatorId: string) {
  // Validate generator exists
  const def = GENERATOR_DEFS[generatorId];
  if (!def) return { ok: false, error: "Unknown generator" };

  // Read current state
  const { data: row } = await supabase.from("game_progress")
    .select("currency, owned_generators")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  const ownedGenerators = (row.owned_generators as Array<{ generatorId: string; level: number }>) || [];
  const existing = ownedGenerators.find(og => og.generatorId === generatorId);
  const currentLevel = existing?.level || 0;
  const cost = getGeneratorCost(generatorId, currentLevel);

  const currency = (row.currency as number) ?? 0;
  if (currency < cost) return { ok: false, error: "Not enough currency" };

  // Update owned generators
  const newOwned = existing
    ? ownedGenerators.map(og => og.generatorId === generatorId ? { ...og, level: og.level + 1 } : og)
    : [...ownedGenerators, { generatorId, level: 1 }];

  const { error } = await supabase.from("game_progress")
    .update({ currency: currency - cost, owned_generators: newOwned })
    .eq("telegram_id", telegramId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, new_level: currentLevel + 1, cost };
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

  try {
    const body = await req.json();
    const { action, init_data, generator_id, epoch_id } = body as {
      action: string;
      init_data?: string;
      generator_id?: string;
      epoch_id?: string;
    };

    if (!init_data) return json({ error: "Missing init_data" }, 400);

    const validation = validateInitData(init_data);
    if (!validation.valid) return json({ error: validation.error }, 401);
    if (!validation.userId) return json({ error: "No user_id in initData" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const telegramId = validation.userId;

    switch (action) {
      case "upgrade_tap":
        return json(await upgradeTap(supabase, telegramId));
      case "switch_epoch":
        if (!epoch_id) return json({ error: "Missing epoch_id" }, 400);
        return json(await switchEpoch(supabase, telegramId, epoch_id));
      case "buy_generator":
        if (!generator_id) return json({ error: "Missing generator_id" }, 400);
        return json(await buyGenerator(supabase, telegramId, generator_id));
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("game-action error:", err);
    return json({ error: String(err) }, 500);
  }
});
