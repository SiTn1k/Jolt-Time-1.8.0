import { supabase } from './supabase';
import { getRawInitData, getTelegramUserId } from './telegram';

/**
 * Client-side helper for server-authoritative game actions.
 *
 * Every call sends the raw `initData` string to the edge function, which
 * validates it via HMAC-SHA256 before executing the action.  This prevents
 * users from manipulating game state via DevTools.
 *
 * Currently implemented server-side:
 *   - upgrade_tap   — deducts currency and increments tap_power
 *   - switch_epoch  — verifies epoch is unlocked, updates epoch_id
 *
 * Future (requires server-side generator definitions):
 *   - buy_generator — verify balance, deduct cost, add generator
 */

interface RpcResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

async function callGameAction(payload: Record<string, unknown>): Promise<RpcResult> {
  if (!supabase) return { ok: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { ok: false, error: 'Not running in Telegram' };

  const telegramId = getTelegramUserId();
  if (!telegramId) return { ok: false, error: 'No Telegram user ID' };

  try {
    const { data, error } = await supabase.functions.invoke('game-action', {
      body: { ...payload, init_data },
    });

    if (error) {
      return { ok: false, error: error.message || 'Edge function error' };
    }

    return data as RpcResult;
  } catch (e) {
    console.error('callGameAction error:', e);
    return { ok: false, error: String(e) };
  }
}

export async function rpcUpgradeTap(): Promise<RpcResult> {
  return callGameAction({ action: 'upgrade_tap' });
}

export async function rpcSwitchEpoch(epochId: string): Promise<RpcResult> {
  return callGameAction({ action: 'switch_epoch', epoch_id: epochId });
}

export async function rpcBuyGenerator(generatorId: string): Promise<RpcResult> {
  return callGameAction({ action: 'buy_generator', generator_id: generatorId });
}

/**
 * Open chest server-side. Returns artifact rewards determined by server RNG.
 * The server updates artifact_parts/artifact_levels/completed_artifacts in DB.
 */
export async function rpcOpenChest(
  telegramId: number,
  epochId: string,
  chestType: 'daily' | 'skychest' = 'daily',
  epochIndex: number = 0,
): Promise<{
  ok: boolean;
  error?: string;
  rewards?: Array<{
    id: string;
    epoch: string;
    rarity: string;
    parts_granted: number;
    icon: string;
    name: { ua: string; en: string };
  }>;
}> {
  if (!supabase) return { ok: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { ok: false, error: 'Not running in Telegram' };

  try {
    // SECURITY: Pass init_data for server-side HMAC validation
    const { data, error } = await supabase.functions.invoke('open-chest', {
      body: { 
        telegram_id: telegramId, 
        init_data, // Pass init_data for validation
        epoch_id: epochId, 
        chest_type: chestType, 
        epoch_index: epochIndex 
      },
    });

    if (error) return { ok: false, error: error.message || 'Edge function error' };

    return { ok: true, rewards: data?.rewards || [] };
  } catch (e) {
    console.error('rpcOpenChest error:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Get trusted server timestamp for offline calculations.
 * Prevents client clock manipulation exploits.
 */
export async function rpcGetServerTime(): Promise<{ 
  ok: boolean; 
  server_time?: number; 
  error?: string 
}> {
  if (!supabase) return { ok: false, error: 'No Supabase connection' };

  try {
    const { data, error } = await supabase.functions.invoke('get-server-time', {});
    
    if (error) return { ok: false, error: error.message };
    
    return { 
      ok: true, 
      server_time: data?.server_time as number 
    };
  } catch (e) {
    console.error('rpcGetServerTime error:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Validate referral ID before processing.
 * SECURITY: Prevents injection and integer overflow attacks.
 */
export function isValidReferralId(id: number): boolean {
  // Valid Telegram user IDs are positive integers
  // Max reasonable value is ~10^11 (100 billion)
  if (!Number.isInteger(id)) return false;
  if (id < 1) return false;
  if (id > 999999999999) return false;
  return true;
}

/**
 * Track session start/end for analytics.
 */
export async function rpcTrackSession(
  telegramId: number,
  event: 'start' | 'activity' | 'end',
): Promise<{ ok: boolean }> {
  if (!supabase) return { ok: false };

  try {
    await supabase.functions.invoke('track-session', {
      body: { telegram_id: telegramId, event },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Validate initData on the server. Returns { valid, user_id } or error.
 * Useful for one-shot validation at app startup or before critical actions.
 */
export async function rpcValidateInitData(): Promise<{ valid: boolean; user_id?: number; error?: string }> {
  if (!supabase) return { valid: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { valid: false, error: 'Not running in Telegram' };

  try {
    const { data, error } = await supabase.functions.invoke('validate-init-data', {
      body: { init_data },
    });

    if (error) return { valid: false, error: error.message };
    return data as { valid: boolean; user_id?: number; error?: string };
  } catch (e) {
    console.error('rpcValidateInitData error:', e);
    return { valid: false, error: String(e) };
  }
}
