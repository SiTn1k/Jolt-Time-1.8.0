/**
 * Referral Validation Utilities
 *
 * SECURITY: Validates and verifies referral IDs to prevent:
 * - Invalid referral ID injection
 * - Self-referral exploits
 * - Non-existent referrer attacks
 * - Out-of-range Telegram ID exploitation
 */

import type { SupabaseClient } from '@supabase/supabase-js';

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
 * Verifies that a referrer exists in the database
 */
export async function verifyReferrerExists(
  supabase: SupabaseClient,
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

/**
 * Validates a complete referral operation
 */
export async function validateReferral(
  supabase: SupabaseClient,
  referrerId: unknown,
  currentUserId: number
): Promise<{
  valid: boolean;
  referrerId: number | null;
  error?: string;
}> {
  // Step 1: Validate format and range
  const validation = validateReferrerId(referrerId);
  if (!validation.valid) {
    console.warn('Referral validation failed - invalid format:', validation.error);
    return validation;
  }

  // Step 2: Check self-referral
  if (validation.referrerId === currentUserId) {
    console.warn('Self-referral attempt blocked');
    return { valid: false, referrerId: null, error: 'Cannot refer yourself' };
  }

  // Step 3: Verify referrer exists
  if (validation.referrerId === null) {
    return { valid: false, referrerId: null, error: 'Invalid referrer ID' };
  }
  
  const exists = await verifyReferrerExists(supabase, validation.referrerId);
  if (!exists) {
    console.warn('Referrer does not exist:', validation.referrerId);
    return { valid: false, referrerId: null, error: 'Referrer not found' };
  }

  return validation;
}
