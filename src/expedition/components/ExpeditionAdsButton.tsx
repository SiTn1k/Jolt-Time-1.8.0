import { useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { initAdsgramAsync, showRewardAd } from '../../services/adsgram';
import { getTelegramUserId } from '../../lib/telegram';

interface ExpeditionAdsButtonProps {
  onComplete: () => void;
  onError?: (error: string) => void;
}

export function ExpeditionAdsButton({ onComplete, onError }: ExpeditionAdsButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleWatchAd = useCallback(async () => {
    setLoading(true);
    try {
      const sad = await initAdsgramAsync();
      if (!sad) {
        onError?.('Реклама наразі недоступна');
        setLoading(false);
        return;
      }
      
      const telegramId = getTelegramUserId();
      const result = await showRewardAd(sad, telegramId || 0);
      
      if (result.success) {
        onComplete();
      } else {
        onError?.(result.error || 'Рекламу не завершено');
      }
    } catch {
      onError?.('Помилка показу реклами');
    } finally {
      setLoading(false);
    }
  }, [onComplete, onError]);

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
