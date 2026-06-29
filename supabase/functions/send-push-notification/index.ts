import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

interface PushPayload {
  telegram_id: number;
  message: string;
  type?: 'retention' | 'expedition' | 'artifact' | 'streak' | 'event';
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const result = await response.json();
    return result.ok === true;
  } catch (err) {
    console.error("Telegram API error:", err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: PushPayload = await req.json();
    const { telegram_id, message, type } = body;

    if (!telegram_id || !message) {
      return jsonResponse({ error: "Missing telegram_id or message" }, 400);
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return jsonResponse({ error: "Telegram bot not configured" }, 500);
    }

    // Format message based on type
    let formattedMessage = message;
    if (type) {
      const emojiMap: Record<string, string> = {
        retention: "👋",
        expedition: "🏕️",
        artifact: "🏆",
        streak: "🔥",
        event: "🎉",
      };
      const emoji = emojiMap[type] || "📢";
      formattedMessage = `${emoji} ${message}`;
    }

    const success = await sendTelegramMessage(telegram_id, formattedMessage);

    if (success) {
      return jsonResponse({ success: true, sent: true });
    } else {
      return jsonResponse({ success: false, error: "Failed to send message" }, 500);
    }
  } catch (err) {
    console.error("Push notification error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
