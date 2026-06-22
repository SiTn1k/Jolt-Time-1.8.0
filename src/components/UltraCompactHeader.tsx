/**
 * UltraCompactHeader - Shows all critical info in minimal space
 * 
 * Layout:
 * [Epoch Badge] [Level + XP Bar] [Energy] [Currency] [Passive]
 */

import { memo } from 'react';
import { Zap, Sparkles, Coins } from 'lucide-react';
import { useTranslation } from '../i18n';
import { formatNumber } from '../lib/utils';
import type { GameState, Epoch } from '../types/game';

interface UltraCompactHeaderProps {
  state: GameState;
  epoch: Epoch;
  onEpochClick?: () => void;
}

export const UltraCompactHeader = memo(function UltraCompactHeader({
  state,
  epoch,
  onEpochClick,
}: UltraCompactHeaderProps) {
  const { t } = useTranslation();
  const locale = 'ua';

  const xpPercent = state.xpToNextLevel > 0 
    ? Math.min(100, (state.xp / state.xpToNextLevel) * 100) 
    : 0;

  const energyPercent = state.maxEnergy > 0 
    ? Math.min(100, (state.energy / state.maxEnergy) * 100) 
    : 100;

  const showEnergy = (state.prestigeLevel || 0) >= 1;
  const currencyIcon = epoch.currencyIcon || '💰';

  return (
    <div 
      className="shrink-0 bg-[#07090F]/98 backdrop-blur-sm border-b border-amber-400/10"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-3 py-2">
        {/* Main Stats Row */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          {/* Epoch Badge */}
          <button
            onClick={onEpochClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 transition-colors shrink-0"
          >
            <span className="text-base">{epoch.currencyIcon}</span>
            <span className="text-amber-300 text-xs font-medium max-w-[80px] truncate">
              {epoch.name[locale] || epoch.name.ua}
            </span>
          </button>

          {/* Level & XP - Center */}
          <div className="flex-1 min-w-0 max-w-[120px]">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-white/60 font-medium">
                {t('game.level', { level: state.level })}
              </span>
              <span className="text-amber-400 font-medium">
                {Math.round(xpPercent)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Resources - Right Side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Passive Income */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-white/50">
              <Sparkles className="w-3 h-3" />
              <span>+{formatNumber(state.passiveXpPerSecond)}/с</span>
            </div>

            {/* Energy - Only for prestige 1+ */}
            {showEnergy && (
              <div className="flex items-center gap-1">
                <Zap 
                  size={12} 
                  className={energyPercent > 20 ? 'text-yellow-400' : 'text-red-400'} 
                />
                <span className={`text-xs font-medium ${
                  energyPercent > 50 ? 'text-white' : 
                  energyPercent > 20 ? 'text-yellow-300' : 
                  'text-red-300'
                }`}>
                  {formatNumber(state.energy)}
                </span>
              </div>
            )}

            {/* Currency */}
            <div className="flex items-center gap-1">
              <span className="text-sm">{currencyIcon}</span>
              <span className="text-xs font-medium text-green-400">
                {formatNumber(state.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default UltraCompactHeader;
