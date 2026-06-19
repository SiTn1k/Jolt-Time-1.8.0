import { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { getTelegramUserId } from '../lib/telegram';
import { hapticImpact, hapticNotification } from '../lib/telegram';
import {
  initAdsgram,
  showRewardAd,
  isXpBoostActive,
  getXpBoostRemainingTime,
  formatRemainingTime,
  XP_BOOST_DURATION_MS,
  type AdShowResult,
} from '../services/adsgram';

interface AdsGramButtonProps {
  activeBoosters: Record<string, unknown>;
  onBoostActivated: () => void;
}

export function AdsGramButton({ activeBoosters, onBoostActivated }: AdsGramButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  // Check if x3 boost is active
  const boostActive = isXpBoostActive(activeBoosters);

  // Initialize AdsGram controller
  useEffect(() => {
    controllerRef.current = initAdsgram();
  }, []);

  // Update remaining time every second
  useEffect(() => {
    const updateRemaining = () => {
      const remaining = getXpBoostRemainingTime(activeBoosters);
      setRemainingTime(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeBoosters]);

  // Handle ad button click
  const handleShowAd = useCallback(async () => {
    if (isLoading || boostActive) return;

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
      const result: AdShowResult = await showRewardAd(controller, telegramId);

      if (result.success && result.boostActivated) {
        hapticNotification('success');
        onBoostActivated();
      } else if (result.alreadyActive) {
        setError('XP буст вже активний. Дочекайся завершення.');
        hapticNotification('warning');
      } else if (result.error) {
        setError(result.error);
        hapticNotification('error');
      }
    } catch (err) {
      console.error('Ad show error:', err);
      setError('Сталася помилка');
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, boostActive, onBoostActivated]);

  // Boost is active - show status with correct duration
  if (boostActive) {
    return (
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-4 border border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">XP x3 активний</h3>
              <p className="text-green-400 text-sm">
                Залишилось: {formatRemainingTime(remainingTime)}
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-400">x3</div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5 mt-3">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2.5 rounded-full transition-all duration-1000"
            style={{ width: `${Math.max(0, (remainingTime / XP_BOOST_DURATION_MS) * 100)}%` }}
          />
        </div>
        <p className="text-gray-400 text-xs text-center mt-2">
          Буст діє 30 хвилин та не подовжується
        </p>
      </div>
    );
  }

  // Show ad button
  return (
    <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-2xl p-4 border border-amber-500/30">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-amber-500/20 rounded-xl">
          <Gift className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">Безкоштовний XP бустер</h3>
          <p className="text-amber-400/80 text-sm">x3 XP на 30 хвилин за перегляд реклами</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-3 bg-red-500/10 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleShowAd}
        disabled={isLoading || boostActive}
        className={`w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          isLoading || boostActive
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-900/30 active:scale-[0.98]'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Завантаження...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Отримати x3 XP на 30 хв</span>
          </>
        )}
      </button>

      <p className="text-gray-500 text-xs text-center mt-2">
        Безкоштовно • Переглянь рекламу до кінця • Буст не подовжується
      </p>
    </div>
  );
}
