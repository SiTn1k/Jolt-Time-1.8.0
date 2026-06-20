/**
 * Game Balance Configuration
 * 
 * OPTIMIZED FOR FAST FIRST PRESTIGE (30-45 min)
 * Targets: Day 1 → First Prestige → Second Prestige → Academy
 */

// ═══════════════════════════════════════════════════════════════════════
// FIRST PRESTIGE TARGETS (30-45 minutes)
// ═══════════════════════════════════════════════════════════════════════

export const FIRST_PRESTIGE_TARGETS = {
  // 5 minutes: First expedition, first artifact
  minute5: {
    karbovanets: 500,
    reputation: 50,
    artifacts: 1,
  },
  
  // 10 minutes: First upgrade, understand mechanics
  minute10: {
    karbovanets: 1500,
    reputation: 150,
    artifacts: 3,
  },
  
  // 15 minutes: First milestone reward
  minute15: {
    karbovanets: 3000,
    reputation: 300,
    artifacts: 5,
  },
  
  // 20 minutes: Active progression
  minute20: {
    karbovanets: 5000,
    reputation: 500,
    artifacts: 8,
  },
  
  // 30 minutes: Halfway there
  minute30: {
    karbovanets: 10000,
    reputation: 1000,
    artifacts: 15,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// PROGRESSION TARGETS
// ═══════════════════════════════════════════════════════════════════════

export const PROGRESSION_TARGETS = {
  // Day 1: ~30 min active play → First Prestige
  day1: {
    karbovanets: 15000,
    reputation: 1500,
    artifacts: 15,
    prestige: 1500,
    collections: 0,
    heroesRank: 1,
    expeditionRegions: 1,
    museumLevel: 1,
    buildingLevels: 1,
  },
  
  // Day 2: ~1 hour more → Second Prestige
  day2: {
    karbovanets: 30000,
    reputation: 3000,
    artifacts: 30,
    prestige: 3000,
    collections: 1,
    heroesRank: 2,
    expeditionRegions: 2,
    museumLevel: 2,
    buildingLevels: 2,
  },
  
  // Day 3: ~2 hours → Active player
  day3: {
    karbovanets: 50000,
    reputation: 5000,
    artifacts: 50,
    prestige: 5000,
    collections: 2,
    heroesRank: 3,
    expeditionRegions: 3,
    museumLevel: 3,
    buildingLevels: 3,
  },
  
  // Day 7: Casual player → Academy
  day7: {
    karbovanets: 100000,
    reputation: 10000,
    artifacts: 100,
    prestige: 10000,
    collections: 4,
    heroesRank: 4,
    expeditionRegions: 4,
    museumLevel: 5,
    buildingLevels: 5,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// PRESTIGE MILESTONES
// ═══════════════════════════════════════════════════════════════════════

export const PRESTIGE_MILESTONES = [
  { prestige: 500, title: 'p0_prestige_milestone', reward: { karbovanets: 500, xp: 100 } },
  { prestige: 1000, title: 'p1_prestige_milestone', reward: { karbovanets: 1000, xp: 200 } },
  { prestige: 1500, title: 'p2_prestige_milestone', reward: { karbovanets: 1500, xp: 300 } },
  { prestige: 2000, title: 'p3_prestige_milestone', reward: { karbovanets: 2000, xp: 400 } },
  { prestige: 2500, title: 'p4_prestige_milestone', reward: { karbovanets: 2500, xp: 500 } },
  { prestige: 3000, title: 'academy_unlock', reward: { karbovanets: 3000, xp: 1000, title: 'Історик' } },
];

// ═══════════════════════════════════════════════════════════════════════
// BALANCE FIXES: Speed up first prestige
// ═══════════════════════════════════════════════════════════════════════

// Quest rewards - increased significantly for faster progression
export const QUEST_REWARD_MULTIPLIER = 2.0;

// Expedition rewards - significantly increased
export const EXPEDITION_REWARD_MULTIPLIER = 1.75;

// Museum income - increased to make museum worthwhile early
export const MUSEUM_INCOME_MULTIPLIER = 2.0;

// Building costs - reduced more to speed up early progression
export const BUILDING_COST_MULTIPLIER = 0.5;

// Artifact prestige values - increased for faster prestige gain
export const ARTIFACT_PRESTIGE_MULTIPLIER = 1.5;

// Generator/XP boost for early game
export const EARLY_GAME_XP_MULTIPLIER = 2.0;
export const EARLY_GAME_KARB_MULTIPLIER = 1.5;

// Stars pricing
export const STARS_VALUE_MULTIPLIER = 1.2;

// ═══════════════════════════════════════════════════════════════════════
// EXPEDITION BALANCE
// ═══════════════════════════════════════════════════════════════════════

export const EXPEDITION_BALANCE = {
  // Base expedition duration in ms
  baseDuration: 5 * 60 * 1000, // 5 minutes
  
  // Duration reduction per building level
  durationReductionPerBuilding: 0.05, // 5% per level
  
  // Base artifact drop rate (per expedition)
  baseArtifactChance: 0.15, // 15%
  
  // Artifact chance bonus per hero specialization
  specializationBonus: {
    archaeologist: 0.1,  // +10% artifact chance
    diplomat: 0.05,       // +5% artifact chance
    warrior: 0.03,        // +3% artifact chance
    scholar: 0.08,        // +8% artifact chance
  },
  
  // Base reward multiplier by region
  regionRewardMultiplier: {
    'region-1': 1.0,   // Trypillia - easiest
    'region-2': 1.5,   // Scythia
    'region-3': 2.0,   // Kyiv Rus
    'region-4': 2.5,   // Zaporizhzhia
    'region-5': 3.0,   // Independence - hardest
  },
  
  // Region unlock requirements
  regionUnlockReputation: {
    'region-1': 0,      // Unlocked at start
    'region-2': 300,    // After local fame
    'region-3': 1000,   // After city fame
    'region-4': 2500,   // After regional fame
    'region-5': 5000,   // After national fame
  },
  
  // Artifact value by rarity
  artifactValue: {
    common: 50,
    rare: 200,
    epic: 800,
    legendary: 3000,
  },
  
  // Drop rates by region
  dropRates: {
    'region-1': { common: 0.70, rare: 0.25, epic: 0.05, legendary: 0.00 },
    'region-2': { common: 0.55, rare: 0.35, epic: 0.09, legendary: 0.01 },
    'region-3': { common: 0.40, rare: 0.40, epic: 0.17, legendary: 0.03 },
    'region-4': { common: 0.30, rare: 0.40, epic: 0.24, legendary: 0.06 },
    'region-5': { common: 0.20, rare: 0.35, epic: 0.33, legendary: 0.12 },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// HERO PROGRESSION BALANCE
// ═══════════════════════════════════════════════════════════════════════

export const HERO_BALANCE = {
  // XP needed for each rank
  rankThresholds: {
    1: 0,           // Novice
    2: 500,         // Adept
    3: 2000,        // Expert
    4: 8000,        // Master
    5: 30000,       // Legend
  },
  
  // XP gained per expedition based on region
  xpPerExpedition: {
    'region-1': 10,
    'region-2': 15,
    'region-3': 25,
    'region-4': 35,
    'region-5': 50,
  },
  
  // Bonus XP from Historical Archive building
  archiveXPMultiplier: 0.15, // +15% per building level
  
  // Stats growth per level
  statsPerLevel: {
    attack: 0.5,
    defense: 0.3,
    luck: 0.2,
  },
  
  // Starting stats
  baseStats: {
    attack: 10,
    defense: 8,
    luck: 5,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// BUILDING BALANCE
// ═══════════════════════════════════════════════════════════════════════

export const BUILDING_BALANCE = {
  // Building upgrade costs
  baseUpgradeCost: 1000,
  upgradeCostMultiplier: 1.5, // Per level
  
  // Upgrade time (ms) - max 30 minutes
  baseUpgradeTime: 60 * 1000, // 1 minute
  maxUpgradeTime: 30 * 60 * 1000, // 30 minutes
  upgradeTimeMultiplier: 1.3, // Per level
  
  // Building bonuses per level
  bonuses: {
    // Archaeology Institute: expedition success rate
    'building-1': {
      baseBonus: 0.10, // +10% per level
      maxBonus: 2.0,   // +200% at level 10
      description: 'expedition_success',
    },
    // Expedition Corps: +1 slot per level
    'building-2': {
      baseBonus: 1,    // +1 slot per level
      maxBonus: 12,   // +11 slots at level 11
      description: 'expedition_slots',
    },
    // Restoration Lab: -10% time per level
    'building-3': {
      baseBonus: 0.10, // -10% per level
      maxBonus: 0.50,  // -50% at level 5
      description: 'restoration_speed',
    },
    // National Museum: +50 income per level
    'building-4': {
      baseBonus: 50,  // +50 per level
      maxBonus: 500,  // +500 at level 10
      description: 'museum_income',
    },
    // Historical Archive: +15% XP per level
    'building-5': {
      baseBonus: 0.15, // +15% per level
      maxBonus: 1.5,   // +150% at level 10
      description: 'hero_xp',
    },
    // Treasury: +1000 storage per level
    'building-6': {
      baseBonus: 1000, // +1000 per level
      maxBonus: 10000, // +10000 at level 10
      description: 'storage',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// MUSEUM BALANCE
// ═══════════════════════════════════════════════════════════════════════

export const MUSEUM_BALANCE = {
  // Base visitors per exhibited artifact
  visitorsPerArtifact: 25,
  
  // Visitor cap (no artifact penalty)
  minDailyVisitors: 50,
  
  // Reputation gain per visitor
  reputationPerVisitor: 0.1,
  
  // Reputation gain per collection completion
  reputationPerCollection: {
    1: 500,   // Tier 1
    2: 2500,  // Tier 2
    3: 10000, // Tier 3
  },
  
  // Income calculation
  incomePer100Value: 1, // 1 karbovanet per 100 artifact value
  
  // Upgrade costs
  upgradeBaseCost: {
    marketing: 5000,
    security: 8000,
    exhibition_hall: 12000,
    restoration_wing: 15000,
  },
  
  upgradeCostMultiplier: {
    marketing: 1.8,
    security: 2.0,
    exhibition_hall: 2.5,
    restoration_wing: 2.2,
  },
  
  // Daily reputation rewards by level
  dailyReputationReward: {
    1: 10,
    2: 20,
    3: 35,
    4: 55,
    5: 85,
    6: 130,
    7: 200,
    8: 300,
    9: 450,
    10: 700,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// QUEST BALANCE
// ═══════════════════════════════════════════════════════════════════════

export const QUEST_BALANCE = {
  // Quest duration estimates (in expeditions)
  questDurationEstimate: {
    easy: 5,      // ~25 min
    medium: 15,   // ~1.25 hours
    hard: 30,    // ~2.5 hours
    epic: 60,    // ~5 hours
  },
  
  // Reward multipliers
  rewardMultipliers: {
    easy: 1.0,
    medium: 2.5,
    hard: 5.0,
    epic: 10.0,
  },
  
  // Base rewards by type
  baseRewards: {
    karbovanets: 200,
    xp: 50,
    reputation: 25,
    academy_xp: 30,
  },
  
  // Arc difficulty multipliers
  arcMultipliers: {
    arc1: 1.0,   // Trypillia - tutorial
    arc2: 1.5,   // Scythia
    arc3: 2.5,   // Kyiv Rus
    arc4: 3.0,   // Cossacks
    arc5: 4.0,   // Independence
  },
  
  // Daily quest caps
  dailyQuestCap: 3, // Max 3 daily quests per day
  dailyQuestRefresh: 24 * 60 * 60 * 1000, // 24 hours
  
  // Repeatable quest rewards
  repeatableQuestMultiplier: 0.5, // 50% of normal rewards
};

// ═══════════════════════════════════════════════════════════════════════
// ECONOMY BALANCE
// ═══════════════════════════════════════════════════════════════════════

export const ECONOMY_BALANCE = {
  // Passive income generation
  passiveIncomePerHour: {
    base: 100,
    museumBonus: 50,  // Per collection
    buildingBonus: 25, // Per building level
  },
  
  // Currency sinks (costs)
  majorSinks: {
    expedition: 50,        // Per expedition
    museumUpgrade: 5000,   // Min upgrade
    buildingUpgrade: 1000, // Min upgrade
    slotExpansion: 5000,  // Exhibition slot
    heroUpgrade: 2000,     // Hero level up
  },
  
  // Soft cap where earning slows (to prevent runaway inflation)
  softCapMultiplier: 0.5, // 50% earnings after this point
  
  softCapThresholds: {
    karbovanets: 100000,  // 100k soft cap
    reputation: 10000,    // 10k soft cap
  },
  
  // Inflation prevention: reduce drops after soft cap
  postSoftCapMultiplier: 0.75,
};

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate recommended expedition duration
 */
export function getExpeditionDuration(buildingLevel: number): number {
  const reduction = 1 - (buildingLevel * BUILDING_BALANCE.bonuses['building-3'].baseBonus);
  return Math.max(
    EXPEDITION_BALANCE.baseDuration * reduction,
    EXPEDITION_BALANCE.baseDuration * 0.25 // Min 25% of base
  );
}

/**
 * Calculate artifact drop rate
 */
export function getArtifactChance(
  _regionId: string,
  heroSpecialization: string,
  buildingLevel: number
): number {
  const base = EXPEDITION_BALANCE.baseArtifactChance;
  const specBonus = (EXPEDITION_BALANCE.specializationBonus as Record<string, number>)[heroSpecialization] || 0;
  const buildingBonus = buildingLevel * 0.02; // +2% per building level
  
  return Math.min(base + specBonus + buildingBonus, 0.8); // Cap at 80%
}

/**
 * Get XP for a hero based on expedition
 */
export function getHeroXP(regionId: string, archiveLevel: number): number {
  const baseXP = (HERO_BALANCE.xpPerExpedition as Record<string, number>)[regionId] || 10;
  const archiveBonus = 1 + (archiveLevel * BUILDING_BALANCE.bonuses['building-5'].baseBonus);
  
  return Math.floor(baseXP * archiveBonus);
}

/**
 * Calculate building upgrade cost
 */
export function getBuildingUpgradeCost(_buildingId: string, currentLevel: number): number {
  const base = BUILDING_BALANCE.baseUpgradeCost;
  return Math.floor(base * Math.pow(BUILDING_BALANCE.upgradeCostMultiplier, currentLevel));
}

/**
 * Calculate building upgrade time
 */
export function getBuildingUpgradeTime(_buildingId: string, currentLevel: number): number {
  const base = BUILDING_BALANCE.baseUpgradeTime;
  const time = Math.floor(base * Math.pow(BUILDING_BALANCE.upgradeTimeMultiplier, currentLevel));
  return Math.min(time, BUILDING_BALANCE.maxUpgradeTime);
}

/**
 * Get quest reward based on difficulty and arc
 */
export function getQuestReward(
  baseReward: number,
  difficulty: keyof typeof QUEST_BALANCE.rewardMultipliers,
  arc: keyof typeof QUEST_BALANCE.arcMultipliers
): number {
  const diffMult = QUEST_BALANCE.rewardMultipliers[difficulty];
  const arcMult = QUEST_BALANCE.arcMultipliers[arc];
  return Math.floor(baseReward * diffMult * arcMult);
}

/**
 * Check if player is past soft cap
 */
export function isPastSoftCap(karbovanets: number): boolean {
  return karbovanets > ECONOMY_BALANCE.softCapThresholds.karbovanets;
}

/**
 * Calculate effective earnings (post soft cap)
 */
export function getEffectiveEarnings(amount: number, karbovanets: number): number {
  if (!isPastSoftCap(karbovanets)) return amount;
  
  const overCap = karbovanets - ECONOMY_BALANCE.softCapThresholds.karbovanets;
  const capRange = ECONOMY_BALANCE.softCapThresholds.karbovanets;
  const reduction = Math.min(1 - ECONOMY_BALANCE.postSoftCapMultiplier, overCap / capRange);
  
  return Math.floor(amount * (1 - reduction));
}
