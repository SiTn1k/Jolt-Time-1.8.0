/**
 * FigmaLayout - EXACT reproduction of approved Figma design
 * 
 * Source: https://github.com/SiTn1k/Pre-Academy-Game-Redesign
 * 
 * Design principles:
 * - Header: ~15% with epoch, level, XP, currency, passive
 * - Top Ad Banner: visible
 * - Game Canvas: 248-320px (25-35% of screen)
 * - Booster Bar: visible immediately
 * - Ornamental Divider
 * - Content Area: scrollable
 * - Bottom Ad Banner: visible
 * - Navigation: 5 tabs
 */

import { useState, useCallback, lazy, Suspense, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../hooks/useGame';
import { useTranslation } from '../i18n';
import { EPOCHS } from '../data/epochs';
import { formatNumber } from '../lib/utils';
import { Lock } from 'lucide-react';

// Lazy load ExpeditionApp
const ExpeditionApp = lazy(() => import('../expedition/ExpeditionApp').then(m => ({ default: m.ExpeditionApp })));

// ─── SVG Decorations ─────────────────────────────────────────────────────────

function CornerOrnament({ flipX, flipY }: { flipX?: boolean; flipY?: boolean }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      className="w-11 h-11"
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
    >
      <path d="M4 40 L4 4 L40 4" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path d="M4 4 Q22 4 22 22" stroke="#F5C842" strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.2" />
      <circle cx="4" cy="4" r="2.5" fill="#F5C842" opacity="0.5" />
      <circle cx="4" cy="40" r="1.5" fill="#F5C842" opacity="0.25" />
      <circle cx="40" cy="4" r="1.5" fill="#F5C842" opacity="0.25" />
    </svg>
  );
}

function GridTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hg" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M0 0 L28 0 M0 0 L0 28" stroke="#F5C842" strokeWidth="0.3" opacity="0.1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hg)" />
    </svg>
  );
}

function OrnamentalDivider() {
  return (
    <svg viewBox="0 0 240 10" fill="none" className="w-full h-2.5 text-amber-400/30">
      <path d="M0 5 Q30 1 60 5 Q90 9 120 5 Q150 1 180 5 Q210 9 240 5" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="60" cy="5" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="120" cy="5" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="180" cy="5" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// ─── Inline Icons ─────────────────────────────────────────────────────────────

function IcoGamepad({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3"/>
      <path d="M6 12h4M8 10v4M15 11h2M15 13h2"/>
    </svg>
  );
}
function IcoGem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6,3 18,3 22,9 12,21 2,9"/>
      <polyline points="2,9 12,13 22,9"/>
      <line x1="12" y1="3" x2="12" y2="13"/>
    </svg>
  );
}
function IcoSword({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 9.5L3 21M5 17l-2 2M3 19l2-2M21 3l-9.5 9.5M16 3h5v5l-9 9-5-5 9-9z"/>
    </svg>
  );
}
function IcoUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function IcoSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}
function IcoLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

// ─── Header (EXACT from Figma) ─────────────────────────────────────────────────

function Header({ 
  level, 
  xp, 
  xpToNext, 
  currency, 
  passivePerSec,
  epochName,
  epochPeriod,
  epochIcon,
  currencyIcon
}: {
  level: number; 
  xp: number; 
  xpToNext: number; 
  currency: number; 
  passivePerSec: number;
  epochName: string;
  epochPeriod: string;
  epochIcon: string;
  currencyIcon: string;
}) {
  const pct = Math.min(100, (xp / xpToNext) * 100);
  
  return (
    <div 
      className="shrink-0 bg-[#07090F]/98 backdrop-blur-sm border-b border-amber-400/10"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="px-4 pt-2.5 pb-2">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {/* Epoch badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 text-lg">
              {epochIcon}
            </div>
            <div className="min-w-0">
              <div
                className="text-amber-300 text-xs font-semibold tracking-wide uppercase leading-tight truncate"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {epochName}
              </div>
              <div className="text-amber-400/40 text-[10px] leading-tight">{epochPeriod}</div>
            </div>
          </div>

          {/* Level badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="bg-amber-400/15 border border-amber-400/20 rounded-lg px-2 py-1 text-center">
              <div className="text-amber-300 text-[10px] font-semibold leading-none">РІВЕНЬ</div>
              <div className="text-amber-300 text-sm font-bold leading-none">{level}</div>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-amber-400/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="shrink-0 text-amber-300/60 text-[10px] font-medium w-10 text-right">
            {Math.round(pct)}%
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-3">
            {/* Currency */}
            <div className="flex items-center gap-1">
              <span className="text-base">{currencyIcon}</span>
              <span className="text-white/90 text-xs font-semibold">
                {formatNumber(currency)}
              </span>
            </div>
          </div>
          
          {/* Passive income */}
          <div className="flex items-center gap-1 text-amber-400/50 text-[10px]">
            <span>✨</span>
            <span>+{formatNumber(passivePerSec)}/с XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation (EXACT from Figma) ─────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  badge?: number;
  locked?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "game", label: "Гра", Icon: IcoGamepad },
  { id: "artifacts", label: "Реліквії", Icon: IcoGem, badge: 0 },
  { id: "expedition", label: "Академія", Icon: IcoSword, locked: true },
  { id: "profile", label: "Профіль", Icon: IcoUser },
  { id: "settings", label: "", Icon: IcoSettings },
];

function Navigation({ 
  tab, 
  setTab,
  badges
}: { 
  tab: string; 
  setTab: (t: string) => void;
  badges: Record<string, number>;
}) {
  return (
    <div
      className="shrink-0 bg-[#07090F]/99 border-t border-amber-400/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {NAV_ITEMS.map(({ id, label, Icon, badge, locked }) => {
          const active = tab === id;
          const showBadge = badges[id] > 0;
          
          return (
            <button
              key={id}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-all ${
                locked ? "opacity-35" : active ? "opacity-100" : "opacity-45 hover:opacity-70"
              }`}
              onClick={() => !locked && setTab(id)}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-amber-400" : "text-white/60"}`} />
                {locked && (
                  <IcoLock className="absolute -top-1.5 -right-2 w-3 h-3 text-white/40" />
                )}
                {showBadge && !locked && (
                  <div className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold leading-none">
                      {badges[id] > 9 ? '9+' : badges[id]}
                    </span>
                  </div>
                )}
              </div>
              {label && (
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-amber-400" : "text-white/35"}`}>
                  {label}
                </span>
              )}
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ad Banner ────────────────────────────────────────────────────────────────

function AdBanner({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div 
      className={`shrink-0 bg-black/40 flex items-center justify-center ${
        position === 'top' ? 'h-12 border-b border-amber-400/10' : 'h-14 border-t border-amber-400/10'
      }`}
    >
      <span className="text-white/30 text-xs">Ad Banner {position === 'top' ? '↑' : '↓'}</span>
    </div>
  );
}

// ─── Game Canvas (EXACT from Figma) ──────────────────────────────────────────

interface TapEvent {
  id: number;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

function GameCanvas({ 
  onTap, 
  tapEvents, 
  tapPower,
  epoch,
  currencyIcon
}: { 
  onTap: (x: number, y: number) => void; 
  tapEvents: TapEvent[];
  tapPower: number;
  epoch: ReturnType<typeof useGame>['epoch'];
  currencyIcon: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const tapIdRef = useRef(0);

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

  return (
    <div 
      ref={areaRef}
      className="relative w-full h-full overflow-hidden cursor-pointer select-none touch-manipulation"
      style={{ background: epoch.bgGradient }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Grid Pattern */}
      <GridTexture />
      
      {/* Corner Ornaments */}
      <div className="absolute top-0 left-0"><CornerOrnament /></div>
      <div className="absolute top-0 right-0"><CornerOrnament flipX /></div>
      <div className="absolute bottom-0 left-0"><CornerOrnament flipY /></div>
      <div className="absolute bottom-0 right-0"><CornerOrnament flipX flipY /></div>

      {/* Central Tap Object */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-5xl sm:text-6xl md:text-7xl transform"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {currencyIcon}
        </motion.div>
      </div>

      {/* Tap Power Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
        <span className="text-white/90 text-xs sm:text-sm font-medium">
          +{formatNumber(tapPower)} XP
        </span>
      </div>

      {/* Floating Tap Events */}
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
                isBig ? 'text-yellow-300 text-xl sm:text-2xl' : 'text-white text-lg sm:text-xl'
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
}

// ─── Booster Bar (EXACT from Figma) ─────────────────────────────────────────

function BoosterBar({ 
  boosts, 
  energy, 
  maxEnergy,
  streak 
}: { 
  boosts: Array<{ type: string; multiplier: number; minutesLeft: number }>;
  energy: number;
  maxEnergy: number;
  streak: number;
}) {
  const energyPct = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 100;

  return (
    <div className="shrink-0 bg-[#07090F]/80 border-b border-amber-400/5">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Energy */}
        {maxEnergy > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xs">⚡</span>
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${energyPct}%` }}
              />
            </div>
            <span className="text-white/60 text-[10px]">{energy}</span>
          </div>
        )}

        {/* Center: Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-400 text-xs">
            <span>🔥</span>
            <span className="font-semibold">{streak}</span>
          </div>
        )}

        {/* Center: Active Boosts */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {boosts.filter(b => b.multiplier > 1).map((boost, i) => (
            <div 
              key={i}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                boost.type === 'xp' 
                  ? 'bg-amber-400/20 text-amber-300' 
                  : 'bg-green-400/20 text-green-400'
              }`}
            >
              x{boost.multiplier.toFixed(1)} {boost.type === 'xp' ? 'XP' : '💰'}
            </div>
          ))}
        </div>

        {/* Right: Watch Ad */}
        <button className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors">
          +30м
        </button>
      </div>
    </div>
  );
}

// ─── Tab Content Components ───────────────────────────────────────────────────

function DailyTasksCard({ 
  tasks, 
  currencyIcon,
  onClaim 
}: { 
  tasks: Array<{ id: string; icon: string; name: string; progress: number; target: number; reward: string; claimed: boolean }>;
  currencyIcon: string;
  onClaim: (id: string) => void;
}) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-xs font-semibold">📋 Завдання</span>
        <span className="text-amber-400/60 text-[10px]">Щодня</span>
      </div>
      <div className="space-y-2">
        {tasks.slice(0, 3).map(task => (
          <div key={task.id} className="flex items-center gap-2">
            <span className="text-lg">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white/80 text-xs truncate">{task.name}</div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }}
                />
              </div>
            </div>
            {!task.claimed && task.progress >= task.target && (
              <button 
                onClick={() => onClaim(task.id)}
                className="bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0"
              >
                Отримати
              </button>
            )}
            {task.claimed && (
              <span className="text-green-400 text-[10px]">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneratorCard({ 
  gen, 
  currency,
  currencyIcon,
  onBuy,
  ownedLevel
}: { 
  gen: { id: string; name: string; icon: string; production: number; cost: number };
  currency: number;
  currencyIcon: string;
  onBuy: (id: string) => void;
  ownedLevel: number;
}) {
  const canAfford = currency >= gen.cost;

  return (
    <div className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center text-xl shrink-0">
        {gen.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-white/80 text-xs font-medium truncate">{gen.name}</span>
          {ownedLevel > 0 && (
            <span className="text-amber-400 text-[10px]">Lv.{ownedLevel}</span>
          )}
        </div>
        <div className="text-amber-400/50 text-[10px]">+{gen.production}/с</div>
      </div>
      <button
        onClick={() => onBuy(gen.id)}
        disabled={!canAfford}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
          canAfford
            ? 'bg-amber-400 text-black hover:bg-amber-300'
            : 'bg-gray-700 text-gray-500'
        }`}
      >
        {currencyIcon} {formatNumber(gen.cost)}
      </button>
    </div>
  );
}

function ExpeditionLocked() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
      <div className="text-5xl">🔒</div>
      <div className="text-center">
        <div 
          className="text-white/80 font-semibold mb-1" 
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Академія заблокована
        </div>
        <div className="text-white/40 text-sm">Розблоковується на 2-му переродженні</div>
      </div>
    </div>
  );
}

function ProfileTab({ level, currency, streak }: { level: number; currency: number; streak: number }) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-amber-400/20 rounded-full flex items-center justify-center text-3xl mb-3">
          👤
        </div>
        <div className="text-white/80 font-semibold mb-1">Рівень {level}</div>
        <div className="text-white/40 text-sm">Стрік: 🔥 {streak}</div>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center">
        <IcoSettings className="w-12 h-12 mx-auto text-white/20 mb-3" />
        <div className="text-white/40 text-sm">Налаштування</div>
      </div>
    </div>
  );
}

// ─── Main FigmaLayout Component ───────────────────────────────────────────────

export function FigmaLayout() {
  const {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    tapPowerCost,
    artifactMultipliers,
    boosterMultipliers,
    claimDailyTask,
  } = useGame();

  const [activeTab, setActiveTab] = useState('game');
  const isAcademyUnlocked = (state.prestigeLevel || 0) >= 2;
  const completedArtifacts = state.completedArtifacts?.length || 0;

  // Calculate effective tap power
  const effectiveTapPower = useMemo(() => {
    const artXpMult = artifactMultipliers?.xp || 1;
    const boostXpMult = boosterMultipliers?.xp || 1;
    const prestigeXpBonus = 1 + ((state.prestigeResearch?.xp_gain || 0) * 0.05);
    return Math.round(state.tapPower * artXpMult * boostXpMult * prestigeXpBonus);
  }, [state.tapPower, state.prestigeResearch, artifactMultipliers, boosterMultipliers]);

  // Prepare boosts for BoosterBar
  const boosts = useMemo(() => {
    const result: Array<{ type: string; multiplier: number; minutesLeft: number }> = [];
    
    if ((boosterMultipliers?.xp || 1) > 1 && boosterMultipliers?.xpBoostEndsAt) {
      const msLeft = boosterMultipliers.xpBoostEndsAt - Date.now();
      if (msLeft > 0) {
        result.push({
          type: 'xp',
          multiplier: boosterMultipliers.xp,
          minutesLeft: Math.ceil(msLeft / 60000),
        });
      }
    }
    
    if ((boosterMultipliers?.currency || 1) > 1 && boosterMultipliers?.currencyBoostEndsAt) {
      const msLeft = boosterMultipliers.currencyBoostEndsAt - Date.now();
      if (msLeft > 0) {
        result.push({
          type: 'currency',
          multiplier: boosterMultipliers.currency,
          minutesLeft: Math.ceil(msLeft / 60000),
        });
      }
    }
    
    return result;
  }, [boosterMultipliers]);

  // Prepare owned generators map
  const ownedGeneratorsMap = useMemo(() => {
    const map = new Map<string, number>();
    state.ownedGenerators.forEach(g => map.set(g.id, g.ownedLevels));
    return map;
  }, [state.ownedGenerators]);

  // Prepare daily tasks
  const dailyTasks = useMemo(() => {
    return state.dailyTasksState?.tasks || [];
  }, [state.dailyTasksState]);

  // Navigation badges
  const badges = useMemo(() => ({
    game: 0,
    artifacts: completedArtifacts,
    expedition: 0,
    profile: state.referralsCount || 0,
    settings: 0,
  }), [completedArtifacts, state.referralsCount]);

  // Clean up old tap events
  useEffect(() => {
    const interval = setInterval(() => {
      // This is handled by the tapEvents from useGame
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden select-none bg-[#07090F] text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Header ── */}
      <Header
        level={state.level}
        xp={state.xp}
        xpToNext={state.xpToNextLevel}
        currency={state.currency}
        passivePerSec={state.passiveXpPerSecond}
        epochName={epoch.name.ua}
        epochPeriod={epoch.period.ua}
        epochIcon={epoch.currencyIcon}
        currencyIcon={epoch.currencyIcon}
      />

      {/* ── Top Ad Banner ── */}
      <AdBanner position="top" />

      {/* ── Game Canvas (248-320px) ── */}
      <div className="shrink-0 h-[248px] sm:h-[288px] md:h-[320px]">
        <GameCanvas
          onTap={tap}
          tapEvents={tapEvents}
          tapPower={effectiveTapPower}
          epoch={epoch}
          currencyIcon={epoch.currencyIcon}
        />
      </div>

      {/* ── Booster Bar ── */}
      <BoosterBar
        boosts={boosts}
        energy={state.energy}
        maxEnergy={state.maxEnergy}
        streak={state.dailyStreak || 0}
      />

      {/* ── Ornamental Divider ── */}
      <div className="shrink-0 px-4 py-1">
        <OrnamentalDivider />
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'game' && (
            <motion.div
              key="game"
              className="h-full overflow-y-auto p-3 space-y-2.5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* Daily Tasks */}
              <DailyTasksCard
                tasks={dailyTasks.map(t => ({
                  id: t.id,
                  icon: t.icon,
                  name: t.name,
                  progress: t.progress,
                  target: t.target,
                  reward: t.reward,
                  claimed: t.claimed,
                }))}
                currencyIcon={epoch.currencyIcon}
                onClaim={claimDailyTask}
              />

              {/* Generators Section Title */}
              <div
                className="text-white/25 text-[9px] uppercase tracking-[3px] px-1 pt-1"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Генератори
              </div>

              {/* Generators */}
              {epoch.generators.map(gen => (
                <GeneratorCard
                  key={gen.id}
                  gen={{
                    id: gen.id,
                    name: gen.name.ua,
                    icon: gen.icon,
                    production: gen.baseProduction,
                    cost: gen.baseCost,
                  }}
                  currency={state.currency}
                  currencyIcon={epoch.currencyIcon}
                  onBuy={buyGenerator}
                  ownedLevel={ownedGeneratorsMap.get(gen.id) || 0}
                />
              ))}

              <div className="h-2" />
            </motion.div>
          )}

          {activeTab === 'artifacts' && (
            <motion.div
              key="artifacts"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-amber-400/10 rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">💎</span>
                  </div>
                  <div className="text-white/60 text-sm mb-1">Реліквії</div>
                  <div className="text-white/30 text-xs">
                    {completedArtifacts} зібрано
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'expedition' && (
            <motion.div
              key="expedition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ExpeditionLocked />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ProfileTab 
                level={state.level} 
                currency={state.currency} 
                streak={state.dailyStreak || 0} 
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <SettingsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Ad Banner ── */}
      <AdBanner position="bottom" />

      {/* ── Navigation ── */}
      <Navigation tab={activeTab} setTab={setActiveTab} badges={badges} />
    </div>
  );
}

export default FigmaLayout;
