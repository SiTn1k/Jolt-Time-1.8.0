import { useState, useEffect, useCallback, useRef } from 'react';
import { Battery, Gift, Zap, AlertCircle, Loader2, X } from 'lucide-react';
import { hapticImpact, hapticNotification } from '../lib/telegram';
import { getTelegramUserId } from '../lib/telegram';
import {
  initAdsgram,
} from '../services/adsgram';

// ═══════════════════════════════════════════════════════════════════════
// SESSION ADS COMPONENT
// Shows after 20 minutes of active gameplay
// ═══════════════════════════════════════════════════════════════════════

interface SessionAdModalProps {
  prestigeLevel: number;
  onReward: (type: 'income_boost' | 'energy' | 'xp_boost') => void;
  onClose: () => void;
}

export function SessionAdModal({ prestigeLevel, onReward, onClose }: SessionAdModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    controllerRef.current = initAdsgram();
  }, []);

  const handleWatchAd = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) {
      setError('AdsGram SDK не завантажено');
      return;
    }

    const telegramId = getTelegramUserId();
    if (!telegramId) {
      setError('Помилка авторизації');
      return;
    }

    setIsLoading(true);
    setError(null);
    hapticImpact('medium');

    try {
      const result = await controller.show();

      if (result.done) {
        hapticNotification('success');
        // Reward based on prestige level
        if (prestigeLevel >= 1) {
          onReward('energy'); // +20 Energy for prestige 1+
        } else {
          onReward('income_boost'); // x2 Income 15 min for prestige 0
        }
        onClose();
      } else {
        setError('Рекламу не завершено');
        hapticNotification('warning');
      }
    } catch (err) {
      console.error('Session ad error:', err);
      setError('Не вдалося завантажити рекламу');
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [prestigeLevel, onReward, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <X size={24} />
        </button>

        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Підтримай гру!</h2>
          <p className="text-gray-400 text-sm mb-4">
            Реклама допомагає розвивати Музей України, підтримувати сервери гри та створювати новий контент.
            Також ви можете підтримати проєкт через Telegram Stars.
          </p>
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
            <div className="text-green-400 font-bold text-center">
              {prestigeLevel >= 1 ? '+20 Енергії' : 'x2 Дохід на 15 хв'}
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              {prestigeLevel >= 1 ? 'Продовжуй грати з бустом' : 'Подвійний пасивний дохід'}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-3 bg-red-500/10 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleWatchAd}
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Завантаження...</span>
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>Дивитись рекламу</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 mt-2 text-gray-400 text-sm hover:text-white transition-colors"
          >
            Пізніше
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CHEST ADS COMPONENT
// Shows after every 10th chest
// ═══════════════════════════════════════════════════════════════════════

interface ChestAdModalProps {
  prestigeLevel: number;
  chestsOpened: number;
  onReward: (type: 'free_chest' | 'rare_boost' | 'energy' | 'secret_boost') => void;
  onClose: () => void;
}

export function ChestAdModal({ prestigeLevel, chestsOpened, onReward, onClose }: ChestAdModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    controllerRef.current = initAdsgram();
  }, []);

  const handleWatchAd = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) {
      setError('AdsGram SDK не завантажено');
      return;
    }

    setIsLoading(true);
    setError(null);
    hapticImpact('medium');

    try {
      const result = await controller.show();

      if (result.done) {
        hapticNotification('success');
        if (prestigeLevel >= 1) {
          onReward('energy'); // +10 Energy
        } else {
          onReward('rare_boost'); // +5% rare fragment chance
        }
        onClose();
      } else {
        setError('Рекламу не завершено');
        hapticNotification('warning');
      }
    } catch (err) {
      console.error('Chest ad error:', err);
      setError('Не вдалося завантажити рекламу');
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [prestigeLevel, onReward, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-purple-500/30">
        <div className="p-6 text-center bg-gradient-to-b from-purple-900/50 to-gray-900">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Чудово! Відкрито {chestsOpened} скринь</h2>
          <p className="text-gray-400 text-sm">
            Отримай бонус за відкриття кожної 10-ї скрині!
          </p>
        </div>

        <div className="p-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
            <div className="text-purple-400 font-bold text-center">
              {prestigeLevel >= 1 ? '+10 Енергії' : '+5% шанс рідкісного'}
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              {prestigeLevel >= 1 ? 'Наступний тап' : 'Для наступної скрині'}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-3 bg-red-500/10 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleWatchAd}
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mb-2 ${
              isLoading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Завантаження...</span>
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                <span>Отримати бонус</span>
              </>
            )}
          </button>

          <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors">
            Пропустити
          </button>
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    controllerRef.current = initAdsgram();
  }, []);

  // Only show for prestige 1+
  if (prestigeLevel < 1) return null;

  // Already at max energy
  if (currentEnergy >= maxEnergy) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 opacity-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700/50 rounded-lg">
            <Battery className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">Енергія повна</div>
            <div className="text-xs text-gray-500">Використай тапи для x5 буста</div>
          </div>
        </div>
      </div>
    );
  }

  // Daily limit reached
  if (dailyEnergyAdsUsed >= MAX_ENERGY_ADS_PER_DAY) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 opacity-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700/50 rounded-lg">
            <Battery className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">Ліміт вичерпано</div>
            <div className="text-xs text-gray-500">{MAX_ENERGY_ADS_PER_DAY}/{MAX_ENERGY_ADS_PER_DAY} на сьогодні</div>
          </div>
        </div>
      </div>
    );
  }

  const handleWatchAd = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) {
      setError('AdsGram SDK не завантажено');
      return;
    }

    const telegramId = getTelegramUserId();
    if (!telegramId) {
      setError('Помилка авторизації');
      return;
    }

    setIsLoading(true);
    setError(null);
    hapticImpact('medium');

    try {
      const result = await controller.show();

      if (result.done) {
        // Claim reward via server
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: telegramId,
            reward_type: 'energy_restore',
          }),
        });

        const data = await response.json();

        if (data.success) {
          hapticNotification('success');
          onEnergyRestored(data.new_value - currentEnergy); // Actual restored amount
          onAdUsed();
        } else {
          setError(data.error || 'Ліміт вичерпано');
          hapticNotification('warning');
        }
      } else {
        setError('Рекламу не завершено');
        hapticNotification('warning');
      }
    } catch (err) {
      console.error('Energy ad error:', err);
      setError('Не вдалося завантажити рекламу');
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [onEnergyRestored, onAdUsed, currentEnergy]);

  const remaining = MAX_ENERGY_ADS_PER_DAY - dailyEnergyAdsUsed;

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-3 border border-blue-500/30">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Battery className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-white font-medium text-sm">Відновити енергію</div>
          <div className="text-xs text-blue-400/80">+{ENERGY_RESTORE_AMOUNT} енергії за рекламу</div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs mb-2 bg-red-500/10 rounded px-2 py-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleWatchAd}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          isLoading
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Завантаження...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>+{ENERGY_RESTORE_AMOUNT} Енергії</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-gray-500 mt-2">
        {remaining}/{MAX_ENERGY_ADS_PER_DAY} сьогодні
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SESSION AD TRIGGER HOOK
// Tracks session time and triggers ad modal
// ═══════════════════════════════════════════════════════════════════════

const SESSION_AD_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes
const NEW_PLAYER_GRACE_MS = 5 * 60 * 1000; // 5 minutes for new players
const NEW_PLAYER_LEVEL_THRESHOLD = 10;

export function useSessionAdTrigger(
  level: number,
  sessionStartAt: number,
  lastSessionAdAt?: number
) {
  const [shouldShowSessionAd, setShouldShowSessionAd] = useState(false);

  useEffect(() => {
    // New player grace period
    if (level < NEW_PLAYER_LEVEL_THRESHOLD) {
      const graceEnd = sessionStartAt + NEW_PLAYER_GRACE_MS;
      if (Date.now() < graceEnd) {
        return; // Don't show ad during grace period
      }
    }

    // Check if 20 minutes have passed since last session ad (or session start)
    const lastAd = lastSessionAdAt || sessionStartAt;
    const timeSinceLastAd = Date.now() - lastAd;

    if (timeSinceLastAd >= SESSION_AD_INTERVAL_MS) {
      setShouldShowSessionAd(true);
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - (lastSessionAdAt || sessionStartAt);
      if (elapsed >= SESSION_AD_INTERVAL_MS) {
        setShouldShowSessionAd(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [level, sessionStartAt, lastSessionAdAt]);

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
