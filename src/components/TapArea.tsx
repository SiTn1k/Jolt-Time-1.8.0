import { useRef, useCallback } from 'react';
import { TapEvent, Epoch } from '../types/game';
import { formatNumber } from '../lib/utils';
import { Sparkles, Landmark } from 'lucide-react';

interface TapAreaProps {
  epoch: Epoch;
  onTap: (x: number, y: number) => void;
  tapEvents: TapEvent[];
  tapPower: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  passiveXp: number;
  currency: number;
  currencyIcon: string;
  topOffset?: number;
  totalLevels?: number;
  currentEpochIndex?: number;
  totalEpochs?: number;
  prestigeLevel?: number;
}

export function TapArea({
  epoch,
  onTap,
  tapEvents,
  tapPower,
  level,
  xp,
  xpToNextLevel,
  passiveXp,
  currency,
  currencyIcon,
  topOffset = 0,
  totalLevels = 960,
  currentEpochIndex = 0,
  totalEpochs = 12,
  prestigeLevel = 0,
}: TapAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    onTap(x, y);
  }, [onTap]);

  const xpPercent = (xp / xpToNextLevel) * 100;
  const epochProgress = ((level - epoch.levelRange.min) / (epoch.levelRange.max - epoch.levelRange.min)) * 100;

  return (
    <div className="relative flex-shrink-0 flex flex-col" style={{ height: `calc(50vh - ${topOffset}px)` }}>
      {/* Enhanced Header Stats */}
      <div
        className="p-3 sm:p-4 text-white"
        style={{ background: epoch.bgGradient }}
      >
        {/* Epoch Title & Period */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                Епоха {currentEpochIndex + 1}/{totalEpochs}
              </span>
              {prestigeLevel < 2 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#9747FF]/50 flex items-center gap-1">
                  <Landmark className="w-3 h-3" />
                  🏛 Академія в P2
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-xl font-bold" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {epoch.name.ua}
            </h2>
            <p className="text-[10px] sm:text-xs opacity-80 italic">
              {epoch.period.ua}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold">
              {currencyIcon} {formatNumber(currency)}
            </div>
            <div className="text-[10px] sm:text-xs opacity-80">+{formatNumber(passiveXp)}/с XP</div>
          </div>
        </div>

        {/* Historical Description */}
        <p className="text-[10px] sm:text-xs opacity-70 mb-2 line-clamp-1">
          {epoch.description.ua}
        </p>

        {/* Level Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] sm:text-xs mb-1">
            <span>Рівень {level}</span>
            <span className="opacity-80">{Math.round(epochProgress)}% епохи</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-2 sm:h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-white/80 to-white transition-all duration-100 rounded-full"
              style={{ width: `${Math.min(epochProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full bg-black/30 rounded-full h-2 sm:h-2.5 overflow-hidden">
          <div
            className="h-full bg-[#FFC72C]/80 transition-all duration-100 rounded-full"
            style={{ width: `${Math.min(xpPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs mt-0.5 opacity-80">
          <span>{formatNumber(xp)}/{formatNumber(xpToNextLevel)} XP</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Тап: +{formatNumber(tapPower)}
          </span>
        </div>
      </div>

      {/* Tap Area */}
      <div
        ref={areaRef}
        className="flex-1 relative overflow-hidden cursor-pointer select-none touch-manipulation"
        style={{
          background: epoch.bgGradient,
        }}
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Central Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl sm:text-8xl transform hover:scale-110 transition-transform duration-150 active:scale-95 drop-shadow-lg">
            {epoch.currencyIcon}
          </div>
        </div>

        {/* Tap Power Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm backdrop-blur-sm">
          Тап: +{tapPower} XP
        </div>

        {/* Floating Tap Events */}
        {tapEvents.map(event => {
          const isBig = event.value >= 100;
          const jitter = ((event.createdAt % 5) - 2) * 8; // -16px to +16px horizontal jitter
          return (
            <div
              key={event.id}
              className={`absolute pointer-events-none font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] select-none ${
                isBig
                  ? 'animate-float-up-big text-yellow-300 text-2xl sm:text-3xl'
                  : 'animate-float-up text-white text-lg sm:text-xl'
              }`}
              style={{
                left: event.x - 20 + jitter,
                top: event.y - 20,
                textShadow: isBig ? '0 0 12px rgba(251,191,36,0.6)' : undefined,
              }}
            >
              +{event.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}
