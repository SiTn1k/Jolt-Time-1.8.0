/**
 * Get Server Time Edge Function
 * 
 * SECURITY: Provides trusted server timestamp for:
 * - Offline calculations (prevent client clock manipulation)
 * - Rate limiting synchronization
 * - Game state timestamp validation
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const now = Date.now();
  const isoString = new Date(now).toISOString();

  return new Response(
    JSON.stringify({
      server_time: now,
      iso_string: isoString,
      timezone: "UTC",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
