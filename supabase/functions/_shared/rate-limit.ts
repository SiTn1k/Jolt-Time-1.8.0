/**
 * Rate Limiting Utility for Edge Functions
 * 
 * Provides sliding window rate limiting to prevent abuse.
 * Uses Supabase for tracking request counts.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Rate limit configurations for different actions
export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Prestige: 1 per hour
  prestige: { maxRequests: 1, windowSeconds: 3600 },
  
  // Purchase: 10 per minute (for creating invoices)
  purchase_create: { maxRequests: 10, windowSeconds: 60 },
  
  // Purchase webhook: handled separately with idempotency
  
  // Chest opening: 30 per minute (prevents farming)
  open_chest: { maxRequests: 30, windowSeconds: 60 },
  
  // Game actions: 60 per minute
  game_action: { maxRequests: 60, windowSeconds: 60 },
  
  // Expedition actions: 20 per minute
  expedition: { maxRequests: 20, windowSeconds: 60 },
  
  // Daily reward claim: 10 per minute
  claim_daily: { maxRequests: 10, windowSeconds: 60 },
  
  // Offline income claim: 5 per minute
  claim_offline: { maxRequests: 5, windowSeconds: 60 },
};

// Default rate limit for unknown actions
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowSeconds: 60,
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds?: number;
}

/**
 * Check if a request is allowed under rate limiting rules
 */
export async function checkRateLimit(
  telegramId: number,
  action: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action] ?? DEFAULT_RATE_LIMIT;
  return checkRateLimitWithConfig(telegramId, action, config);
}

/**
 * Check rate limit with custom configuration
 */
export async function checkRateLimitWithConfig(
  telegramId: number,
  action: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);
  const windowKey = `${action}:${telegramId}`;
  
  try {
    // Clean up old entries first (optional optimization)
    await supabase
      .from("rate_limits")
      .delete()
      .lt("expires_at", now.toISOString());
    
    // Count requests in current window
    const { count, error } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("key", windowKey)
      .gte("window_start", windowStart.toISOString());
    
    if (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow request if rate limit check fails
      return { allowed: true, remaining: config.maxRequests, resetAt: now };
    }
    
    const currentCount = count ?? 0;
    
    if (currentCount >= config.maxRequests) {
      // Rate limit exceeded
      const resetAt = new Date(windowStart.getTime() + config.windowSeconds * 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
      };
    }
    
    // Insert new rate limit record
    const { error: insertError } = await supabase
      .from("rate_limits")
      .insert({
        key: windowKey,
        telegram_id: telegramId,
        action,
        count: 1,
        window_start: windowStart.toISOString(),
        expires_at: new Date(now.getTime() + config.windowSeconds * 1000 * 2).toISOString(), // 2x window for cleanup
      });
    
    if (insertError) {
      console.error("Rate limit insert error:", insertError);
      // Fail open
      return { allowed: true, remaining: config.maxRequests - currentCount - 1, resetAt: now };
    }
    
    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetAt: new Date(windowStart.getTime() + config.windowSeconds * 1000),
    };
  } catch (err) {
    console.error("Rate limit unexpected error:", err);
    // Fail open - allow request if rate limiting fails
    return { allowed: true, remaining: config.maxRequests, resetAt: now };
  }
}

/**
 * Create a rate limit response for when limit is exceeded
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please wait ${result.retryAfterSeconds} seconds.`,
      retry_after: result.retryAfterSeconds,
      reset_at: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds ?? 60),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}

/**
 * Helper to create a standard JSON response with rate limit headers
 */
export function jsonRateLimitResponse(
  data: unknown,
  status: number,
  rateLimitResult?: RateLimitResult
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (rateLimitResult) {
    headers["X-RateLimit-Remaining"] = String(rateLimitResult.remaining);
    headers["X-RateLimit-Reset"] = rateLimitResult.resetAt.toISOString();
  }
  
  return new Response(JSON.stringify(data), { status, headers });
}
