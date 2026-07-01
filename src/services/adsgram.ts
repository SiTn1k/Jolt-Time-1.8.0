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
 * Token: e73dc047768d42dba4d64432274c05c1
 */

// AdsGram Block ID for reward ads (Telegram-approved exclusive block)
export const ADSGRAM_BLOCK_ID = '35644';
// AdsGram Token
export const ADSGRAM_TOKEN = 'e73dc047768d42dba4d64432274c05c1';

// XP Boost configuration - EXCLUSIVE reward (cannot be bought)
export const XP_BOOST_MULTIPLIER = 3;
export const XP_BOOST_DURATION_MS = 30 * 60 * 1000; // 30 minutes (fixed, not extendable)

// SDK loading configuration
const ADSGRAM_SDK_URL = 'https://sad.adsgram.ai/js/sad.min.js';
const ADSGRAM_POLL_INTERVAL_MS = 100;
const ADSGRAM_LOAD_TIMEOUT_MS = 10000;

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
  userId?: string;
}

/**
 * AdsGram SDK types (Sad API)
 */
interface SadConfig {
  blockId: string;
  token: string;
  onReward?: () => void;
  onError?: (error: { message: string }) => void;
  onClose?: () => void;
}

interface Sad {
  showRewardedAd: (config: SadConfig) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    Sad?: Sad;
  }
}

/**
 * Check if AdsGram SDK is loaded
 */
export function isAdsgramLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.Sad;
}

/**
 * Dynamically load the AdsGram SDK script if not already loaded
 */
function loadAdsgramScript(): Promise<Sad | null> {
  return new Promise((resolve) => {
    if (window.Sad) {
      resolve(window.Sad);
      return;
    }

    // Check if script is already in DOM
    const existing = document.querySelector(`script[src="${ADSGRAM_SDK_URL}"]`);
    if (existing) {
      // Script tag exists but SDK not loaded yet, wait for it
      const observer = new MutationObserver(() => {
        if (window.Sad) {
          observer.disconnect();
          resolve(window.Sad);
        }
      });
      observer.observe(document.head, { childList: true, subtree: true });
      return;
    }

    // Create and append the script
    const script = document.createElement('script');
    script.src = ADSGRAM_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Sad) {
        resolve(window.Sad);
      } else {
        console.error('[adsgram] Script loaded but window.Sad not defined');
        resolve(null);
      }
    };
    script.onerror = () => {
      console.error('[adsgram] Failed to load AdsGram SDK script');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

/**
 * Wait for SDK to be available with polling
 */
function waitForSdk(timeoutMs: number): Promise<Sad | null> {
  return new Promise((resolve) => {
    if (window.Sad) {
      resolve(window.Sad);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.Sad) {
        clearInterval(interval);
        resolve(window.Sad);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        console.error('[adsgram] SDK load timeout after', timeoutMs, 'ms');
        resolve(null);
      }
    }, ADSGRAM_POLL_INTERVAL_MS);
  });
}

/**
 * Initialize AdsGram SDK with automatic loading and waiting
 * Use this for async initialization that handles SDK loading
 */
export async function initAdsgramAsync(): Promise<Sad | null> {
  console.log('[adsgram] Initializing SDK...');

  // If already loaded, return immediately
  if (window.Sad) {
    console.log('[adsgram] SDK already loaded');
    return window.Sad;
  }

  // Try to load the script dynamically
  await loadAdsgramScript();

  // Wait for SDK to be available
  const sad = await waitForSdk(ADSGRAM_LOAD_TIMEOUT_MS);
  if (sad) {
    console.log('[adsgram] SDK ready!');
  } else {
    console.error('[adsgram] SDK failed to load');
  }

  return sad;
}

/**
 * Initialize AdsGram SDK (sync version - returns immediately if not loaded)
 * For components that need a quick check
 */
export function initAdsgram(): Sad | null {
  if (window.Sad) {
    return window.Sad;
  }
  // Kick off async loading in background for next time
  initAdsgramAsync().catch(() => {});
  return null;
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
 * Show reward ad and handle completion (Sad API)
 */
export async function showRewardAd(
  sad: Sad,
  telegramId: number
): Promise<AdShowResult> {
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (result: AdShowResult) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    console.log('[adsgram] Showing reward ad...');

    sad.showRewardedAd({
      blockId: ADSGRAM_BLOCK_ID,
      token: ADSGRAM_TOKEN,
      onReward: async () => {
        console.log('[adsgram] Ad watched, granting reward via server...');
        const grantResult = await grantXpBoostFromServer(telegramId);
        console.log('[adsgram] Grant result:', JSON.stringify(grantResult));

        if (grantResult.success) {
          safeResolve({ success: true, boostActivated: true });
        } else {
          safeResolve({
            success: false,
            error: grantResult.error || 'Failed to grant reward',
            alreadyActive: grantResult.alreadyActive,
          });
        }
      },
      onError: (error) => {
        console.error('[adsgram] Ad error:', error);
        safeResolve({
          success: false,
          error: error?.message || 'Ad playback error',
        });
      },
      onClose: () => {
        console.log('[adsgram] Ad closed before completion');
        safeResolve({ success: false, error: 'Ad closed before completion' });
      },
    });
  });
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
