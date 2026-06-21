import { useState, useEffect, useCallback, useRef } from 'react';
import { Battery, Gift, Zap, AlertCircle, Loader2, X, Play } from 'lucide-react';
import { hapticImpact, hapticNotification, getTelegramUserId, getRawInitData } from '../lib/telegram';
import { useTranslation } from '../i18n';
import { showError, showSuccess } from '../lib/errors';
import {
  initAdsgram,
  isAdsgramLoaded,
  showRewardAd,
} from '../services/adsgram';

// ═══════════════════════════════════════════════════════════════════════
// SESSION ADS COMPONENT
// Shows after 15 minutes of ACTIVE gameplay (tracking taps)
// Grace period: 10 min for new players (level < 10)
// ═══════════════════════════════════════════════════════════════════════

interface SessionAdModalProps {
  prestigeLevel: number;
  onReward: (type: 'income_boost' | 'energy' | 'xp_boost') => void;
  onClose: () => void;
}

export function SessionAdModal({ prestigeLevel, onReward, onClose }: SessionAdModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    // Wait for SDK to load
    const init = () => {
      if (isAdsgramLoaded()) {
        controllerRef.current = initAdsgram();
        setSdkReady(!!controllerRef.current);
      }
    };
    
    // Try immediately
    init();
    
    // If not ready, wait a bit
    if (!sdkReady) {
      const timer = setTimeout(init, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleWatchAd = useCallback(async () => {
    if (!sdkReady || !controllerRef.current) {
      setError(t('ad_system.sdk_not_loaded'));
      return;
    }

    const telegramId = getTelegramUserId();
    if (!telegramId) {
      setError(t('ad_system.auth_error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    hapticImpact('medium');

    try {
      const result = await showRewardAd(controllerRef.current, telegramId);

      if (result.success) {
        hapticNotification('success');
        // Reward based on prestige level
        if (prestigeLevel >= 1) {
          onReward('energy'); // +20 Energy for prestige 1+
        } else {
          onReward('income_boost'); // x2 Income 15 min for prestige 0
        }
        onClose();
      } else {
        setError(result.error || t('ad_system.ad_not_completed'));
        hapticNotification('warning');
      }
    } catch (err) {
      console.error('Session ad error:', err);
      setError(t('ad_system.ad_load_error'));
      showError(t('ad_system.ad_load_error'));
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [prestigeLevel, onReward, onClose, t, sdkReady]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-sm mx-4 bg-[#161B22] rounded-3xl overflow-hidden border border-white/[0.08]">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8B949E] hover:text-[#E6EDF3] z-10">
          <X size={20} />
        </button>

        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-[#10B981]/10 rounded-full flex items-center justify-center">
            <Gift className="w-7 h-7 text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-[#E6EDF3] mb-2">{t('ad.support_game')}</h2>
          <p className="text-[#8B949E] text-sm mb-4">
            {t('ad.support_game_desc')}
          </p>
        </div>

        <div className="p-4 border-t border-white/[0.08]">
          <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-3 mb-4">
            <div className="text-[#10B981] font-semibold text-center">
              {prestigeLevel >= 1 ? t('ad.energy_boost') : t('ad.x2_income')}
            </div>
            <div className="text-xs text-[#8B949E] text-center mt-1">
              {prestigeLevel >= 1 ? t('ad.continue_with_boost') : t('ad.double_passive')}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#EF4444] text-sm mb-3 bg-[#EF4444]/10 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleWatchAd}
            disabled={isLoading}
            className={`w-full h-12 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-white/[0.08] text-[#8B949E] cursor-not-allowed'
                : 'bg-[#10B981] text-[#0d1117] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('ad.loading')}</span>
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>{t('ad_system.watch_ad')}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 mt-2 text-[#8B949E] text-sm hover:text-[#E6EDF3] transition-colors"
          >
            {t('ad_system.later')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CHEST ADS COMPONENT - MANDATORY
// Shows after every 10th chest - CANNOT BE SKIPPED
// User MUST watch ad to continue playing
// ═══════════════════════════════════════════════════════════════════════

interface ChestAdModalProps {
  prestigeLevel: number;
  chestsOpened: number;
  onReward: (type: 'free_chest' | 'rare_boost' | 'energy' | 'secret_boost') => void;
  onClose: () => void;
}

export function ChestAdModal({ prestigeLevel, chestsOpened, onReward, onClose }: ChestAdModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    // Wait for SDK to load
    const init = () => {
      if (isAdsgramLoaded()) {
        controllerRef.current = initAdsgram();
        setSdkReady(!!controllerRef.current);
      }
    };
    
    init();
    
    if (!sdkReady) {
      const timer = setTimeout(init, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Prevent closing by clicking outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleWatchAd = useCallback(async () => {
    if (!sdkReady || !controllerRef.current) {
      setError(t('ad_system.sdk_not_loaded'));
      return;
    }

    const telegramId = getTelegramUserId();
    if (!telegramId) {
      setError(t('ad_system.auth_error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    hapticImpact('medium');

    try {
      const result = await showRewardAd(controllerRef.current, telegramId);

      if (result.success) {
        hapticNotification('success');
        if (prestigeLevel >= 1) {
          onReward('energy'); // +10 Energy
        } else {
          onReward('rare_boost'); // +5% rare fragment chance
        }
        onClose();
      } else {
        setError(result.error || t('ad_system.ad_not_completed'));
        hapticNotification('warning');
      }
    } catch (err) {
      console.error('Chest ad error:', err);
      setError(t('ad_system.ad_load_error'));
      showError(t('ad_system.ad_load_error'));
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [prestigeLevel, onReward, onClose, t, sdkReady]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm mx-4 bg-[#161B22] rounded-3xl overflow-hidden border border-[#FFC72C]/20 relative">
        {/* Non-skippable badge */}
        <div className="bg-[#FFC72C] py-1 text-center">
          <span className="text-xs font-semibold text-[#0d1117] uppercase tracking-wider">
            {t('ad_system.mandatory_ad')}
          </span>
        </div>
        
        <div className="p-6 pt-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#FFC72C]/10 rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-[#FFC72C]" />
          </div>
          <h2 className="text-xl font-bold text-[#E6EDF3] mb-2">
            {t('ad.chest_milestone')}
          </h2>
          <p className="text-[#8B949E] text-sm">
            {t('ad.chest_milestone_desc', { count: chestsOpened })}
          </p>
        </div>

        <div className="p-4">
          <div className="bg-[#FFC72C]/10 border border-[#FFC72C]/20 rounded-xl p-4 mb-4 text-center">
            <div className="text-[#FFC72C] font-bold text-lg">
              {prestigeLevel >= 1 ? '+10 Енергії' : '+5% рідкісний шанс'}
            </div>
            <div className="text-xs text-[#8B949E] mt-2">
              {prestigeLevel >= 1 
                ? 'Потрібно для наступного тапу' 
                : 'Для наступної легендарної скрині'}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#EF4444] text-sm mb-3 bg-[#EF4444]/10 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleWatchAd}
            disabled={isLoading}
            className={`w-full h-12 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-white/[0.08] text-[#8B949E] cursor-not-allowed'
                : 'bg-[#FFC72C] text-[#0d1117] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('ad.loading')}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>{t('ad_system.watch_to_continue')}</span>
              </>
            )}
          </button>

          {/* No skip button - this ad is MANDATORY */}
          <p className="text-center text-xs text-[#8B949E] mt-3">
            {t('ad.cannot_skip')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ENERGY RESTORE ADS COMPONENT
// +50 Energy, max 5 times per day
// ═══════════════════════════════════════════════════════════════════════

interface EnergyRestoreAdButtonProps {
  currentEnergy: number;
  maxEnergy: number;
  prestigeLevel: number;
  dailyEnergyAdsUsed: number;
  onEnergyRestored: (amount: number) => void;
  onAdUsed: () => void;
}

const MAX_ENERGY_ADS_PER_DAY = 5;
const ENERGY_RESTORE_AMOUNT = 50;

export function EnergyRestoreAdButton({
  currentEnergy,
  maxEnergy,
  prestigeLevel,
  dailyEnergyAdsUsed,
  onEnergyRestored,
  onAdUsed,
}: EnergyRestoreAdButtonProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    // Wait for SDK to load
    const init = () => {
      if (isAdsgramLoaded()) {
        controllerRef.current = initAdsgram();
        setSdkReady(!!controllerRef.current);
      }
    };
    
    init();
    
    if (!sdkReady) {
      const timer = setTimeout(init, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleWatchAd = useCallback(async () => {
    if (!sdkReady || !controllerRef.current) {
      setError(t('ad_system.sdk_not_loaded'));
      return;
    }

    const telegramId = getTelegramUserId();
    if (!telegramId) {
      setError(t('ad_system.auth_error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    hapticImpact('medium');

    try {
      // Show ad and wait for completion
      const result = await showRewardAd(controllerRef.current, telegramId);

      if (result.success) {
        // Claim reward via server with HMAC authentication
        const initData = getRawInitData();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData,
            reward_type: 'energy_restore',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          showSuccess('Енергія відновлена!');
          hapticNotification('success');
          onEnergyRestored(data.new_value - currentEnergy); // Actual restored amount
          onAdUsed();
        } else {
          setError(data.error || t('ad_system.limit_reached'));
          showError(data.error || t('ad_system.limit_reached'));
          hapticNotification('warning');
        }
      } else {
        setError(result.error || t('ad_system.ad_not_completed'));
        hapticNotification('warning');
      }
    } catch (err) {
      console.error('Energy ad error:', err);
      setError(t('ad_system.ad_load_error'));
      showError(t('ad_system.ad_load_error'));
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [onEnergyRestored, onAdUsed, currentEnergy, t, sdkReady]);

  // Only show for prestige 1+
  if (prestigeLevel < 1) return null;

  // Already at max energy
  if (currentEnergy >= maxEnergy) {
    return (
      <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] opacity-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/[0.04] rounded-lg">
            <Battery className="w-5 h-5 text-[#8B949E]" />
          </div>
          <div className="flex-1">
            <div className="text-[#E6EDF3] font-medium text-sm">{t('ad.energy_full')}</div>
            <div className="text-xs text-[#8B949E]">{t('ad.use_taps_x5')}</div>
          </div>
        </div>
      </div>
    );
  }

  // Daily limit reached
  if (dailyEnergyAdsUsed >= MAX_ENERGY_ADS_PER_DAY) {
    return (
      <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] opacity-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/[0.04] rounded-lg">
            <Battery className="w-5 h-5 text-[#8B949E]" />
          </div>
          <div className="flex-1">
            <div className="text-[#E6EDF3] font-medium text-sm">{t('ad_system.limit_exceeded')}</div>
            <div className="text-xs text-[#8B949E]">{MAX_ENERGY_ADS_PER_DAY}/{MAX_ENERGY_ADS_PER_DAY} {t('common.today')}</div>
          </div>
        </div>
      </div>
    );
  }

  const remaining = MAX_ENERGY_ADS_PER_DAY - dailyEnergyAdsUsed;

  return (
    <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08]">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[#00E5FF]/10 rounded-lg">
          <Battery className="w-5 h-5 text-[#00E5FF]" />
        </div>
        <div className="flex-1">
          <div className="text-[#E6EDF3] font-medium text-sm">{t('ad_system.restore_energy')}</div>
          <div className="text-xs text-[#00E5FF]/80">+{ENERGY_RESTORE_AMOUNT} {t('ad_system.energy_amount').replace('+{amount} ', '')}</div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[#EF4444] text-xs mb-2 bg-[#EF4444]/10 rounded px-2 py-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleWatchAd}
        disabled={isLoading}
        className={`w-full h-10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          isLoading
            ? 'bg-white/[0.08] text-[#8B949E] cursor-not-allowed'
            : 'bg-[#00E5FF] text-[#0d1117] active:scale-[0.98]'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('ad.loading')}</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>+{ENERGY_RESTORE_AMOUNT} Енергії</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-[#8B949E] mt-2">
        {remaining}/{MAX_ENERGY_ADS_PER_DAY} сьогодні
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SESSION AD TRIGGER HOOK
// Tracks ACTIVE gameplay time and triggers ad modal
// Only counts time when user is actively playing (tapping)
// ═══════════════════════════════════════════════════════════════════════

const SESSION_AD_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes of ACTIVE gameplay
const NEW_PLAYER_GRACE_MS = 10 * 60 * 1000; // 10 minutes for new players
const NEW_PLAYER_LEVEL_THRESHOLD = 10;
const ACTIVITY_TIMEOUT_MS = 30 * 1000; // 30 seconds - if no tap, consider inactive

export function useSessionAdTrigger(
  level: number,
  sessionStartAt: number,
  lastSessionAdAt?: number,
  isActive?: boolean // Whether user is currently active (tapping)
) {
  const [shouldShowSessionAd, setShouldShowSessionAd] = useState(false);
  const activeTimeRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // New player grace period
    if (level < NEW_PLAYER_LEVEL_THRESHOLD) {
      const graceEnd = sessionStartAt + NEW_PLAYER_GRACE_MS;
      if (Date.now() < graceEnd) {
        return; // Don't show ad during grace period
      }
    }

    // Start tracking active time
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // Only count as active if user tapped within last 30 seconds
      if (isActive || timeSinceLastActivity < ACTIVITY_TIMEOUT_MS) {
        activeTimeRef.current += 1000; // Add 1 second of active time
        lastActivityRef.current = now;
      }
      
      // Check if 15 minutes of active time accumulated
      if (activeTimeRef.current >= SESSION_AD_INTERVAL_MS) {
        const lastAd = lastSessionAdAt || sessionStartAt;
        // Only show if more than 15 min since last ad was shown
        if (now - lastAd >= SESSION_AD_INTERVAL_MS) {
          setShouldShowSessionAd(true);
          activeTimeRef.current = 0; // Reset active time counter
        }
      }
    }, 1000); // Check every second

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [level, sessionStartAt, lastSessionAdAt, isActive]);

  // Track when user becomes active (taps)
  useEffect(() => {
    if (isActive) {
      lastActivityRef.current = Date.now();
    }
  }, [isActive]);

  const dismissSessionAd = useCallback(() => {
    setShouldShowSessionAd(false);
  }, []);

  return { shouldShowSessionAd, dismissSessionAd };
}

// ═══════════════════════════════════════════════════════════════════════
// CHEST AD COUNTER HOOK
// Tracks chest openings and triggers ad modal every 10th
// ═══════════════════════════════════════════════════════════════════════

const CHEST_AD_INTERVAL = 10;

export function useChestAdTrigger() {
  const [chestCount, setChestCount] = useState(0);
  const [shouldShowChestAd, setShouldShowChestAd] = useState(false);
  const [totalChestsOpened, setTotalChestsOpened] = useState(0);

  const recordChestOpened = useCallback(() => {
    setChestCount(prev => {
      const newCount = prev + 1;
      setTotalChestsOpened(t => t + 1);
      if (newCount >= CHEST_AD_INTERVAL) {
        setShouldShowChestAd(true);
        return 0; // Reset counter
      }
      return newCount;
    });
  }, []);

  const dismissChestAd = useCallback(() => {
    setShouldShowChestAd(false);
  }, []);

  return {
    chestCount,
    totalChestsOpened,
    shouldShowChestAd,
    recordChestOpened,
    dismissChestAd
  };
}
