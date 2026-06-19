/**
 * AdsGram SDK Service for Virtual Museum Tapper Game
 *
 * Provides integration with AdsGram Reward Video Ads.
 * Block ID: 35432
 *
 * Reward: x3 XP multiplier for EXACTLY 30 minutes (does not extend)
 */

import type { ShowPromiseResult } from '@adsgram/react';

// AdsGram Block ID for reward ads
export const ADSGRAM_BLOCK_ID = '35432';

// XP Boost configuration
export const XP_BOOST_MULTIPLIER = 3;
export const XP_BOOST_DURATION_MS = 30 * 60 * 1000; // 30 minutes (fixed, not extendable)

// Supabase Edge Function URL for granting rewards
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
 * Types for AdsGram SDK
 */
interface AdsgramController {
  show: () => Promise<ShowPromiseResult>;
}

declare global {
  interface Window {
    Adsgram?: {
      init: (config: { blockId: string; debug?: boolean }) => AdsgramController;
    };
  }
}

/**
 * Initialize AdsGram SDK
 */
export function initAdsgram(blockId: string = ADSGRAM_BLOCK_ID, debug = false): AdsgramController | null {
  if (!window.Adsgram) {
    console.error('AdsGram SDK not loaded');
    return null;
  }

  try {
    return window.Adsgram.init({ blockId, debug });
  } catch (err) {
    console.error('Failed to initialize AdsGram:', err);
    return null;
  }
}

/**
 * Grant XP boost via server
 * Server-side validation ensures boost cannot be forged
 */
export async function grantXpBoostFromServer(telegramId: number): Promise<{ success: boolean; error?: string; alreadyActive?: boolean }> {
  try {
    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userid: telegramId.toString(),
        ad_id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        reward_type: 'xp_boost',
      }),
    });

    const data = await response.json();

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
    console.error('Failed to grant XP boost:', err);
    return {
      success: false,
      error: 'Network error',
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
export function isXpBoostActive(activeBoosters: Record<string, unknown>): boolean {
  const xpBoostEnd = activeBoosters?.xp_boost_end as number | undefined;
  const xpBoostMult = activeBoosters?.xp_boost_mult as number | undefined;

  if (!xpBoostEnd || !xpBoostMult) return false;

  // Only x3 boost counts (x2 is from Stars purchases)
  return xpBoostEnd > Date.now() && xpBoostMult >= XP_BOOST_MULTIPLIER;
}

/**
 * Get remaining time for XP boost in milliseconds
 */
export function getXpBoostRemainingTime(activeBoosters: Record<string, unknown>): number {
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
