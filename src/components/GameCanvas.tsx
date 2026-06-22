/**
 * GameCanvas - Compact tap area with fixed height
 * 
 * Design principles from Pre-Academy-Game-Redesign:
 * - Fixed height (248px mobile, 288px tablet, 320px desktop)
 * - Central tap object, not full-screen
 * - Floating animations for tap events
 * - Ornamental decorations for visual appeal
 */

import { useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TapEvent, Epoch } from '../types/game';
import { formatNumber } from '../lib/utils';

interface GameCanvasProps {
  epoch: Epoch;
  onTap: (x: number, y: number) => void;
  tapEvents: TapEvent[];
  tapPower: number;
}

// SVG Decorative Elements
function CornerOrnament({ flipX, flipY }: { flipX?: boolean; flipY?: boolean }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      className="absolute w-8 h-8 text-amber-400/20"
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
    >
      <path d="M4 40 L4 4 L40 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 4 Q22 4 22 22" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.5" />
      <circle cx="4" cy="4" r="2.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function GridTexture() {
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="gameGrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M0 0 L28 0 M0 0 L0 28" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gameGrid)" />
    </svg>
  );
}

export const GameCanvas = memo(function GameCanvas({
  epoch,
  onTap,
  tapEvents,
  tapPower,
}: GameCanvasProps) {
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

  const tapPowerText = `+${formatNumber(tapPower)} XP`;

  return (
    <div 
      ref={areaRef}
      className="relative w-full h-full overflow-hidden cursor-pointer select-none touch-manipulation"
      style={{
        background: epoch.bgGradient,
      }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Grid Pattern Background */}
      <GridTexture />

      {/* Corner Ornaments */}
      <CornerOrnament flipX={false} flipY={false} />
      <CornerOrnament flipX={true} flipY={false} />
      <CornerOrnament flipX={false} flipY={true} />
      <CornerOrnament flipX={true} flipY={true} />

      {/* Central Tap Object - Sized for visibility, not overwhelming */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-5xl sm:text-6xl md:text-7xl transform drop-shadow-lg"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {epoch.currencyIcon}
        </motion.div>
      </div>

      {/* Tap Power Indicator - Bottom Center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
        <span className="text-white/90 text-xs sm:text-sm font-medium drop-shadow-lg">
          {tapPowerText}
        </span>
      </div>

      {/* Floating Tap Events with AnimatePresence */}
      <AnimatePresence mode="popLayout">
        {tapEvents.map(event => {
          const isBig = event.value >= 100;
          const jitter = ((event.createdAt % 5) - 2) * 6;
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{ opacity: 0, scale: 1.2, y: -60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className={`absolute pointer-events-none font-black select-none ${
                isBig
                  ? 'text-yellow-300 text-xl sm:text-2xl'
                  : 'text-white text-lg sm:text-xl'
              }`}
              style={{
                left: event.x - 20 + jitter,
                top: event.y - 20,
                textShadow: isBig 
                  ? '0 0 16px rgba(251,191,36,0.8), 0 2px 8px rgba(0,0,0,0.5)' 
                  : '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              +{formatNumber(event.value)}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

export default GameCanvas;
