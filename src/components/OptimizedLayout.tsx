/**
 * OptimizedLayout - Pre-Academy game layout with UX improvements
 * 
 * Layout balance:
 * - Header: ~8-10% (all critical stats visible)
 * - Game Canvas: ~35-40% (tappable but not dominant)
 * - Content Area: ~45-50% (generators, tasks visible without scroll)
 * - Navigation: ~5-7%
 * 
 * Key UX improvements:
 * 1. UltraCompactHeader shows ALL critical info: level, XP, energy, currency, passive
 * 2. GameCanvas reduced to 200px mobile / 240px tablet / 260px desktop
 * 3. BoostBar minimal height (32px)
 * 4. Ad banners integrated without waste
 * 5. Content area starts immediately below boost bar
 */

import { useState, useCallback, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../hooks/useGame';
import { useTranslation } from '../i18n';
import { UltraCompactHeader } from './UltraCompactHeader';
import { UltraCompactBoostBar } from './UltraCompactBoostBar';
import { GameCanvas } from './GameCanvas';
import { BottomNavigation, NavigationTab } from './BottomNavigation';
import { GeneratorShop } from './GeneratorShop';
import { TapUpgrade } from './StatsPanel';
import { DailyTasksPanel } from './DailyTasksPanel';
import { EPOCHS } from '../data/epochs';
import { formatNumber } from '../lib/utils';
import { Gift, Users, Settings, Lock } from 'lucide-react';

// Lazy load ExpeditionApp
const ExpeditionApp = lazy(() => import('../expedition/ExpeditionApp').then(m => ({ default: m.ExpeditionApp })));

// Ultra-compact Ad Banner
function MiniAdBanner({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div 
      className={`shrink-0 bg-black/50 flex items-center justify-center ${
        position === 'top' 
          ? 'h-10 border-b border-amber-400/10' 
          : 'h-10 border-t border-amber-400/10'
      }`}
    >
      <span className="text-white/20 text-[10px]">▀▀▀ Ad ▀▀▀</span>
    </div>
  );
}

// ─── Tab Content Components ───────────────────────────────────────────────────

function GameTab({
  state,
  epoch,
  tapPowerCost,
  effectiveTapPower,
  onBuyGenerator,
  onUpgradeTap,
  onClaimTask,
}: {
  state: ReturnType<typeof useGame>['state'];
  epoch: ReturnType<typeof useGame>['epoch'];
  tapPowerCost: number;
  effectiveTapPower: number;
  onBuyGenerator: (id: number) => void;
  onUpgradeTap: () => void;
  onClaimTask: (taskId: string) => void;
}) {
  const ownedLevels = useMemo(() => {
    const levels: Record<string, number> = {};
    state.ownedGenerators.forEach(g => { levels[g.id] = g.ownedLevels; });
    return levels;
  }, [state.ownedGenerators]);

  return (
    <motion.div
      key="game"
      className="h-full overflow-y-auto overscroll-contain"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    >
      <div className="p-2 space-y-2">
        {/* Daily Tasks - Compact */}
        <DailyTasksPanel
          dailyStreak={state.dailyStreak}
          bestStreak={state.bestStreak}
          dailyTasksState={state.dailyTasksState}
          currencyIcon={epoch.currencyIcon}
          checkInStreak={state.checkInStreak}
          onClaimTask={onClaimTask}
        />

        {/* Tap Upgrade - Compact Card */}
        <TapUpgrade
          tapPower={state.tapPower}
          effectiveTapPower={effectiveTapPower}
          passiveXpPerSecond={state.passiveXpPerSecond}
          cost={tapPowerCost}
          currency={state.currency}
          epochIndex={EPOCHS.findIndex(e => e.id === state.epochId)}
          onUpgrade={onUpgradeTap}
        />

        {/* Generators */}
        <GeneratorShop
          epoch={epoch}
          currency={state.currency}
          ownedLevels={ownedLevels}
          onBuy={onBuyGenerator}
        />
        
        <div className="h-2" />
      </div>
    </motion.div>
  );
}

function ArtifactsTab({ completedCount }: { completedCount: number }) {
  const totalArtifacts = 12;

  return (
    <motion.div
      key="artifacts"
      className="h-full flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-center py-8 px-4">
        <Gift className="w-12 h-12 mx-auto text-amber-400/40 mb-3" />
        <div className="text-white/60 text-sm mb-1">Артефакти</div>
        <div className="text-white/30 text-xs">
          {completedCount}/{totalArtifacts} зібрано
        </div>
        <div className="mt-4 text-white/20 text-xs">
          Відкриваються з часом...
        </div>
      </div>
    </motion.div>
  );
}

function ExpeditionLockedTab() {
  return (
    <motion.div
      key="expedition-locked"
      className="h-full flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 mx-auto bg-amber-400/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-amber-400/40" />
        </div>
        <div className="text-white/80 text-sm font-medium mb-1">Академія</div>
        <div className="text-white/40 text-xs">
          Розблоковується на 2-му переродженні
        </div>
      </div>
    </motion.div>
  );
}

function ProfileTab({ 
  level, 
  currency, 
  streak, 
  bestStreak,
  prestigeLevel,
  referralsCount,
  passiveIncome,
  tapPower,
  currencyIcon
}: { 
  level: number; 
  currency: number; 
  streak: number;
  bestStreak: number;
  prestigeLevel: number;
  referralsCount: number;
  passiveIncome: number;
  tapPower: number;
  currencyIcon: string;
}) {
  return (
    <motion.div
      key="profile"
      className="h-full overflow-y-auto p-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon="⭐" label="Рівень" value={String(level)} color="text-amber-400" />
        <StatCard icon="🔥" label="Стрік" value={String(streak)} subtext={`Найкращий: ${bestStreak}`} color="text-orange-400" />
        <StatCard icon={currencyIcon} label="Валюта" value={formatNumber(currency)} color="text-green-400" />
        <StatCard icon="⚡" label="Тап" value={`+${formatNumber(tapPower)}`} subtext="за тап" color="text-blue-400" />
        <StatCard icon="✨" label="Пасив" value={`+${formatNumber(passiveIncome)}/с`} color="text-purple-400" />
        <StatCard icon="👥" label="Реферали" value={String(referralsCount)} color="text-cyan-400" />
        {prestigeLevel > 0 && (
          <StatCard icon="★" label="Престиж" value={String(prestigeLevel)} color="text-yellow-400" />
        )}
      </div>
    </motion.div>
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
    <motion.div
      key="settings"
      className="h-full flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="text-center py-8 px-4">
        <Settings className="w-12 h-12 mx-auto text-white/20 mb-3" />
        <div className="text-white/40 text-sm">Налаштування</div>
      </div>
    </motion.div>
  );
}

// ─── Main OptimizedLayout ─────────────────────────────────────────────────────

export function OptimizedLayout() {
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

  const [activeNavTab, setActiveNavTab] = useState<NavigationTab>('game');

  // Calculate effective tap power
  const effectiveTapPower = useMemo(() => {
    const artXpMult = artifactMultipliers?.xp || 1;
    const boostXpMult = boosterMultipliers?.xp || 1;
    const prestigeXpBonus = 1 + ((state.prestigeResearch?.xp_gain || 0) * 0.05);
    return Math.round(state.tapPower * artXpMult * boostXpMult * prestigeXpBonus);
  }, [state.tapPower, state.prestigeResearch, artifactMultipliers, boosterMultipliers]);

  const completedArtifacts = state.completedArtifacts?.length || 0;
  const isAcademyUnlocked = (state.prestigeLevel || 0) >= 2;

  const handleNavTabChange = useCallback((tab: NavigationTab) => {
    setActiveNavTab(tab);
  }, []);

  const handleBuy = useCallback((id: string) => {
    buyGenerator(id as unknown as number);
  }, [buyGenerator]);

  const handleUpgradeTap = useCallback(() => {
    upgradeTapPower();
  }, [upgradeTapPower]);

  const handleClaimTask = useCallback((taskId: string) => {
    claimDailyTask(taskId);
  }, [claimDailyTask]);

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden select-none bg-[#07090F] text-white"
    >
      {/* Header - Ultra Compact (~8-10%) */}
      <UltraCompactHeader
        state={state}
        epoch={epoch}
        onEpochClick={() => {}}
      />

      {/* Top Ad Banner */}
      <MiniAdBanner position="top" />

      {/* Game Canvas - Compact (~30-35%) */}
      <div className="shrink-0 h-[180px] sm:h-[200px] md:h-[220px]">
        <GameCanvas
          epoch={epoch}
          onTap={tap}
          tapEvents={tapEvents}
          tapPower={effectiveTapPower}
        />
      </div>

      {/* Boost Bar - Ultra Minimal (~3-4%) */}
      <UltraCompactBoostBar
        boostInfo={{
          xpMultiplier: boosterMultipliers?.xp || 1,
          xpBoostEndsAt: boosterMultipliers?.xpBoostEndsAt || null,
          currencyMultiplier: boosterMultipliers?.currency || 1,
          currencyBoostEndsAt: boosterMultipliers?.currencyBoostEndsAt || null,
          dailyStreak: state.dailyStreak || 0,
          bestStreak: state.bestStreak || 0,
        }}
        adsRemaining={3}
      />

      {/* Content Area - Scrollable (~45-50%) */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeNavTab === 'game' && (
            <GameTab
              state={state}
              epoch={epoch}
              tapPowerCost={tapPowerCost}
              effectiveTapPower={effectiveTapPower}
              onBuyGenerator={handleBuy}
              onUpgradeTap={handleUpgradeTap}
              onClaimTask={handleClaimTask}
            />
          )}

          {activeNavTab === 'artifacts' && (
            <ArtifactsTab completedCount={completedArtifacts} />
          )}

          {activeNavTab === 'expedition' && (
            <ExpeditionLockedTab />
          )}

          {activeNavTab === 'profile' && (
            <ProfileTab 
              level={state.level}
              currency={state.currency}
              streak={state.dailyStreak || 0}
              bestStreak={state.bestStreak || 0}
              prestigeLevel={state.prestigeLevel || 0}
              referralsCount={state.referralsCount || 0}
              passiveIncome={state.passiveXpPerSecond}
              tapPower={state.tapPower}
              currencyIcon={epoch.currencyIcon}
            />
          )}

          {activeNavTab === 'settings' && (
            <SettingsTab />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Ad Banner */}
      <MiniAdBanner position="bottom" />

      {/* Bottom Navigation - Compact (~5-7%) */}
      <BottomNavigation
        activeTab={activeNavTab}
        onTabChange={handleNavTabChange}
        badges={{
          artifacts: completedArtifacts,
          expedition: 0,
          profile: state.referralsCount || 0,
        }}
        expeditionUnlocked={isAcademyUnlocked}
        prestigeLevel={state.prestigeLevel || 0}
      />
    </div>
  );
}

export default OptimizedLayout;
