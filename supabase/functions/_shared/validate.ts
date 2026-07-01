/**
 * Shared InitData validation for all Edge Functions
 * Validates Telegram WebApp initData using HMAC-SHA256
 */

import { createHmac } from "node:crypto";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

export interface ValidationResult {
  valid: boolean;
  userId: number | null;
  error?: string;
}

/**
 * Validate Telegram WebApp initData
 * 
 * @param initData - Raw initData string from Telegram WebApp
 * @returns ValidationResult with userId if valid
 */
export function validateInitData(initData: string): ValidationResult {
  if (!BOT_TOKEN) {
    return { valid: false, userId: null, error: "BOT_TOKEN not configured" };
  }

  if (!initData || initData.length === 0) {
    return { valid: false, userId: null, error: "Missing initData" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { valid: false, userId: null, error: "Missing hash" };
  }

  const authDateStr = params.get("auth_date");
  if (!authDateStr) {
    return { valid: false, userId: null, error: "Missing auth_date" };
  }

  const authDate = parseInt(authDateStr, 10);
  if (isNaN(authDate)) {
    return { valid: false, userId: null, error: "Invalid auth_date" };
  }

  // Check data age (must be less than 24 hours old)
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age > 86400 || age < 0) {
    return { valid: false, userId: null, error: "Stale initData" };
  }

  // Build the data check string
  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const checkStr = keys.map(k => `${k}=${params.get(k)}`).join("\n");

  // Compute HMAC-SHA256
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computed = createHmac("sha256", secretKey).update(checkStr).digest("hex");

  if (computed !== hash) {
    return { valid: false, userId: null, error: "HMAC mismatch" };
  }

  // Extract user ID from user parameter
  let userId: number | null = null;
  const userStr = params.get("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = user.id ?? null;
    } catch {
      // Invalid JSON in user field
    }
  }

  return { valid: true, userId };
}