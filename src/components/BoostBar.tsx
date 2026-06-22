/**
 * BoostBar - Always visible boost bar with active boosts and ad buttons
 * 
 * Shows: XP boost, Currency boost, Daily streak, Watch ad buttons
 * Designed for mobile-first Telegram Mini App
 */

import { memo, useMemo } from 'react';
import { Star, Coins, Calendar, PlayCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

interface BoostInfo {
  xpMultiplier: number;
  xpBoostEndsAt: number | null;
  currencyMultiplier: number;
  currencyBoostEndsAt: number | null;
  dailyStreak: number;
  bestStreak: number;
}

interface BoostBarProps {
  boostInfo: BoostInfo;
  onWatchAd?: () => void;
  adsRemaining?: number;
  disabled?: boolean;
}

function formatTimeRemaining(endsAt: number | null): string {
  if (!endsAt || endsAt <= Date.now()) return '';
  
  const remaining = Math.max(0, endsAt - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}г ${mins}хв`;
  }
  
  if (minutes > 0) {
    return `${minutes}хв`;
  }
  
  return `${seconds}сек`;
}

function formatTimeRemainingShort(endsAt: number | null): string {
  if (!endsAt || endsAt <= Date.now()) return '';
  
  const remaining = Math.max(0, endsAt - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const BoostBar = memo(function BoostBar({
  boostInfo,
  onWatchAd,
  adsRemaining = 3,
  disabled = false,
}: BoostBarProps) {
  const { t } = useTranslation();

  const hasActiveBoosts = useMemo(() => {
    const now = Date.now();
    return (
      (boostInfo.xpBoostEndsAt && boostInfo.xpBoostEndsAt > now) ||
      (boostInfo.currencyBoostEndsAt && boostInfo.currencyBoostEndsAt > now)
    );
  }, [boostInfo]);

  const xpTimeRemaining = formatTimeRemainingShort(boostInfo.xpBoostEndsAt);
  const currencyTimeRemaining = formatTimeRemainingShort(boostInfo.currencyBoostEndsAt);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border-y border-gray-700/50 px-3 py-2">
      {/* Active Boosts Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-gray-400 font-medium">
          {t('boosts.active', 'АКТИВНІ')}
        </span>
        
        <div className="flex items-center gap-2">
          {/* XP Boost */}
          {boostInfo.xpMultiplier > 1 && (
            <div className={`
              flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
              ${xpTimeRemaining 
                ? 'bg-yellow-500/20 text-yellow-300' 
                : 'bg-gray-700/50 text-gray-400'
              }
            `}>
              <Star size={12} className={xpTimeRemaining ? 'text-yellow-400' : 'text-gray-500'} />
              <span>x{boostInfo.xpMultiplier}</span>
              {xpTimeRemaining && (
                <span className="text-yellow-400/70">{xpTimeRemaining}</span>
              )}
            </div>
          )}

          {/* Currency Boost */}
          {boostInfo.currencyMultiplier > 1 && (
            <div className={`
              flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
              ${currencyTimeRemaining 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-gray-700/50 text-gray-400'
              }
            `}>
              <Coins size={12} className={currencyTimeRemaining ? 'text-green-400' : 'text-gray-500'} />
              <span>x{boostInfo.currencyMultiplier}</span>
              {currencyTimeRemaining && (
                <span className="text-green-400/70">{currencyTimeRemaining}</span>
              )}
            </div>
          )}

          {/* No Active Boosts */}
          {!hasActiveBoosts && (
            <span className="text-xs text-gray-500">
              {t('boosts.none', 'Немає')}
            </span>
          )}
        </div>
      </div>

      {/* Stats + Ad Button Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Daily Streak */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-xs">
            <Calendar size={12} className="text-orange-400" />
            <span>{t('boosts.streak', 'Стрік')}: {boostInfo.dailyStreak}</span>
          </div>
          
          {boostInfo.bestStreak > 0 && (
            <span className="text-xs text-gray-500">
              {t('boosts.best', 'Рекорд')}: {boostInfo.bestStreak}
            </span>
          )}
        </div>

        {/* Watch Ad Button */}
        {onWatchAd && adsRemaining > 0 && (
          <button
            onClick={onWatchAd}
            disabled={disabled}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200
              ${disabled 
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                : 'bg-purple-600/80 hover:bg-purple-500 text-white active:scale-95'
              }
            `}
          >
            <PlayCircle size={14} />
            <span>{t('boosts.watchAd', '+30 хв')}</span>
            <span className="opacity-70">({adsRemaining})</span>
          </button>
        )}

        {/* No Ads Remaining */}
        {onWatchAd && adsRemaining <= 0 && (
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-500">
            {t('boosts.noAds', 'Реклама недоступна')}
          </div>
        )}
      </div>
    </div>
  );
});

export default BoostBar;
