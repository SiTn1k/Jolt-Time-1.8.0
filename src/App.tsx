import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGame } from './hooks/useGame';
import { useTranslation } from './i18n';
import { TapArea } from './components/TapArea';
import { GeneratorShop } from './components/GeneratorShop';
import { TapUpgrade } from './components/StatsPanel';
import { GachaModal } from './components/GachaModal';
import { ReferralsTab } from './components/ReferralsTab';
import { TutorialModal } from './components/TutorialModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { DailyRewards } from './components/DailyRewards';
import { DailyTasksPanel } from './components/DailyTasksPanel';
import { AdsGramButton } from './components/AdsGramButton';
import { AdsGramTask } from './components/AdsGramTask';
import { PrestigeButton, MuseumLaboratory } from './components/PrestigeSystem';
import { SessionAdModal, ChestAdModal, EnergyRestoreAdButton, useSessionAdTrigger, useChestAdTrigger } from './components/AdSystem';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { AcademyUnlockModal } from './components/AcademyUnlockModal';
import { FigmaLayout } from './components/FigmaLayout';
import { EPOCHS, ARTIFACTS, getEpochById } from './data/epochs';
import { initTelegramMiniApp, hapticImpact, hapticNotification, getTelegramWebApp, getTelegramUserId, getRawInitData } from './lib/telegram';
import { rpcTrackSession } from './lib/rpc';
import { supabase } from './lib/supabase';
import { notificationService } from './services/NotificationService';
import { initErrorToasts } from './lib/errors';
import { Crown, ShoppingBag, Trophy, Gift, Loader2, Users, X, Shield, Zap, Star, ChevronRight, Wifi, RefreshCw, Timer, AlertTriangle, Battery, BatteryLow, Globe, Building2, Check } from 'lucide-react';
import type { EpochId } from './types/game';
import { formatNumber } from './lib/utils';
import { getTodayDateStr } from './data/tasks';

// Lazy load ExpeditionApp - only needed for prestigeLevel >= 2
const ExpeditionApp = lazy(() => import('./expedition/ExpeditionApp').then(m => ({ default: m.ExpeditionApp })));

type Tab = 'shop' | 'epochs' | 'artifacts' | 'referrals' | 'stats' | 'boosters';

function App() {
  const {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    switchEpoch,
    tapPowerCost,
    processServerRewards,
    upgradeArtifactLevel,
    deductGachaCost,
    recordGachaOpen,
    claimDailyTask,
    isLoading,
    telegramId,
    leaderboard,
    userRank,
    leaderboardLoading,
    loadLeaderboard,
    artifactMultipliers,
    boosterMultipliers,
    refreshBoosters,
    offlineGains,
    dismissOfflineGains,
    duplicateTab,
    streakModal,
    dismissStreakModal,
    syncStatus,
    connectionError,
    dismissConnectionError,
    showDailyRewards,
    claimDailyReward,
    skipDailyRewards,
    // Prestige System
    canPrestige,
    performPrestige,
    buyPrestigeUpgrade,
    // Energy System
    getEnergyMultiplier,
    updateSessionAdTimestamp,
  } = useGame();

  const [activeTab, setActiveTab] = useState<Tab>('shop');
  const [activeNavTab, setActiveNavTab] = useState<NavigationTab>('game');
  const [showGacha, setShowGacha] = useState(false);
  const [showEpochModal, setShowEpochModal] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [purchasingBooster, setPurchasingBooster] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Handler for BottomNavigation tab change
  const handleNavTabChange = useCallback((tab: NavigationTab) => {
    setActiveNavTab(tab);
    
    // Map new tabs to old tabs for backwards compatibility
    switch (tab) {
      case 'game':
        setActiveTab('shop');
        break;
      case 'artifacts':
        setActiveTab('artifacts');
        break;
      case 'expedition':
        // Expedition is handled separately with ExpeditionApp
        break;
      case 'profile':
        setActiveTab('stats');
        break;
      case 'settings':
        setShowSettings(true);
        break;
    }
  }, []);

  // Academy Unlock Modal - show once when prestigeLevel === 2
  const isAcademyUnlocked = (state.prestigeLevel || 0) >= 2;
  const hasSeenAcademyUnlock = localStorage.getItem('academy_unlock_seen') === 'true';
  const [showAcademyUnlock, setShowAcademyUnlock] = useState(false);
  const [academyModalShown, setAcademyModalShown] = useState(false);

  // Initialize error toasts on mount
  useEffect(() => {
    initErrorToasts();
  }, []);

  // Show unlock modal on first visit after prestigeLevel >= 2
  useEffect(() => {
    if (isAcademyUnlocked && !academyModalShown && !hasSeenAcademyUnlock) {
      setShowAcademyUnlock(true);
      setAcademyModalShown(true);
    }
  }, [isAcademyUnlocked, academyModalShown, hasSeenAcademyUnlock]);

  const handleAcademyUnlockClose = () => {
    setShowAcademyUnlock(false);
    localStorage.setItem('academy_unlock_seen', 'true');
  };

  // i18n
  const { locale, toggleLocale, t } = useTranslation();
  
  // Translation helper for static strings
  const tr = (key: string, params?: Record<string, string | number>) => t(key as never, params as never);

  // Session Ad hook - triggers after 15 min of ACTIVE play
  const { shouldShowSessionAd, dismissSessionAd } = useSessionAdTrigger(
    state.level,
    state.sessionStartAt || Date.now(),
    state.lastSessionAdAt || 0
  );

  // Chest Ad hook - triggers every 10th chest
  const {
    shouldShowChestAd,
    totalChestsOpened,
    recordChestOpened,
    dismissChestAd
  } = useChestAdTrigger();

  // Daily energy ads tracking
  const today = getTodayDateStr();
  const dailyAdViews = state.dailyAdViews || {};
  const energyAdsUsed = (dailyAdViews.last_reset === today) ? (dailyAdViews.energy_ads || 0) : 0;
  const offlineAdsUsed = (dailyAdViews.last_reset === today) ? (dailyAdViews.offline_ads || 0) : 0;
  const offlineAdsRemaining = 3 - offlineAdsUsed;

  useEffect(() => {
    const tg = initTelegramMiniApp();
    // Initialize Telegram Mini App if available
    if (tg) {
      tg.ready();
    }

    // Show tutorial for new players
    const tutorialSeen = localStorage.getItem('tutorial_seen');
    if (!tutorialSeen) {
      setShowTutorial(true);
    }

    // Request push notification permission on first launch
    const notificationPermissionRequested = localStorage.getItem('notification_permission_requested');
    if (!notificationPermissionRequested && 'Notification' in window) {
      notificationService.requestPermission().then(() => {
        localStorage.setItem('notification_permission_requested', 'true');
      });
    }

    // Session tracking
    const userId = getTelegramUserId();
    if (userId) {
      rpcTrackSession(userId, 'start');

      // Activity ping every 60 seconds
      const activityInterval = setInterval(() => {
        rpcTrackSession(userId, 'activity');
      }, 60_000);

      // Track visibility changes (app open/close in Telegram)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          rpcTrackSession(userId, 'end');
        } else {
          rpcTrackSession(userId, 'start');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // End session on unload
      const handleUnload = () => {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session`,
          JSON.stringify({ telegram_id: userId, event: 'end' })
        );
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        clearInterval(activityInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleUnload);
        rpcTrackSession(userId, 'end');
      };
    }
  }, []);

  const ownedLevels = useMemo(() => {
    const map = new Map<string, number>();
    state.ownedGenerators.forEach(og => {
      map.set(og.generatorId, og.level);
    });
    return map;
  }, [state.ownedGenerators]);

  const handleBuy = (generatorId: string): boolean => {
    const ok = buyGenerator(generatorId);
    if (ok) hapticNotification('success');
    return ok;
  };

  const handleUpgradeTap = (): boolean => {
    const ok = upgradeTapPower();
    if (ok) hapticNotification('success');
    return ok;
  };

  const completedArtifacts = state.completedArtifacts?.length || 0;
  // Energy multiplier (x5 if energy > 0 and prestige >= 1)
  const energyMultiplier = getEnergyMultiplier ? getEnergyMultiplier() : 1;

  // Prestige research XP bonus
  const prestigeXpBonus = 1 + ((state.prestigeResearch?.xp_gain || 0) * 0.05);

  const effectiveTapPower = Math.max(
    1,
    Math.round(state.tapPower * artifactMultipliers.xp * boosterMultipliers.xp * energyMultiplier * prestigeXpBonus),
    Math.round(state.passiveXpPerSecond * 0.015),
  );

  // Telegram Stars purchase — real implementation
  const handleBuyBooster = useCallback(async (booster: { id: string; name: string; price: number }) => {
    const tg = getTelegramWebApp();
    if (!tg) {
      setShowError(t('error.telegram_stars_app_only'));
      return;
    }
    if (!telegramId) {
      setShowError(t('error.login_telegram'));
      return;
    }
    if (!supabase) {
      setShowError(t('error.no_connection'));
      return;
    }

    setPurchasingBooster(booster.id);
    hapticImpact('medium');

    try {
      if (!supabase) {
        setShowError(t('error.supabase_not_connected'));
        setPurchasingBooster(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('telegram-payments', {
        body: { action: 'create_invoice', booster_id: booster.id, telegram_id: telegramId },
      });

      if (error || !data?.invoice_url) {
        const msg = data?.error ?? error?.message ?? t('error.create_bill_failed');
        setShowError(msg);
        setPurchasingBooster(null);
        return;
      }

      // Open Telegram native invoice UI
      tg.openInvoice(data.invoice_url, async (status) => {
        setPurchasingBooster(null);
        if (status === 'paid') {
          hapticNotification('success');
          // Wait briefly for webhook to deliver, then refresh boosters
          setTimeout(() => refreshBoosters(), 2000);
        } else if (status === 'failed') {
          hapticNotification('error');
          setShowError(t('error.payment_failed'));
        }
      });
    } catch (e) {
      console.error('handleBuyBooster error:', e);
      setShowError(t('error.open_bill_failed'));
      setPurchasingBooster(null);
    }
  }, [telegramId, refreshBoosters, t]);

  const handleEpochSwitch = (epochId: EpochId) => {
    if (state.unlockedEpochs.includes(epochId)) {
      switchEpoch(epochId);
      hapticNotification('success');
      setShowEpochModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mb-4" />
        <p className="text-lg">{tr('common.loading')}</p>
        {telegramId && (
          <p className="text-xs text-gray-500 mt-2">{tr('app.telegram_id', { id: telegramId })}</p>
        )}
      </div>
    );
  }

  // After the 2nd rebirth (prestige), show ExpeditionApp (Academy)
  if ((state.prestigeLevel || 0) >= 2) {
    // Lazy-loaded, wrapped in Suspense for loading state
    return (
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-[#0D1117]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFC72C]" />
        </div>
      }>
        <>
          <ExpeditionApp prestigeLevel={state.prestigeLevel || 0} />
          {showAcademyUnlock && (
            <AcademyUnlockModal isOpen={showAcademyUnlock} onClose={handleAcademyUnlockClose} />
          )}
        </>
      </Suspense>
    );
  }

  // Before Academy - use FIGMA layout (exact reproduction)
  return <FigmaLayout />;
}

export default App;
