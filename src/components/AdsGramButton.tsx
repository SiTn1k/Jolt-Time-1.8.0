import { useState, useEffect, useCallback } from 'react';
import { Zap, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { getTelegramUserId } from '../lib/telegram';
import { hapticImpact, hapticNotification } from '../lib/telegram';
import {
  initAdsgramAsync,
  showRewardAd,
  isXpBoostActive,
  getXpBoostRemainingTime,
  formatRemainingTime,
  XP_BOOST_DURATION_MS,
} from '../services/adsgram';
import type { ActiveBoosters } from '../types/game';

interface AdsGramButtonProps {
  activeBoosters: ActiveBoosters;
  onBoostActivated: () => void;
}

export function AdsGramButton({ activeBoosters, onBoostActivated }: AdsGramButtonProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sdkReady, setSdkReady] = useState(false);

  // Check if x3 boost is active
  const boostActive = isXpBoostActive(activeBoosters);

  // Initialize AdsGram SDK (async with polling)
  useEffect(() => {
    let cancelled = false;
    console.log('[AdsGramButton] Initializing AdsGram SDK...');
    
    (async () => {
      const sad = await initAdsgramAsync();
      if (!cancelled) {
        if (sad) {
          console.log('[AdsGramButton] AdsGram SDK initialized successfully');
          setSdkReady(true);
        } else {
          console.error('[AdsGramButton] Failed to initialize AdsGram SDK');
        }
      }
    })();
    
    return () => { cancelled = true; };
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

    setIsLoading(true);
    setError(null);
    hapticImpact('medium');

    console.log('[AdsGramButton] Initializing SDK...');
    const sad = await initAdsgramAsync();
    
    if (!sad) {
      console.error('[AdsGramButton] SDK not ready');
      setError('Реклама наразі недоступна. Спробуйте пізніше.');
      setIsLoading(false);
      return;
    }

    const telegramId = getTelegramUserId();
    if (!telegramId) {
      console.error('[AdsGramButton] Telegram ID not found');
      setError('Помилка авторизації');
      setIsLoading(false);
      return;
    }

    console.log('[AdsGramButton] Showing reward ad...');

    try {
      const result = await showRewardAd(sad, telegramId);
      console.log('[AdsGramButton] Ad result:', result);

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
      console.error('[AdsGramButton] Ad show error:', err);
      setError('Сталася помилка. Спробуй ще раз.');
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, boostActive, onBoostActivated]);

  // Boost is active - show status with correct duration
  if (boostActive) {
    return (
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10B981]/20 rounded-xl">
              <Zap className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-[#E6EDF3] font-semibold">XP x3 активний</h3>
              <p className="text-[#8B949E] text-sm">
                Залишилось: {formatRemainingTime(remainingTime)}
              </p>
            </div>
          </div>
          <div className="text-xl font-bold text-[#10B981]">x3</div>
        </div>
        <div className="w-full bg-white/[0.08] rounded-full h-2 mt-3">
          <div
            className="bg-[#10B981] h-2 rounded-full transition-all duration-1000"
            style={{ width: `${Math.max(0, (remainingTime / XP_BOOST_DURATION_MS) * 100)}%` }}
          />
        </div>
        <p className="text-[#8B949E] text-xs text-center mt-2">
          Буст діє 30 хвилин та не подовжується
        </p>
      </div>
    );
  }

  // Show ad button
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[#FFC72C]/10 rounded-xl">
          <Gift className="w-5 h-5 text-[#FFC72C]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[#E6EDF3] font-semibold">Безкоштовний XP бустер</h3>
          <p className="text-[#8B949E] text-sm">x3 XP на 30 хвилин за перегляд реклами</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[#EF4444] text-sm mb-3 bg-[#EF4444]/10 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleShowAd}
        disabled={isLoading || boostActive}
        className={`w-full h-12 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
          isLoading || boostActive
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
            <Zap className="w-5 h-5" />
            <span>Отримати x3 XP на 30 хв</span>
          </>
        )}
      </button>

      <p className="text-[#8B949E] text-xs text-center mt-2">
        Безкоштовно • Переглянь рекламу до кінця • Буст не подовжується
      </p>
    </div>
  );
}
