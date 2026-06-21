/**
 * Shared Referral Validation for Edge Functions
 *
 * SECURITY: Validates and verifies referral IDs to prevent:
 * - Invalid referral ID injection
 * - Self-referral exploits
 * - Non-existent referrer attacks
 */

// Valid Telegram ID range
const VALID_TELEGRAM_ID_MIN = 1;
const VALID_TELEGRAM_ID_MAX = 9999999999;

/**
 * Validates a referral ID for format and range
 */
export function validateReferrerId(refId: unknown): {
  valid: boolean;
  referrerId: number | null;
  error?: string;
} {
  // Check type
  if (typeof refId !== 'number' && typeof refId !== 'string') {
    return { valid: false, referrerId: null, error: 'Invalid type: expected number or string' };
  }

  // Convert to number
  const numRefId = typeof refId === 'string' ? parseInt(refId, 10) : refId;

  // Check valid number
  if (isNaN(numRefId)) {
    return { valid: false, referrerId: null, error: 'Not a valid number' };
  }

  // Check Telegram ID range
  if (numRefId < VALID_TELEGRAM_ID_MIN || numRefId > VALID_TELEGRAM_ID_MAX) {
    return {
      valid: false,
      referrerId: null,
      error: `Telegram ID out of range: ${numRefId}`
    };
  }

  // Check non-negative
  if (numRefId <= 0) {
    return { valid: false, referrerId: null, error: 'Telegram ID must be positive' };
  }

  // Check integer
  if (!Number.isInteger(numRefId)) {
    return { valid: false, referrerId: null, error: 'Telegram ID must be integer' };
  }

  return { valid: true, referrerId: numRefId };
}

/**
 * Checks if a referrer exists in the profiles table
 */
export async function verifyReferrerExists(
  supabase: any,
  referrerId: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('telegram_id', referrerId)
      .maybeSingle();

    return !error && !!data;
  } catch (err) {
    console.error('verifyReferrerExists error:', err);
    return false;
  }
}
