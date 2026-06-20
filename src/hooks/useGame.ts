import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, EpochId, OwnedGenerator, TapEvent, LeaderboardEntry, Epoch, ARTIFACT_PARTS_PER_LEVEL } from '../types/game';
import {
  EPOCHS,
  ARTIFACTS,
  getEpochById,
  getCurrentEpochByLevel,
  getGeneratorCost,
  getGeneratorProduction,
} from '../data/epochs';
import {
  getTodayDateStr,
  getYesterdayDateStr,
  makeFreshDailyTasks,
  getStreakReward,
  getTaskById,
  type StreakReward,
} from '../data/tasks';
import {
  saveLocalState,
  saveRemoteState,
  loadGameState,
  getTelegramUserId,
  getLeaderboard,
  getUserRank,
  fetchActiveBoosters,
} from '../lib/storage';
import { hapticNotification, hapticImpact } from '../lib/telegram';
import type { ActiveBoosters } from '../types/game';

const LOCAL_SAVE_INTERVAL = 2000;
const REMOTE_SAVE_INTERVAL = 15000;
const MAX_LEVEL = 999;
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * XP curve: tuned for ~15 hours to reach Epoch 3 (level 100).
 *
 * Target time per level:
 * - Epoch 1: 60s → 5 min (avg ~3 min)
 * - Epoch 2: 90s → 8 min (avg ~5 min)
 * - Epoch 3+: 2 min → 15 min (progressive slowdown)
 *
 * Each epoch has its own passive XP/s estimate based on generators.
 */
function calculateXpToLevel(level: number): number {
  const epoch = getCurrentEpochByLevel(level);
  const { min, max } = epoch.levelRange;
  const rangeSize = Math.max(1, max - min + 1);
  const progress = Math.min(1, Math.max(0, (level - min) / rangeSize)); // 0 at epoch start, ~1 at end

  // Target time by epoch:
  // Epoch 1: 60s → 5 min (total ~6 min for 50 levels would be ideal but let's make it realistic)
  // Epoch 2: 90s → 8 min
  // Epoch 3+: 2 min → 15 min
  const epochIndex = EPOCHS.findIndex(e => e.id === epoch.id);
  let minSeconds: number;
  let maxSeconds: number;

  if (epochIndex === 0) {
    // Epoch 1: 60s → 300s (5 min) - avg ~3 min per level = ~2.5 hr for 50 levels
    minSeconds = 60;
    maxSeconds = 300;
  } else if (epochIndex === 1) {
    // Epoch 2: 60s → 480s (8 min) - avg ~4.5 min = ~3.75 hr for 50 levels
    minSeconds = 60;
    maxSeconds = 480;
  } else if (epochIndex === 2) {
    // Epoch 3: 120s → 900s (15 min) - avg ~8.5 min = ~7 hr for 50 levels
    minSeconds = 120;
    maxSeconds = 900;
  } else {
    // Later epochs: progressively harder
    minSeconds = 120 + (epochIndex - 3) * 60;
    maxSeconds = 1800 + (epochIndex - 3) * 600;
  }

  const targetSeconds = minSeconds + progress * (maxSeconds - minSeconds);

  // Estimate passive XP/s for this level within the epoch
  // Use the epoch's base production scaling × level factor
  // The sum of all generators at roughly (level - min + 1) levels gives a good estimate
  const levelInEpoch = Math.max(1, level - min + 1);
  const estimatedPassive = estimatePassiveForEpoch(epoch, levelInEpoch);

  return Math.max(50, Math.floor(estimatedPassive * targetSeconds));
}

function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number {
  // Rough estimate: sum of production if player owns ~2 generators per tier
  // scaled by their level within the epoch
  const tierWeights = [1, 0.5, 0.25, 0.1, 0.03]; // cheaper generators are bought more
  let total = 0;
  for (let i = 0; i < epoch.generators.length && i < tierWeights.length; i++) {
    const g = epoch.generators[i];
    const owned = Math.max(1, Math.floor(levelInEpoch * tierWeights[i]));
    total += g.baseProduction * owned;
  }
  return Math.max(1, total);
}

export interface ArtifactMultipliers {
  xp: number;
  currency: number;
  passive: number;
}

export interface BoosterMultipliers {
  xp: number;
  currency: number;
}

export function getBoosterMultipliers(boosters: ActiveBoosters): BoosterMultipliers {
  const now = Date.now();
  let xp = 1;
  let currency = 1;

  if (boosters.xp_boost_end && boosters.xp_boost_end > now) {
    xp = Math.max(xp, boosters.xp_boost_mult ?? 2);
  }
  if (boosters.currency_boost_end && boosters.currency_boost_end > now) {
    currency = Math.max(currency, boosters.currency_boost_mult ?? 2);
  }
  if (boosters.super_boost_end && boosters.super_boost_end > now) {
    const m = boosters.super_boost_mult ?? 3;
    xp = Math.max(xp, m);
    currency = Math.max(currency, m);
  }
  if (boosters.offline_boost_end && boosters.offline_boost_end > now) {
    xp = Math.max(xp, 2);
    currency = Math.max(currency, 2);
  }

  return { xp, currency };
}

export function getArtifactMultipliers(completedArtifacts: string[], artifactDupes?: Record<string, number>): ArtifactMultipliers {
  let xp = 1;
  let currency = 1;
  let passive = 1;
  for (const id of completedArtifacts) {
    const art = ARTIFACTS.find(a => a.id === id);
    if (!art) continue;
    // Each duplicate adds +10% of the base bonus (stacks additively, then multiplied)
    const dupeCount = artifactDupes?.[id] || 0;
    const effectiveValue = art.bonus.value + (art.bonus.value - 1) * 0.1 * dupeCount;
    if (art.bonus.type === 'xp_multiplier') xp *= effectiveValue;
    if (art.bonus.type === 'currency_multiplier') currency *= effectiveValue;
    if (art.bonus.type === 'passive_boost') passive *= effectiveValue;
  }
  return { xp, currency, passive };
}

const INITIAL_STATE: GameState = {
  epochId: 'trypillia',
  level: 1,
  xp: 0,
  xpToNextLevel: calculateXpToLevel(1),
  totalXp: 0,
  currency: 20,
  totalCurrencyEarned: 20,
  ownedGenerators: [],
  tapPower: 1,
  passiveXpPerSecond: 0,
  unlockedEpochs: ['trypillia'],
  artifactParts: {},
  artifactLevels: {},
  completedArtifacts: [],
  artifactDupes: {},
  lastSavedAt: Date.now(),
  referrerId: null,
  referralsCount: 0,
  referralEarnings: 0,
  activeBoosters: {},
  dailyStreak: 0,
  bestStreak: 0,
  lastLoginDate: null,
  dailyTasksState: null,
  lastCheckIn: null,
  checkInStreak: 0,
  // Phase 2: Prestige System
  prestigeLevel: 0,
  prestigePoints: 0,
  prestigeResearch: {},
  // Phase 2: Energy System (only after Prestige 1+)
  energy: 1000,
  maxEnergy: 1000,
  lastOnlineAt: Date.now(),
  sessionStartAt: Date.now(),
  dailyAdViews: {},
};

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export function useGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [tapEvents, setTapEvents] = useState<TapEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [offlineGains, setOfflineGains] = useState<{ xp: number; currency: number } | null>(null);
  const [duplicateTab, setDuplicateTab] = useState(false);
  const [streakModal, setStreakModal] = useState<{ streak: number; reward: StreakReward } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const tickRef = useRef<number | null>(null);
  const localSaveRef = useRef<number | null>(null);
  const remoteSaveRef = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const dirtyRef = useRef(false);
  const isOnlineRef = useRef(true);

  // ── Online/offline detection ────────────────────────────────────────
  useEffect(() => {
    const goOffline = () => {
      isOnlineRef.current = false;
      setSyncStatus('offline');
      setConnectionError('Проблеми зі з\'єднанням. Прогрес збережеться локально');
    };
    const goOnline = () => {
      isOnlineRef.current = true;
      setSyncStatus('synced');
      setConnectionError(null);
    };

    // Initial state
    isOnlineRef.current = navigator.onLine;
    if (!navigator.onLine) goOffline();

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Multiple tab detection with BroadcastChannel for real-time sync
  useEffect(() => {
    const STORAGE_KEY = 'game_active_tab';
    const CHANNEL_NAME = 'jolt_time_tab_channel';
    let channel: BroadcastChannel | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    // Claim active tab on mount
    localStorage.setItem(STORAGE_KEY, TAB_ID);

    // Try BroadcastChannel for better cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        
        // Announce this tab
        channel.postMessage({
          type: 'tab_active',
          tabId: TAB_ID,
          timestamp: Date.now(),
        });

        // Listen for other tabs
        channel.onmessage = (event) => {
          const { type, tabId } = event.data;
          if (tabId === TAB_ID) return; // Ignore own messages

          if (type === 'tab_active') {
            setDuplicateTab(true);
          } else if (type === 'tab_closed') {
            // Another tab closed, we can claim active status
            setDuplicateTab(false);
            localStorage.setItem(STORAGE_KEY, TAB_ID);
          }
        };
      } catch {
        console.warn('BroadcastChannel not supported');
      }
    }

    const checkTab = () => {
      const activeTab = localStorage.getItem(STORAGE_KEY);
      if (activeTab && activeTab !== TAB_ID) {
        setDuplicateTab(true);
      } else {
        // Other tab closed/released — reclaim and clear warning
        localStorage.setItem(STORAGE_KEY, TAB_ID);
        setDuplicateTab(false);
        // Notify other tabs
        channel?.postMessage({
          type: 'tab_active',
          tabId: TAB_ID,
          timestamp: Date.now(),
        });
      }
    };

    heartbeatTimer = setInterval(checkTab, 1000);

    // Listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue && e.newValue !== TAB_ID) {
        setDuplicateTab(true);
      } else {
        setDuplicateTab(false);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('storage', handleStorage);
      // Notify other tabs we're closing
      channel?.postMessage({
        type: 'tab_closed',
        tabId: TAB_ID,
        timestamp: Date.now(),
      });
      channel?.close();
      if (localStorage.getItem(STORAGE_KEY) === TAB_ID) {
        localStorage.removeItem(STORAGE_KEY);
      }
    };
  }, []);

  // Use the player's selected epoch (state.epochId) if available
  // Fall back to level-based epoch only for new players
  const epoch = getEpochById(state.epochId);

  const calculatePassiveXp = useCallback((owned: OwnedGenerator[], unlockedEpochs: EpochId[]): number => {
    // Sum production from all owned generators across all unlocked epochs
    return owned.reduce((total, og) => {
      // Search for generator in all unlocked epochs
      for (const epochId of unlockedEpochs) {
        const epochData = getEpochById(epochId);
        const generator = epochData.generators.find(g => g.id === og.generatorId);
        if (generator) {
          return total + getGeneratorProduction(generator, og.level);
        }
      }
      return total;
    }, 0);
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    (async () => {
      let saved: GameState | null = null;
      try {
        saved = await loadGameState();
      } catch (e) {
        console.error('Failed to load game state:', e);
        setSyncStatus('error');
        setConnectionError('Не вдалося завантажити прогрес. Гратимете з локальної копії.');
        // Try localStorage fallback
        try {
          const raw = localStorage.getItem('ukraine_tap_game_state');
          if (raw) saved = JSON.parse(raw) as GameState;
        } catch {
          // No fallback available — start fresh
        }
      }
      if (saved) {
        const passiveXp = calculatePassiveXp(saved.ownedGenerators, saved.unlockedEpochs);

        // Compute offline gains using server-based timestamp
        // lastSavedAt comes from server's last_saved_at column during hydration
        // We use lastOnlineAt (server timestamp) instead of Date.now() (device time)
        // to prevent device clock manipulation exploits
        const serverNow = saved.lastOnlineAt || Date.now();
        const offlineMs = Math.max(0, serverNow - saved.lastSavedAt);
        // Use prestige-based offline cap: 8h for prestige 0, 6h for prestige 1+
        const prestigeLevel = saved.prestigeLevel || 0;
        const offlineCap = prestigeLevel > 0 ? 6 * 3600 : 8 * 3600;
        const offlineSec = Math.min(offlineMs / 1000, offlineCap);
        // CRITICAL FIX: Offline rewards formula was too generous
        // OLD: offlineCurrency = (saved.level * 50) * (offlineSec / 60)
        // This meant level 100 player got 5000/sec = 300,000/hour!
        // NEW: Capped at reasonable amount based on level, with diminishing returns
        let offlineXp = passiveXp * offlineSec;
        const maxOfflineCurrencyPerHour = Math.min(saved.level * 10, 500); // Cap at 500/hr
        let offlineCurrency = (maxOfflineCurrencyPerHour * offlineSec) / 3600;

        // ── Daily streak check ────────────────────────────────────────
        const today = getTodayDateStr();
        const yesterday = getYesterdayDateStr();
        let newStreak = saved.dailyStreak || 0;
        let newBestStreak = saved.bestStreak || 0;
        let newLastLoginDate = saved.lastLoginDate;
        let isNewDay = false;

        if (saved.lastLoginDate !== today) {
          isNewDay = true;
          if (!saved.lastLoginDate) {
            // Brand new player
            newStreak = 1;
          } else if (saved.lastLoginDate === yesterday) {
            newStreak = (saved.dailyStreak || 0) + 1;
          } else {
            // Missed at least one day → reset streak
            newStreak = 1;
          }
          newBestStreak = Math.max(newStreak, saved.bestStreak || 0);
          newLastLoginDate = today;

          // Add streak reward to offline gains so it's shown in the same batch
          const reward = getStreakReward(newStreak);
          offlineXp += reward.xp;
          offlineCurrency += reward.currency;
          setStreakModal({ streak: newStreak, reward });
        }

        // ── Daily tasks: refresh if new day ──────────────────────────
        let dailyTasksState = saved.dailyTasksState;
        if (!dailyTasksState || dailyTasksState.date !== today) {
          dailyTasksState = makeFreshDailyTasks(today);
        }

        if (offlineMs > 60_000 && (offlineXp > 100 || offlineCurrency > 10) && !isNewDay) {
          setOfflineGains({ xp: offlineXp, currency: offlineCurrency });
        }

        // ── Daily check-in: show reward modal if player hasn't claimed today ──
        const checkInToday = getTodayDateStr();
        if (saved.lastCheckIn !== checkInToday) {
          setShowDailyRewards(true);
        }

        setState({
          ...saved,
          xp: saved.xp + offlineXp,
          totalXp: saved.totalXp + offlineXp,
          currency: saved.currency + offlineCurrency,
          totalCurrencyEarned: saved.totalCurrencyEarned + offlineCurrency,
          passiveXpPerSecond: passiveXp,
          lastSavedAt: Date.now(),
          dailyStreak: newStreak,
          bestStreak: newBestStreak,
          lastLoginDate: newLastLoginDate,
          dailyTasksState,
        });
      }
      setIsLoading(false);
    })();
  }, [calculatePassiveXp]);

  // Use a stable ref for save so we don't recreate the interval on every state update
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Dual-layer save: local (fast) + remote (throttled) ──────────────
  // Mark state as dirty whenever it changes — the intervals check this flag
  // to avoid redundant writes when nothing changed.
  useEffect(() => {
    if (isLoading) return;
    dirtyRef.current = true;
  }, [state, isLoading]);

  useEffect(() => {
    if (isLoading) return;

    // Local save: every 2s (cheap, synchronous)
    localSaveRef.current = window.setInterval(() => {
      if (dirtyRef.current) {
        saveLocalState(stateRef.current);
        dirtyRef.current = false;
      }
    }, LOCAL_SAVE_INTERVAL);

    // Remote save: every 15s (expensive, throttled to avoid race conditions)
    remoteSaveRef.current = window.setInterval(async () => {
      if (!isOnlineRef.current) return;
      try {
        setSyncStatus('syncing');
        await saveRemoteState(stateRef.current);
        setSyncStatus('synced');
        // Clear connection error on first successful save after a failure
        setConnectionError(prev => prev ? null : prev);
      } catch (e) {
        console.error('Remote save failed:', e);
        setSyncStatus('error');
        setConnectionError('Проблеми зі з\'єднанням. Прогрес збережеться локально');
      }
    }, REMOTE_SAVE_INTERVAL);

    // Flush both on unmount / tab close
    const flush = () => {
      saveLocalState(stateRef.current);
      saveRemoteState(stateRef.current);
    };

    window.addEventListener('beforeunload', flush);

    return () => {
      if (localSaveRef.current) clearInterval(localSaveRef.current);
      if (remoteSaveRef.current) clearInterval(remoteSaveRef.current);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    tickRef.current = window.setInterval(() => {
      setState(prev => {
        const basePassiveXp = calculatePassiveXp(prev.ownedGenerators, prev.unlockedEpochs);
        const { passive: passMult, currency: artCurrMult } = getArtifactMultipliers(prev.completedArtifacts || [], prev.artifactDupes || {});
        const { xp: boostXpMult, currency: boostCurrMult } = getBoosterMultipliers(prev.activeBoosters || {});
        const effectivePassiveXp = basePassiveXp * passMult * boostXpMult * (1 + ((prev.prestigeResearch?.passive_income || 0) * 0.10));

        const xpGainThisTick = effectivePassiveXp / 10;
        let xp = prev.xp + xpGainThisTick;
        const newTotalXp = prev.totalXp + xpGainThisTick;

        const currMult = artCurrMult * boostCurrMult;
        let newLevel = prev.level;
        let xpToNext = prev.xpToNextLevel;
        let newCurrency = prev.currency;
        let newTotalCurrency = prev.totalCurrencyEarned;
        // Reuse same array reference if no epoch unlocks happen — avoids cascading re-renders
        let newUnlocked: string[] | null = null;

        while (xp >= xpToNext && newLevel < MAX_LEVEL) {
          xp -= xpToNext;
          newLevel++;
          xpToNext = calculateXpToLevel(newLevel);
          const levelReward = Math.round(newLevel * 50 * currMult);
          newCurrency += levelReward;
          newTotalCurrency += levelReward;

          EPOCHS.forEach(e => {
            if (e.unlockLevel === newLevel && !prev.unlockedEpochs.includes(e.id)) {
              if (!newUnlocked) newUnlocked = [...prev.unlockedEpochs];
              if (!newUnlocked.includes(e.id)) newUnlocked.push(e.id);
            }
          });
        }

        const unlockedEpochs = newUnlocked ?? prev.unlockedEpochs;
        const newEpochUnlocked = newUnlocked !== null;
        const epochId = newEpochUnlocked
          ? getCurrentEpochByLevel(newLevel).id
          : prev.epochId;

        return {
          ...prev,
          xp,
          totalXp: newTotalXp,
          level: newLevel,
          xpToNextLevel: xpToNext,
          epochId,
          passiveXpPerSecond: effectivePassiveXp,
          currency: newCurrency,
          totalCurrencyEarned: newTotalCurrency,
          unlockedEpochs,
        };
      });
    }, 100);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isLoading, calculatePassiveXp]);

  const tap = useCallback((x: number, y: number) => {
    const eventId = Math.random().toString(36).substr(2, 9);

    setState(prev => {
      const { xp: artXpMult } = getArtifactMultipliers(prev.completedArtifacts || [], prev.artifactDupes || {});
      const { xp: boostXpMult } = getBoosterMultipliers(prev.activeBoosters || {});

      // Energy multiplier: x5 if energy > 0 and prestige >= 1, x1 otherwise
      const hasEnergyBoost = (prev.prestigeLevel || 0) >= 1 && (prev.energy || 0) > 0;
      const energyMult = hasEnergyBoost ? 5 : 1;

      // Apply prestige research XP bonus
      const prestigeXpBonus = 1 + ((prev.prestigeResearch?.xp_gain || 0) * 0.05);

      const baseTap = Math.max(1, Math.round(prev.tapPower * artXpMult * boostXpMult * energyMult * prestigeXpBonus));
      const passiveFloor = Math.round(prev.passiveXpPerSecond * 0.015);
      const value = Math.max(baseTap, passiveFloor);

      setTapEvents(te => [
        ...te.slice(-9),
        { id: eventId, x, y, value, createdAt: Date.now() },
      ]);
      setTimeout(() => {
        setTapEvents(te => te.filter(e => e.id !== eventId));
      }, 1000);

      // Track daily task counters for tap and earn_xp types
      const tasks = prev.dailyTasksState;
      const updatedTasks = tasks
        ? {
            ...tasks,
            counters: {
              ...tasks.counters,
              tap: tasks.counters.tap + 1,
              earn_xp: tasks.counters.earn_xp + value,
            },
          }
        : tasks;

      // Use energy if prestige >= 1 and energy > 0 (consume 1 per tap)
      const currentEnergy = prev.energy || 0;
      const maxEnergy = prev.maxEnergy || 1000;
      const newEnergy = hasEnergyBoost
        ? Math.max(0, currentEnergy - 1)
        : Math.min(maxEnergy, currentEnergy); // Regenerate when not using x5

      return {
        ...prev,
        xp: prev.xp + value,
        totalXp: prev.totalXp + value,
        dailyTasksState: updatedTasks,
        energy: newEnergy,
      };
    });
  }, []);

  const buyGenerator = useCallback((generatorId: string) => {
    const generator = epoch.generators.find(g => g.id === generatorId);
    if (!generator) return false;

    const currentOwned = state.ownedGenerators.find(og => og.generatorId === generatorId);
    const currentLevel = currentOwned?.level || 0;
    const cost = getGeneratorCost(generator, currentLevel);

    if (state.currency < cost) return false;

    setState(prev => {
      const existing = prev.ownedGenerators.find(og => og.generatorId === generatorId);
      const newOwned = existing
        ? prev.ownedGenerators.map(og =>
            og.generatorId === generatorId ? { ...og, level: og.level + 1 } : og
          )
        : [...prev.ownedGenerators, { generatorId, level: 1 }];

      const { passive: passMult } = getArtifactMultipliers(prev.completedArtifacts || [], prev.artifactDupes || {});
      const newPassiveXp = calculatePassiveXp(newOwned, prev.unlockedEpochs) * passMult;

      const tasks = prev.dailyTasksState;
      const updatedTasks = tasks
        ? { ...tasks, counters: { ...tasks.counters, buy_generator: tasks.counters.buy_generator + 1 } }
        : tasks;

      return {
        ...prev,
        currency: prev.currency - cost,
        ownedGenerators: newOwned,
        passiveXpPerSecond: newPassiveXp,
        dailyTasksState: updatedTasks,
      };
    });

    return true;
  }, [epoch.generators, state.currency, state.ownedGenerators, calculatePassiveXp]);

  const upgradeTapPower = useCallback(() => {
    const rawCost = 25 * Math.pow(1.8, state.tapPower - 1);
    // Guard against floating-point overflow at very high tap power levels
    const cost = Number.isFinite(rawCost) ? Math.floor(rawCost) : Number.MAX_SAFE_INTEGER;
    if (state.currency < cost) return false;

    setState(prev => {
      const tasks = prev.dailyTasksState;
      const updatedTasks = tasks
        ? { ...tasks, counters: { ...tasks.counters, upgrade_tap: tasks.counters.upgrade_tap + 1 } }
        : tasks;
      return {
        ...prev,
        currency: prev.currency - cost,
        tapPower: prev.tapPower + 1,
        dailyTasksState: updatedTasks,
      };
    });

    return true;
  }, [state.currency, state.tapPower]);

  const addArtifactPart = useCallback((artifactId: string, isFull: boolean) => {
    const artifact = ARTIFACTS.find(a => a.id === artifactId);

    setState(prev => {
      const newParts = { ...prev.artifactParts };
      const newCompleted = [...(prev.completedArtifacts || [])];
      const newDupes = { ...prev.artifactDupes };
      const newLevels = { ...prev.artifactLevels };

      if (isFull) {
        if (newCompleted.includes(artifactId)) {
          // Duplicate of a completed artifact → add fragments for upgrades
          newParts[artifactId] = (newParts[artifactId] || 0) + (artifact?.parts || 10);
        } else {
          newCompleted.push(artifactId);
          // Set initial level to 1
          newLevels[artifactId] = 1;
        }
      } else if (newCompleted.includes(artifactId)) {
        // Part for an already-completed artifact → add to parts (for upgrades)
        newParts[artifactId] = (newParts[artifactId] || 0) + 1;
      } else {
        // Only add parts if artifact not already completed
        newParts[artifactId] = (newParts[artifactId] || 0) + 1;

        // Auto-complete when all parts collected
        if (artifact && newParts[artifactId] >= artifact.parts) {
          newCompleted.push(artifactId);
          newLevels[artifactId] = 1;
        }
      }

      return { ...prev, artifactParts: newParts, completedArtifacts: newCompleted, artifactDupes: newDupes, artifactLevels: newLevels };
    });
  }, []);

  // Process server-determined chest rewards (server already updated DB)
  const processServerRewards = useCallback((rewards: Array<{ id: string; parts_granted: number }>) => {
    setState(prev => {
      const newParts = { ...prev.artifactParts };
      const newCompleted = [...(prev.completedArtifacts || [])];
      const newLevels = { ...prev.artifactLevels };

      for (const reward of rewards) {
        const artifact = ARTIFACTS.find(a => a.id === reward.id);
        newParts[reward.id] = (newParts[reward.id] || 0) + reward.parts_granted;

        // Auto-complete if enough parts collected (matches server logic)
        if (artifact && newParts[reward.id] >= artifact.parts && !newCompleted.includes(reward.id)) {
          newCompleted.push(reward.id);
          newLevels[reward.id] = 1;
        }
      }

      return { ...prev, artifactParts: newParts, completedArtifacts: newCompleted, artifactLevels: newLevels };
    });
  }, []);

  // Upgrade artifact level (consume parts for bonus increase)
  const upgradeArtifactLevel = useCallback((artifactId: string) => {
    setState(prev => {
      const currentLevel = prev.artifactLevels?.[artifactId] || 1;
      if (currentLevel >= 4) return prev; // Max level

      const partsRequired = ARTIFACT_PARTS_PER_LEVEL[currentLevel + 1] || 10;
      const currentParts = prev.artifactParts?.[artifactId] || 0;

      if (currentParts < partsRequired) return prev;

      const newParts = { ...prev.artifactParts };
      const newLevels = { ...prev.artifactLevels };

      newParts[artifactId] = currentParts - partsRequired;
      newLevels[artifactId] = currentLevel + 1;

      return { ...prev, artifactParts: newParts, artifactLevels: newLevels };
    });
  }, []);

  const deductGachaCost = useCallback((cost: number): boolean => {
    if (state.currency < cost) return false;
    setState(prev => ({ ...prev, currency: Math.max(0, prev.currency - cost) }));
    return true;
  }, [state.currency]);

  const recordGachaOpen = useCallback(() => {
    setState(prev => {
      const tasks = prev.dailyTasksState;
      if (!tasks) return prev;
      return {
        ...prev,
        dailyTasksState: {
          ...tasks,
          counters: { ...tasks.counters, open_gacha: tasks.counters.open_gacha + 1 },
        },
      };
    });
  }, []);

  const claimDailyTask = useCallback((taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) return;

    setState(prev => {
      const tasks = prev.dailyTasksState;
      if (!tasks || tasks.claimed.includes(taskId)) return prev;
      if (tasks.counters[task.type] < task.target) return prev;

      const reward = task.reward;
      return {
        ...prev,
        currency: prev.currency + (reward.currency || 0),
        totalCurrencyEarned: prev.totalCurrencyEarned + (reward.currency || 0),
        xp: prev.xp + (reward.xp || 0),
        totalXp: prev.totalXp + (reward.xp || 0),
        dailyTasksState: {
          ...tasks,
          claimed: [...tasks.claimed, taskId],
        },
      };
    });
  }, []);

  const dismissStreakModal = useCallback(() => setStreakModal(null), []);
  const dismissConnectionError = useCallback(() => setConnectionError(null), []);

  const claimDailyReward = useCallback(() => {
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();

    setState(prev => {
      if (prev.lastCheckIn === today) return prev; // already claimed today

      let newStreak: number;
      if (!prev.lastCheckIn) {
        newStreak = 1;
      } else if (prev.lastCheckIn === yesterday) {
        newStreak = prev.checkInStreak + 1;
      } else {
        newStreak = 1; // missed a day — reset
      }

      // Import dynamically to avoid circular — but since it's a pure data module, import at top
      const dayInWeek = ((newStreak - 1) % 7) + 1;
      // Inline reward lookup to avoid importing component code here
      const REWARDS = [
        { day: 1, currency: 500,  xp: 0 },
        { day: 2, currency: 1000, xp: 200 },
        { day: 3, currency: 1500, xp: 400 },
        { day: 4, currency: 2000, xp: 600 },
        { day: 5, currency: 3000, xp: 800 },
        { day: 6, currency: 4000, xp: 1000 },
        { day: 7, currency: 5000, xp: 1500 },
      ];
      const reward = REWARDS.find(r => r.day === dayInWeek) || REWARDS[0];

      // For day 7 special: grant a gacha ticket by adding 100 currency equivalent
      const bonusCurrency = reward.currency + (dayInWeek === 7 ? 100 : 0);

      return {
        ...prev,
        lastCheckIn: today,
        checkInStreak: newStreak,
        currency: prev.currency + bonusCurrency,
        totalCurrencyEarned: prev.totalCurrencyEarned + bonusCurrency,
        xp: prev.xp + reward.xp,
        totalXp: prev.totalXp + reward.xp,
      };
    });

    setShowDailyRewards(false);
  }, []);

  const switchEpoch = useCallback((epochId: EpochId) => {
    if (!state.unlockedEpochs.includes(epochId)) return;
    setState(prev => ({ ...prev, epochId }));
    // Force immediate remote save for important state change
    saveRemoteState({ ...state, epochId }).catch(e => {
      console.error('switchEpoch remote save failed:', e);
      setSyncStatus('error');
      setConnectionError('Проблеми зі з\'єднанням. Прогрес збережеться локально');
    });
  }, [state.unlockedEpochs, state]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const data = await getLeaderboard(50);
      setLeaderboard(data);

      const telegramId = getTelegramUserId();
      if (telegramId) {
        const rank = await getUserRank(telegramId);
        setUserRank(rank);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
      setConnectionError('Не вдалося завантажити таблицю лідерів');
    }
    setLeaderboardLoading(false);
  }, []);

  const dismissOfflineGains = useCallback(() => setOfflineGains(null), []);

  // Called after a successful Telegram Stars purchase to pull fresh boosters from DB
  const refreshBoosters = useCallback(async () => {
    const telegramIdLocal = getTelegramUserId();
    if (!telegramIdLocal) return;
    try {
      const fresh = await fetchActiveBoosters(telegramIdLocal);
      setState(prev => ({ ...prev, activeBoosters: fresh }));
    } catch (e) {
      console.error('Failed to refresh boosters:', e);
      setConnectionError('Не вдалося оновити бустери');
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // PRESTIGE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  // Check if player can prestige (level >= 950, epoch = independence)
  const canPrestige = state.level >= 950 && state.epochId === 'independence';

  // Perform prestige (rebirth) - SERVER AUTHORITATIVE
  const performPrestige = useCallback(async () => {
    if (!canPrestige) return false;

    const telegramIdLocal = getTelegramUserId();
    if (!telegramIdLocal) return false;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perform-prestige`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramIdLocal }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Prestige failed:', data.error);
        return false;
      }

      // Update local state with server response
      setState(prev => ({
        ...prev,
        // RESET:
        level: 1,
        xp: 0,
        xpToNextLevel: calculateXpToLevel(1),
        totalXp: 0,
        currency: 20,
        totalCurrencyEarned: 20,
        ownedGenerators: [],
        epochId: 'trypillia',
        unlockedEpochs: ['trypillia'],
        tapPower: 1,
        passiveXpPerSecond: 0,
        activeBoosters: {},
        artifactParts: {},
        artifactDupes: {},
        // PRESERVE:
        completedArtifacts: prev.completedArtifacts,
        artifactLevels: prev.artifactLevels,
        dailyStreak: prev.dailyStreak,
        bestStreak: prev.bestStreak,
        lastLoginDate: prev.lastLoginDate,
        referralsCount: prev.referralsCount,
        referralEarnings: prev.referralEarnings,
        prestigeResearch: prev.prestigeResearch,
        // INCREMENT:
        prestigeLevel: data.prestige_level,
        prestigePoints: data.total_prestige_points,
        // Energy reset to full
        energy: 100,
        maxEnergy: 100,
        lastSavedAt: Date.now(),
        lastOnlineAt: Date.now(),
        sessionStartAt: Date.now(),
      }));

      hapticNotification('success');
      return true;
    } catch (err) {
      console.error('Prestige error:', err);
      return false;
    }
  }, [canPrestige]);

  // ═══════════════════════════════════════════════════════════════════════
  // MUSEUM LABORATORY (Prestige Shop)
  // ═══════════════════════════════════════════════════════════════════════

  const buyPrestigeUpgrade = useCallback((upgradeId: string, cost: number, maxLevel: number) => {
    setState(prev => {
      const currentPoints = prev.prestigePoints || 0;
      const currentResearch = prev.prestigeResearch || {};
      const currentLevel = currentResearch[upgradeId as keyof typeof currentResearch] || 0;

      if (currentPoints < cost) return prev;
      if (currentLevel >= maxLevel) return prev;

      return {
        ...prev,
        prestigePoints: currentPoints - cost,
        prestigeResearch: {
          ...currentResearch,
          [upgradeId]: currentLevel + 1,
        },
      };
    });

    hapticNotification('success');
    return true;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // ENERGY SYSTEM (Only after Prestige 1+)
  // ═══════════════════════════════════════════════════════════════════════

  // Use energy on tap (only for prestige 1+)
  const useEnergy = useCallback(() => {
    if ((state.prestigeLevel || 0) < 1) return false;

    setState(prev => {
      if (prev.energy <= 0) return prev;
      return { ...prev, energy: prev.energy - 1 };
    });

    hapticImpact('light');
    return true;
  }, [state.prestigeLevel, state.energy]);

  // Get energy multiplier (x5 if energy > 0, x1 if energy = 0, only for prestige 1+)
  const getEnergyMultiplier = useCallback(() => {
    if ((state.prestigeLevel || 0) < 1) return 1;
    return (state.energy || 0) > 0 ? 5 : 1;
  }, [state.prestigeLevel, state.energy]);

  // Regenerate energy: +2 per 2 minutes (using timestamps for offline regeneration)
  const regenerateEnergy = useCallback(() => {
    if ((state.prestigeLevel || 0) < 1) return;

    const now = Date.now();
    const lastOnline = state.lastOnlineAt || now;
    const elapsedMs = now - lastOnline;
    const REGEN_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
    const REGEN_AMOUNT = 2;
    const MAX_ENERGY = 1000;

    // Calculate how many regen cycles have passed
    const cycles = Math.floor(elapsedMs / REGEN_INTERVAL_MS);
    const energyToAdd = cycles * REGEN_AMOUNT;

    if (energyToAdd > 0 || (state.energy || 0) < MAX_ENERGY) {
      setState(prev => {
        const currentEnergy = prev.energy || 0;
        if (currentEnergy >= MAX_ENERGY && energyToAdd <= 0) return prev;

        const newEnergy = Math.min(MAX_ENERGY, currentEnergy + Math.max(0, energyToAdd));
        return {
          ...prev,
          energy: newEnergy,
          lastOnlineAt: now,
        };
      });
    }
  }, [state.prestigeLevel, state.lastOnlineAt, state.energy]);

  // Energy regeneration interval - check every 2 minutes
  useEffect(() => {
    if ((state.prestigeLevel || 0) < 1) return;
    if (isLoading) return;

    // Initial regeneration check
    regenerateEnergy();

    const interval = setInterval(regenerateEnergy, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
  }, [state.prestigeLevel, isLoading, regenerateEnergy]);

  const rawTapCost = 25 * Math.pow(1.8, state.tapPower - 1);
  const tapPowerCost = Number.isFinite(rawTapCost) ? Math.floor(rawTapCost) : Number.MAX_SAFE_INTEGER;
  const telegramId = getTelegramUserId();
  const artifactMultipliers = getArtifactMultipliers(state.completedArtifacts || [], state.artifactDupes || {});
  const boosterMultipliers = getBoosterMultipliers(state.activeBoosters || {});

  return {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    switchEpoch,
    tapPowerCost,
    addArtifactPart,
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
    skipDailyRewards: useCallback(() => setShowDailyRewards(false), []),
    // Prestige System
    canPrestige,
    performPrestige,
    buyPrestigeUpgrade,
    // Energy System
    useEnergy,
    getEnergyMultiplier,
    regenerateEnergy,
  };
}
