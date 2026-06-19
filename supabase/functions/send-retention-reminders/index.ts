import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/*
 * send-retention-reminders
 * ------------------------
 * Backend-only retention push system for the Telegram Mini App.
 *
 * Behaviour:
 * 1. Reads players from game_progress whose last_active_at is between
 *    (NOW - 7h) and (NOW - 6h) — a 1-hour notification window.
 *    last_active_at is ONLY updated when the player genuinely opens the
 *    Mini App or pings a session (via the track-session edge function),
 *    so it reflects true user activity, unlike updated_at which fires on
 *    every background sync / passive income claim / cron job.
 * 2. Filters out players without a valid telegram_id.
 * 3. Checks retention_notifications for an existing send of the
 *    same notification_type in the last 24 hours, and skips if found.
 * 4. Sends a Telegram sendMessage to each candidate with an inline
 *    "🚀 Запустити гру" button that deep-links into the Mini App.
 * 5. Inserts a row into retention_notifications for every send.
 * 6. Emits structured console.log lines at each stage so retention runs
 *    can be verified in the Supabase Edge Function logs.
 *
 * Designed to be invoked hourly by pg_cron via the pg_net extension
 * (configured in a separate migration).
 *
 * Environment variables (read at call time):
 *  - SUPABASE_URL             (auto-provided by Supabase runtime)
 *  - SUPABASE_SERVICE_ROLE_KEY (auto-provided)
 *  - TELEGRAM_BOT_TOKEN        (secret, configured in Supabase dashboard)
 *  - RETENTION_DEEP_LINK       (optional) override URL for the launch button.
 *      Defaults to https://t.me/<BOT_USERNAME>?start=retention where
 *      BOT_USERNAME comes from RETENTION_BOT_USERNAME (optional) and
 *      falls back to the public bot via /getMe.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const NOTIFICATION_TYPE = "energy_full";
const DUPLICATE_WINDOW_HOURS = 24;

const RETENTION_MESSAGES = [
  "⚡ Твоя енергія повністю відновилася!\n\nПовертайся в музей та продовжуй дослідження! 🏛️",

  "🎁 На тебе чекає подарунок у музеї!\n\nЗаходь та забери свою нагороду просто зараз.",

  "💰 Музей накопичив прибуток офлайн!\n\nПовертайся та забери зароблені монети.",

  "🏛️ Експедиція завершилася!\n\nТвої археологи вже чекають на нові завдання.",

  "🔍 Знайдено новий артефакт!\n\nНе пропусти можливість поповнити свою колекцію.",

  "🚀 Твій музей сумує без тебе!\n\nЧас повернутися та продовжити розвиток імперії.",

  "⭐ У тебе накопичилися бонуси!\n\nЗаходь у гру та використай їх з користю.",

  "🎮 Настав час нових відкриттів!\n\nТвої відвідувачі вже чекають на повернення директора музею.",

  "🏆 Ти вже близько до наступного рівня!\n\nЗалишився лише один крок до нових досягнень.",

  "🔥 Повертайся в гру!\n\nПопереду нові артефакти, нагороди та досягнення."
];

interface CandidatePlayer {
  telegram_id: number;
  last_active_at: string | null;
}

interface TelegramResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
}

async function tgCall(method: string, body: Record<string, unknown>): Promise<TelegramResponse> {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as TelegramResponse;
}

async function resolveBotUsername(): Promise<string | null> {
  const configured = Deno.env.get("RETENTION_BOT_USERNAME");
  if (configured && configured.trim().length > 0) return configured.trim();

  const info = await tgCall("getMe", {});
  if (info.ok) {
    const me = (info as unknown as { result?: { username?: string } }).result;
    return me?.username ?? null;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Supabase env vars not configured" }, 500);
  }
  if (!BOT_TOKEN) {
    return json({ error: "TELEGRAM_BOT_TOKEN not configured" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const deepLinkOverride = Deno.env.get("RETENTION_DEEP_LINK");
  let inlineUrl: string;
  if (deepLinkOverride && deepLinkOverride.trim().length > 0) {
    inlineUrl = deepLinkOverride.trim();
  } else {
    const botUsername = await resolveBotUsername();
    if (!botUsername) {
      return json({ error: "Could not resolve bot username" }, 500);
    }
    inlineUrl = `https://t.me/${botUsername}?start=retention`;
  }

  const sent: number[] = [];
  const skippedDuplicate: number[] = [];
  const failed: Array<{ telegram_id: number; error: string }> = [];

  console.log(`[retention] run started at ${new Date().toISOString()}`);
  console.log(`[retention] deep_link=${inlineUrl}`);

  try {
    // 1-hour retention notification window: players whose last genuine app
    // activity (last_active_at) is between 6h and 7h ago.
    // "6 to 7 hours ago" = last_active_at <= (now - 6h) AND last_active_at > (now - 7h).
    const now = Date.now();
    const sixHoursAgoIso = new Date(now - 6 * 60 * 60 * 1000).toISOString();
    const sevenHoursAgoIso = new Date(now - 7 * 60 * 60 * 1000).toISOString();

    console.log(`[retention] window: last_active_at in (${sevenHoursAgoIso}, ${sixHoursAgoIso}]`);

    const { data: candidates, error } = await supabase
      .from("game_progress")
      .select("telegram_id, last_active_at")
      .not("telegram_id", "is", null)
      .not("last_active_at", "is", null)
      .lte("last_active_at", sixHoursAgoIso)
      .gt("last_active_at", sevenHoursAgoIso);

    if (error) {
      console.error("[retention] query candidates error:", error);
      return json({ error: error.message }, 500);
    }

    if (!candidates || candidates.length === 0) {
      console.log("[retention] no candidates in window, exiting");
      return json({
        ok: true,
        candidates: 0,
        sent: 0,
        skipped_duplicate: 0,
        failed: 0,
      });
    }

    console.log(`[retention] found ${candidates.length} candidate(s)`);

    for (const candidate of candidates as CandidatePlayer[]) {
      const telegramId = candidate.telegram_id;
      const lastActive = candidate.last_active_at;
      if (!telegramId || !Number.isFinite(telegramId) || telegramId <= 0) continue;

      console.log(`[retention] processing telegram_id=${telegramId} last_active_at=${lastActive}`);

      // Duplicate protection: check if same notification_type was sent in last 24h.
      const { data: existing, error: dedupErr } = await supabase
        .from("retention_notifications")
        .select("id")
        .eq("telegram_id", telegramId)
        .eq("notification_type", NOTIFICATION_TYPE)
        .gte(
          "sent_at",
          new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
        )
        .limit(1);

      if (dedupErr) {
        console.error(`[retention] dedup query error for ${telegramId}:`, dedupErr);
        failed.push({ telegram_id: telegramId, error: "dedup check failed" });
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`[retention] skipping telegram_id=${telegramId} (already sent in last 24h)`);
        skippedDuplicate.push(telegramId);
        continue;
      }

      // Select random message from the array
      const randomMessage =
        RETENTION_MESSAGES[
          Math.floor(Math.random() * RETENTION_MESSAGES.length)
        ];

      console.log(`[retention] sending Telegram message to ${telegramId}`);
      const tgResult = await tgCall("sendMessage", {
        chat_id: telegramId,
        text: randomMessage,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🚀 Запустити гру", url: inlineUrl }
            ],
            [
              { text: "📢 Наш Telegram канал", url: "https://t.me/SITNIK_BLOG" }
            ]
          ],
        },
      });

      if (!tgResult.ok) {
        const errDesc = tgResult.description ?? `Telegram error ${tgResult.error_code ?? ""}`;
        console.error(`[retention] sendMessage failed for ${telegramId}: ${errDesc}`);
        failed.push({ telegram_id: telegramId, error: errDesc });
        continue;
      }

      console.log(`[retention] sendMessage ok for ${telegramId}, logging to retention_notifications`);
      const { error: insertErr } = await supabase
        .from("retention_notifications")
        .insert({
          telegram_id: telegramId,
          notification_type: NOTIFICATION_TYPE,
          payload: {
            message: randomMessage,
            url: inlineUrl,
            channel: "https://t.me/SITNIK_BLOG"
          },
        });

      if (insertErr) {
        console.error(`[retention] insert notification log error for ${telegramId}:`, insertErr);
      }

      sent.push(telegramId);
    }

    console.log(`[retention] run complete: sent=${sent.length} skipped=${skippedDuplicate.length} failed=${failed.length}`);

    return json({
      ok: true,
      field_used: "last_active_at",
      window: { after: sevenHoursAgoIso, before: sixHoursAgoIso },
      candidates: candidates.length,
      sent: sent.length,
      skipped_duplicate: skippedDuplicate.length,
      failed: failed.length,
      sent_ids: sent,
      failed_details: failed,
    });
  } catch (err) {
    console.error("[retention] fatal error:", err);
    return json({ error: String(err) }, 500);
  }
});
