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

const ADSGRAM_SDK_TIMEOUT_MS = 10000;
const ADSGRAM_POLL_INTERVAL_MS = 200;
const ADSGRAM_SCRIPT_URL = 'https://sad.adsgram.ai/js/sad.min.js';
let sdkLoadPromise: Promise<Sad | null> | null = null;

/**
 * Load AdsGram SDK dynamically if not already loaded
 */
function loadAdsgramSDK(): Promise<Sad | null> {
  if (sdkLoadPromise) return sdkLoadPromise;
  
  sdkLoadPromise = new Promise((resolve) => {
    if (window.Sad) {
      resolve(window.Sad);
      return;
    }
    
    const existing = document.querySelector(`script[src="${ADSGRAM_SCRIPT_URL}"]`);
    if (!existing) {
      console.log('[adsgram] Loading SDK dynamically...');
      const script = document.createElement('script');
      script.src = ADSGRAM_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        console.log('[adsgram] SDK script loaded');
        resolve(window.Sad || null);
      };
      script.onerror = () => {
        console.error('[adsgram] Failed to load SDK script');
        resolve(null);
      };
      document.head.appendChild(script);
    } else {
      // Script exists, wait for it
      existing.addEventListener('load', () => {
        resolve(window.Sad || null);
      });
      // Also check immediately in case already loaded
      if (window.Sad) {
        resolve(window.Sad);
      }
    }
  });
  
  return sdkLoadPromise;
}

/**
 * Wait for AdsGram SDK to be available with polling
 */
export async function waitForAdsgramSDK(timeoutMs = ADSGRAM_SDK_TIMEOUT_MS): Promise<Sad | null> {
  if (window.Sad) return window.Sad;
  
  // Try to load dynamically first
  await loadAdsgramSDK();
  
  // Now poll with timeout
  return new Promise((resolve) => {
    if (window.Sad) { resolve(window.Sad); return; }
    
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
 * Initialize AdsGram SDK (Sad API) - synchronous check
 */
export function initAdsgram(): Sad | null {
  console.log('[adsgram] Checking SDK...');
  
  if (!window.Sad) {
    console.error('[adsgram] SDK not loaded - window.Sad is undefined');
    console.log('[adsgram] Available window keys:', Object.keys(window).filter(k => k.toLowerCase().includes('ad') || k.toLowerCase().includes('ads')));
    return null;
  }

  console.log('[adsgram] SDK found!');
  return window.Sad;
}

/**
 * Initialize AdsGram SDK - async version with polling
 */
export async function initAdsgramAsync(): Promise<Sad | null> {
  console.log('[adsgram] Waiting for SDK...');
  const sad = await waitForAdsgramSDK();
  if (!sad) {
    console.error('[adsgram] SDK not loaded after waiting');
    return null;
  }
  console.log('[adsgram] SDK ready!');
  return sad;
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
          safeResolve({
            success: true,
            boostActivated: true,
          });
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
          error: error?.message || 'Сталася помилка при відтворенні реклами',
        });
      },
      onClose: () => {
        // Only resolve as failure if not already resolved by onReward
        if (!resolved) {
          console.log('[adsgram] Ad closed before completion');
          safeResolve({
            success: false,
            error: 'Рекламу закрито до завершення',
          });
        } else {
          console.log('[adsgram] Ad closed after already resolved');
        }
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
