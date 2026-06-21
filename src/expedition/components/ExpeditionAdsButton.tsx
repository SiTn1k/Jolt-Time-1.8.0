import { useState, useCallback, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { initAdsgram, showRewardAd, isAdsgramLoaded } from '../../services/adsgram';
import { getTelegramUserId } from '../../lib/telegram';

interface ExpeditionAdsButtonProps {
  onComplete: () => void;
  onError?: (error: string) => void;
}

export function ExpeditionAdsButton({ onComplete, onError }: ExpeditionAdsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sdkAvailable, setSdkAvailable] = useState(true);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    // Initialize SDK
    if (isAdsgramLoaded()) {
      controllerRef.current = initAdsgram();
      setSdkAvailable(true);
      console.log('[ExpeditionAds] SDK loaded successfully');
    } else {
      setSdkAvailable(false);
      console.warn('[ExpeditionAds] SDK not loaded - ads disabled');
    }
  }, []);

  const handleWatchAd = useCallback(async () => {
    if (!sdkAvailable || !controllerRef.current) {
      onError?.('Рекламна система тимчасово недоступна');
      return;
    }

    const telegramId = getTelegramUserId();
    if (!telegramId) {
      onError?.('Помилка автентифікації');
      return;
    }

    setLoading(true);
    try {
      const result = await showRewardAd(controllerRef.current, telegramId);
      
      if (result.success) {
        onComplete();
      } else {
        onError?.(result.error || 'Рекламу не завершено');
      }
    } catch (err) {
      console.error('[ExpeditionAds] Error:', err);
      onError?.('Помилка показу реклами');
    } finally {
      setLoading(false);
    }
  }, [onComplete, onError, sdkAvailable]);

  // Show disabled state if SDK not available
  if (!sdkAvailable) {
    return (
      <button
        disabled
        className="w-full h-8 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all opacity-50 cursor-not-allowed"
        style={{ backgroundColor: '#6B7280', color: '#fff' }}
        title="Реклама тимчасово недоступна"
      >
        <Zap className="w-3 h-3" />
        Реклама недоступна
      </button>
    );
  }

  return (
    <button
      onClick={handleWatchAd}
      disabled={loading}
      className="w-full h-8 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all active:scale-[0.98]"
      style={{ 
        backgroundColor: '#10B981', 
        color: '#fff',
        opacity: loading ? 0.7 : 1 
      }}
    >
      <Zap className="w-3 h-3" />
      {loading ? 'Завантаження...' : 'Прискорити за рекламу'}
    </button>
  );
}
