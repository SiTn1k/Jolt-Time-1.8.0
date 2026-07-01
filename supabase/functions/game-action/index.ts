import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateInitData } from "../_shared/validate";

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

// ── Action handlers ───────────────────────────────────────────────────────

// ── Server-side generator definitions ───────────────────────────────────────
// These must match src/data/epochs.ts definitions exactly
// Cost formula: baseCost * (costMultiplier ^ currentLevel)

interface GeneratorDef {
  id: string;
  epochId: string;
  baseCost: number;
  baseProduction: number;
  costMultiplier: number;
}

const GENERATORS: GeneratorDef[] = [
  // Epoch 1: Trypillia
  { id: 'clay_pit', epochId: 'trypillia', baseCost: 10, baseProduction: 2, costMultiplier: 1.15 },
  { id: 'pottery', epochId: 'trypillia', baseCost: 50, baseProduction: 8, costMultiplier: 1.15 },
  { id: 'settlement', epochId: 'trypillia', baseCost: 300, baseProduction: 40, costMultiplier: 1.15 },
  { id: 'megastructure', epochId: 'trypillia', baseCost: 3000, baseProduction: 200, costMultiplier: 1.15 },
  { id: 'temple', epochId: 'trypillia', baseCost: 30000, baseProduction: 1000, costMultiplier: 1.15 },
  // Epoch 2: Scythia
  { id: 'pasture', epochId: 'scythia', baseCost: 10, baseProduction: 5, costMultiplier: 1.15 },
  { id: 'gold_mine', epochId: 'scythia', baseCost: 50, baseProduction: 20, costMultiplier: 1.15 },
  { id: 'kurgan', epochId: 'scythia', baseCost: 300, baseProduction: 100, costMultiplier: 1.15 },
  { id: 'fortress', epochId: 'scythia', baseCost: 3000, baseProduction: 500, costMultiplier: 1.15 },
  { id: 'royal_tomb', epochId: 'scythia', baseCost: 30000, baseProduction: 2500, costMultiplier: 1.15 },
  // Epoch 3: Antiquity
  { id: 'port', epochId: 'antiquity', baseCost: 10, baseProduction: 10, costMultiplier: 1.15 },
  { id: 'agora', epochId: 'antiquity', baseCost: 50, baseProduction: 40, costMultiplier: 1.15 },
  { id: 'colony', epochId: 'antiquity', baseCost: 300, baseProduction: 200, costMultiplier: 1.15 },
  { id: 'amphitheater', epochId: 'antiquity', baseCost: 3000, baseProduction: 1000, costMultiplier: 1.15 },
  { id: 'acropolis', epochId: 'antiquity', baseCost: 30000, baseProduction: 5000, costMultiplier: 1.15 },
  // Epoch 4: Kyiv Rus
  { id: 'field', epochId: 'kyiv_rus', baseCost: 10, baseProduction: 15, costMultiplier: 1.15 },
  { id: 'craft_workshop', epochId: 'kyiv_rus', baseCost: 50, baseProduction: 60, costMultiplier: 1.15 },
  { id: 'city', epochId: 'kyiv_rus', baseCost: 300, baseProduction: 300, costMultiplier: 1.15 },
  { id: 'saint_sophia', epochId: 'kyiv_rus', baseCost: 3000, baseProduction: 1500, costMultiplier: 1.15 },
  { id: 'golden_gate', epochId: 'kyiv_rus', baseCost: 30000, baseProduction: 7500, costMultiplier: 1.15 },
  // Epoch 5: Halych-Volhynia
  { id: 'salt_mine', epochId: 'halych_volhynia', baseCost: 10, baseProduction: 20, costMultiplier: 1.15 },
  { id: 'caravan', epochId: 'halych_volhynia', baseCost: 50, baseProduction: 80, costMultiplier: 1.15 },
  { id: 'castle', epochId: 'halych_volhynia', baseCost: 300, baseProduction: 400, costMultiplier: 1.15 },
  { id: 'cathedral', epochId: 'halych_volhynia', baseCost: 3000, baseProduction: 2000, costMultiplier: 1.15 },
  { id: 'principality', epochId: 'halych_volhynia', baseCost: 30000, baseProduction: 10000, costMultiplier: 1.15 },
  // Epoch 6: Polish-Lithuanian
  { id: 'manor', epochId: 'polish_lithuanian', baseCost: 10, baseProduction: 25, costMultiplier: 1.15 },
  { id: 'market', epochId: 'polish_lithuanian', baseCost: 50, baseProduction: 100, costMultiplier: 1.15 },
  { id: 'cossack_sich', epochId: 'polish_lithuanian', baseCost: 300, baseProduction: 500, costMultiplier: 1.15 },
  { id: 'brotherhood', epochId: 'polish_lithuanian', baseCost: 3000, baseProduction: 2500, costMultiplier: 1.15 },
  { id: 'university', epochId: 'polish_lithuanian', baseCost: 30000, baseProduction: 12500, costMultiplier: 1.15 },
  // Epoch 7: Cossack
  { id: 'homestead', epochId: 'cossack', baseCost: 10, baseProduction: 30, costMultiplier: 1.15 },
  { id: 'cannon', epochId: 'cossack', baseCost: 50, baseProduction: 120, costMultiplier: 1.15 },
  { id: 'regiment', epochId: 'cossack', baseCost: 300, baseProduction: 600, costMultiplier: 1.15 },
  { id: 'fortress_sich', epochId: 'cossack', baseCost: 3000, baseProduction: 3000, costMultiplier: 1.15 },
  { id: 'hetman_capital', epochId: 'cossack', baseCost: 30000, baseProduction: 15000, costMultiplier: 1.15 },
  // Epoch 8: Hetmanate
  { id: 'farm', epochId: 'hetmanate', baseCost: 10, baseProduction: 40, costMultiplier: 1.15 },
  { id: 'factory', epochId: 'hetmanate', baseCost: 50, baseProduction: 160, costMultiplier: 1.15 },
  { id: 'gymnasium', epochId: 'hetmanate', baseCost: 300, baseProduction: 800, costMultiplier: 1.15 },
  { id: 'theater', epochId: 'hetmanate', baseCost: 3000, baseProduction: 4000, costMultiplier: 1.15 },
  { id: 'railway', epochId: 'hetmanate', baseCost: 30000, baseProduction: 20000, costMultiplier: 1.15 },
  // Epoch 9: Empire
  { id: 'mine', epochId: 'empire', baseCost: 10, baseProduction: 50, costMultiplier: 1.15 },
  { id: 'mill', epochId: 'empire', baseCost: 50, baseProduction: 200, costMultiplier: 1.15 },
  { id: 'university_city', epochId: 'empire', baseCost: 300, baseProduction: 1000, costMultiplier: 1.15 },
  { id: 'opera', epochId: 'empire', baseCost: 3000, baseProduction: 5000, costMultiplier: 1.15 },
  { id: 'skyscraper', epochId: 'empire', baseCost: 30000, baseProduction: 25000, costMultiplier: 1.15 },
  // Epoch 10: Revolution
  { id: 'printing', epochId: 'revolution', baseCost: 10, baseProduction: 60, costMultiplier: 1.15 },
  { id: 'military_unit', epochId: 'revolution', baseCost: 50, baseProduction: 250, costMultiplier: 1.15 },
  { id: 'rada', epochId: 'revolution', baseCost: 300, baseProduction: 1200, costMultiplier: 1.15 },
  { id: 'embassy', epochId: 'revolution', baseCost: 3000, baseProduction: 6000, costMultiplier: 1.15 },
  { id: 'independence_hall', epochId: 'revolution', baseCost: 30000, baseProduction: 30000, costMultiplier: 1.15 },
  // Epoch 11: Soviet
  { id: 'kolkhoz', epochId: 'soviet', baseCost: 10, baseProduction: 80, costMultiplier: 1.15 },
  { id: 'power_plant', epochId: 'soviet', baseCost: 50, baseProduction: 320, costMultiplier: 1.15 },
  { id: 'research_institute', epochId: 'soviet', baseCost: 300, baseProduction: 1600, costMultiplier: 1.15 },
  { id: 'space_factory', epochId: 'soviet', baseCost: 3000, baseProduction: 8000, costMultiplier: 1.15 },
  { id: 'city_million', epochId: 'soviet', baseCost: 30000, baseProduction: 40000, costMultiplier: 1.15 },
  // Epoch 12: Independence
  { id: 'startup', epochId: 'independence', baseCost: 10, baseProduction: 100, costMultiplier: 1.15 },
  { id: 'logistics', epochId: 'independence', baseCost: 50, baseProduction: 400, costMultiplier: 1.15 },
  { id: 'tech_park', epochId: 'independence', baseCost: 300, baseProduction: 2000, costMultiplier: 1.15 },
  { id: 'eu_integration', epochId: 'independence', baseCost: 3000, baseProduction: 10000, costMultiplier: 1.15 },
  { id: 'new_ukraine', epochId: 'independence', baseCost: 30000, baseProduction: 50000, costMultiplier: 1.15 },
];

async function buyGenerator(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  generatorId: string,
  epochId: string
) {
  // Find generator definition
  const generator = GENERATORS.find(g => g.id === generatorId && g.epochId === epochId);
  if (!generator) {
    return { ok: false, error: "Invalid generator_id or epoch_id" };
  }

  // Read current state
  const { data: row } = await supabase.from("game_progress")
    .select("currency, owned_generators, unlocked_epochs, epoch_id")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  // Verify epoch is unlocked
  const unlocked = (row.unlocked_epochs as string[]) ?? [];
  if (!unlocked.includes(epochId)) {
    return { ok: false, error: "Epoch not unlocked" };
  }

  // Get current level of this generator
  const ownedGenerators = (row.owned_generators as Array<{ generatorId: string; level: number }>) ?? [];
  const currentOwned = ownedGenerators.find(og => og.generatorId === generatorId);
  const currentLevel = currentOwned?.level || 0;

  // Calculate cost: baseCost * (costMultiplier ^ currentLevel)
  const cost = Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, currentLevel));
  const currency = (row.currency as number) ?? 0;

  if (currency < cost) {
    return { ok: false, error: "Not enough currency" };
  }

  // Update owned generators
  const newOwned = currentOwned
    ? ownedGenerators.map(og => og.generatorId === generatorId ? { ...og, level: og.level + 1 } : og)
    : [...ownedGenerators, { generatorId, level: 1 }];

  // Deduct currency and save new generators
  const { error } = await supabase.from("game_progress")
    .update({
      currency: currency - cost,
      owned_generators: newOwned,
    })
    .eq("telegram_id", telegramId);

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    generator_id: generatorId,
    level: currentLevel + 1,
    cost,
    new_currency: currency - cost,
  };
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
        if (!epoch_id) return json({ error: "Missing epoch_id" }, 400);
        return json(await buyGenerator(supabase, telegramId, generator_id, epoch_id));
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("game-action error:", err);
    return json({ error: String(err) }, 500);
  }
});
