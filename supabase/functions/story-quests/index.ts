/**
 * Story Quests Edge Function
 * 
 * Server-authoritative quest completion rewards.
 * Prevents reward manipulation and ensures valid quest completion.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { validateInitData } from "../_shared/validate";
import { createHmac } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Quest reward multiplier (matches client)
const QUEST_REWARD_MULTIPLIER = 2.0;

 {
  if (!BOT_TOKEN) return { valid: false, userId: null, error: "BOT_TOKEN not configured" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, userId: null, error: "Missing hash" };

  const authDateStr = params.get("auth_date");
  if (!authDateStr) return { valid: false, userId: null, error: "Missing auth_date" };
  const authDate = parseInt(authDateStr, 10);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || ageSeconds > 86400 || ageSeconds < 0) {
    return { valid: false, userId: null, error: "initData too old or invalid" };
  }

  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return { valid: false, userId: null, error: "HMAC mismatch" };

  const userStr = params.get("user");
  let userId: number | null = null;
  if (userStr) {
    try { userId = JSON.parse(userStr).id ?? null; } catch { return { valid: false, userId: null, error: "Invalid user JSON" }; }
  }

  return { valid: true, userId };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Quest definitions (server-side validation)
interface QuestReward {
  type: 'karbovanets' | 'xp' | 'reputation' | 'artifact' | 'hero_fragment';
  amount: number;
}

interface QuestDef {
  id: string;
  rewards: QuestReward[];
}

const QUESTS: Record<string, QuestDef> = {
  // Tutorial quests
  'quest-tutorial-1': { rewards: [{ type: 'karbovanets', amount: 500 }] },
  'quest-tutorial-2': { rewards: [{ type: 'karbovanets', amount: 1000 }] },
  
  // Region 1 quests
  'quest-trybillia-1': { rewards: [{ type: 'karbovanets', amount: 1000 }, { type: 'reputation', amount: 100 }] },
  'quest-trybillia-2': { rewards: [{ type: 'karbovanets', amount: 2000 }, { type: 'reputation', amount: 200 }] },
  
  // Region 2 quests
  'quest-scythia-1': { rewards: [{ type: 'karbovanets', amount: 2000 }, { type: 'reputation', amount: 300 }] },
  'quest-scythia-2': { rewards: [{ type: 'karbovanets', amount: 3000 }, { type: 'reputation', amount: 400 }] },
  
  // Add more quests as needed
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { action, init_data, quest_id } = body as {
      action: string;
      init_data?: string;
      quest_id?: string;
    };

    if (!init_data) return jsonResponse({ error: "Missing init_data" }, 400);
    const validation = validateInitData(init_data);
    if (!validation.valid) return jsonResponse({ error: validation.error }, 401);
    if (!validation.userId) return jsonResponse({ error: "Invalid telegram_id" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    switch (action) {
      case "claim":
        if (!quest_id) return jsonResponse({ error: "Missing quest_id" }, 400);
        return await claimQuest(supabase, validation.userId, quest_id);
      case "get_available":
        return await getAvailableQuests(supabase, validation.userId);
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("story-quests error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function claimQuest(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  questId: string
) {
  // Validate quest exists
  const quest = QUESTS[questId];
  if (!quest) {
    // For unknown quests, return error but allow client-defined quests
    return jsonResponse({ error: "Unknown quest", questId }, 404);
  }

  // Get story progress
  const { data: storyData, error: loadError } = await supabase
    .from("story_progress")
    .select("completed_quests, active_quests")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (loadError) {
    return jsonResponse({ error: "Failed to load progress" }, 500);
  }

  const completedQuests = (storyData?.completed_quests as string[]) || [];
  const activeQuests = (storyData?.active_quests as string[]) || [];

  // Check if already completed
  if (completedQuests.includes(questId)) {
    return jsonResponse({ error: "Quest already completed", code: "ALREADY_COMPLETED" }, 409);
  }

  // Check if quest is active
  if (!activeQuests.includes(questId)) {
    return jsonResponse({ error: "Quest not started", code: "NOT_STARTED" }, 400);
  }

  // Calculate server-side rewards with multiplier
  const rewards = quest.rewards.map(r => ({
    type: r.type,
    amount: Math.floor(r.amount * QUEST_REWARD_MULTIPLIER),
  }));

  // Calculate total rewards
  let currencyGain = 0;
  let xpGain = 0;
  let reputationGain = 0;

  for (const r of rewards) {
    switch (r.type) {
      case 'karbovanets': currencyGain += r.amount; break;
      case 'xp': xpGain += r.amount; break;
      case 'reputation': reputationGain += r.amount; break;
    }
  }

  // Update story_progress
  const { error: updateError } = await supabase
    .from("story_progress")
    .update({
      completed_quests: [...completedQuests, questId],
      active_quests: activeQuests.filter(id => id !== questId),
    })
    .eq("telegram_id", telegramId);

  if (updateError) {
    return jsonResponse({ error: "Failed to update quest" }, 500);
  }

  // Update expedition state with rewards (if expedition_state exists)
  if (currencyGain > 0 || reputationGain > 0) {
    const { data: expData } = await supabase
      .from("expedition_state")
      .select("state_data")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (expData) {
      const state = (expData.state_data as Record<string, unknown>) || {};
      await supabase
        .from("expedition_state")
        .update({
          state_data: {
            ...state,
            karbovanets: ((state.karbovanets as number) || 0) + currencyGain,
            reputation: ((state.reputation as number) || 0) + reputationGain,
          },
        })
        .eq("telegram_id", telegramId);
    }
  }

  return jsonResponse({
    ok: true,
    questId,
    rewards: {
      currency: currencyGain,
      xp: xpGain,
      reputation: reputationGain,
    },
  });
}

async function getAvailableQuests(
  supabase: ReturnType<typeof createClient>,
  telegramId: number
) {
  const { data: storyData } = await supabase
    .from("story_progress")
    .select("completed_quests, active_quests")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  const completedQuests = (storyData?.completed_quests as string[]) || [];
  const activeQuests = (storyData?.active_quests as string[]) || [];

  // Return available quests (not completed)
  const available = Object.entries(QUESTS)
    .filter(([id]) => !completedQuests.includes(id))
    .map(([id, quest]) => ({
      id,
      rewards: quest.rewards.map(r => ({
        type: r.type,
        amount: Math.floor(r.amount * QUEST_REWARD_MULTIPLIER),
      })),
    }));

  return jsonResponse({
    ok: true,
    available,
    active: activeQuests,
    completed: completedQuests,
  });
}
