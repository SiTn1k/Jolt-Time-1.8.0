/**
 * PreAcademyLayout - PRE-ACADEMY GAME SCREEN
 * 
 * Based on: https://github.com/SiTn1k/Pre-Academy-Game-Redesign
 * 
 * Design:
 * - Compact Header (~10-12%) - all critical stats visible
 * - Top Ad Banner (~3%)
 * - Game Canvas (180px mobile / 200px tablet / 220px desktop) - SMALLER than Figma
 * - Tap Medallion (central interactive element)
 * - Booster Bar (~5%)
 * - Ornamental Divider
 * - Content Area (scrollable) (~40-45%)
 * - Bottom Ad Banner (~3%)
 * - Navigation (~7%)
 * 
 * Game Features:
 * - Tap mechanics with XP gain
 * - Generator purchases and production
 * - Boosters (XP, Currency)
 * - Daily Tasks
 * - Artifacts
 * - Energy system
 * - Passive XP
 * 
 * NOT included (Academy-only features):
 * - Expedition/Academy tab
 * - Research tree
 * - Prestige upgrades
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../hooks/useGame';
import { EPOCHS } from '../data/epochs';
import { formatNumber } from '../lib/utils';

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

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ 
  level, 
  xp, 
  xpToNext, 
  currency, 
  passivePerSec,
  epochName,
  epochPeriod,
  epochIcon,
  currencyIcon,
  energy,
  maxEnergy
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
  energy: number;
  maxEnergy: number;
}) {
  const pct = Math.min(100, (xp / xpToNext) * 100);
  const energyPct = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 100;
  
  return (
    <div 
      className="shrink-0 bg-[#07090F]/98 backdrop-blur-sm border-b border-amber-400/10"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="px-4 pt-2 pb-2">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3 mb-2">
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
          <div className="flex-1 h-1.5 bg-amber-400/10 rounded-full overflow-hidden">
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
            
            {/* Energy (if prestige 1+) */}
            {maxEnergy > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-xs">⚡</span>
                <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${energyPct}%` }}
                  />
                </div>
                <span className="text-white/60 text-[10px]">{energy}</span>
              </div>
            )}
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

// ─── Navigation ───────────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  { id: "game", label: "Гра", Icon: IcoGamepad },
  { id: "artifacts", label: "Реліквії", Icon: IcoGem },
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
        {NAV_ITEMS.map(({ id, label, Icon, badge }) => {
          const active = tab === id;
          const showBadge = (badges[id] || 0) > 0;
          
          return (
            <button
              key={id}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-all ${
                active ? "opacity-100" : "opacity-45 hover:opacity-70"
              }`}
              onClick={() => setTab(id)}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-amber-400" : "text-white/60"}`} />
                {showBadge && (
                  <div className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold leading-none">
                      {(badges[id] || 0) > 9 ? '9+' : badges[id]}
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
        position === 'top' ? 'h-10 border-b border-amber-400/10' : 'h-12 border-t border-amber-400/10'
      }`}
    >
      <span className="text-white/30 text-xs">Ad Banner {position === 'top' ? '↑' : '↓'}</span>
    </div>
  );
}

// ─── Tap Medallion (from Figma) ──────────────────────────────────────────────

function TapMedallion({ 
  onTap, 
  tapPower, 
  currencyIcon 
}: { 
  onTap: () => void; 
  tapPower: number;
  currencyIcon: string;
}) {
  const [pressing, setPressing] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      {/* Main button */}
      <motion.button
        animate={{ scale: pressing ? 0.90 : 1 }}
        transition={{ duration: 0.09, ease: "easeOut" }}
        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center
          bg-gradient-to-b from-[#1E1A06] to-[#0E0C04]
          border-2 border-amber-400/40
          shadow-[0_0_48px_rgba(245,200,66,0.12),inset_0_1px_4px_rgba(255,255,255,0.08),inset_0_-2px_6px_rgba(0,0,0,0.5)]
          cursor-pointer pointer-events-auto"
        onTouchStart={e => { setPressing(true); onTap(); }}
        onTouchEnd={() => setPressing(false)}
        onMouseDown={e => { setPressing(true); onTap(); }}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
      >
        {/* Inner ring */}
        <div className="absolute inset-2.5 rounded-full border border-amber-400/15" />
        {/* Icon */}
        <span className="text-4xl sm:text-5xl select-none relative z-10 -mt-1">{currencyIcon}</span>
        <span className="text-[9px] text-amber-400/50 uppercase tracking-[3px] mt-0.5 relative z-10 select-none">
          Натисни
        </span>
      </motion.button>

      {/* Tap power badge */}
      <div className="mt-3">
        <div className="bg-[#070A13]/90 border border-amber-400/20 rounded-full px-3 py-1 flex items-center gap-1.5">
          <span className="text-amber-400 text-xs">⚡</span>
          <span
            className="text-amber-300 text-[11px] font-bold"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            +{formatNumber(tapPower)} XP
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Game Canvas ─────────────────────────────────────────────────────────────

interface TapEvent {
  id: number;
  xPct: number;
  yPct: number;
  value: number;
}

function GameCanvas({ 
  onTap, 
  tapEvents, 
  tapPower,
  epoch,
  currencyIcon
}: { 
  onTap: () => void; 
  tapEvents: TapEvent[];
  tapPower: number;
  epoch: ReturnType<typeof useGame>['epoch'];
  currencyIcon: string;
}) {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0D1E10] via-[#091210] to-[#070A13] overflow-hidden">
      <GridTexture />

      {/* Radial center glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-amber-400/5 blur-[60px]" />
      </div>

      {/* Corner ornaments */}
      <div className="absolute top-2 left-2 pointer-events-none"><CornerOrnament /></div>
      <div className="absolute top-2 right-2 pointer-events-none"><CornerOrnament flipX /></div>
      <div className="absolute bottom-10 left-2 pointer-events-none"><CornerOrnament flipY /></div>
      <div className="absolute bottom-10 right-2 pointer-events-none"><CornerOrnament flipX flipY /></div>

      {/* Era label */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 text-amber-400/20 text-[10px] uppercase tracking-[5px] font-semibold select-none pointer-events-none"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {epoch.period.ua}
      </div>

      {/* Tap medallion */}
      <TapMedallion onTap={onTap} tapPower={tapPower} currencyIcon={currencyIcon} />

      {/* Floating XP numbers */}
      <AnimatePresence>
        {tapEvents.map(ev => (
          <motion.div
            key={ev.id}
            className={`absolute pointer-events-none select-none font-bold ${
              ev.value >= 100 ? "text-amber-300 text-lg sm:text-xl" : "text-yellow-200/90 text-sm sm:text-base"
            }`}
            style={{
              left: `${ev.xPct}%`,
              top: `${ev.yPct}%`,
              fontFamily: "'DM Mono', monospace",
              textShadow: "0 0 14px rgba(245,200,66,0.7)",
            }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -72, scale: ev.value >= 100 ? 1.3 : 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: "easeOut" }}
          >
            +{ev.value}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bottom ambient labels */}
      <div className="absolute bottom-3 left-4 right-4 flex justify-between pointer-events-none">
        <span className="text-amber-400/25 text-[10px] font-mono hidden sm:block">Тисни для XP</span>
        <span className="text-amber-400/25 text-[10px] font-mono">#{epoch.id} {epoch.name.ua.split(' ')[0]}</span>
      </div>
    </div>
  );
}

// ─── Booster Bar ─────────────────────────────────────────────────────────────

function BoosterBar({ 
  boosts, 
  streak,
  adsRemaining,
  onWatchAd
}: { 
  boosts: Array<{ type: string; multiplier: number; minutesLeft: number }>;
  streak: number;
  adsRemaining?: number;
  onWatchAd?: () => void;
}) {
  return (
    <div className="shrink-0 bg-[#07090F]/80 border-b border-amber-400/5">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Streak */}
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
              {boost.minutesLeft > 0 && <span className="ml-1 opacity-60">{boost.minutesLeft}м</span>}
            </div>
          ))}
          {boosts.filter(b => b.multiplier > 1).length === 0 && (
            <span className="text-white/30 text-[10px]">Без бустів</span>
          )}
        </div>

        {/* Right: Watch Ad */}
        {(adsRemaining || 0) > 0 && onWatchAd && (
          <button 
            onClick={onWatchAd}
            className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
          >
            +30м
          </button>
        )}
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
  const activeTasks = tasks.filter(t => !t.claimed);
  const completedTasks = tasks.filter(t => t.claimed);

  return (
    <div className="bg-gray-800/50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-xs font-semibold">📋 Завдання</span>
        <span className="text-amber-400/60 text-[10px]">{completedTasks.length}/{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {activeTasks.slice(0, 3).map(task => (
          <div key={task.id} className="flex items-center gap-2">
            <span className="text-lg">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white/80 text-xs truncate">{task.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }}
                  />
                </div>
                <span className="text-white/40 text-[9px] shrink-0">
                  {task.progress}/{task.target}
                </span>
              </div>
            </div>
            {task.progress >= task.target && (
              <button 
                onClick={() => onClaim(task.id)}
                className="bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0"
              >
                Отримати
              </button>
            )}
          </div>
        ))}
        {activeTasks.length === 0 && (
          <div className="text-white/30 text-xs text-center py-2">Всі завдання виконано!</div>
        )}
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
        <div className="text-amber-400/50 text-[10px]">+{gen.production}/с XP</div>
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

function ArtifactsTab({ 
  completedCount,
  currencyIcon 
}: { 
  completedCount: number;
  currencyIcon: string;
}) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto bg-amber-400/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">💎</span>
        </div>
        <div className="text-white/80 font-semibold mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
          Реліквії
        </div>
        <div className="text-white/40 text-sm mb-2">
          {completedCount} зібрано
        </div>
        <div className="text-white/30 text-xs">
          Збирайте реліквії для бонусів до XP та валюти
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ 
  level, 
  currency, 
  streak,
  bestStreak,
  tapPower,
  passiveIncome,
  currencyIcon
}: { 
  level: number; 
  currency: number; 
  streak: number;
  bestStreak: number;
  tapPower: number;
  passiveIncome: number;
  currencyIcon: string;
}) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon="⭐" label="Рівень" value={String(level)} color="text-amber-400" />
        <StatCard icon="🔥" label="Стрік" value={String(streak)} subtext={`Найкращий: ${bestStreak}`} color="text-orange-400" />
        <StatCard icon={currencyIcon} label="Валюта" value={formatNumber(currency)} color="text-green-400" />
        <StatCard icon="⚡" label="Тап" value={`+${formatNumber(tapPower)}`} subtext="за тап" color="text-blue-400" />
        <StatCard icon="✨" label="Пасив" value={`+${formatNumber(passiveIncome)}/с`} color="text-purple-400" />
        <StatCard icon="🏆" label="Досягнення" value="0" color="text-cyan-400" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }: {
  icon: string; label: string; value: string; subtext?: string; color: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span>{icon}</span>
        <span className="text-white/40 text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={`font-bold ${color}`}>{value}</div>
      {subtext && <div className="text-white/30 text-[9px]">{subtext}</div>}
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center">
        <IcoSettings className="w-12 h-12 mx-auto text-white/20 mb-3" />
        <div className="text-white/40 text-sm">Налаштування</div>
        <div className="text-white/20 text-xs mt-2">Розробка...</div>
      </div>
    </div>
  );
}

// ─── Main PreAcademyLayout Component ─────────────────────────────────────────

export function PreAcademyLayout() {
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
    profile: state.referralsCount || 0,
    settings: 0,
  }), [completedArtifacts, state.referralsCount]);

  // Handle generator purchase with cost calculation
  const handleBuyGenerator = useCallback((generatorId: string) => {
    const generator = epoch.generators.find(g => g.id === generatorId);
    if (!generator) return;
    
    const ownedLevel = ownedGeneratorsMap.get(generatorId) || 0;
    const cost = Math.floor(generator.baseCost * Math.pow(1.15, ownedLevel));
    
    if (state.currency >= cost) {
      buyGenerator(generatorId);
    }
  }, [epoch.generators, state.currency, ownedGeneratorsMap, buyGenerator]);

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
        energy={state.energy}
        maxEnergy={state.maxEnergy}
      />

      {/* ── Top Ad Banner ── */}
      <AdBanner position="top" />

      {/* ── Game Canvas (180-220px - SMALLER than Figma) ── */}
      <div className="shrink-0 h-[180px] sm:h-[200px] md:h-[220px]">
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
        streak={state.dailyStreak || 0}
        adsRemaining={3}
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
              {epoch.generators.map(gen => {
                const ownedLevel = ownedGeneratorsMap.get(gen.id) || 0;
                const cost = Math.floor(gen.baseCost * Math.pow(1.15, ownedLevel));
                
                return (
                  <GeneratorCard
                    key={gen.id}
                    gen={{
                      id: gen.id,
                      name: gen.name.ua,
                      icon: gen.icon,
                      production: gen.baseProduction,
                      cost: cost,
                    }}
                    currency={state.currency}
                    currencyIcon={epoch.currencyIcon}
                    onBuy={handleBuyGenerator}
                    ownedLevel={ownedLevel}
                  />
                );
              })}

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
              <ArtifactsTab completedCount={completedArtifacts} currencyIcon={epoch.currencyIcon} />
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
                bestStreak={state.bestStreak || 0}
                tapPower={state.tapPower}
                passiveIncome={state.passiveXpPerSecond}
                currencyIcon={epoch.currencyIcon}
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

export default PreAcademyLayout;
