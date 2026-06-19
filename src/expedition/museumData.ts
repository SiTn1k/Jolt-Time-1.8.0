/**
 * Museum System Data
 * 
 * Contains:
 * - Museum Collections
 * - Museum Upgrades
 * - Reputation Levels
 * - Passive Income Calculations
 */

// ═══════════════════════════════════════════════════════════════════════
// COLLECTIONS
// ═══════════════════════════════════════════════════════════════════════

export interface Collection {
  id: string;
  nameKey: string;        // i18n key
  era: string;            // Matching era from artifacts
  artifacts: string[];     // Required artifact IDs or patterns
  requiredCount: number;  // Number needed to complete
  bonus: MuseumBonus;     // Permanent bonus on completion
  icon: string;           // Emoji icon
}

export interface MuseumBonus {
  reputationBonus: number;     // Flat reputation bonus
  visitorBonus: number;       // Percentage visitor bonus
  incomeBonus: number;         // Percentage income bonus
  karbovanetsBonus: number;   // Flat karbovanets bonus on completion
}

export const museumCollections: Collection[] = [
  {
    id: 'collection_trypillia',
    nameKey: 'museum.collection_trypillia',
    era: 'Трипілля',
    artifacts: ['bull', 'idol', 'vessel', 'ceramic', 'figurine'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 500,
      visitorBonus: 10,
      incomeBonus: 5,
      karbovanetsBonus: 1000,
    },
    icon: '🏺',
  },
  {
    id: 'collection_scythia',
    nameKey: 'museum.collection_scythia',
    era: 'Скіфія',
    artifacts: ['gold', 'arrow', 'sword', 'armor', 'crown'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 800,
      visitorBonus: 15,
      incomeBonus: 8,
      karbovanetsBonus: 2000,
    },
    icon: '⚔️',
  },
  {
    id: 'collection_kyiv_rus',
    nameKey: 'museum.collection_kyiv_rus',
    era: 'Київська Русь',
    artifacts: ['icon', 'cross', 'seal', 'manuscript', 'chalice'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 1200,
      visitorBonus: 20,
      incomeBonus: 12,
      karbovanetsBonus: 3500,
    },
    icon: '⛪',
  },
  {
    id: 'collection_cossack',
    nameKey: 'museum.collection_cossack',
    era: 'Козаччина',
    artifacts: ['sword', 'pistol', 'seal', 'flag', 'mace'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 1500,
      visitorBonus: 25,
      incomeBonus: 15,
      karbovanetsBonus: 5000,
    },
    icon: '🗡️',
  },
  {
    id: 'collection_independence',
    nameKey: 'museum.collection_independence',
    era: 'Незалежність',
    artifacts: ['flag', 'trident', 'constitution', 'coat', 'stamp'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 2000,
      visitorBonus: 30,
      incomeBonus: 20,
      karbovanetsBonus: 10000,
    },
    icon: '🏴',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// REPUTATION LEVELS
// ═══════════════════════════════════════════════════════════════════════

export interface ReputationLevel {
  level: number;
  nameKey: string;           // i18n key
  requiredReputation: number; // Total reputation needed
  visitorMultiplier: number; // Visitor generation multiplier
  incomeMultiplier: number;    // Income generation multiplier
  unlocks: string[];         // Feature unlocks
}

export const reputationLevels: ReputationLevel[] = [
  {
    level: 1,
    nameKey: 'museum.rep_local',
    requiredReputation: 0,
    visitorMultiplier: 1.0,
    incomeMultiplier: 1.0,
    unlocks: ['basic_exhibitions'],
  },
  {
    level: 2,
    nameKey: 'museum.rep_district',
    requiredReputation: 500,
    visitorMultiplier: 1.1,
    incomeMultiplier: 1.05,
    unlocks: ['collections'],
  },
  {
    level: 3,
    nameKey: 'museum.rep_city',
    requiredReputation: 1500,
    visitorMultiplier: 1.2,
    incomeMultiplier: 1.1,
    unlocks: ['upgrades'],
  },
  {
    level: 4,
    nameKey: 'museum.rep_regional',
    requiredReputation: 3500,
    visitorMultiplier: 1.35,
    incomeMultiplier: 1.2,
    unlocks: ['special_exhibitions'],
  },
  {
    level: 5,
    nameKey: 'museum.rep_national',
    requiredReputation: 7000,
    visitorMultiplier: 1.5,
    incomeMultiplier: 1.35,
    unlocks: ['legendary_exhibits'],
  },
  {
    level: 6,
    nameKey: 'museum.rep_international',
    requiredReputation: 12000,
    visitorMultiplier: 1.7,
    incomeMultiplier: 1.5,
    unlocks: ['international_visitors'],
  },
  {
    level: 7,
    nameKey: 'museum.rep_famous',
    requiredReputation: 20000,
    visitorMultiplier: 1.9,
    incomeMultiplier: 1.7,
    unlocks: ['famous_exhibits'],
  },
  {
    level: 8,
    nameKey: 'museum.rep_federal',
    requiredReputation: 35000,
    visitorMultiplier: 2.1,
    incomeMultiplier: 1.9,
    unlocks: ['federal_recognition'],
  },
  {
    level: 9,
    nameKey: 'museum.rep_world',
    requiredReputation: 60000,
    visitorMultiplier: 2.4,
    incomeMultiplier: 2.2,
    unlocks: ['world_heritage'],
  },
  {
    level: 10,
    nameKey: 'museum.rep_legendary',
    requiredReputation: 100000,
    visitorMultiplier: 2.8,
    incomeMultiplier: 2.5,
    unlocks: ['legendary_status'],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// MUSEUM UPGRADES
// ═══════════════════════════════════════════════════════════════════════

export type UpgradeId = 'marketing' | 'security' | 'exhibition_hall' | 'restoration_wing';

export interface MuseumUpgrade {
  id: UpgradeId;
  nameKey: string;           // i18n key
  descriptionKey: string;    // i18n key
  maxLevel: number;
  baseCost: number;          // Karbovanets cost for level 1
  costMultiplier: number;    // Cost increase per level
  effects: UpgradeEffect[];
  icon: string;
}

export interface UpgradeEffect {
  type: 'visitors' | 'income' | 'slots' | 'repairs' | 'reputation';
  value: number;            // Effect value per level
}

export const museumUpgrades: MuseumUpgrade[] = [
  {
    id: 'marketing',
    nameKey: 'museum.upgrade_marketing',
    descriptionKey: 'museum.upgrade_marketing_desc',
    maxLevel: 10,
    baseCost: 5000,
    costMultiplier: 1.8,
    effects: [
      { type: 'visitors', value: 15 },      // +15% visitors per level
    ],
    icon: '📢',
  },
  {
    id: 'security',
    nameKey: 'museum.upgrade_security',
    descriptionKey: 'museum.upgrade_security_desc',
    maxLevel: 10,
    baseCost: 8000,
    costMultiplier: 2.0,
    effects: [
      { type: 'reputation', value: 50 },   // +50 reputation per level
    ],
    icon: '🔒',
  },
  {
    id: 'exhibition_hall',
    nameKey: 'museum.upgrade_exhibition',
    descriptionKey: 'museum.upgrade_exhibition_desc',
    maxLevel: 9,                             // 3 base + 9 upgrades = 12 max
    baseCost: 12000,
    costMultiplier: 2.5,
    effects: [
      { type: 'slots', value: 1 },           // +1 exhibition slot per level
    ],
    icon: '🏛️',
  },
  {
    id: 'restoration_wing',
    nameKey: 'museum.upgrade_restoration',
    descriptionKey: 'museum.upgrade_restoration_desc',
    maxLevel: 10,
    baseCost: 15000,
    costMultiplier: 2.2,
    effects: [
      { type: 'repairs', value: 10 },       // +10% repair speed per level
      { type: 'income', value: 5 },         // +5% income per level
    ],
    icon: '🔧',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// MUSEUM STATE TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface MuseumExhibition {
  slotIndex: number;
  artifactId: string | null;  // null = empty slot
  placedAt: number;          // Timestamp when placed
}

export interface MuseumUpgradeState {
  marketing: number;
  security: number;
  exhibition_hall: number;
  restoration_wing: number;
}

export interface MuseumState {
  // Core stats
  reputation: number;
  dailyVisitors: number;
  lastVisitorReset: number;  // Timestamp of last daily reset
  
  // Exhibitions
  exhibitions: MuseumExhibition[];  // 12 slots
  maxExhibitionSlots: number;
  
  // Collections
  completedCollections: string[];   // Collection IDs
  collectionProgress: Record<string, number>;  // Artifact count per collection
  
  // Upgrades
  upgrades: MuseumUpgradeState;
  
  // Statistics
  totalVisitorsAllTime: number;
  totalIncomeAllTime: number;
  lastIncomeCollected: number;
}

// ═══════════════════════════════════════════════════════════════════════
// CALCULATION HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get reputation level based on current reputation
 */
export function getReputationLevel(reputation: number): ReputationLevel {
  let currentLevel = reputationLevels[0];
  
  for (const level of reputationLevels) {
    if (reputation >= level.requiredReputation) {
      currentLevel = level;
    } else {
      break;
    }
  }
  
  return currentLevel;
}

/**
 * Calculate daily visitors based on all factors
 */
export function calculateDailyVisitors(
  museumState: MuseumState,
  exhibitedArtifactCount: number,
  collectionBonus: number,
): number {
  // Base visitors from exhibited artifacts
  const baseVisitors = exhibitedArtifactCount * 25;
  
  // Get reputation level multiplier
  const repLevel = getReputationLevel(museumState.reputation);
  const repMultiplier = repLevel.visitorMultiplier;
  
  // Marketing upgrade bonus
  const marketingBonus = 1 + (museumState.upgrades.marketing * museumUpgrades[0].effects[0].value / 100);
  
  // Collection bonus
  const collectionMultiplier = 1 + (collectionBonus / 100);
  
  // Calculate final visitors
  const visitors = Math.floor(baseVisitors * repMultiplier * marketingBonus * collectionMultiplier);
  
  // Minimum visitors even with no artifacts
  return Math.max(50, visitors);
}

/**
 * Calculate hourly income from museum
 */
export function calculateMuseumIncome(
  museumState: MuseumState,
  exhibitedArtifactValue: number,
): number {
  // Base income from artifact value
  const baseIncome = Math.floor(exhibitedArtifactValue / 100);
  
  // Reputation level multiplier
  const repLevel = getReputationLevel(museumState.reputation);
  const repMultiplier = repLevel.incomeMultiplier;
  
  // Restoration wing bonus
  const restorationBonus = 1 + (museumState.upgrades.restoration_wing * 
    museumUpgrades[3].effects.find(e => e.type === 'income')!.value / 100);
  
  // Collection bonuses
  const completedCount = museumState.completedCollections.length;
  const collectionBonus = 1 + (completedCount * 5 / 100);
  
  // Calculate final income
  const income = Math.floor(baseIncome * repMultiplier * restorationBonus * collectionBonus);
  
  return Math.max(10, income);
}

/**
 * Get upgrade cost for a specific level
 */
export function getUpgradeCost(upgrade: MuseumUpgrade, currentLevel: number): number {
  if (currentLevel >= upgrade.maxLevel) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

/**
 * Get upgrade effect value at a specific level
 */
export function getUpgradeEffectValue(
  upgrade: MuseumUpgrade,
  currentLevel: number,
  effectType: 'visitors' | 'income' | 'slots' | 'repairs' | 'reputation'
): number {
  const effect = upgrade.effects.find(e => e.type === effectType);
  if (!effect) return 0;
  return effect.value * currentLevel;
}

/**
 * Calculate collection progress for an era
 */
export function calculateCollectionProgress(
  collection: Collection,
  museumArtifacts: Array<{ era: string; name: string }>,
): number {
  return museumArtifacts.filter(artifact => {
    // Check if artifact matches era
    if (artifact.era !== collection.era) return false;
    
    // Check if artifact name contains any of the collection keywords
    const artifactLower = artifact.name.toLowerCase();
    return collection.artifacts.some(keyword => artifactLower.includes(keyword.toLowerCase()));
  }).length;
}

/**
 * Check if collection is complete
 */
export function isCollectionComplete(
  collection: Collection,
  progress: number,
): boolean {
  return progress >= collection.requiredCount;
}

// ═══════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════

export const initialMuseumState: MuseumState = {
  reputation: 0,
  dailyVisitors: 50,
  lastVisitorReset: Date.now(),
  
  exhibitions: Array.from({ length: 3 }, (_, i) => ({
    slotIndex: i,
    artifactId: null,
    placedAt: 0,
  })),
  maxExhibitionSlots: 3,
  
  completedCollections: [],
  collectionProgress: {},
  
  upgrades: {
    marketing: 0,
    security: 0,
    exhibition_hall: 0,
    restoration_wing: 0,
  },
  
  totalVisitorsAllTime: 0,
  totalIncomeAllTime: 0,
  lastIncomeCollected: Date.now(),
};
