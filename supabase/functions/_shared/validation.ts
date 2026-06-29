/**
 * Input Validation Utility for Edge Functions
 * 
 * Provides runtime validation for request payloads.
 * Uses manual validation (no external dependencies needed for Deno).
 */

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  sanitized?: Record<string, unknown>;
}

/**
 * Validate telegram_id
 */
export function validateTelegramId(value: unknown): number | null {
  if (typeof value === "number" && value > 0 && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (parsed > 0 && String(parsed) === value) {
      return parsed;
    }
  }
  return null;
}

/**
 * Validate epoch_id
 */
export function validateEpochId(value: unknown): string | null {
  const validEpochs = [
    "trypillia", "scythia", "antiquity", "kyiv_rus",
    "halych_volhynia", "polish_lithuanian", "cossack",
    "hetmanate", "empire", "revolution", "soviet", "independence"
  ];
  
  if (typeof value === "string" && validEpochs.includes(value)) {
    return value;
  }
  return null;
}

/**
 * Validate chest_type
 */
export function validateChestType(value: unknown): "daily" | "skychest" | null {
  if (value === "daily" || value === "skychest") {
    return value;
  }
  return null;
}

/**
 * Validate positive integer
 */
export function validatePositiveInt(value: unknown, max: number = 1000000): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0 && value <= max) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (parsed > 0 && parsed <= max && String(parsed) === value) {
      return parsed;
    }
  }
  return null;
}

/**
 * Validate string against max length
 */
export function validateString(value: unknown, maxLength: number = 1000): string | null {
  if (typeof value === "string" && value.length > 0 && value.length <= maxLength) {
    return value;
  }
  return null;
}

/**
 * Validate UUID format
 */
export function validateUUID(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return value;
  }
  return null;
}

/**
 * Validate booster_id
 */
export function validateBoosterId(value: unknown): string | null {
  const validBoosters = [
    "xp_boost_1h", "currency_boost_1h", "super_boost_30m",
    "legendary_gacha", "great_patron", "professor",
    "secret_expedition", "support_dev"
  ];
  
  if (typeof value === "string" && validBoosters.includes(value)) {
    return value;
  }
  return null;
}

/**
 * Validate action string
 */
export function validateAction(value: unknown): string | null {
  const validActions = [
    "create_invoice", "get_boosters", "set_webhook",
    "upgrade_tap", "switch_epoch", "buy_generator"
  ];
  
  if (typeof value === "string" && validActions.includes(value)) {
    return value;
  }
  return null;
}

/**
 * Generic object validator
 */
export function validateObject<T extends Record<string, unknown>>(
  obj: unknown,
  schema: Record<string, (v: unknown) => unknown | null>
): ValidationResult {
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, errors: ["Request body must be an object"] };
  }
  
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, validator] of Object.entries(schema)) {
    const value = (obj as Record<string, unknown>)[key];
    const result = validator(value);
    
    if (result === null) {
      errors.push(`Invalid value for field: ${key}`);
    } else {
      sanitized[key] = result;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(errors: string[]): Response {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: errors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Schema for prestige request
 */
export function validatePrestigeRequest(body: unknown): ValidationResult {
  return validateObject(body, {
    telegram_id: (v) => validateTelegramId(v),
  });
}

/**
 * Schema for open chest request
 */
export function validateOpenChestRequest(body: unknown): ValidationResult {
  return validateObject(body, {
    telegram_id: (v) => validateTelegramId(v),
    epoch_id: (v) => validateEpochId(v),
    chest_type: (v) => v === undefined ? "daily" : validateChestType(v),
    epoch_index: (v) => v === undefined ? 0 : validatePositiveInt(v, 100),
  });
}

/**
 * Schema for telegram payments request
 */
export function validatePaymentsRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Request body must be an object"] };
  }
  
  const obj = body as Record<string, unknown>;
  const errors: string[] = [];
  
  // action is required
  const action = validateAction(obj.action);
  if (action === null) {
    errors.push("Invalid or missing action");
  }
  
  // telegram_id required for most actions
  if (action !== "set_webhook" && action !== null) {
    const telegramId = validateTelegramId(obj.telegram_id);
    if (telegramId === null) {
      errors.push("Invalid or missing telegram_id");
    }
  }
  
  // booster_id required for create_invoice
  if (action === "create_invoice") {
    const boosterId = validateBoosterId(obj.booster_id);
    if (boosterId === null) {
      errors.push("Invalid or missing booster_id");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Schema for game action request
 */
export function validateGameActionRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Request body must be an object"] };
  }
  
  const obj = body as Record<string, unknown>;
  const errors: string[] = [];
  
  // action is required
  const action = validateAction(obj.action);
  if (action === null) {
    errors.push("Invalid or missing action");
  }
  
  // init_data is required
  const initData = validateString(obj.init_data, 10000);
  if (initData === null) {
    errors.push("Invalid or missing init_data");
  }
  
  // epoch_id required for switch_epoch
  if (obj.action === "switch_epoch") {
    const epochId = validateEpochId(obj.epoch_id);
    if (epochId === null) {
      errors.push("Invalid or missing epoch_id");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, "") // Remove < and >
    .trim();
}

/**
 * Validate init_data format (basic check)
 */
export function validateInitDataFormat(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 10000) {
    return null;
  }
  
  // initData should be URL-encoded query string with hash
  if (!value.includes("hash=")) {
    return null;
  }
  
  return value;
}
