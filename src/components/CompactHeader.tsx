/**
 * CompactHeader - Compact game header with key resources
 * 
 * Shows: Epoch name, XP progress bar, Energy, Currency
 * Designed for mobile-first Telegram Mini App
 */

import { memo, useCallback } from 'react';
import { Zap, Coins, ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n';
import { formatNumber } from '../lib/utils';
import type { GameState, Epoch } from '../types/game';

interface CompactHeaderProps {
  state: GameState;
  epoch: Epoch;
  onEpochClick?: () => void;
}

export const CompactHeader = memo(function CompactHeader({
  state,
  epoch,
  onEpochClick,
}: CompactHeaderProps) {
  const { locale, t } = useTranslation();

  const energyPercent = state.maxEnergy > 0 
    ? Math.min(100, (state.energy / state.maxEnergy) * 100) 
    : 0;

  const xpPercent = state.xpToNextLevel > 0 
    ? Math.min(100, (state.xp / state.xpToNextLevel) * 100) 
    : 0;

  const epochName = epoch.name[locale as keyof typeof epoch.name] || epoch.name.ua;
  const currencyIcon = epoch.currencyIcon || '💰';

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-3 py-2 safe-area-top">
      {/* Top Row: Epoch + Resources */}
      <div className="flex items-center justify-between mb-2">
        {/* Epoch Selector */}
        <button
          onClick={onEpochClick}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        >
          <span className="text-lg">🏛️</span>
          <span className="text-sm font-medium text-white max-w-[100px] truncate">
            {epochName}
          </span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {/* Resources: Energy + Currency */}
        <div className="flex items-center gap-3">
          {/* Energy */}
          {(state.prestigeLevel || 0) >= 1 && (
            <div className="flex items-center gap-1.5">
              <Zap 
                size={16} 
                className={energyPercent > 20 ? 'text-yellow-400' : 'text-red-400'} 
              />
              <span className={`text-sm font-medium ${
                energyPercent > 50 ? 'text-white' : 
                energyPercent > 20 ? 'text-yellow-300' : 
                'text-red-300'
              }`}>
                {formatNumber(state.energy)}
              </span>
              <span className="text-xs text-gray-500">
                /{formatNumber(state.maxEnergy)}
              </span>
            </div>
          )}

          {/* Currency */}
          <div className="flex items-center gap-1.5">
            <span className="text-base">{currencyIcon}</span>
            <span className="text-sm font-medium text-green-400">
              {formatNumber(state.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {t('game.level', { level: state.level })}
          </span>
          <span className="text-xs text-gray-400">
            {Math.round(xpPercent)}%
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
});

export default CompactHeader;
