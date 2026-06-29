/**
 * Security Audit Logging Utility for Edge Functions
 * 
 * Provides structured logging for security-relevant events.
 * All logs go to the security_audit_log table.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Event categories
export type EventCategory = 
  | "auth"      // Authentication events
  | "purchase"  // Purchase events
  | "prestige"  // Prestige events
  | "abuse"     // Abuse prevention
  | "system"    // System events
  | "general";  // General events

// Severity levels
export type SeverityLevel = 
  | "debug" 
  | "info" 
  | "warning" 
  | "error" 
  | "critical";

// Common event types
export const EVENT_TYPES = {
  // Auth events
  INVALID_INIT_DATA: "invalid_init_data",
  AUTH_SUCCESS: "auth_success",
  AUTH_FAILED: "auth_failed",
  
  // Prestige events
  PRESTIGE_ATTEMPT: "prestige_attempt",
  PRESTIGE_SUCCESS: "prestige_success",
  PRESTIGE_FAILED: "prestige_failed",
  
  // Purchase events
  PURCHASE_ATTEMPT: "purchase_attempt",
  PURCHASE_CREATE_INVOICE: "purchase_create_invoice",
  PURCHASE_SUCCESS: "purchase_success",
  PURCHASE_FAILED: "purchase_failed",
  PURCHASE_DUPLICATE: "purchase_duplicate",
  
  // Abuse events
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  PAYLOAD_VALIDATION_FAILED: "payload_validation_failed",
  INVALID_PARAMETERS: "invalid_parameters",
  
  // Game events
  CHEST_OPENED: "chest_opened",
  GENERATOR_PURCHASED: "generator_purchased",
  EPOCH_SWITCHED: "epoch_switched",
  
  // System events
  EDGE_FUNCTION_CALLED: "edge_function_called",
  EDGE_FUNCTION_ERROR: "edge_function_error",
  DB_ERROR: "db_error",
} as const;

// Interface for log entry
export interface SecurityLogEntry {
  telegramId?: number | null;
  eventType: string;
  eventCategory: EventCategory;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  errorMessage?: string;
  requestMethod?: string;
  requestPath?: string;
  telegramInitData?: string;
  severity?: SeverityLevel;
}

/**
 * Log a security event to the audit log
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    const { error } = await supabase
      .from("security_audit_log")
      .insert({
        telegram_id: entry.telegramId,
        event_type: entry.eventType,
        event_category: entry.eventCategory,
        success: entry.success,
        ip_address: entry.ipAddress ?? null,
        user_agent: entry.userAgent ?? null,
        details: entry.details ?? {},
        error_message: entry.errorMessage ?? null,
        request_method: entry.requestMethod ?? null,
        request_path: entry.requestPath ?? null,
        telegram_init_data: entry.telegramInitData ? "[REDACTED]" : null, // Never log actual initData
        severity: entry.severity ?? (entry.success ? "info" : "warning"),
      });
    
    if (error) {
      console.error("Failed to log security event:", error);
    }
  } catch (err) {
    // Never throw from logging - just console.error
    console.error("Security logging error:", err);
  }
}

/**
 * Extract client info from request headers
 */
export function extractClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  // Try various headers for IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  let ipAddress = "unknown";
  if (forwardedFor) {
    ipAddress = forwardedFor.split(",")[0].trim();
  } else if (realIp) {
    ipAddress = realIp;
  } else if (cfConnectingIp) {
    ipAddress = cfConnectingIp;
  }
  
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  
  return { ipAddress, userAgent };
}

/**
 * Create a security log entry from a request
 */
export function createLogEntry(
  request: Request,
  eventType: string,
  eventCategory: EventCategory,
  telegramId?: number | null,
  success: boolean = true,
  details?: Record<string, unknown>,
  errorMessage?: string
): SecurityLogEntry {
  const { ipAddress, userAgent } = extractClientInfo(request);
  
  return {
    telegramId,
    eventType,
    eventCategory,
    success,
    ipAddress,
    userAgent,
    details,
    errorMessage,
    requestMethod: request.method,
    requestPath: new URL(request.url).pathname,
    severity: success ? "info" : "warning",
  };
}

/**
 * Log an authentication failure
 */
export async function logAuthFailure(
  request: Request,
  reason: string,
  telegramId?: number | null
): Promise<void> {
  await logSecurityEvent({
    ...createLogEntry(request, EVENT_TYPES.AUTH_FAILED, "auth", telegramId, false, { reason }),
    errorMessage: reason,
    severity: "warning",
  });
}

/**
 * Log a rate limit exceeded event
 */
export async function logRateLimitExceeded(
  request: Request,
  action: string,
  telegramId?: number | null
): Promise<void> {
  await logSecurityEvent({
    ...createLogEntry(request, EVENT_TYPES.RATE_LIMIT_EXCEEDED, "abuse", telegramId, false, { action }),
    severity: "warning",
  });
}

/**
 * Log a prestige event
 */
export async function logPrestigeEvent(
  request: Request,
  telegramId: number,
  success: boolean,
  level?: number,
  prestigeLevel?: number,
  errorMessage?: string
): Promise<void> {
  const eventType = success ? EVENT_TYPES.PRESTIGE_SUCCESS : EVENT_TYPES.PRESTIGE_FAILED;
  
  await logSecurityEvent({
    ...createLogEntry(request, eventType, "prestige", telegramId, success, {
      level,
      prestigeLevel,
    }),
    errorMessage,
    severity: success ? "info" : "warning",
  });
}

/**
 * Log a purchase event
 */
export async function logPurchaseEvent(
  request: Request,
  telegramId: number,
  eventType: string,
  success: boolean,
  boosterId?: string,
  errorMessage?: string
): Promise<void> {
  await logSecurityEvent({
    ...createLogEntry(request, eventType, "purchase", telegramId, success, {
      boosterId,
    }),
    errorMessage,
    severity: success ? "info" : "warning",
  });
}

/**
 * Log a validation failure
 */
export async function logValidationFailure(
  request: Request,
  field: string,
  value: unknown,
  reason: string,
  telegramId?: number | null
): Promise<void> {
  await logSecurityEvent({
    ...createLogEntry(
      request, 
      EVENT_TYPES.PAYLOAD_VALIDATION_FAILED, 
      "abuse", 
      telegramId, 
      false, 
      { field, value: String(value), reason }
    ),
    errorMessage: reason,
    severity: "warning",
  });
}

/**
 * Log a suspicious activity
 */
export async function logSuspiciousActivity(
  request: Request,
  description: string,
  telegramId?: number | null,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    ...createLogEntry(request, EVENT_TYPES.SUSPICIOUS_ACTIVITY, "abuse", telegramId, false, {
      description,
      ...details,
    }),
    severity: "error",
  });
}
