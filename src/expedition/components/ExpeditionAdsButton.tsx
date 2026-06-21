import { useState, useCallback, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { initAdsgram, showRewardAd } from '../../services/adsgram';

interface ExpeditionAdsButtonProps {
  onComplete: () => void;
  onError?: (error: string) => void;
}

export function ExpeditionAdsButton({ onComplete, onError }: ExpeditionAdsButtonProps) {
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<ReturnType<typeof initAdsgram>>(null);

  useEffect(() => {
    controllerRef.current = initAdsgram();
  }, []);

  const handleWatchAd = useCallback(async () => {
    setLoading(true);
    try {
      const success = await showRewardAd({
        blockId: '35644',
        userId: 'expedition_speedup',
      });
      
      if (success) {
        onComplete();
      }
    } catch (err) {
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
