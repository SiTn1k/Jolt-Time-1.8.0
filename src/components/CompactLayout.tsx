/**
 * CompactLayout - New compact game layout
 * 
 * Design from Pre-Academy-Game-Redesign:
 * - Header with epoch, XP bar, resources
 * - Fixed height game canvas (248-320px)
 * - Booster bar always visible
 * - Tab content below
 * - Navigation at bottom
 * - Ad banners in proper positions
 */

import { useState, useCallback, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../hooks/useGame';
import { useTranslation } from '../i18n';
import { CompactHeader } from './CompactHeader';
import { BoostBar } from './BoostBar';
import { GameCanvas } from './GameCanvas';
import { BottomNavigation, NavigationTab } from './BottomNavigation';
import { GeneratorShop } from './GeneratorShop';
import { TapUpgrade } from './StatsPanel';
import { DailyTasksPanel } from './DailyTasksPanel';
import { AcademyPreview } from './AcademyPreview';
import { ReferralsTab } from './ReferralsTab';
import { EPOCHS, getEpochById } from '../data/epochs';
import { formatNumber } from '../lib/utils';
import { ShoppingBag, Trophy, Gift, Users } from 'lucide-react';

// Lazy load ExpeditionApp
const ExpeditionApp = lazy(() => import('../expedition/ExpeditionApp').then(m => ({ default: m.ExpeditionApp })));

// Ad Banner Placeholder
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

// Tab Content Components
function GameTab({
  state,
  epoch,
  tapPowerCost,
  effectiveTapPower,
  onBuyGenerator,
  onUpgradeTap,
}: {
  state: ReturnType<typeof useGame>['state'];
  epoch: ReturnType<typeof useGame>['epoch'];
  tapPowerCost: number;
  effectiveTapPower: number;
  onBuyGenerator: (id: string) => void;
  onUpgradeTap: () => void;
}) {
  const ownedLevels = useMemo(() => {
    const map = new Map<string, number>();
    state.ownedGenerators.forEach(g => { map.set(g.id, g.ownedLevels); });
    return map;
  }, [state.ownedGenerators]);

  return (
    <motion.div
      key="game"
      className="h-full overflow-y-auto p-3 space-y-2.5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      <DailyTasksPanel
        dailyStreak={state.dailyStreak}
        bestStreak={state.bestStreak}
        dailyTasksState={state.dailyTasksState}
        currencyIcon={epoch.currencyIcon}
        checkInStreak={state.checkInStreak}
        onClaimTask={() => {}} // Will be passed from parent
      />
      <AcademyPreview currentPrestige={state.prestigeLevel || 0} />
      <TapUpgrade
        tapPower={state.tapPower}
        effectiveTapPower={effectiveTapPower}
        passiveXpPerSecond={state.passiveXpPerSecond}
        cost={tapPowerCost}
        currency={state.currency}
        epochIndex={EPOCHS.findIndex(e => e.id === state.epochId)}
        onUpgrade={onUpgradeTap}
      />
      <GeneratorShop
        epoch={epoch}
        currency={state.currency}
        ownedLevels={ownedLevels}
        onBuy={onBuyGenerator}
      />
      <div className="h-4" />
    </motion.div>
  );
}

function ArtifactsTab({ state }: { state: ReturnType<typeof useGame>['state'] }) {
  const { t } = useTranslation();
  
  const completedCount = state.completedArtifacts?.length || 0;
  const totalArtifacts = 12; // Approximate

  return (
    <motion.div
      key="artifacts"
      className="h-full overflow-y-auto p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="text-center py-8">
        <Gift className="w-16 h-16 mx-auto text-amber-400/40 mb-3" />
        <div className="text-white/60 text-sm mb-1">{t('app.artifacts') || 'Артефакти'}</div>
        <div className="text-white/30 text-xs">
          {completedCount}/{totalArtifacts} зібрано
        </div>
      </div>
    </motion.div>
  );
}

function ProfileTab({ 
  level, 
  currency, 
  streak, 
  prestigeLevel,
  referralsCount 
}: { 
  level: number; 
  currency: number; 
  streak: number;
  prestigeLevel: number;
  referralsCount: number;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="profile"
      className="h-full overflow-y-auto p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="bg-gray-800/50 rounded-xl p-4 mb-3">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto bg-amber-400/20 rounded-full flex items-center justify-center text-3xl mb-2">
            👤
          </div>
          <div className="text-white font-semibold">Level {level}</div>
          {prestigeLevel > 0 && (
            <div className="text-amber-400 text-sm">★ {t('prestige.prestige_level', { count: prestigeLevel })}</div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-white/60 text-sm">{t('prestige.streak', 'Стрік')}</span>
            <span className="text-white font-medium">🔥 {streak}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-white/60 text-sm">{t('app.currency', 'Валюта')}</span>
            <span className="text-green-400 font-medium">{formatNumber(currency)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-white/60 text-sm">{t('app.referrals', 'Реферали')}</span>
            <span className="text-white font-medium">👥 {referralsCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main CompactLayout Component
export function CompactLayout() {
  const { t } = useTranslation();
  
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
    offlineGains,
    dismissOfflineGains,
    canPrestige,
    performPrestige,
    dailyStreak,
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

  const handleNavTabChange = useCallback((tab: NavigationTab) => {
    setActiveNavTab(tab);
  }, []);

  const handleBuy = useCallback((id: string) => {
    buyGenerator(id);
  }, [buyGenerator]);

  const handleUpgradeTap = useCallback(() => {
    upgradeTapPower();
  }, [upgradeTapPower]);

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden select-none bg-[#07090F] text-white"
    >
      {/* Header */}
      <CompactHeader
        state={state}
        epoch={epoch}
        onEpochClick={() => {}}
      />

      {/* Top Ad Banner */}
      <AdBanner position="top" />

      {/* Game Canvas - Fixed Height */}
      <div className="shrink-0 h-[248px] sm:h-[288px] md:h-[320px]">
        <GameCanvas
          epoch={epoch}
          onTap={(x, y) => tap(x, y)}
          tapEvents={tapEvents}
          tapPower={effectiveTapPower}
        />
      </div>

      {/* Booster Bar */}
      <BoostBar
        boostInfo={{
          xpMultiplier: boosterMultipliers?.xp || 1,
          xpBoostEndsAt: boosterMultipliers?.xpBoostEndsAt || null,
          currencyMultiplier: boosterMultipliers?.currency || 1,
          currencyBoostEndsAt: boosterMultipliers?.currencyBoostEndsAt || null,
          dailyStreak: state.dailyStreak || 0,
          bestStreak: state.bestStreak || 0,
        }}
        adsRemaining={3}
        disabled={false}
      />

      {/* Content Area */}
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
            />
          )}

          {activeNavTab === 'artifacts' && (
            <ArtifactsTab state={state} />
          )}

          {activeNavTab === 'expedition' && (
            <motion.div 
              key="expedition" 
              className="h-full flex flex-col items-center justify-center gap-4 p-6"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-5xl">🔒</div>
              <div className="text-center">
                <div className="text-white/80 font-semibold mb-1">Академія заблокована</div>
                <div className="text-white/40 text-sm">Розблоковується на 2-му переродженні</div>
              </div>
            </motion.div>
          )}

          {activeNavTab === 'profile' && (
            <ProfileTab 
              level={state.level}
              currency={state.currency}
              streak={state.dailyStreak || 0}
              prestigeLevel={state.prestigeLevel || 0}
              referralsCount={state.referralsCount || 0}
            />
          )}

          {activeNavTab === 'settings' && (
            <motion.div 
              key="settings" 
              className="h-full flex items-center justify-center"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-white/40 text-sm">{t('settings.title', 'Налаштування')}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Ad Banner */}
      <AdBanner position="bottom" />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeNavTab}
        onTabChange={handleNavTabChange}
        badges={{
          artifacts: completedArtifacts,
          expedition: 0,
          profile: state.referralsCount || 0,
        }}
        expeditionUnlocked={(state.prestigeLevel || 0) >= 2}
        prestigeLevel={state.prestigeLevel || 0}
      />
    </div>
  );
}

export default CompactLayout;
