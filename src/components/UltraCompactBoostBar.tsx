/**
 * UltraCompactBoostBar - Minimal height boost bar
 * Shows active boosts and quick actions in single row
 */

import { memo, useState, useEffect } from 'react';
import { Zap, Coins, Flame, Clock } from 'lucide-react';

interface BoostInfo {
  xpMultiplier: number;
  xpBoostEndsAt: number | null;
  currencyMultiplier: number;
  currencyBoostEndsAt: number | null;
  dailyStreak: number;
  bestStreak: number;
}

interface UltraCompactBoostBarProps {
  boostInfo: BoostInfo;
  adsRemaining?: number;
  onWatchAd?: () => void;
  disabled?: boolean;
}

function formatTimeRemaining(endTime: number | null): string {
  if (!endTime) return '';
  const ms = endTime - Date.now();
  if (ms <= 0) return '0:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}г`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TimerBadge({ endTime }: { endTime: number | null }) {
  const [remaining, setRemaining] = useState(formatTimeRemaining(endTime));

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRemaining(formatTimeRemaining(endTime));
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [endTime]);

  return remaining ? <span className="text-[9px] opacity-75 ml-0.5">{remaining}</span> : null;
}

export const UltraCompactBoostBar = memo(function UltraCompactBoostBar({
  boostInfo,
  adsRemaining = 0,
  onWatchAd,
  disabled = false,
}: UltraCompactBoostBarProps) {
  const hasXpBoost = boostInfo.xpMultiplier > 1;
  const hasCurrencyBoost = boostInfo.currencyMultiplier > 1;
  const hasStreak = boostInfo.dailyStreak > 0;

  return (
    <div className="shrink-0 bg-[#07090F]/80 border-b border-amber-400/5">
      <div className="flex items-center justify-between px-3 py-1.5 gap-2">
        {/* Left: Streak */}
        {hasStreak && (
          <div className="flex items-center gap-1 text-[10px] text-orange-400">
            <Flame className="w-3 h-3" />
            <span>{boostInfo.dailyStreak}</span>
            {boostInfo.bestStreak > boostInfo.dailyStreak && (
              <span className="text-white/30">/ {boostInfo.bestStreak}</span>
            )}
          </div>
        )}

        {/* Center: Active Boosts */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {hasXpBoost && (
            <div className="flex items-center gap-1 bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              <span className="text-[10px] font-semibold">x{boostInfo.xpMultiplier.toFixed(1)}</span>
              <TimerBadge endTime={boostInfo.xpBoostEndsAt} />
            </div>
          )}
          
          {hasCurrencyBoost && (
            <div className="flex items-center gap-1 bg-green-400/15 text-green-400 px-2 py-0.5 rounded-full">
              <Coins className="w-3 h-3" />
              <span className="text-[10px] font-semibold">x{boostInfo.currencyMultiplier.toFixed(1)}</span>
              <TimerBadge endTime={boostInfo.currencyBoostEndsAt} />
            </div>
          )}

          {!hasXpBoost && !hasCurrencyBoost && (
            <div className="flex items-center gap-1 text-white/30 text-[10px]">
              <Clock className="w-3 h-3" />
              <span>Без бустів</span>
            </div>
          )}
        </div>

        {/* Right: Watch Ad Button */}
        {adsRemaining > 0 && onWatchAd && (
          <button
            onClick={onWatchAd}
            disabled={disabled}
            className="flex items-center gap-1 bg-amber-400/20 hover:bg-amber-400/30 disabled:opacity-50 text-amber-300 px-2 py-0.5 rounded-full transition-colors text-[10px]"
          >
            <span>+30м</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default UltraCompactBoostBar;
