// ═══════════════════════════════════════════════════════════════════════
// PLAYER GUIDANCE & ONBOARDING SYSTEM
// Journey Map, Quest Tracker, Notifications, Analytics
// ═══════════════════════════════════════════════════════════════════════

import { Rarity } from './data';

// ═══════════════════════════════════════════════════════════════════════
// JOURNEY MAP SYSTEM
// Shows player's complete progression path
// ═══════════════════════════════════════════════════════════════════════

export type JourneyStage = 
  | 'clicker'
  | 'prestige_1'
  | 'prestige_2'
  | 'heroes'
  | 'expeditions'
  | 'npc'
  | 'museum'
  | 'prestige_3'
  | 'prestige_4'
  | 'legendary'
  | 'secret_endings';

export interface JourneyNode {
  id: JourneyStage;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
  
  // Requirements to reach this stage
  requirements: {
    minLevel?: number;
    minPrestige?: number;
    minExpeditions?: number;
    minReputation?: number;
    specificHero?: string;
    specificNPC?: string;
    storyArc?: number;
  };
  
  // Next stages
  nextNodes: JourneyStage[];
  
  // Rewards/milestones at this stage
  milestone?: {
    type: 'hero' | 'npc' | 'region' | 'feature' | 'prestige';
    id: string;
    nameKey: string;
  };
}

export const JOURNEY_MAP: JourneyNode[] = [
  {
    id: 'clicker',
    nameKey: 'journey.clicker.name',
    descriptionKey: 'journey.clicker.desc',
    icon: '👆',
    color: '#10B981',
    requirements: {},
    nextNodes: ['prestige_1'],
    milestone: { type: 'feature', id: 'clicker', nameKey: 'journey.milestone.clicker' },
  },
  {
    id: 'prestige_1',
    nameKey: 'journey.prestige_1.name',
    descriptionKey: 'journey.prestige_1.desc',
    icon: '⭐',
    color: '#FFD700',
    requirements: { minPrestige: 1 },
    nextNodes: ['prestige_2'],
    milestone: { type: 'prestige', id: 'prestige_1', nameKey: 'journey.milestone.prestige_1' },
  },
  {
    id: 'prestige_2',
    nameKey: 'journey.prestige_2.name',
    descriptionKey: 'journey.prestige_2.desc',
    icon: '🎓',
    color: '#A855F7',
    requirements: { minPrestige: 2 },
    nextNodes: ['heroes'],
    milestone: { type: 'prestige', id: 'prestige_2', nameKey: 'journey.milestone.prestige_2' },
  },
  {
    id: 'heroes',
    nameKey: 'journey.heroes.name',
    descriptionKey: 'journey.heroes.desc',
    icon: '👥',
    color: '#00E5FF',
    requirements: { specificHero: 'any' },
    nextNodes: ['expeditions'],
    milestone: { type: 'hero', id: 'first_hero', nameKey: 'journey.milestone.first_hero' },
  },
  {
    id: 'expeditions',
    nameKey: 'journey.expeditions.name',
    descriptionKey: 'journey.expeditions.desc',
    icon: '🗺️',
    color: '#F59E0B',
    requirements: { minExpeditions: 1 },
    nextNodes: ['npc', 'museum'],
    milestone: { type: 'feature', id: 'expedition', nameKey: 'journey.milestone.first_expedition' },
  },
  {
    id: 'npc',
    nameKey: 'journey.npc.name',
    descriptionKey: 'journey.npc.desc',
    icon: '💬',
    color: '#FF6B6B',
    requirements: { specificNPC: 'any' },
    nextNodes: ['museum'],
    milestone: { type: 'npc', id: 'first_npc', nameKey: 'journey.milestone.first_npc' },
  },
  {
    id: 'museum',
    nameKey: 'journey.museum.name',
    descriptionKey: 'journey.museum.desc',
    icon: '🏛️',
    color: '#8B5CF6',
    requirements: { minReputation: 10 },
    nextNodes: ['prestige_3'],
    milestone: { type: 'feature', id: 'museum', nameKey: 'journey.milestone.museum' },
  },
  {
    id: 'prestige_3',
    nameKey: 'journey.prestige_3.name',
    descriptionKey: 'journey.prestige_3.desc',
    icon: '🏰',
    color: '#00E5FF',
    requirements: { minPrestige: 3 },
    nextNodes: ['prestige_4'],
    milestone: { type: 'prestige', id: 'prestige_3', nameKey: 'journey.milestone.prestige_3' },
  },
  {
    id: 'prestige_4',
    nameKey: 'journey.prestige_4.name',
    descriptionKey: 'journey.prestige_4.desc',
    icon: '🌍',
    color: '#FF6B6B',
    requirements: { minPrestige: 4 },
    nextNodes: ['legendary'],
    milestone: { type: 'prestige', id: 'prestige_4', nameKey: 'journey.milestone.prestige_4' },
  },
  {
    id: 'legendary',
    nameKey: 'journey.legendary.name',
    descriptionKey: 'journey.legendary.desc',
    icon: '👑',
    color: '#FFD700',
    requirements: { minPrestige: 5 },
    nextNodes: ['secret_endings'],
    milestone: { type: 'hero', id: 'legendary_hero', nameKey: 'journey.milestone.legendary' },
  },
  {
    id: 'secret_endings',
    nameKey: 'journey.secret_endings.name',
    descriptionKey: 'journey.secret_endings.desc',
    icon: '🔮',
    color: '#A855F7',
    requirements: { storyArc: 12 },
    nextNodes: [],
    milestone: { type: 'feature', id: 'secret_ending', nameKey: 'journey.milestone.ending' },
  },
];

/**
 * Get current journey stage based on player progress
 */
export function getCurrentJourneyStage(state: {
  prestigeLevel: number;
  reputation: number;
  expeditionCount: number;
  heroCount: number;
  npcCount: number;
  completedArcs: number;
}): JourneyStage {
  if (state.storyArc === 12) return 'secret_endings';
  if (state.prestigeLevel >= 5) return 'legendary';
  if (state.prestigeLevel >= 4) return 'prestige_4';
  if (state.prestigeLevel >= 3) return 'prestige_3';
  if (state.reputation >= 10 && state.npcCount > 0) return 'museum';
  if (state.npcCount > 0) return 'npc';
  if (state.expeditionCount > 0) return 'expeditions';
  if (state.heroCount > 0) return 'heroes';
  if (state.prestigeLevel >= 2) return 'prestige_2';
  if (state.prestigeLevel >= 1) return 'prestige_1';
  return 'clicker';
}

/**
 * Get journey progress percentage
 */
export function getJourneyProgress(state: {
  prestigeLevel: number;
  reputation: number;
  expeditionCount: number;
  heroCount: number;
  npcCount: number;
  completedArcs: number;
}): number {
  const totalStages = JOURNEY_MAP.length;
  let completedStages = 0;
  
  for (let i = 0; i < JOURNEY_MAP.length; i++) {
    const stage = JOURNEY_MAP[i];
    let isComplete = false;
    
    if (i === 0) isComplete = true; // Clicker is always available
    else if (state.prestigeLevel >= (stage.requirements.minPrestige || 0)) isComplete = true;
    else if (stage.requirements.minExpeditions && state.expeditionCount >= stage.requirements.minExpeditions) isComplete = true;
    else if (stage.requirements.specificHero && state.heroCount > 0) isComplete = true;
    else if (stage.requirements.specificNPC && state.npcCount > 0) isComplete = true;
    else if (stage.requirements.minReputation && state.reputation >= stage.requirements.minReputation) isComplete = true;
    
    if (isComplete) completedStages++;
  }
  
  return Math.round((completedStages / totalStages) * 100);
}

// ═══════════════════════════════════════════════════════════════════════
// BADGE SYSTEM
// Universal notification badges
// ═══════════════════════════════════════════════════════════════════════

export type BadgeType = 'NEW' | 'UPDATED' | 'READY' | 'UNLOCKED' | 'COLLECT';

export interface BadgeConfig {
  type: BadgeType;
  color: string;
  bgColor: string;
  icon?: string;
}

export const BADGE_CONFIGS: Record<BadgeType, BadgeConfig> = {
  NEW: { type: 'NEW', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.2)', icon: '✨' },
  UPDATED: { type: 'UPDATED', color: '#00E5FF', bgColor: 'rgba(0, 229, 255, 0.2)', icon: '🔄' },
  READY: { type: 'READY', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.2)', icon: '⚡' },
  UNLOCKED: { type: 'UNLOCKED', color: '#A855F7', bgColor: 'rgba(168, 85, 247, 0.2)', icon: '🔓' },
  COLLECT: { type: 'COLLECT', color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.2)', icon: '📦' },
};

/**
 * Badge component props
 */
export interface BadgeDisplayProps {
  type: BadgeType;
  count?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// RED DOT NOTIFICATION SYSTEM
// Data-driven notification flags
// ═══════════════════════════════════════════════════════════════════════

export type NotificationFlag = 
  | 'expedition_complete'
  | 'npc_available'
  | 'reward_available'
  | 'hero_unlocked'
  | 'artifact_found'
  | 'quest_complete'
  | 'achievement_ready'
  | 'daily_challenge_ready'
  | 'weekly_challenge_ready'
  | 'seasonal_event'
  | 'museum_income_ready'
  | 'daily_streak'
  | 'gacha_available'
  | 'premium_shop_new';

export interface NotificationConfig {
  flag: NotificationFlag;
  nameKey: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  sound?: string;
  persistent: boolean; // Show until clicked
}

export const NOTIFICATION_CONFIGS: Record<NotificationFlag, NotificationConfig> = {
  expedition_complete: { flag: 'expedition_complete', nameKey: 'notification.expedition_complete', icon: '✅', priority: 'high', persistent: true },
  npc_available: { flag: 'npc_available', nameKey: 'notification.npc_available', icon: '💬', priority: 'high', persistent: true },
  reward_available: { flag: 'reward_available', nameKey: 'notification.reward_available', icon: '🎁', priority: 'medium', persistent: false },
  hero_unlocked: { flag: 'hero_unlocked', nameKey: 'notification.hero_unlocked', icon: '⭐', priority: 'high', persistent: true },
  artifact_found: { flag: 'artifact_found', nameKey: 'notification.artifact_found', icon: '🏺', priority: 'medium', persistent: true },
  quest_complete: { flag: 'quest_complete', nameKey: 'notification.quest_complete', icon: '📜', priority: 'high', persistent: true },
  achievement_ready: { flag: 'achievement_ready', nameKey: 'notification.achievement_ready', icon: '🏆', priority: 'medium', persistent: true },
  daily_challenge_ready: { flag: 'daily_challenge_ready', nameKey: 'notification.daily_challenge', icon: '📅', priority: 'high', persistent: true },
  weekly_challenge_ready: { flag: 'weekly_challenge_ready', nameKey: 'notification.weekly_challenge', icon: '📆', priority: 'medium', persistent: true },
  seasonal_event: { flag: 'seasonal_event', nameKey: 'notification.seasonal_event', icon: '🎉', priority: 'high', persistent: true },
  museum_income_ready: { flag: 'museum_income_ready', nameKey: 'notification.museum_income', icon: '💰', priority: 'low', persistent: false },
  daily_streak: { flag: 'daily_streak', nameKey: 'notification.daily_streak', icon: '🔥', priority: 'medium', persistent: false },
  gacha_available: { flag: 'gacha_available', nameKey: 'notification.gacha_available', icon: '🎰', priority: 'medium', persistent: false },
  premium_shop_new: { flag: 'premium_shop_new', nameKey: 'notification.premium_shop', icon: '🛍️', priority: 'low', persistent: false },
};

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION CENTER
// History of events
// ═══════════════════════════════════════════════════════════════════════

export interface NotificationHistory {
  id: string;
  flag: NotificationFlag;
  timestamp: number;
  titleKey: string;
  messageKey?: string;
  data?: Record<string, unknown>;
  read: boolean;
}

export const MAX_NOTIFICATION_HISTORY = 100;

/**
 * Add notification to history
 */
export function addNotificationToHistory(
  history: NotificationHistory[],
  notification: Omit<NotificationHistory, 'id' | 'timestamp' | 'read'>
): NotificationHistory[] {
  const newNotification: NotificationHistory = {
    ...notification,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    read: false,
  };
  
  const updatedHistory = [newNotification, ...history];
  
  // Keep only last 100
  return updatedHistory.slice(0, MAX_NOTIFICATION_HISTORY);
}

// ═══════════════════════════════════════════════════════════════════════
// QUEST TRACKER SYSTEM
// Active objectives display
// ═══════════════════════════════════════════════════════════════════════

export type QuestType = 'main' | 'side' | 'daily' | 'weekly';

export interface ActiveQuest {
  id: string;
  type: QuestType;
  titleKey: string;
  descriptionKey: string;
  progress: number;
  target: number;
  rewards: {
    xp?: number;
    karbovanets?: number;
    reputation?: number;
    item?: string;
  };
  expiresAt?: number; // For daily/weekly
  priority: number;
}

export const QUEST_TYPE_CONFIG: Record<QuestType, { color: string; icon: string; maxActive: number }> = {
  main: { color: '#FFD700', icon: '🎯', maxActive: 1 },
  side: { color: '#00E5FF', icon: '📋', maxActive: 3 },
  daily: { color: '#10B981', icon: '📅', maxActive: 3 },
  weekly: { color: '#A855F7', icon: '📆', maxActive: 2 },
};

// ═══════════════════════════════════════════════════════════════════════
// UNIFIED EVENT SYSTEM
// Game events for analytics and subscriptions
// ═══════════════════════════════════════════════════════════════════════

export type GameEventType =
  | 'hero_unlocked'
  | 'npc_unlocked'
  | 'expedition_completed'
  | 'quest_completed'
  | 'story_arc_completed'
  | 'museum_collection_completed'
  | 'achievement_unlocked'
  | 'prestige_reached'
  | 'region_unlocked'
  | 'artifact_found'
  | 'hero_level_up'
  | 'npc_relationship_up'
  | 'item_purchased'
  | 'ad_watched'
  | 'session_started'
  | 'session_ended';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export type GameEventListener = (event: GameEvent) => void;

class GameEventEmitter {
  private listeners: Map<GameEventType, GameEventListener[]> = new Map();
  private eventHistory: GameEvent[] = [];
  private maxHistory = 500;

  /**
   * Subscribe to specific event type
   */
  subscribe(eventType: GameEventType, listener: GameEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(listener: GameEventListener): () => void {
    return this.subscribe('hero_unlocked' as GameEventType, listener);
  }

  /**
   * Emit an event
   */
  emit(type: GameEventType, data: Record<string, unknown> = {}): void {
    const event: GameEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistory);
    }
    
    // Notify listeners
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): GameEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

export const gameEvents = new GameEventEmitter();

// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS SYSTEM
// Track events for Firebase/Supabase/Amplitude/Telegram
// ═══════════════════════════════════════════════════════════════════════

export type AnalyticsPlatform = 'firebase' | 'supabase' | 'amplitude' | 'telegram' | 'none';

export interface AnalyticsConfig {
  platforms: AnalyticsPlatform[];
  enabled: boolean;
  debug: boolean;
}

export const ANALYTICS_CONFIG: AnalyticsConfig = {
  platforms: ['telegram', 'none'],
  enabled: true,
  debug: false,
};

/**
 * Track an event (placeholder for actual analytics)
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!ANALYTICS_CONFIG.enabled) return;
  
  const eventData = {
    event: eventName,
    properties,
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
  
  // Log in debug mode
  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics]', eventData);
  }
  
  // Emit for internal listeners
  gameEvents.emit(eventName as GameEventType, properties || {});
  
  // Future implementations:
  // Firebase: firebase.analytics().logEvent(eventName, properties)
  // Supabase: supabase analytics
  // Amplitude: amplitude.logEvent(eventName, properties)
  // Telegram: window.Telegram.WebApp.Analytics
}

/**
 * Track screen view
 */
export function trackScreenView(screenName: string): void {
  trackEvent('screen_view', { screen_name: screenName });
}

/**
 * Track user action
 */
export function trackAction(action: string, details?: Record<string, unknown>): void {
  trackEvent(`action_${action}`, details);
}

/**
 * Track purchase
 */
export function trackPurchase(itemId: string, cost: number, currency: string): void {
  trackEvent('purchase', { item_id: itemId, cost, currency });
}

/**
 * Track ad watched
 */
export function trackAdWatched(adType: string, reward: string): void {
  trackEvent('ad_watched', { ad_type: adType, reward });
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRESS BOOK
// Statistics overview
// ═══════════════════════════════════════════════════════════════════════

export interface ProgressStats {
  // Heroes
  heroesUnlocked: number;
  heroesTotal: number;
  
  // NPCs
  npcsUnlocked: number;
  npcsTotal: number;
  
  // Regions
  regionsUnlocked: number;
  regionsTotal: number;
  
  // Story
  storyArcsCompleted: number;
  storyArcsTotal: number;
  
  // Collections
  collectionsCompleted: number;
  collectionsTotal: number;
  
  // Achievements
  achievementsUnlocked: number;
  achievementsTotal: number;
  
  // Prestige
  currentPrestige: number;
  xpToNextPrestige: number;
  xpRequiredForPrestige: number;
}

export const PROGRESS_CATEGORIES = [
  { key: 'heroes', nameKey: 'progress.heroes', icon: '👥', color: '#00E5FF' },
  { key: 'npcs', nameKey: 'progress.npcs', icon: '💬', color: '#FF6B6B' },
  { key: 'regions', nameKey: 'progress.regions', icon: '🗺️', color: '#F59E0B' },
  { key: 'story', nameKey: 'progress.story', icon: '📖', color: '#A855F7' },
  { key: 'collections', nameKey: 'progress.collections', icon: '🏛️', color: '#10B981' },
  { key: 'achievements', nameKey: 'progress.achievements', icon: '🏆', color: '#FFD700' },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// CODEX SYSTEM
// Unified encyclopedia
// ═══════════════════════════════════════════════════════════════════════

export type CodexSection = 
  | 'heroes'
  | 'npcs'
  | 'regions'
  | 'story_arcs'
  | 'collections'
  | 'artifacts';

export interface CodexEntry {
  id: string;
  section: CodexSection;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  unlocked: boolean;
  unlockCondition?: string;
  rarity?: Rarity;
}

export const CODEX_SECTIONS: { id: CodexSection; nameKey: string; icon: string; color: string }[] = [
  { id: 'heroes', nameKey: 'codex.heroes', icon: '👥', color: '#00E5FF' },
  { id: 'npcs', nameKey: 'codex.npcs', icon: '💬', color: '#FF6B6B' },
  { id: 'regions', nameKey: 'codex.regions', icon: '🗺️', color: '#F59E0B' },
  { id: 'story_arcs', nameKey: 'codex.story_arcs', icon: '📖', color: '#A855F7' },
  { id: 'collections', nameKey: 'codex.collections', icon: '🏛️', color: '#10B981' },
  { id: 'artifacts', nameKey: 'codex.artifacts', icon: '🏺', color: '#8B5CF6' },
];
