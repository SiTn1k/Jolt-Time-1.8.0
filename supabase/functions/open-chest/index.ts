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
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 chest opens per minute

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

/**
 * Open Chest Edge Function
 *
 * Server-authoritative chest/skychest opening.
 * 
 * SECURITY:
 * - Validates initData via HMAC-SHA256
 * - Rate limited: 10 requests/minute per user
 * - Uses SERVICE_ROLE key for database operations
 */

interface OpenChestRequest {
  initData: string; // Required for HMAC validation
  epoch_id: string;
  chest_type?: "skychest" | "daily";
  epoch_index?: number;
}

interface ArtifactDrop {
  id: string;
  epoch: string;
  rarity: string;
  parts_granted: number;
  icon: string;
  name: { ua: string; en: string };
}

interface OpenChestResponse {
  success: boolean;
  error?: string;
  rewards?: ArtifactDrop[];
  chest_type?: string;
}

// Artifact definitions (must match epochs.ts)
const ARTIFACTS: Array<{
  id: string;
  epoch: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "secret";
  parts: number;
  bonus: { type: string; value: number };
  icon: string;
  name: { ua: string; en: string };
  requiredPrestige?: number;
}> = [
  // Trypillia
  { id: "trypillia_bull", epoch: "trypillia", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.05 }, icon: "🐂", name: { ua: "Бик-бикален", en: "Bull Idol" } },
  { id: "trypillia_pot", epoch: "trypillia", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.10 }, icon: "🏺", name: { ua: "Трипільська піала", en: "Trypillian Bowl" } },
  { id: "trypillia_goddess", epoch: "trypillia", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.20 }, icon: "👸", name: { ua: "Богиня-Мати", en: "Mother Goddess" } },
  // Scythia
  { id: "scythia_arrow", epoch: "scythia", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.05 }, icon: "🏹", name: { ua: "Скіфська стріла", en: "Scythian Arrow" } },
  { id: "scythia_rhyton", epoch: "scythia", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "🎺", name: { ua: "Золотий ритон", en: "Golden Rhyton" } },
  { id: "scythia_gold", epoch: "scythia", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Золота пектораль", en: "Golden Pectoral" } },
  // Antiquity
  { id: "antiquity_amphora", epoch: "antiquity", rarity: "common", parts: 10, bonus: { type: "currency_multiplier", value: 1.05 }, icon: "🏺", name: { ua: "Грецька амфора", en: "Greek Amphora" } },
  { id: "antiquity_coin", epoch: "antiquity", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.10 }, icon: "🪙", name: { ua: "Ольвійська монета", en: "Olbian Coin" } },
  { id: "antiquity_statue", epoch: "antiquity", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "🏛", name: { ua: "Статуя Аполлона", en: "Apollo Statue" } },
  // Kyiv Rus
  { id: "kyiv_icon", epoch: "kyiv_rus", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.06 }, icon: "🖼", name: { ua: "Ікона", en: "Icon" } },
  { id: "kyiv_reliquary", epoch: "kyiv_rus", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.12 }, icon: "☦️", name: { ua: "Мощі Святих", en: "Saints Relics" } },
  { id: "kyiv_gospels", epoch: "kyiv_rus", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "📖", name: { ua: "Остромирове Євангеліє", en: "Ostromir Gospels" } },
  // Halych-Volhynia
  { id: "halych_seal", epoch: "halych_volhynia", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.10 }, icon: "🔖", name: { ua: "Печать князя", en: "Prince's Seal" } },
  { id: "halych_crown", epoch: "halych_volhynia", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Корона Данила", en: "Danylo's Crown" } },
  // Polish-Lithuanian
  { id: "polish_sword", epoch: "polish_lithuanian", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "⚔️", name: { ua: "Рицарський меч", en: "Knight Sword" } },
  { id: "polish_crown", epoch: "polish_lithuanian", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.18 }, icon: "👑", name: { ua: "Корона короля", en: "King's Crown" } },
  // Cossack
  { id: "cossack_pistol", epoch: "cossack", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.06 }, icon: "🔫", name: { ua: "Козацький пістоль", en: "Cossack Pistol" } },
  { id: "cossack_flag", epoch: "cossack", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.12 }, icon: "🚩", name: { ua: "Козацький прапор", en: "Cossack Banner" } },
  { id: "cossack_mace", epoch: "cossack", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "🏏", name: { ua: "Булава Богдана", en: "Bohdan's Mace" } },
  // Hetmanate
  { id: "hetman_seal", epoch: "hetmanate", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.12 }, icon: "🔏", name: { ua: "Печать гетьмана", en: "Hetman's Seal" } },
  { id: "hetman_charter", epoch: "hetmanate", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "📜", name: { ua: "Гетьманська грамота", en: "Hetman Charter" } },
  // Empire
  { id: "empire_medal", epoch: "empire", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "🏅", name: { ua: "Імперська медаль", en: "Imperial Medal" } },
  { id: "empire_factory", epoch: "empire", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.12 }, icon: "🏭", name: { ua: "Заводський знак", en: "Factory Badge" } },
  // Revolution
  { id: "revolution_poster", epoch: "revolution", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.08 }, icon: "📰", name: { ua: "Агітаційний плакат", en: "Propaganda Poster" } },
  { id: "revolution_flag", epoch: "revolution", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "🇺🇦", name: { ua: "Прапор УНР", en: "UNR Flag" } },
  // Soviet
  { id: "soviet_badge", epoch: "soviet", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "⭐", name: { ua: "Радянський значок", en: "Soviet Badge" } },
  { id: "soviet_anthem", epoch: "soviet", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.10 }, icon: "🎵", name: { ua: "Ноти гімну УРСР", en: "USSR Anthem Notes" } },
  { id: "soviet_rocket", epoch: "soviet", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.15 }, icon: "🚀", name: { ua: "Модель ракети", en: "Rocket Model" } },
  // Independence
  { id: "ind_flag", epoch: "independence", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.08 }, icon: "🇺🇦", name: { ua: "Національний прапор", en: "National Flag" } },
  { id: "ind_passport", epoch: "independence", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.12 }, icon: "🎫", name: { ua: "Перший паспорт", en: "First Passport" } },
  { id: "ind_constitution", epoch: "independence", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.20 }, icon: "📜", name: { ua: "Конституція", en: "Constitution" } },
  // Secret artifacts (Prestige 1+)
  { id: "secret_trypillia_altar", epoch: "trypillia", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.15 }, icon: "🔥", name: { ua: "Трипільський жертовник", en: "Trypillian Altar" }, requiredPrestige: 1 },
  { id: "secret_scythia_treasure", epoch: "scythia", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.15 }, icon: "💎", name: { ua: "Скарб Скіфії", en: "Scythian Treasure" }, requiredPrestige: 1 },
  { id: "secret_antiquity_oracle", epoch: "antiquity", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.15 }, icon: "🔮", name: { ua: "Оракул Аполлона", en: "Apollo Oracle" }, requiredPrestige: 1 },
  { id: "secret_kyiv_relic", epoch: "kyiv_rus", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.16 }, icon: "✝️", name: { ua: "Мощі Володимира", en: "Vladimir Relics" }, requiredPrestige: 1 },
  { id: "secret_halych_throne", epoch: "halych_volhynia", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.17 }, icon: "🪑", name: { ua: "Трон Данила", en: "Danylo's Throne" }, requiredPrestige: 1 },
  { id: "secret_cossack_hetman_mace", epoch: "cossack", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.18 }, icon: "⚔️", name: { ua: "Булава Хмельницького", en: "Khmelnytsky's Mace" }, requiredPrestige: 1 },
  { id: "secret_hetman_oriflamma", epoch: "hetmanate", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.17 }, icon: "🚩", name: { ua: "Оріфлама Гетьманщини", en: "Hetmanate Oriflamme" }, requiredPrestige: 1 },
  { id: "secret_empire_factory_secret", epoch: "empire", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.16 }, icon: "⚙️", name: { ua: "Секрет заводу", en: "Factory Secret" }, requiredPrestige: 1 },
  { id: "secret_revolution_manifest", epoch: "revolution", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.18 }, icon: "📜", name: { ua: "Маніфест УНР", en: "UNR Manifest" }, requiredPrestige: 1 },
  { id: "secret_soviet_space_secret", epoch: "soviet", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.18 }, icon: "🌌", name: { ua: "Таємниця космосу", en: "Space Secret" }, requiredPrestige: 1 },
  { id: "secret_independence_charter", epoch: "independence", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "🇺🇦", name: { ua: "Акт Незалежності", en: "Independence Act" }, requiredPrestige: 1 },
  // Prestige 2+ secrets
  { id: "secret_golden_fleece", epoch: "scythia", rarity: "secret", parts: 20, bonus: { type: "xp_multiplier", value: 1.19 }, icon: "🌟", name: { ua: "Золоте руно", en: "Golden Fleece" }, requiredPrestige: 2 },
  { id: "secret_kyiv_sophia_secret", epoch: "kyiv_rus", rarity: "secret", parts: 20, bonus: { type: "passive_boost", value: 1.19 }, icon: "⛪", name: { ua: "Таємниця Софії", en: "Sophia Secret" }, requiredPrestige: 2 },
  { id: "secret_cossack_constitution", epoch: "cossack", rarity: "secret", parts: 20, bonus: { type: "currency_multiplier", value: 1.19 }, icon: "📖", name: { ua: "Конституція Пилипа", en: "Pylyp's Constitution" }, requiredPrestige: 2 },
  // Prestige 3+ secrets
  { id: "secret_modern_constitution_1996", epoch: "independence", rarity: "secret", parts: 20, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "⚖️", name: { ua: "Конституція 1996", en: "1996 Constitution" }, requiredPrestige: 3 },
];

function jsonResponse(data: OpenChestResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =====================================================
// ARTIFACT DROP RATE CONSTANTS (Balanced for game economy)
// =====================================================
const DROP_RATES = {
  // Base chances (before bonuses)
  BASE_SECRET: 1,      // 1%
  BASE_LEGENDARY: 4,   // 4%
  BASE_EPIC: 10,       // 10%
  BASE_RARE: 25,       // 25%
  BASE_COMMON: 60,     // 60% (implicit, remaining)
  
  // Maximum caps
  MAX_SECRET: 5,        // 5% max
  MAX_LEGENDARY: 10,    // 10% max
  MAX_EPIC: 20,        // 20% max
  MAX_RARE: 30,        // 30% max
  
  // Bonus per research level
  SECRET_BONUS_PER_LEVEL: 0.5,  // +0.5% per rare_artifact_chance level
  LEGENDARY_BONUS_PER_LEVEL: 0.3, // +0.3% per rare_artifact_chance level
  EPIC_BONUS_PER_LEVEL: 0.2,    // +0.2% per rare_artifact_chance level
};

/**
 * Calculate capped drop chances based on research level
 * Returns: { secret, legendary, epic, rare, common } - all as percentages (0-100)
 */
function calculateDropChances(rareArtifactChanceBonus: number): {
  secret: number;
  legendary: number;
  epic: number;
  rare: number;
  common: number;
} {
  // Calculate each rarity chance with bonuses
  let secretChance = DROP_RATES.BASE_SECRET + (rareArtifactChanceBonus * DROP_RATES.SECRET_BONUS_PER_LEVEL);
  let legendaryChance = DROP_RATES.BASE_LEGENDARY + (rareArtifactChanceBonus * DROP_RATES.LEGENDARY_BONUS_PER_LEVEL);
  let epicChance = DROP_RATES.BASE_EPIC + (rareArtifactChanceBonus * DROP_RATES.EPIC_BONUS_PER_LEVEL);
  let rareChance = DROP_RATES.BASE_RARE;
  let commonChance = DROP_RATES.BASE_COMMON;

  // Apply hard caps
  secretChance = Math.min(secretChance, DROP_RATES.MAX_SECRET);
  legendaryChance = Math.min(legendaryChance, DROP_RATES.MAX_LEGENDARY);
  epicChance = Math.min(epicChance, DROP_RATES.MAX_EPIC);
  rareChance = Math.min(rareChance, DROP_RATES.MAX_RARE);

  // Calculate total and normalize if > 100%
  const totalCapped = secretChance + legendaryChance + epicChance + rareChance;
  
  if (totalCapped > 100 - DROP_RATES.BASE_COMMON) {
    // Normalize: scale all capped rarities to fit with 60% minimum for common
    const maxCapped = 100 - DROP_RATES.BASE_COMMON;
    const scale = maxCapped / totalCapped;
    secretChance *= scale;
    legendaryChance *= scale;
    epicChance *= scale;
    rareChance *= scale;
    commonChance = DROP_RATES.BASE_COMMON;
  } else {
    // Remaining goes to common
    commonChance = 100 - (secretChance + legendaryChance + epicChance + rareChance);
  }

  return {
    secret: Math.round(secretChance * 100) / 100,
    legendary: Math.round(legendaryChance * 100) / 100,
    epic: Math.round(epicChance * 100) / 100,
    rare: Math.round(rareChance * 100) / 100,
    common: Math.round(commonChance * 100) / 100,
  };
}

/**
 * Roll for rarity based on chances
 * Returns: common | rare | epic | legendary | secret
 */
function rollRarity(prestigeLevel: number, rareArtifactChanceBonus: number): string {
  const roll = Math.random() * 100;
  
  // Get balanced drop chances
  const chances = calculateDropChances(rareArtifactChanceBonus);

  // Secret: only for prestige 1+
  if (prestigeLevel >= 1 && roll < chances.secret) {
    return "secret";
  }

  // Legendary
  if (roll < chances.secret + chances.legendary) {
    return "legendary";
  }

  // Epic
  if (roll < chances.secret + chances.legendary + chances.epic) {
    return "epic";
  }

  // Rare
  if (roll < chances.secret + chances.legendary + chances.epic + chances.rare) {
    return "rare";
  }

  // Common: remaining
  return "common";
}

// Export for testing
export { calculateDropChances, DROP_RATES };

/**
 * Get random artifact from epoch with matching rarity
 */
function getRandomArtifact(epochId: string, rarity: string, prestigeLevel: number): typeof ARTIFACTS[0] | null {
  const eligible = ARTIFACTS.filter((a) => {
    if (a.epoch !== epochId) return false;
    if (a.rarity !== rarity) return false;
    if (a.requiredPrestige && a.requiredPrestige > prestigeLevel) return false;
    return true;
  });

  if (eligible.length === 0) {
    // Fallback to common if no artifacts found for rarity
    return getRandomArtifact(epochId, "common", prestigeLevel);
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Generate rewards for chest opening
 */
function generateRewards(
  epochId: string,
  prestigeLevel: number,
  rareArtifactChanceBonus: number,
  chestType: "skychest" | "daily"
): ArtifactDrop[] {
  const rewards: ArtifactDrop[] = [];

  // Skychest: 2-3 artifacts, Daily: 1 artifact
  const numArtifacts = chestType === "skychest" ? Math.floor(Math.random() * 2) + 2 : 1;

  for (let i = 0; i < numArtifacts; i++) {
    const rarity = rollRarity(prestigeLevel, rareArtifactChanceBonus);
    const artifact = getRandomArtifact(epochId, rarity, prestigeLevel);

    if (artifact) {
      // Fragments: 1-3 for common, 1-2 for rare+, 1 for legendary/secret
      let partsGranted = 1;
      if (rarity === "common") {
        partsGranted = Math.floor(Math.random() * 3) + 1;
      } else if (rarity === "rare" || rarity === "epic") {
        partsGranted = Math.floor(Math.random() * 2) + 1;
      }

      rewards.push({
        id: artifact.id,
        epoch: artifact.epoch,
        rarity: artifact.rarity,
        parts_granted: partsGranted,
        icon: artifact.icon,
        name: artifact.name,
      });
    }
  }

  return rewards;
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
    const body: OpenChestRequest = await req.json();
    const { initData, epoch_id, chest_type = "daily", epoch_index = 0 } = body;

    // =====================================================
    // SECURITY: Validate initData BEFORE any DB operations
    // =====================================================
    if (!initData) {
      return jsonResponse({ error: "Missing initData for validation" }, 403);
    }

    const validated = validateInitData(initData);
    if (!validated.success) {
      console.error(`SECURITY: initData validation failed: ${validated.error}`);
      return jsonResponse({ error: validated.error || "Invalid initData" }, 403);
    }

    // Use validated telegram_id from HMAC check
    const telegram_id = validated.telegram_id;

    if (!telegram_id) {
      return jsonResponse({ error: "Invalid telegram_id from validation" }, 403);
    }

    // =====================================================
    // SECURITY: Rate limiting
    // =====================================================
    const rateCheck = checkRateLimit(telegram_id);
    if (!rateCheck.allowed) {
      console.warn(`SECURITY: Rate limit exceeded for telegram_id=${telegram_id}`);
      return jsonResponse({ error: "Rate limit exceeded. Try again later." }, 429);
    }

    if (!epoch_id) {
      return jsonResponse({ error: "Missing epoch_id" }, 400);
    }

    // Calculate chest cost: 100 * (epoch_index + 1)
    const chestCost = chest_type === "skychest" ? 0 : 100 * Math.max(1, (epoch_index || 0) + 1);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch player state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("currency, prestige_level, prestige_research, artifact_parts, artifact_levels, completed_artifacts")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Check and deduct currency for daily chests
    const playerCurrency = (player.currency as number) || 0;
    if (chestCost > 0 && playerCurrency < chestCost) {
      return jsonResponse({ error: "Not enough currency" }, 400);
    }

    const prestigeLevel = (player.prestige_level as number) || 0;
    const prestigeResearch = (player.prestige_research as Record<string, number>) || {};

    // Calculate rare artifact chance bonus from research
    // +5% per level (relative bonus, so 10 levels = +50% of base 1% = 1.5% total)
    const rareArtifactChanceBonus = (prestigeResearch.rare_artifact_chance || 0) * 0.05;

    // Generate rewards
    const rewards = generateRewards(epoch_id, prestigeLevel, rareArtifactChanceBonus, chest_type);

    // Update player's artifact parts
    const artifactParts = (player.artifact_parts as Record<string, number>) || {};
    const artifactLevels = (player.artifact_levels as Record<string, number>) || {};
    const completedArtifacts = (player.completed_artifacts as string[]) || [];

    for (const reward of rewards) {
      // Add parts
      artifactParts[reward.id] = (artifactParts[reward.id] || 0) + reward.parts_granted;

      // Check if artifact is completed (parts >= required)
      const artifact = ARTIFACTS.find((a) => a.id === reward.id);
      if (artifact) {
        const partsRequired = artifact.parts;
        if (artifactParts[reward.id] >= partsRequired && !completedArtifacts.includes(reward.id)) {
          // Complete the artifact — leftover parts remain for upgrades
          completedArtifacts.push(reward.id);
          artifactLevels[reward.id] = 1;
        }
      }
    }

    // Update database (deduct currency + save artifacts)
    const updateData: Record<string, unknown> = {
      artifact_parts: artifactParts,
      artifact_levels: artifactLevels,
      completed_artifacts: completedArtifacts,
    };

    if (chestCost > 0) {
      updateData.currency = playerCurrency - chestCost;
    }

    const { error: updateError } = await supabase
      .from("game_progress")
      .update(updateData)
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating artifacts:", updateError);
      return jsonResponse({ error: "Failed to save rewards" }, 500);
    }

    console.log(`Chest opened: user=${telegram_id}, epoch=${epoch_id}, type=${chest_type}, rewards=${rewards.length}`);

    return jsonResponse({
      success: true,
      rewards,
      chest_type: chest_type,
    });
  } catch (err) {
    console.error("Open chest error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
