// ═══════════════════════════════════════════════════════════════════════
// LIVE OPS & RETENTION SYSTEMS
// Data-driven challenges, events, achievements, and notifications
// ═══════════════════════════════════════════════════════════════════════

import { Rarity } from './data';

// ═══════════════════════════════════════════════════════════════════════
// CHALLENGE TYPES
// ═══════════════════════════════════════════════════════════════════════

export type ChallengeType = 
  | 'expedition_complete'
  | 'expedition_count'
  | 'npc_trust_level'
  | 'npc_interaction'
  | 'hero_unlock'
  | 'hero_level'
  | 'artifact_rarity'
  | 'artifact_count'
  | 'quest_complete'
  | 'arc_complete'
  | 'museum_collection'
  | 'museum_income';

export type ChallengePeriod = 'daily' | 'weekly';

export interface ChallengeReward {
  xp?: number;
  reputation?: number;
  karbovanets?: number;
  museumBonus?: 'xp' | 'speed' | 'trust' | 'income';
  expeditionSpeedBoost?: number; // % boost for next expedition
}

// Daily/Weekly Challenge Definition
export interface Challenge {
  id: string;
  type: ChallengeType;
  target: string; // target value (region id, npc id, etc.)
  targetCount: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  period: ChallengePeriod;
  reward: ChallengeReward;
}

// ═══════════════════════════════════════════════════════════════════════
// DAILY CHALLENGES
// ═══════════════════════════════════════════════════════════════════════

export const dailyChallenges: Challenge[] = [
  {
    id: 'daily-expedition-1',
    type: 'expedition_complete',
    target: 'any',
    targetCount: 3,
    titleKey: 'challenge.daily_expedition_3.title',
    descriptionKey: 'challenge.daily_expedition_3.desc',
    icon: '🗺️',
    period: 'daily',
    reward: { xp: 200, reputation: 20, karbovanets: 300 },
  },
  {
    id: 'daily-npc-trust-1',
    type: 'npc_interaction',
    target: 'any',
    targetCount: 5,
    titleKey: 'challenge.daily_npc_5.title',
    descriptionKey: 'challenge.daily_npc_5.desc',
    icon: '💬',
    period: 'daily',
    reward: { xp: 100, museumBonus: 'trust' },
  },
  {
    id: 'daily-rare-artifact-1',
    type: 'artifact_rarity',
    target: 'rare',
    targetCount: 1,
    titleKey: 'challenge.daily_rare_artifact.title',
    descriptionKey: 'challenge.daily_rare_artifact.desc',
    icon: '💎',
    period: 'daily',
    reward: { xp: 150, reputation: 30 },
  },
  {
    id: 'daily-quest-1',
    type: 'quest_complete',
    target: 'any',
    targetCount: 1,
    titleKey: 'challenge.daily_quest.title',
    descriptionKey: 'challenge.daily_quest.desc',
    icon: '📜',
    period: 'daily',
    reward: { xp: 250, karbovanets: 500 },
  },
  {
    id: 'daily-hero-unlock-1',
    type: 'hero_unlock',
    target: 'any',
    targetCount: 1,
    titleKey: 'challenge.daily_hero_unlock.title',
    descriptionKey: 'challenge.daily_hero_unlock.desc',
    icon: '⭐',
    period: 'daily',
    reward: { xp: 300, reputation: 50, karbovanets: 1000 },
  },
  {
    id: 'daily-museum-1',
    type: 'museum_collection',
    target: 'any',
    targetCount: 1,
    titleKey: 'challenge.daily_museum.title',
    descriptionKey: 'challenge.daily_museum.desc',
    icon: '🏛️',
    period: 'daily',
    reward: { xp: 100, museumBonus: 'income' },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// WEEKLY CHALLENGES
// ═══════════════════════════════════════════════════════════════════════

export const weeklyChallenges: Challenge[] = [
  {
    id: 'weekly-expedition-10',
    type: 'expedition_count',
    target: 'any',
    targetCount: 10,
    titleKey: 'challenge.weekly_expedition_10.title',
    descriptionKey: 'challenge.weekly_expedition_10.desc',
    icon: '🗺️',
    period: 'weekly',
    reward: { xp: 1000, reputation: 100, karbovanets: 2000, expeditionSpeedBoost: 10 },
  },
  {
    id: 'weekly-artifact-15',
    type: 'artifact_count',
    target: 'any',
    targetCount: 15,
    titleKey: 'challenge.weekly_artifacts_15.title',
    descriptionKey: 'challenge.weekly_artifacts_15.desc',
    icon: '🏺',
    period: 'weekly',
    reward: { xp: 800, reputation: 80, karbovanets: 1500 },
  },
  {
    id: 'weekly-npc-trust-3',
    type: 'npc_trust_level',
    target: 'any',
    targetCount: 3,
    titleKey: 'challenge.weekly_npc_trust.title',
    descriptionKey: 'challenge.weekly_npc_trust.desc',
    icon: '🤝',
    period: 'weekly',
    reward: { xp: 600, museumBonus: 'trust', expeditionSpeedBoost: 5 },
  },
  {
    id: 'weekly-arc-complete',
    type: 'arc_complete',
    target: 'any',
    targetCount: 1,
    titleKey: 'challenge.weekly_arc.title',
    descriptionKey: 'challenge.weekly_arc.desc',
    icon: '🎯',
    period: 'weekly',
    reward: { xp: 1500, reputation: 200, karbovanets: 3000, museumBonus: 'xp' },
  },
  {
    id: 'weekly-epic-artifact',
    type: 'artifact_rarity',
    target: 'epic',
    targetCount: 3,
    titleKey: 'challenge.weekly_epic.title',
    descriptionKey: 'challenge.weekly_epic.desc',
    icon: '💎',
    period: 'weekly',
    reward: { xp: 1200, reputation: 150, karbovanets: 2500 },
  },
  {
    id: 'weekly-quest-5',
    type: 'quest_complete',
    target: 'any',
    targetCount: 5,
    titleKey: 'challenge.weekly_quests_5.title',
    descriptionKey: 'challenge.weekly_quests_5.desc',
    icon: '📜',
    period: 'weekly',
    reward: { xp: 900, museumBonus: 'speed', expeditionSpeedBoost: 8 },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// SEASONAL EVENTS (Data-Driven)
// ═══════════════════════════════════════════════════════════════════════

export type EventType = 'national_day' | 'historical' | 'cultural' | 'seasonal';

export interface SeasonalEvent {
  id: string;
  name: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
  startDate: string; // MM-DD format (e.g., "08-24" for August 24)
  endDate: string;   // MM-DD format
  type: EventType;
  bonusMultiplier: number; // e.g., 2.0 = double rewards
  uniqueReward?: {
    id: string;
    nameKey: string;
    descriptionKey: string;
  };
  challenge?: Challenge; // Optional associated challenge
}

// Seasonal Events - Add new events here without changing logic
export const seasonalEvents: SeasonalEvent[] = [
  {
    id: 'event-independence',
    name: 'День Незалежності',
    nameKey: 'event.independence.name',
    descriptionKey: 'event.independence.desc',
    icon: '🏴',
    color: '#FFD700',
    startDate: '08-24',
    endDate: '08-26',
    type: 'national_day',
    bonusMultiplier: 2.0,
    uniqueReward: {
      id: 'artifact-independence-medal',
      nameKey: 'artifact.independence_medal.name',
      descriptionKey: 'artifact.independence_medal.desc',
    },
  },
  {
    id: 'event-pokrova',
    name: 'Покрова',
    nameKey: 'event.pokrova.name',
    descriptionKey: 'event.pokrova.desc',
    icon: '⛪',
    color: '#A855F7',
    startDate: '10-14',
    endDate: '10-16',
    type: 'historical',
    bonusMultiplier: 1.5,
    challenge: {
      id: 'event-pokrova-challenge',
      type: 'expedition_count',
      target: 'region-4',
      targetCount: 3,
      titleKey: 'challenge.event_pokrova.title',
      descriptionKey: 'challenge.event_pokrova.desc',
      icon: '⚔️',
      period: 'daily',
      reward: { xp: 500, reputation: 100, karbovanets: 1000 },
    },
  },
  {
    id: 'event-christmas',
    name: 'Різдво',
    nameKey: 'event.christmas.name',
    descriptionKey: 'event.christmas.desc',
    icon: '🎄',
    color: '#228B22',
    startDate: '12-25',
    endDate: '12-26',
    type: 'seasonal',
    bonusMultiplier: 1.5,
  },
  {
    id: 'event-easter',
    name: 'Великдень',
    nameKey: 'event.easter.name',
    descriptionKey: 'event.easter.desc',
    icon: '🥚',
    color: '#FF69B4',
    startDate: '04-20',
    endDate: '04-21',
    type: 'seasonal',
    bonusMultiplier: 1.5,
  },
  {
    id: 'event-cossack-day',
    name: 'День козацтва',
    nameKey: 'event.cossack_day.name',
    descriptionKey: 'event.cossack_day.desc',
    icon: '🗡️',
    color: '#F59E0B',
    startDate: '10-15',
    endDate: '10-15',
    type: 'national_day',
    bonusMultiplier: 1.75,
    uniqueReward: {
      id: 'artifact-cossack-sword',
      nameKey: 'artifact.cossack_sword.name',
      descriptionKey: 'artifact.cossack_sword.desc',
    },
  },
  {
    id: 'event-kyiv-founded',
    name: 'День заснування Києва',
    nameKey: 'event.kyiv_founded.name',
    descriptionKey: 'event.kyiv_founded.desc',
    icon: '⛪',
    color: '#FFC72C',
    startDate: '05-28',
    endDate: '05-29',
    type: 'historical',
    bonusMultiplier: 1.5,
  },
  {
    id: 'event-new-year',
    name: 'Новий Рік',
    nameKey: 'event.new_year.name',
    descriptionKey: 'event.new_year.desc',
    icon: '🎆',
    color: '#FF2A5F',
    startDate: '12-31',
    endDate: '01-01',
    type: 'seasonal',
    bonusMultiplier: 2.0,
  },
  {
    id: 'event-zhovtnevy',
    name: 'Жовтневий переворот (історичний)',
    nameKey: 'event.zhovtnevy.name',
    descriptionKey: 'event.zhovtnevy.desc',
    icon: '🔴',
    color: '#DC143C',
    startDate: '11-07',
    endDate: '11-08',
    type: 'historical',
    bonusMultiplier: 1.25,
  },
];

/**
 * Check if a seasonal event is currently active
 */
export function isEventActive(event: SeasonalEvent): boolean {
  const now = new Date();
  const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return currentMonthDay >= event.startDate && currentMonthDay <= event.endDate;
}

/**
 * Get all currently active seasonal events
 */
export function getActiveEvents(): SeasonalEvent[] {
  return seasonalEvents.filter(isEventActive);
}

/**
 * Get the current bonus multiplier from active events (highest one)
 */
export function getCurrentBonusMultiplier(): number {
  const active = getActiveEvents();
  if (active.length === 0) return 1.0;
  return Math.max(...active.map(e => e.bonusMultiplier));
}

// ═══════════════════════════════════════════════════════════════════════
// ACHIEVEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════

export type AchievementCategory = 
  | 'expedition'
  | 'hero'
  | 'museum'
  | 'npc'
  | 'story';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  requirement: {
    type: 'count' | 'level' | 'rarity' | 'complete' | 'trust';
    target: string;
    value: number;
  };
  reward: ChallengeReward;
  secret?: boolean; // Hidden until unlocked
}

// Achievement definitions
export const achievements: Achievement[] = [
  // ===== EXPEDITION ACHIEVEMENTS =====
  {
    id: 'ach-expedition-1',
    category: 'expedition',
    nameKey: 'achievement.expedition_1.name',
    descriptionKey: 'achievement.expedition_1.desc',
    icon: '🗺️',
    requirement: { type: 'count', target: 'expedition', value: 1 },
    reward: { xp: 50, karbovanets: 100 },
  },
  {
    id: 'ach-expedition-10',
    category: 'expedition',
    nameKey: 'achievement.expedition_10.name',
    descriptionKey: 'achievement.expedition_10.desc',
    icon: '🗺️',
    requirement: { type: 'count', target: 'expedition', value: 10 },
    reward: { xp: 200, karbovanets: 500 },
  },
  {
    id: 'ach-expedition-50',
    category: 'expedition',
    nameKey: 'achievement.expedition_50.name',
    descriptionKey: 'achievement.expedition_50.desc',
    icon: '🗺️',
    requirement: { type: 'count', target: 'expedition', value: 50 },
    reward: { xp: 500, karbovanets: 1500, expeditionSpeedBoost: 5 },
  },
  {
    id: 'ach-expedition-100',
    category: 'expedition',
    nameKey: 'achievement.expedition_100.name',
    descriptionKey: 'achievement.expedition_100.desc',
    icon: '🗺️',
    requirement: { type: 'count', target: 'expedition', value: 100 },
    reward: { xp: 1000, reputation: 100, karbovanets: 3000 },
  },
  {
    id: 'ach-expedition-legendary',
    category: 'expedition',
    nameKey: 'achievement.legendary_artifact.name',
    descriptionKey: 'achievement.legendary_artifact.desc',
    icon: '👑',
    requirement: { type: 'rarity', target: 'legendary', value: 1 },
    reward: { xp: 1000, reputation: 200, karbovanets: 5000 },
  },

  // ===== HERO ACHIEVEMENTS =====
  {
    id: 'ach-hero-unlock-1',
    category: 'hero',
    nameKey: 'achievement.hero_unlock_1.name',
    descriptionKey: 'achievement.hero_unlock_1.desc',
    icon: '⭐',
    requirement: { type: 'count', target: 'hero', value: 1 },
    reward: { xp: 100, karbovanets: 200 },
  },
  {
    id: 'ach-hero-unlock-5',
    category: 'hero',
    nameKey: 'achievement.hero_unlock_5.name',
    descriptionKey: 'achievement.hero_unlock_5.desc',
    icon: '⭐',
    requirement: { type: 'count', target: 'hero', value: 5 },
    reward: { xp: 500, karbovanets: 1000 },
  },
  {
    id: 'ach-hero-unlock-10',
    category: 'hero',
    nameKey: 'achievement.hero_unlock_10.name',
    descriptionKey: 'achievement.hero_unlock_10.desc',
    icon: '⭐',
    requirement: { type: 'count', target: 'hero', value: 10 },
    reward: { xp: 1000, expeditionSpeedBoost: 10 },
  },
  {
    id: 'ach-hero-level-10',
    category: 'hero',
    nameKey: 'achievement.hero_level_10.name',
    descriptionKey: 'achievement.hero_level_10.desc',
    icon: '📈',
    requirement: { type: 'level', target: 'any', value: 10 },
    reward: { xp: 300, karbovanets: 500 },
  },
  {
    id: 'ach-hero-level-20',
    category: 'hero',
    nameKey: 'achievement.hero_level_20.name',
    descriptionKey: 'achievement.hero_level_20.desc',
    icon: '📈',
    requirement: { type: 'level', target: 'any', value: 20 },
    reward: { xp: 1000, reputation: 50, karbovanets: 2000 },
  },

  // ===== MUSEUM ACHIEVEMENTS =====
  {
    id: 'ach-museum-first',
    category: 'museum',
    nameKey: 'achievement.museum_first.name',
    descriptionKey: 'achievement.museum_first.desc',
    icon: '🏛️',
    requirement: { type: 'count', target: 'artifact_exhibited', value: 1 },
    reward: { xp: 50, karbovanets: 100 },
  },
  {
    id: 'ach-museum-10',
    category: 'museum',
    nameKey: 'achievement.museum_10.name',
    descriptionKey: 'achievement.museum_10.desc',
    icon: '🏛️',
    requirement: { type: 'count', target: 'artifact_exhibited', value: 10 },
    reward: { xp: 300, museumBonus: 'income' },
  },
  {
    id: 'ach-museum-50',
    category: 'museum',
    nameKey: 'achievement.museum_50.name',
    descriptionKey: 'achievement.museum_50.desc',
    icon: '🏛️',
    requirement: { type: 'count', target: 'artifact_exhibited', value: 50 },
    reward: { xp: 1000, reputation: 100, museumBonus: 'xp' },
  },
  {
    id: 'ach-collection-1',
    category: 'museum',
    nameKey: 'achievement.collection_1.name',
    descriptionKey: 'achievement.collection_1.desc',
    icon: '📚',
    requirement: { type: 'count', target: 'collection', value: 1 },
    reward: { xp: 200, karbovanets: 500 },
  },
  {
    id: 'ach-collection-5',
    category: 'museum',
    nameKey: 'achievement.collection_5.name',
    descriptionKey: 'achievement.collection_5.desc',
    icon: '📚',
    requirement: { type: 'count', target: 'collection', value: 5 },
    reward: { xp: 1000, reputation: 150, karbovanets: 2500 },
  },
  {
    id: 'ach-collection-complete',
    category: 'museum',
    nameKey: 'achievement.collection_all.name',
    descriptionKey: 'achievement.collection_all.desc',
    icon: '📚',
    requirement: { type: 'count', target: 'collection', value: 14 },
    reward: { xp: 5000, reputation: 500, karbovanets: 10000, museumBonus: 'xp' },
    secret: true,
  },

  // ===== NPC ACHIEVEMENTS =====
  {
    id: 'ach-npc-first',
    category: 'npc',
    nameKey: 'achievement.npc_first.name',
    descriptionKey: 'achievement.npc_first.desc',
    icon: '💬',
    requirement: { type: 'count', target: 'npc_interaction', value: 1 },
    reward: { xp: 50, karbovanets: 100 },
  },
  {
    id: 'ach-npc-trust-3',
    category: 'npc',
    nameKey: 'achievement.npc_trust_3.name',
    descriptionKey: 'achievement.npc_trust_3.desc',
    icon: '🤝',
    requirement: { type: 'trust', target: 'any', value: 3 },
    reward: { xp: 300, museumBonus: 'trust' },
  },
  {
    id: 'ach-npc-trust-5',
    category: 'npc',
    nameKey: 'achievement.npc_trust_5.name',
    descriptionKey: 'achievement.npc_trust_5.desc',
    icon: '🤝',
    requirement: { type: 'trust', target: 'any', value: 5 },
    reward: { xp: 800, expeditionSpeedBoost: 8 },
  },
  {
    id: 'ach-npc-all-allied',
    category: 'npc',
    nameKey: 'achievement.npc_all_allied.name',
    descriptionKey: 'achievement.npc_all_allied.desc',
    icon: '👥',
    requirement: { type: 'trust', target: 'all', value: 4 },
    reward: { xp: 2000, reputation: 200, karbovanets: 5000 },
    secret: true,
  },

  // ===== STORY ACHIEVEMENTS =====
  {
    id: 'ach-arc-1',
    category: 'story',
    nameKey: 'achievement.arc_1.name',
    descriptionKey: 'achievement.arc_1.desc',
    icon: '🎯',
    requirement: { type: 'complete', target: 'arc', value: 1 },
    reward: { xp: 200, karbovanets: 500 },
  },
  {
    id: 'ach-arc-5',
    category: 'story',
    nameKey: 'achievement.arc_5.name',
    descriptionKey: 'achievement.arc_5.desc',
    icon: '🎯',
    requirement: { type: 'complete', target: 'arc', value: 5 },
    reward: { xp: 2000, reputation: 200, karbovanets: 5000 },
  },
  {
    id: 'ach-quest-10',
    category: 'story',
    nameKey: 'achievement.quest_10.name',
    descriptionKey: 'achievement.quest_10.desc',
    icon: '📜',
    requirement: { type: 'count', target: 'quest', value: 10 },
    reward: { xp: 500, karbovanets: 1000 },
  },
  {
    id: 'ach-quest-50',
    category: 'story',
    nameKey: 'achievement.quest_50.name',
    descriptionKey: 'achievement.quest_50.desc',
    icon: '📜',
    requirement: { type: 'count', target: 'quest', value: 50 },
    reward: { xp: 2000, expeditionSpeedBoost: 10 },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// EXPEDITION RANDOM EVENTS
// Events that can happen during active expeditions
// ═══════════════════════════════════════════════════════════════════════

export interface ExpeditionEvent {
  id: string;
  type: 'bonus_artifact' | 'hero_xp' | 'npc_message' | 'rare_find' | 'expedition_speed';
  chance: number; // 0-1 probability
  titleKey: string;
  messageKey: string;
  icon: string;
  effect: {
    artifactRarity?: Rarity;
    xpAmount?: number;
    npcId?: string;
    speedReduction?: number; // % reduction in remaining time
  };
}

export const expeditionEvents: ExpeditionEvent[] = [
  {
    id: 'event-bonus-artifact',
    type: 'bonus_artifact',
    chance: 0.08,
    titleKey: 'expedition_event.bonus_artifact.title',
    messageKey: 'expedition_event.bonus_artifact.message',
    icon: '🎁',
    effect: { artifactRarity: 'rare' },
  },
  {
    id: 'event-hero-inspiration',
    type: 'hero_xp',
    chance: 0.15,
    titleKey: 'expedition_event.hero_xp.title',
    messageKey: 'expedition_event.hero_xp.message',
    icon: '✨',
    effect: { xpAmount: 50 },
  },
  {
    id: 'event-npc-visits',
    type: 'npc_message',
    chance: 0.05,
    titleKey: 'expedition_event.npc_message.title',
    messageKey: 'expedition_event.npc_message.message',
    icon: '💬',
    effect: { npcId: 'any' },
  },
  {
    id: 'event-ancient-map',
    type: 'rare_find',
    chance: 0.03,
    titleKey: 'expedition_event.rare_find.title',
    messageKey: 'expedition_event.rare_find.message',
    icon: '🗺️',
    effect: { artifactRarity: 'epic' },
  },
  {
    id: 'event-wind-favor',
    type: 'expedition_speed',
    chance: 0.12,
    titleKey: 'expedition_event.speed_boost.title',
    messageKey: 'expedition_event.speed_boost.message',
    icon: '💨',
    effect: { speedReduction: 10 },
  },
];

/**
 * Check if a random expedition event should trigger
 */
export function checkExpeditionEvent(expeditionId: string, eventsTriggered: Set<string>): ExpeditionEvent | null {
  // Only trigger once per expedition
  if (eventsTriggered.has(expeditionId)) return null;
  
  for (const event of expeditionEvents) {
    if (Math.random() < event.chance) {
      eventsTriggered.add(expeditionId);
      return event;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════

export type NotificationType = 
  | 'expedition_complete'
  | 'daily_reward_ready'
  | 'new_quest'
  | 'new_npc'
  | 'level_up'
  | 'event_active';

export interface NotificationConfig {
  type: NotificationType;
  titleKey: string;
  bodyKey: string;
  icon: string;
  actionUrl?: string;
}

export const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  expedition_complete: {
    type: 'expedition_complete',
    titleKey: 'notification.expedition_complete.title',
    bodyKey: 'notification.expedition_complete.body',
    icon: '🗺️',
  },
  daily_reward_ready: {
    type: 'daily_reward_ready',
    titleKey: 'notification.daily_reward_ready.title',
    bodyKey: 'notification.daily_reward_ready.body',
    icon: '🎁',
  },
  new_quest: {
    type: 'new_quest',
    titleKey: 'notification.new_quest.title',
    bodyKey: 'notification.new_quest.body',
    icon: '📜',
  },
  new_npc: {
    type: 'new_npc',
    titleKey: 'notification.new_npc.title',
    bodyKey: 'notification.new_npc.body',
    icon: '💬',
  },
  level_up: {
    type: 'level_up',
    titleKey: 'notification.level_up.title',
    bodyKey: 'notification.level_up.body',
    icon: '⭐',
  },
  event_active: {
    type: 'event_active',
    titleKey: 'notification.event_active.title',
    bodyKey: 'notification.event_active.body',
    icon: '🎉',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// PLAYER STATISTICS
// ═══════════════════════════════════════════════════════════════════════

export interface PlayerStats {
  // Expedition stats
  totalExpeditions: number;
  successfulExpeditions: number;
  totalArtifactsFound: number;
  legendaryArtifacts: number;
  epicArtifacts: number;
  
  // Hero stats
  heroesUnlocked: number;
  highestHeroLevel: number;
  
  // Museum stats
  artifactsExhibited: number;
  collectionsCompleted: number;
  totalMuseumIncome: number;
  
  // NPC stats
  npcsAllied: number;
  highestTrustLevel: number;
  totalInteractions: number;
  
  // Story stats
  arcsCompleted: number;
  questsCompleted: number;
  
  // Reputation and XP
  totalReputation: number;
  totalXP: number;
  
  // Time stats
  totalPlayTime: number; // in seconds
  lastActiveDate: string;
  consecutiveDays: number;
}

/**
 * Create initial player stats
 */
export function getInitialPlayerStats(): PlayerStats {
  return {
    totalExpeditions: 0,
    successfulExpeditions: 0,
    totalArtifactsFound: 0,
    legendaryArtifacts: 0,
    epicArtifacts: 0,
    heroesUnlocked: 0,
    highestHeroLevel: 0,
    artifactsExhibited: 0,
    collectionsCompleted: 0,
    totalMuseumIncome: 0,
    npcsAllied: 0,
    highestTrustLevel: 1,
    totalInteractions: 0,
    arcsCompleted: 0,
    questsCompleted: 0,
    totalReputation: 0,
    totalXP: 0,
    totalPlayTime: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    consecutiveDays: 1,
  };
}
