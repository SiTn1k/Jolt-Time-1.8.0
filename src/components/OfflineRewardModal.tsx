import { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { initAdsgram } from '../services/adsgram';
import { hapticImpact, hapticNotification } from '../lib/telegram';

interface OfflineGains {
  xp: number;
  currency: number;
}

interface OfflineRewardModalProps {
  offlineGains: OfflineGains;
  currencyIcon: string;
  onClaim: (watchAd: boolean) => Promise<void>;
  onDismiss: () => void;
  canWatchAd: boolean;
  adsRemaining: number;
}

export function OfflineRewardModal({
  offlineGains,
  currencyIcon,
  onClaim,
  onDismiss,
  canWatchAd,
  adsRemaining,
}: OfflineRewardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    controllerRef.current = initAdsgram();
  }, []);

  const handleWatchAd = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) {
      setAdError('AdsGram SDK не завантажено');
      return;
    }

    setIsLoading(true);
    setAdError(null);
    hapticImpact('medium');

    try {
      const result = await controller.show();

      if (result.done) {
        // Ad watched successfully - claim via server
        await onClaim(true);
        setClaimed(true);
        hapticNotification('success');
      } else {
        setAdError('Рекламу не завершено. Подивись до кінця для x2 бонусу.');
        hapticNotification('warning');
      }
    } catch (err) {
      console.error('Offline ad error:', err);
      setAdError('Не вдалося завантажити рекламу. Спробуйте пізніше.');
      hapticNotification('error');
    } finally {
      setIsLoading(false);
    }
  }, [onClaim]);

  const handleClaimNormal = useCallback(async () => {
    setIsLoading(true);
    try {
      await onClaim(false);
      setClaimed(true);
    } catch (err) {
      setAdError('Сталася помилка');
    } finally {
      setIsLoading(false);
    }
  }, [onClaim]);

  if (claimed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full text-center border border-green-500/40">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Прибуток отримано!</h3>
          <p className="text-sm text-gray-400 mb-4">
            +{formatNumber(offlineGains.xp)} XP + {formatNumber(offlineGains.currency)} {currencyIcon}
          </p>
          <button
            onClick={onDismiss}
            className="w-full py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
          >
            Продовжити
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-yellow-500/40">
        <div className="text-center">
          <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Пасивний дохід</h3>
          <p className="text-sm text-gray-400 mb-4">
            Поки вас не було, ваші генератори заробили:
          </p>

          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">XP</span>
              <span className="text-yellow-400 font-bold">+{formatNumber(offlineGains.xp)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{currencyIcon} Валюта</span>
              <span className="text-green-400 font-bold">+{formatNumber(offlineGains.currency)}</span>
            </div>
          </div>

          {canWatchAd && adsRemaining > 0 && (
            <>
              <button
                onClick={handleWatchAd}
                disabled={isLoading}
                className="w-full py-3 mb-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Перегляд реклами...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Подвоїти за рекламу (x2)
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mb-3">
                Залишилось {adsRemaining} переглядів сьогодні
              </p>
            </>
          )}

          {adError && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-3">
              <AlertCircle className="w-4 h-4" />
              {adError}
            </div>
          )}

          <button
            onClick={handleClaimNormal}
            disabled={isLoading}
            className="w-full py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Забрати звичайну суму
          </button>
        </div>
      </div>
    </div>
  );
}
