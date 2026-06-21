/**
 * AdsGram SDK Service for Virtual Museum Tapper Game
 *
 * Provides integration with AdsGram Reward Video Ads.
 * 
 * TUNED FOR TELEGRAM APPROVAL:
 * - Exclusive rewards not found elsewhere (x3 XP boost, rare artifacts)
 * - Clear value proposition for watching ads
 * - Anti-abuse: server-side validation, daily limits
 * - 30-second non-skippable chest ads every 10 chests
 * 
 * Block ID: 35644
 */

// AdsGram Block ID for reward ads (Telegram-approved exclusive block)
export const ADSGRAM_BLOCK_ID = '35644';

// XP Boost configuration - EXCLUSIVE reward (cannot be bought)
export const XP_BOOST_MULTIPLIER = 3;
export const XP_BOOST_DURATION_MS = 30 * 60 * 1000; // 30 minutes (fixed, not extendable)

// Supabase Edge Function URL for granting rewards (server-side validation)
const getEdgeFunctionUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/adsgram-reward`;
};

/**
 * Result of ad show attempt
 */
export interface AdShowResult {
  success: boolean;
  error?: string;
  boostActivated?: boolean;
  alreadyActive?: boolean;
}

/**
 * AdsGram ShowPromiseResult type (based on SDK usage)
 */
interface ShowPromiseResult {
  done: boolean;
  error?: string;
  state?: string;
  description?: string;
}

/**
 * Types for AdsGram SDK
 */
interface AdsgramController {
  show: () => Promise<ShowPromiseResult>;
}

type BlockId = string;

declare global {
  interface Window {
    Adsgram?: {
      init: (config: { blockId: BlockId; debug?: boolean }) => AdsgramController;
    };
  }
}

/**
 * Initialize AdsGram SDK
 */
export function initAdsgram(blockId: string = ADSGRAM_BLOCK_ID, debug = false): AdsgramController | null {
  console.log('[adsgram] Initializing with blockId:', blockId);
  
  if (!window.Adsgram) {
    console.error('[adsgram] SDK not loaded - window.Adsgram is undefined');
    console.log('[adsgram] Available window keys:', Object.keys(window).filter(k => k.toLowerCase().includes('ad') || k.toLowerCase().includes('ads')));
    return null;
  }

  console.log('[adsgram] SDK found, initializing...');
  
  try {
    const controller = window.Adsgram.init({ blockId, debug });
    console.log('[adsgram] Controller created:', controller);
    return controller;
  } catch (err) {
    console.error('[adsgram] Failed to initialize:', err);
    return null;
  }
}

/**
 * Grant XP boost via server
 * Server-side validation ensures boost cannot be forged
 */
export async function grantXpBoostFromServer(telegramId: number): Promise<{ success: boolean; error?: string; alreadyActive?: boolean }> {
  const url = getEdgeFunctionUrl();
  
  if (!url || url.includes('undefined') || url.includes('null')) {
    console.error('[adsgram] Edge function URL not configured:', url);
    return {
      success: false,
      error: 'Boost service is not configured. Please try again later.',
    };
  }

  console.log('[adsgram] Granting XP boost from server...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userid: telegramId.toString(),
        ad_id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        reward_type: 'xp_boost',
      }),
    });

    const data = await response.json();
    console.log('[adsgram] Server response:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to grant boost',
        alreadyActive: data.already_active || false,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('[adsgram] Failed to grant XP boost:', err);
    return {
      success: false,
      error: 'Network error - please try again',
    };
  }
}

/**
 * Show reward ad and handle completion
 */
export async function showRewardAd(
  controller: AdsgramController,
  telegramId: number
): Promise<AdShowResult> {
  try {
    const result = await controller.show();

    if (result.done) {
      // User watched ad till the end - grant reward via server
      const grantResult = await grantXpBoostFromServer(telegramId);

      if (grantResult.success) {
        return {
          success: true,
          boostActivated: true,
        };
      } else {
        return {
          success: false,
          error: grantResult.error || 'Failed to grant reward',
          alreadyActive: grantResult.alreadyActive,
        };
      }
    } else {
      // User closed ad before completion
      return {
        success: false,
        error: 'Рекламу не завершено. Подивись до кінця, щоб отримати нагороду.',
      };
    }
  } catch (err) {
    const errorResult = err as ShowPromiseResult;

    // Handle different error states
    if (errorResult.state === 'load') {
      return {
        success: false,
        error: 'Не вдалося завантажити рекламу. Спробуйте пізніше.',
      };
    }

    if (errorResult.description?.includes('not found') || errorResult.description?.includes('no banner')) {
      return {
        success: false,
        error: 'Реклама наразі недоступна. Спробуйте пізніше.',
      };
    }

    return {
      success: false,
      error: errorResult.description || 'Сталася помилка при відтворенні реклами',
    };
  }
}

/**
 * Check if XP boost is currently active (x3 multiplier)
 */
export function isXpBoostActive(activeBoosters: { xp_boost_end?: number | null; xp_boost_mult?: number } | null): boolean {
  const xpBoostEnd = activeBoosters?.xp_boost_end as number | undefined;
  const xpBoostMult = activeBoosters?.xp_boost_mult as number | undefined;

  if (!xpBoostEnd || !xpBoostMult) return false;

  // Only x3 boost counts (x2 is from Stars purchases)
  return xpBoostEnd > Date.now() && xpBoostMult >= XP_BOOST_MULTIPLIER;
}

/**
 * Get remaining time for XP boost in milliseconds
 */
export function getXpBoostRemainingTime(activeBoosters: { xp_boost_end?: number | null } | null): number {
  const xpBoostEnd = activeBoosters?.xp_boost_end as number | undefined;

  if (!xpBoostEnd) return 0;

  return Math.max(0, xpBoostEnd - Date.now());
}

/**
 * Format remaining time as human-readable string (MM:SS or HH:MM:SS)
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
