// ═══════════════════════════════════════════════════════════════════════
// LIVE OPS STORE
// Manages challenges, achievements, events, notifications
// ═══════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import {
  Challenge,
  ChallengePeriod,
  ChallengeReward,
  SeasonalEvent,
  PlayerStats,
  getInitialPlayerStats,
  dailyChallenges,
  weeklyChallenges,
  achievements,
  getActiveEvents,
  getCurrentBonusMultiplier,
  checkExpeditionEvent,
  ExpeditionEvent,
} from './liveOpsData';
import { RelationshipLevel } from './storyData';

interface ChallengeProgress {
  current: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: number;
}

interface AchievementProgress {
  unlocked: boolean;
  unlockedAt?: number;
}

interface LiveOpsState {
  // Daily challenges
  dailyChallengesProgress: Record<string, ChallengeProgress>;
  lastDailyReset: number;
  
  // Weekly challenges
  weeklyChallengesProgress: Record<string, ChallengeProgress>;
  lastWeeklyReset: number;
  
  // Achievements
  achievementsProgress: Record<string, AchievementProgress>;
  
  // Active events
  activeEvents: SeasonalEvent[];
  currentBonusMultiplier: number;
  
  // Expedition events (one-time per expedition)
  expeditionEventsTriggered: Set<string>;
  
  // Player stats
  playerStats: PlayerStats;
  
  // Notifications queue
  pendingNotifications: string[];
  
  // Active boost effects
  activeBoosts: {
    expeditionSpeedBoost: number; // % boost
    expeditionSpeedBoostExpires: number;
  };
}

interface LiveOpsActions {
  // Challenge actions
  checkChallengeProgress: (type: Challenge['type'], target: string, value: number) => void;
  claimChallengeReward: (challengeId: string, period: ChallengePeriod) => void;
  resetDailyChallenges: () => void;
  resetWeeklyChallenges: () => void;
  
  // Achievement actions
  checkAchievements: (state: {
    totalExpeditions: number;
    artifactsFound: number;
    heroesUnlocked: number;
    highestHeroLevel: number;
    artifactsExhibited: number;
    collectionsCompleted: number;
    npcTrustLevels: Record<string, RelationshipLevel>;
    arcsCompleted: number;
    questsCompleted: number;
    reputation: number;
    totalXP: number;
    legendaryArtifacts: number;
  }) => void;
  claimAchievementReward: (achievementId: string) => void;
  
  // Event actions
  refreshActiveEvents: () => void;
  getExpeditionEvent: (expeditionId: string) => ExpeditionEvent | null;
  applyExpeditionEvent: (event: ExpeditionEvent, heroId?: string) => void;
  
  // Notification actions
  addNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  
  // Stats actions
  updateStats: (updates: Partial<PlayerStats>) => void;
  incrementStat: (stat: keyof PlayerStats, amount?: number) => void;
  
  // Boost actions
  applyBoost: (boost: ChallengeReward) => void;
  checkBoostExpiry: () => void;
}

type LiveOpsStore = LiveOpsState & LiveOpsActions;

// Helper to get challenge by ID
function getChallengeById(id: string): Challenge | undefined {
  return [...dailyChallenges, ...weeklyChallenges].find(c => c.id === id);
}

export const useLiveOpsStore = create<LiveOpsStore>((set, get) => ({
  // Initial state
  dailyChallengesProgress: {},
  lastDailyReset: Date.now(),
  weeklyChallengesProgress: {},
  lastWeeklyReset: Date.now(),
  achievementsProgress: {},
  activeEvents: [],
  currentBonusMultiplier: 1.0,
  expeditionEventsTriggered: new Set(),
  playerStats: getInitialPlayerStats(),
  pendingNotifications: [],
  activeBoosts: {
    expeditionSpeedBoost: 0,
    expeditionSpeedBoostExpires: 0,
  },

  // Challenge actions
  checkChallengeProgress: (type, target, value) => {
    const state = get();
    const now = Date.now();
    
    // Check daily challenges
    dailyChallenges.forEach(challenge => {
      if (challenge.type !== type) return;
      if (challenge.target !== 'any' && challenge.target !== target) return;
      
      const progress = state.dailyChallengesProgress[challenge.id] || {
        current: 0,
        completed: false,
        claimed: false,
      };
      
      if (!progress.completed) {
        const newCurrent = Math.min(progress.current + value, challenge.targetCount);
        const isComplete = newCurrent >= challenge.targetCount;
        
        set(s => ({
          dailyChallengesProgress: {
            ...s.dailyChallengesProgress,
            [challenge.id]: {
              ...progress,
              current: newCurrent,
              completed: isComplete,
              completedAt: isComplete && !progress.completed ? now : progress.completedAt,
            },
          },
        }));
        
        // Notify player if just completed
        if (isComplete && !progress.completed) {
          get().addNotification(`challenge_complete:${challenge.id}`);
        }
      }
    });
    
    // Check weekly challenges
    weeklyChallenges.forEach(challenge => {
      if (challenge.type !== type) return;
      if (challenge.target !== 'any' && challenge.target !== target) return;
      
      const progress = state.weeklyChallengesProgress[challenge.id] || {
        current: 0,
        completed: false,
        claimed: false,
      };
      
      if (!progress.completed) {
        const newCurrent = Math.min(progress.current + value, challenge.targetCount);
        const isComplete = newCurrent >= challenge.targetCount;
        
        set(s => ({
          weeklyChallengesProgress: {
            ...s.weeklyChallengesProgress,
            [challenge.id]: {
              ...progress,
              current: newCurrent,
              completed: isComplete,
              completedAt: isComplete && !progress.completed ? now : progress.completedAt,
            },
          },
        }));
        
        if (isComplete && !progress.completed) {
          get().addNotification(`challenge_complete:${challenge.id}`);
        }
      }
    });
  },

  claimChallengeReward: (challengeId, period) => {
    const challenge = getChallengeById(challengeId);
    if (!challenge) return;
    
    const progressKey = period === 'daily' ? 'dailyChallengesProgress' : 'weeklyChallengesProgress';
    const progress = get()[progressKey][challengeId];
    
    if (!progress?.completed || progress.claimed) return;
    
    // Mark as claimed
    set(s => ({
      [progressKey]: {
        ...s[progressKey],
        [challengeId]: { ...progress, claimed: true },
      },
    }));
    
    // Apply rewards
    get().applyBoost(challenge.reward);
    
    // Update stats
    get().addNotification(`reward_claimed:${challengeId}`);
  },

  resetDailyChallenges: () => {
    const now = Date.now();
    const lastReset = get().lastDailyReset;
    
    // Reset at midnight
    const shouldReset = now - lastReset >= 24 * 60 * 60 * 1000;
    
    if (shouldReset) {
      set(() => {
        const newProgress: Record<string, ChallengeProgress> = {};
        dailyChallenges.forEach(c => {
          
          newProgress[c.id] = {
            current: 0,
            completed: false,
            claimed: false,
          };
        });
        
        return {
          dailyChallengesProgress: newProgress,
          lastDailyReset: now,
        };
      });
    }
  },

  resetWeeklyChallenges: () => {
    const now = Date.now();
    const lastReset = get().lastWeeklyReset;
    
    // Reset after 7 days
    const shouldReset = now - lastReset >= 7 * 24 * 60 * 60 * 1000;
    
    if (shouldReset) {
      set(() => {
        const newProgress: Record<string, ChallengeProgress> = {};
        weeklyChallenges.forEach(c => {
          newProgress[c.id] = {
            current: 0,
            completed: false,
            claimed: false,
          };
        });
        
        return {
          weeklyChallengesProgress: newProgress,
          lastWeeklyReset: now,
        };
      });
    }
  },

  // Achievement actions
  checkAchievements: (stats) => {
    achievements.forEach(achievement => {
      const progress = get().achievementsProgress[achievement.id];
      if (progress?.unlocked) return;
      
      let isUnlocked = false;
      
      switch (achievement.requirement.type) {
        case 'count':
          switch (achievement.requirement.target) {
            case 'expedition':
              isUnlocked = stats.totalExpeditions >= achievement.requirement.value;
              break;
            case 'hero':
              isUnlocked = stats.heroesUnlocked >= achievement.requirement.value;
              break;
            case 'artifact_exhibited':
              isUnlocked = stats.artifactsExhibited >= achievement.requirement.value;
              break;
            case 'collection':
              isUnlocked = stats.collectionsCompleted >= achievement.requirement.value;
              break;
            case 'quest':
              isUnlocked = stats.questsCompleted >= achievement.requirement.value;
              break;
            case 'reputation':
              isUnlocked = stats.totalReputation >= achievement.requirement.value;
              break;
          }
          break;
        case 'level':
          isUnlocked = stats.highestHeroLevel >= achievement.requirement.value;
          break;
        case 'rarity':
          if (achievement.requirement.target === 'legendary') {
            isUnlocked = stats.legendaryArtifacts >= achievement.requirement.value;
          }
          break;
        case 'complete':
          if (achievement.requirement.target === 'arc') {
            isUnlocked = stats.arcsCompleted >= achievement.requirement.value;
          }
          break;
        case 'trust':
          if (achievement.requirement.target === 'any') {
            isUnlocked = Object.values(stats.npcTrustLevels).some(
              level => level >= achievement.requirement.value
            );
          }
          break;
      }
      
      if (isUnlocked) {
        set(s => ({
          achievementsProgress: {
            ...s.achievementsProgress,
            [achievement.id]: {
              unlocked: true,
              unlockedAt: Date.now(),
            },
          },
        }));
        get().addNotification(`achievement:${achievement.id}`);
      }
    });
  },

  claimAchievementReward: (achievementId) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    const progress = get().achievementsProgress[achievementId];
    if (!progress?.unlocked) return;
    
    // Apply reward
    get().applyBoost(achievement.reward);
  },

  // Event actions
  refreshActiveEvents: () => {
    const active = getActiveEvents();
    const multiplier = getCurrentBonusMultiplier();
    set({ activeEvents: active, currentBonusMultiplier: multiplier });
  },

  getExpeditionEvent: (expeditionId) => {
    const triggered = get().expeditionEventsTriggered;
    return checkExpeditionEvent(expeditionId, triggered);
  },

  applyExpeditionEvent: (event, heroId) => {
    switch (event.type) {
      case 'bonus_artifact':
        // Add bonus artifact to expedition rewards (handled in store)
        break;
      case 'hero_xp':
        if (heroId) {
          // XP will be applied when expedition completes
        }
        break;
      case 'npc_message':
        // NPC trust will be increased
        break;
      case 'expedition_speed':
        // Duration reduction handled in expedition
        break;
      case 'rare_find':
        // Guaranteed rare/epic artifact
        break;
    }
    
    get().addNotification(`expedition_event:${event.id}`);
  },

  // Notification actions
  addNotification: (notificationId) => {
    set(s => ({
      pendingNotifications: [...s.pendingNotifications, notificationId],
    }));
  },

  clearNotifications: () => {
    set({ pendingNotifications: [] });
  },

  // Stats actions
  updateStats: (updates) => {
    set(s => ({
      playerStats: { ...s.playerStats, ...updates },
    }));
  },

  incrementStat: (stat, amount = 1) => {
    set(s => ({
      playerStats: {
        ...s.playerStats,
        [stat]: (s.playerStats[stat] as number) + amount,
      },
    }));
  },

  // Boost actions
  applyBoost: (boost) => {
    const now = Date.now();
    
    if (boost.expeditionSpeedBoost) {
      const currentBoost = get().activeBoosts.expeditionSpeedBoost;
      const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
      
      set(() => ({
        activeBoosts: {
          expeditionSpeedBoost: currentBoost + boost.expeditionSpeedBoost,
          expeditionSpeedBoostExpires: expiresAt,
        },
      }));
    }
    
    // Other rewards are applied immediately (XP, karbovanets, etc.)
    // These need to be handled by the main store
    if (boost.xp || boost.karbovanets || boost.reputation) {
      get().addNotification('rewards_ready');
    }
  },

  checkBoostExpiry: () => {
    const now = Date.now();
    const boost = get().activeBoosts;
    
    if (boost.expeditionSpeedBoostExpires > 0 && now >= boost.expeditionSpeedBoostExpires) {
      set({ activeBoosts: { expeditionSpeedBoost: 0, expeditionSpeedBoostExpires: 0 } });
    }
  },
}));
