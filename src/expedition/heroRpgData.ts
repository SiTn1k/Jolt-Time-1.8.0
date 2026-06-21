// ═══════════════════════════════════════════════════════════════════════
// HERO RPG & NPC EVOLUTION SYSTEMS
// Data-driven hero traits, synergies, NPC evolution, side quests
// ═══════════════════════════════════════════════════════════════════════

import { Rarity } from './data';

// ═══════════════════════════════════════════════════════════════════════
// HERO TRAITS SYSTEM
// Traits enhance hero abilities in expeditions
// ═══════════════════════════════════════════════════════════════════════

export type HeroTrait = 
  | 'archaeologist'      // +15% artifacts
  | 'explorer'           // +15% speed
  | 'historian'          // +10% XP
  | 'diplomat'           // +NPC trust
  | 'warrior'            // +success rate
  | 'treasure_hunter'    // +rare finds
  | 'scholar'            // +knowledge bonus
  | 'leader'             // +team morale
  | 'lucky'              // +luck chance
  | 'cartographer'        // +map discovery
  | 'medic'              // -damage taken
  | 'trader';            // +income bonus

export interface TraitBonus {
  type: 'artifact' | 'speed' | 'xp' | 'success' | 'trust' | 'rare_find' | 'income' | 'damage' | 'luck' | 'map';
  value: number; // percentage or flat bonus
  descriptionKey: string;
}

export const TRAIT_DEFINITIONS: Record<HeroTrait, TraitBonus> = {
  archaeologist: {
    type: 'artifact',
    value: 15,
    descriptionKey: 'trait.archaeologist.desc',
  },
  explorer: {
    type: 'speed',
    value: 15,
    descriptionKey: 'trait.explorer.desc',
  },
  historian: {
    type: 'xp',
    value: 10,
    descriptionKey: 'trait.historian.desc',
  },
  diplomat: {
    type: 'trust',
    value: 5,
    descriptionKey: 'trait.diplomat.desc',
  },
  warrior: {
    type: 'success',
    value: 10,
    descriptionKey: 'trait.warrior.desc',
  },
  treasure_hunter: {
    type: 'rare_find',
    value: 10,
    descriptionKey: 'trait.treasure_hunter.desc',
  },
  scholar: {
    type: 'xp',
    value: 8,
    descriptionKey: 'trait.scholar.desc',
  },
  leader: {
    type: 'success',
    value: 5,
    descriptionKey: 'trait.leader.desc',
  },
  lucky: {
    type: 'luck',
    value: 8,
    descriptionKey: 'trait.lucky.desc',
  },
  cartographer: {
    type: 'map',
    value: 10,
    descriptionKey: 'trait.cartographer.desc',
  },
  medic: {
    type: 'damage',
    value: 20,
    descriptionKey: 'trait.medic.desc',
  },
  trader: {
    type: 'income',
    value: 10,
    descriptionKey: 'trait.trader.desc',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// HERO SYNERGY SYSTEM
// Combinations of heroes provide extra bonuses
// ═══════════════════════════════════════════════════════════════════════

export interface HeroSynergy {
  id: string;
  heroIds: string[]; // Exactly 2 heroes for this synergy
  nameKey: string;
  descriptionKey: string;
  bonus: TraitBonus;
  icon: string;
}

export const HERO_SYNERGIES: HeroSynergy[] = [
  {
    id: 'synergy-shevchenko-skovoroda',
    heroIds: ['shevchenko', 'skovoroda'],
    nameKey: 'synergy.shevchenko_skovoroda.name',
    descriptionKey: 'synergy.shevchenko_skovoroda.desc',
    bonus: { type: 'xp', value: 10, descriptionKey: 'synergy.shevchenko_skovoroda.bonus' },
    icon: '📜',
  },
  {
    id: 'synergy-hmel-sagaidachn',
    heroIds: ['hmelnytsky', 'sagaidachny'],
    nameKey: 'synergy.hmel_sagaidachn.name',
    descriptionKey: 'synergy.hmel_sagaidachn.desc',
    bonus: { type: 'success', value: 15, descriptionKey: 'synergy.hmel_sagaidachn.bonus' },
    icon: '⚔️',
  },
  {
    id: 'synergy-danylo-volodymyr',
    heroIds: ['danylo', 'volodymyr'],
    nameKey: 'synergy.danylo_volodymyr.name',
    descriptionKey: 'synergy.danylo_volodymyr.desc',
    bonus: { type: 'trust', value: 10, descriptionKey: 'synergy.danylo_volodymyr.bonus' },
    icon: '👑',
  },
  {
    id: 'synergy-kmc-franko',
    heroIds: ['kmc', 'franko'],
    nameKey: 'synergy.kmc_franko.name',
    descriptionKey: 'synergy.kmc_franko.desc',
    bonus: { type: 'artifact', value: 12, descriptionKey: 'synergy.kmc_franko.bonus' },
    icon: '🏺',
  },
  {
    id: 'synergy-kobzar-haidamaky',
    heroIds: ['kobzar', 'haidamaky'],
    nameKey: 'synergy.kobzar_haidamaky.name',
    descriptionKey: 'synergy.kobzar_haidamaky.desc',
    bonus: { type: 'speed', value: 10, descriptionKey: 'synergy.kobzar_haidamaky.bonus' },
    icon: '🎵',
  },
  {
    id: 'synergy-naukova-hromada',
    heroIds: ['naukova', 'hromada'],
    nameKey: 'synergy.naukova_hromada.name',
    descriptionKey: 'synergy.naukova_hromada.desc',
    bonus: { type: 'income', value: 15, descriptionKey: 'synergy.naukova_hromada.bonus' },
    icon: '📚',
  },
];

/**
 * Check if two heroes have a synergy
 */
export function getSynergyBetween(heroId1: string, heroId2: string): HeroSynergy | null {
  return HERO_SYNERGIES.find(
    s => s.heroIds.includes(heroId1) && s.heroIds.includes(heroId2)
  ) || null;
}

/**
 * Get all synergies for a set of heroes
 */
export function getActiveSynergies(heroIds: string[]): HeroSynergy[] {
  const synergies: HeroSynergy[] = [];
  
  for (let i = 0; i < heroIds.length; i++) {
    for (let j = i + 1; j < heroIds.length; j++) {
      const synergy = getSynergyBetween(heroIds[i], heroIds[j]);
      if (synergy) {
        synergies.push(synergy);
      }
    }
  }
  
  return synergies;
}

// ═══════════════════════════════════════════════════════════════════════
// HERO LEVEL BONUSES
// Bonuses increase with hero level
// ═══════════════════════════════════════════════════════════════════════

export interface LevelBonus {
  level: number;
  successBonus: number;    // % added to success chance
  speedBonus: number;      // % faster
  artifactBonus: number;   // % better artifacts
  xpBonus: number;         // % more XP
  reputationBonus: number; // % more reputation
}

export const HERO_LEVEL_BONUSES: LevelBonus[] = [
  { level: 1, successBonus: 0, speedBonus: 0, artifactBonus: 0, xpBonus: 0, reputationBonus: 0 },
  { level: 5, successBonus: 3, speedBonus: 5, artifactBonus: 2, xpBonus: 2, reputationBonus: 1 },
  { level: 10, successBonus: 5, speedBonus: 8, artifactBonus: 4, xpBonus: 5, reputationBonus: 2 },
  { level: 15, successBonus: 8, speedBonus: 12, artifactBonus: 6, xpBonus: 8, reputationBonus: 3 },
  { level: 20, successBonus: 10, speedBonus: 15, artifactBonus: 8, xpBonus: 10, reputationBonus: 5 },
  { level: 30, successBonus: 15, speedBonus: 20, artifactBonus: 12, xpBonus: 15, reputationBonus: 8 },
  { level: 50, successBonus: 20, speedBonus: 25, artifactBonus: 15, xpBonus: 20, reputationBonus: 10 },
];

/**
 * Get bonuses for a specific level
 */
export function getLevelBonus(level: number): LevelBonus {
  let bonus = HERO_LEVEL_BONUSES[0];
  
  for (const b of HERO_LEVEL_BONUSES) {
    if (level >= b.level) {
      bonus = b;
    } else {
      break;
    }
  }
  
  return bonus;
}

// ═══════════════════════════════════════════════════════════════════════
// RARITY TRAIT COUNT
// Determines how many traits a hero can have based on rarity
// ═══════════════════════════════════════════════════════════════════════

export const RARITY_TRAIT_COUNT: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

// ═══════════════════════════════════════════════════════════════════════
// NPC EVOLUTION SYSTEM
// NPC relationships evolve and unlock content
// ═══════════════════════════════════════════════════════════════════════

export type NpcRelationshipLevel = 
  | 'stranger'      // Level 0
  | 'neutral'       // Level 1
  | 'friendly'      // Level 2
  | 'trusted'       // Level 3
  | 'ally'          // Level 4
  | 'legendary_ally'; // Level 5

export interface NpcDialogue {
  relationship: NpcRelationshipLevel;
  dialogueKey: string;
  emotion?: 'happy' | 'neutral' | 'sad' | 'excited' | 'grateful';
}

export interface NpcReward {
  relationship: NpcRelationshipLevel;
  rewards: {
    xp?: number;
    karbovanets?: number;
    reputation?: number;
    expeditionSpeedBonus?: number; // %
    artifactBonus?: number; // %
    unlocksHero?: string;
    unlocksRegion?: string;
    unlocksCollection?: string;
  };
}

// Default dialogues by relationship level (can be overridden per NPC)
export const DEFAULT_NPC_DIALOGUES: Record<NpcRelationshipLevel, string[]> = {
  stranger: [
    'npc.dialogue.stranger.1',
    'npc.dialogue.stranger.2',
  ],
  neutral: [
    'npc.dialogue.neutral.1',
    'npc.dialogue.neutral.2',
    'npc.dialogue.neutral.3',
  ],
  friendly: [
    'npc.dialogue.friendly.1',
    'npc.dialogue.friendly.2',
    'npc.dialogue.friendly.3',
  ],
  trusted: [
    'npc.dialogue.trusted.1',
    'npc.dialogue.trusted.2',
    'npc.dialogue.trusted.3',
  ],
  ally: [
    'npc.dialogue.ally.1',
    'npc.dialogue.ally.2',
    'npc.dialogue.ally.3',
  ],
  legendary_ally: [
    'npc.dialogue.legendary.1',
    'npc.dialogue.legendary.2',
    'npc.dialogue.legendary.3',
  ],
};

// NPC rewards by relationship level
export const NPC_RELATIONSHIP_REWARDS: NpcReward[] = [
  {
    relationship: 'neutral',
    rewards: { xp: 50 },
  },
  {
    relationship: 'friendly',
    rewards: { xp: 100, karbovanets: 200 },
  },
  {
    relationship: 'trusted',
    rewards: { xp: 150, expeditionSpeedBonus: 5 },
  },
  {
    relationship: 'ally',
    rewards: { xp: 200, reputation: 10, artifactBonus: 5 },
  },
  {
    relationship: 'legendary_ally',
    rewards: { xp: 500, reputation: 25, karbovanets: 1000, expeditionSpeedBonus: 10 },
  },
];

/**
 * Get reward for reaching a relationship level
 */
export function getNpcLevelReward(level: NpcRelationshipLevel): NpcReward['rewards'] {
  const rewardEntry = NPC_RELATIONSHIP_REWARDS.find(r => r.relationship === level);
  return rewardEntry?.rewards || {};
}

/**
 * Get random dialogue for a relationship level
 */
export function getRandomDialogue(level: NpcRelationshipLevel): string {
  const dialogues = DEFAULT_NPC_DIALOGUES[level];
  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

// ═══════════════════════════════════════════════════════════════════════
// SIDE QUESTS SYSTEM
// Non-blocking quests that provide extra content
// ═══════════════════════════════════════════════════════════════════════

export type SideQuestType = 
  | 'expedition'
  | 'artifact'
  | 'collection'
  | 'hero'
  | 'npc'
  | 'exploration';

export interface SideQuest {
  id: string;
  type: SideQuestType;
  titleKey: string;
  descriptionKey: string;
  target: string;
  targetCount: number;
  npcId?: string; // Optional NPC associated with quest
  rewards: {
    xp?: number;
    reputation?: number;
    karbovanets?: number;
    trait?: HeroTrait; // Unlock trait for hero
    unlocksRegion?: string;
  };
  repeatable?: boolean;
  icon: string;
}

export const SIDE_QUESTS: SideQuest[] = [
  {
    id: 'side-quest-ancient-map',
    type: 'expedition',
    titleKey: 'quest.ancient_map.title',
    descriptionKey: 'quest.ancient_map.desc',
    target: 'region-kyiv',
    targetCount: 3,
    npcId: 'istorik',
    rewards: {
      xp: 500,
      reputation: 25,
      karbovanets: 500,
      trait: 'cartographer',
    },
    icon: '🗺️',
  },
  {
    id: 'side-quest-treasure-hunter',
    type: 'artifact',
    titleKey: 'quest.treasure_hunter.title',
    descriptionKey: 'quest.treasure_hunter.desc',
    target: 'legendary',
    targetCount: 1,
    rewards: {
      xp: 1000,
      reputation: 50,
      karbovanets: 2000,
    },
    icon: '💎',
  },
  {
    id: 'side-quest-diplomat',
    type: 'npc',
    titleKey: 'quest.diplomat.title',
    descriptionKey: 'quest.diplomat.desc',
    target: 'any',
    targetCount: 5,
    npcId: 'hetman',
    rewards: {
      xp: 300,
      trait: 'diplomat',
    },
    icon: '🤝',
  },
  {
    id: 'side-quest-collector',
    type: 'collection',
    titleKey: 'quest.collector.title',
    descriptionKey: 'quest.collector.desc',
    target: 'collection',
    targetCount: 3,
    rewards: {
      xp: 800,
      reputation: 40,
      karbovanets: 1000,
    },
    icon: '📚',
  },
  {
    id: 'side-quest-explorer',
    type: 'exploration',
    titleKey: 'quest.explorer.title',
    descriptionKey: 'quest.explorer.desc',
    target: 'any',
    targetCount: 10,
    rewards: {
      xp: 600,
      trait: 'explorer',
    },
    icon: '🧭',
  },
  {
    id: 'side-quest-warrior',
    type: 'expedition',
    titleKey: 'quest.warrior.title',
    descriptionKey: 'quest.warrior.desc',
    target: 'success',
    targetCount: 20,
    npcId: 'voyna',
    rewards: {
      xp: 700,
      reputation: 30,
      trait: 'warrior',
    },
    icon: '⚔️',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// EXPEDITION EVENTS 2.0
// Enhanced random events during expeditions
// ═══════════════════════════════════════════════════════════════════════

export type ExpeditionEventType = 
  | 'positive'
  | 'neutral'
  | 'rare'
  | 'negative';

export interface ExpeditionRandomEvent {
  id: string;
  type: ExpeditionEventType;
  chance: number; // 0-1
  titleKey: string;
  messageKey: string;
  icon: string;
  effect: {
    heroDamage?: number;      // % damage to hero
    heroXp?: number;          // Bonus XP
    artifactRarity?: 'common' | 'rare' | 'epic' | 'legendary';
    speedReduction?: number;   // % faster completion
    npcDialogue?: string;     // Trigger NPC dialogue
    sideQuest?: string;       // Trigger side quest
    mapRegion?: string;        // Unlock map region
    bonusArtifact?: boolean;   // Extra artifact
    reputationBonus?: number;  // % more reputation
  };
}

export const EXPEDITION_RANDOM_EVENTS: ExpeditionRandomEvent[] = [
  // === POSITIVE EVENTS ===
  {
    id: 'event-treasure-found',
    type: 'positive',
    chance: 0.08,
    titleKey: 'expedition_event.treasure_found.title',
    messageKey: 'expedition_event.treasure_found.message',
    icon: '💰',
    effect: {
      bonusArtifact: true,
      reputationBonus: 5,
    },
  },
  {
    id: 'event-ancient-scroll',
    type: 'positive',
    chance: 0.06,
    titleKey: 'expedition_event.ancient_scroll.title',
    messageKey: 'expedition_event.ancient_scroll.message',
    icon: '📜',
    effect: {
      heroXp: 100,
      reputationBonus: 3,
    },
  },
  {
    id: 'event-npc-hint',
    type: 'positive',
    chance: 0.07,
    titleKey: 'expedition_event.npc_hint.title',
    messageKey: 'expedition_event.npc_hint.message',
    icon: '💬',
    effect: {
      npcDialogue: 'hint',
      speedReduction: 5,
    },
  },
  {
    id: 'event-double-artifact',
    type: 'positive',
    chance: 0.04,
    titleKey: 'expedition_event.double_artifact.title',
    messageKey: 'expedition_event.double_artifact.message',
    icon: '🎁',
    effect: {
      bonusArtifact: true,
      artifactRarity: 'rare',
    },
  },

  // === NEUTRAL EVENTS ===
  {
    id: 'event-strange-find',
    type: 'neutral',
    chance: 0.10,
    titleKey: 'expedition_event.strange_find.title',
    messageKey: 'expedition_event.strange_find.message',
    icon: '❓',
    effect: {},
  },
  {
    id: 'event-lost-records',
    type: 'neutral',
    chance: 0.08,
    titleKey: 'expedition_event.lost_records.title',
    messageKey: 'expedition_event.lost_records.message',
    icon: '📃',
    effect: {
      heroXp: 25,
    },
  },

  // === RARE EVENTS ===
  {
    id: 'event-legendary-artifact',
    type: 'rare',
    chance: 0.02,
    titleKey: 'expedition_event.legendary_artifact.title',
    messageKey: 'expedition_event.legendary_artifact.message',
    icon: '👑',
    effect: {
      artifactRarity: 'legendary',
      bonusArtifact: true,
      reputationBonus: 15,
    },
  },
  {
    id: 'event-secret-region',
    type: 'rare',
    chance: 0.015,
    titleKey: 'expedition_event.secret_region.title',
    messageKey: 'expedition_event.secret_region.message',
    icon: '🗺️',
    effect: {
      mapRegion: 'secret-1',
      speedReduction: 10,
    },
  },
  {
    id: 'event-hidden-npc',
    type: 'rare',
    chance: 0.01,
    titleKey: 'expedition_event.hidden_npc.title',
    messageKey: 'expedition_event.hidden_npc.message',
    icon: '👤',
    effect: {
      npcDialogue: 'secret',
      heroXp: 200,
    },
  },

  // === NEGATIVE EVENTS ===
  {
    id: 'event-hero-injured',
    type: 'negative',
    chance: 0.05,
    titleKey: 'expedition_event.hero_injured.title',
    messageKey: 'expedition_event.hero_injured.message',
    icon: '🤕',
    effect: {
      heroDamage: 10,
    },
  },
  {
    id: 'event-storm-delay',
    type: 'negative',
    chance: 0.04,
    titleKey: 'expedition_event.storm_delay.title',
    messageKey: 'expedition_event.storm_delay.message',
    icon: '⛈️',
    effect: {
      speedReduction: -15,
    },
  },
];

/**
 * Check if a random expedition event should trigger
 */
export function checkExpeditionRandomEvent(): ExpeditionRandomEvent | null {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const event of EXPEDITION_RANDOM_EVENTS) {
    cumulative += event.chance;
    if (roll < cumulative) {
      return event;
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// SECRET/HIDDEN NPC SYSTEM
// NPCs that require special conditions to unlock
// ═══════════════════════════════════════════════════════════════════════

export interface SecretNpc {
  id: string;
  nameKey: string;
  descriptionKey: string;
  unlockCondition: {
    type: 'expedition_count' | 'arc_complete' | 'artifact_rarity' | 'hero_level' | 'npc_trust' | 'region_visited';
    target: string | number;
    value: number;
  };
  initialRelationship: NpcRelationshipLevel;
  icon: string;
  color: string;
}

export const SECRET_NPCS: SecretNpc[] = [
  {
    id: 'secret-mysterious-scholar',
    nameKey: 'npc.secret_mysterious_scholar.name',
    descriptionKey: 'npc.secret_mysterious_scholar.desc',
    unlockCondition: {
      type: 'expedition_count',
      target: 'any',
      value: 100,
    },
    initialRelationship: 'stranger',
    icon: '🧙',
    color: '#A855F7',
  },
  {
    id: 'secret-forest-spirit',
    nameKey: 'npc.secret_forest_spirit.name',
    descriptionKey: 'npc.secret_forest_spirit.desc',
    unlockCondition: {
      type: 'region_visited',
      target: 'region-1',
      value: 5,
    },
    initialRelationship: 'stranger',
    icon: '🌲',
    color: '#10B981',
  },
  {
    id: 'secret-ancient-guardian',
    nameKey: 'npc.secret_ancient_guardian.name',
    descriptionKey: 'npc.secret_ancient_guardian.desc',
    unlockCondition: {
      type: 'artifact_rarity',
      target: 'legendary',
      value: 3,
    },
    initialRelationship: 'stranger',
    icon: '🛡️',
    color: '#FFD700',
  },
];

/**
 * Check if a secret NPC should be unlocked
 */
export function checkSecretNpcUnlock(
  npc: SecretNpc,
  stats: {
    totalExpeditions: number;
    completedArcs: number[];
    legendaryArtifacts: number;
    highestHeroLevel: number;
    regionVisits: Record<string, number>;
  }
): boolean {
  switch (npc.unlockCondition.type) {
    case 'expedition_count':
      return stats.totalExpeditions >= npc.unlockCondition.value;
    case 'arc_complete':
      return stats.completedArcs.includes(npc.unlockCondition.value as number);
    case 'artifact_rarity':
      return stats.legendaryArtifacts >= npc.unlockCondition.value;
    case 'hero_level':
      return stats.highestHeroLevel >= npc.unlockCondition.value;
    case 'region_visited':
      return (stats.regionVisits[npc.unlockCondition.target as string] || 0) >= npc.unlockCondition.value;
    default:
      return false;
  }
}
