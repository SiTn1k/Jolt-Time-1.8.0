// ═══════════════════════════════════════════════════════════════════════
// PREMIUM ECONOMY & ADS SYSTEM
// Telegram Stars, Premium Shop, Rewarded Ads
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// ADVERTISING SYSTEM
// Rewarded ads integration for both game parts
// ═══════════════════════════════════════════════════════════════════════

export type AdType = 
  | 'expedition_skip'    // Skip expedition timer
  | 'bonus_xp'          // +25% XP for 30 min
  | 'bonus_income'       // +25% museum income for 1 hour
  | 'bonus_reputation'   // +25% reputation for 30 min
  | 'artifact_chance'    // +1 artifact chance roll
  | 'hero_revive'        // Revive injured hero
  | 'daily_free'         // Extra daily reward
  | 'gacha_spin'         // Free gacha spin
  | 'generator_complete'  // Instant generator completion
  | 'double_currency'    // 2x currency for 30 min
  | 'double_tap_power';   // 2x tap power for 15 min

export interface AdReward {
  type: AdType;
  duration?: number; // in minutes
  multiplier?: number;
  descriptionKey: string;
}

export interface DailyAdLimits {
  expedition_skip: number;
  bonus_xp: number;
  bonus_income: number;
  bonus_reputation: number;
  artifact_chance: number;
  hero_revive: number;
  daily_free: number;
  gacha_spin: number;
  generator_complete: number;
  double_currency: number;
  double_tap_power: number;
}

// Data-driven daily ad limits
export const DAILY_AD_LIMITS: DailyAdLimits = {
  expedition_skip: 5,
  bonus_xp: 5,
  bonus_income: 5,
  bonus_reputation: 5,
  artifact_chance: 10,
  hero_revive: 3,
  daily_free: 1,
  gacha_spin: 3,
  generator_complete: 10,
  double_currency: 3,
  double_tap_power: 5,
};

// Ad rewards configuration
export const AD_REWARDS: Record<AdType, AdReward> = {
  expedition_skip: {
    type: 'expedition_skip',
    descriptionKey: 'ad.expedition_skip.desc',
  },
  bonus_xp: {
    type: 'bonus_xp',
    duration: 30,
    multiplier: 1.25,
    descriptionKey: 'ad.bonus_xp.desc',
  },
  bonus_income: {
    type: 'bonus_income',
    duration: 60,
    multiplier: 1.25,
    descriptionKey: 'ad.bonus_income.desc',
  },
  bonus_reputation: {
    type: 'bonus_reputation',
    duration: 30,
    multiplier: 1.25,
    descriptionKey: 'ad.bonus_reputation.desc',
  },
  artifact_chance: {
    type: 'artifact_chance',
    multiplier: 1,
    descriptionKey: 'ad.artifact_chance.desc',
  },
  hero_revive: {
    type: 'hero_revive',
    descriptionKey: 'ad.hero_revive.desc',
  },
  daily_free: {
    type: 'daily_free',
    descriptionKey: 'ad.daily_free.desc',
  },
  gacha_spin: {
    type: 'gacha_spin',
    descriptionKey: 'ad.gacha_spin.desc',
  },
  generator_complete: {
    type: 'generator_complete',
    descriptionKey: 'ad.generator_complete.desc',
  },
  double_currency: {
    type: 'double_currency',
    duration: 30,
    multiplier: 2,
    descriptionKey: 'ad.double_currency.desc',
  },
  double_tap_power: {
    type: 'double_tap_power',
    duration: 15,
    multiplier: 2,
    descriptionKey: 'ad.double_tap_power.desc',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// TELEGRAM STARS & PREMIUM CURRENCY
// ═══════════════════════════════════════════════════════════════════════

export interface PremiumCurrency {
  starsBalance: number;
  premiumTickets: number;      // For gacha
  expeditionBoosts: number;    // Instant complete
  xpBoosts: number;           // +XP duration
  incomeBoosts: number;       // +Income duration
  cosmeticFrames: string[];   // Unlocked frames
  chatBadges: string[];        // Unlocked badges
  profileBackgrounds: string[]; // Unlocked backgrounds
  activeEffects: {
    xpBoostEnd: number;
    incomeBoostEnd: number;
    reputationBoostEnd: number;
    cosmeticFrame: string | null;
    chatBadge: string | null;
    profileBackground: string | null;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// PREMIUM SHOP ITEMS
// All purchasable items via Telegram Stars
// ═══════════════════════════════════════════════════════════════════════

export type ShopItemType = 
  | 'pack'
  | 'boost'
  | 'spin'
  | 'cosmetic_frame'
  | 'chat_badge'
  | 'profile_background'
  | 'subscription';

export interface ShopItem {
  id: string;
  type: ShopItemType;
  nameKey: string;
  descriptionKey: string;
  cost: number; // in Telegram Stars
  icon: string;
  color: string;
  contents?: {
    premiumTickets?: number;
    expeditionBoosts?: number;
    xpBoosts?: number;
    incomeBoosts?: number;
    cosmeticFrame?: string;
    chatBadge?: string;
    profileBackground?: string;
    duration?: number; // days for subscription effects
  };
  limited?: boolean;
  limitedQuantity?: number;
  featured?: boolean;
}

// Premium shop items (data-driven)
export const PREMIUM_SHOP_ITEMS: ShopItem[] = [
  // === STARTER PACKS ===
  {
    id: 'starter_pack_small',
    type: 'pack',
    nameKey: 'shop.starter_pack_small.name',
    descriptionKey: 'shop.starter_pack_small.desc',
    cost: 50,
    icon: '🎁',
    color: '#10B981',
    contents: {
      premiumTickets: 5,
      expeditionBoosts: 10,
    },
    featured: true,
  },
  {
    id: 'explorer_pack',
    type: 'pack',
    nameKey: 'shop.explorer_pack.name',
    descriptionKey: 'shop.explorer_pack.desc',
    cost: 99,
    icon: '🧭',
    color: '#00E5FF',
    contents: {
      expeditionBoosts: 20,
      premiumTickets: 5,
      incomeBoosts: 1, // +10% for 7 days
      duration: 7,
    },
  },
  {
    id: 'historian_pack',
    type: 'pack',
    nameKey: 'shop.historian_pack.name',
    descriptionKey: 'shop.historian_pack.desc',
    cost: 199,
    icon: '📚',
    color: '#A855F7',
    contents: {
      expeditionBoosts: 50,
      premiumTickets: 10,
      xpBoosts: 2, // +20% XP for 14 days
      duration: 14,
    },
    featured: true,
  },
  {
    id: 'patron_pack',
    type: 'pack',
    nameKey: 'shop.patron_pack.name',
    descriptionKey: 'shop.patron_pack.desc',
    cost: 399,
    icon: '👑',
    color: '#FFD700',
    contents: {
      expeditionBoosts: 100,
      premiumTickets: 20,
      cosmeticFrame: 'golden_frame',
      chatBadge: 'patron_badge',
    },
    limited: true,
    limitedQuantity: 100,
  },

  // === INDIVIDUAL BOOSTS ===
  {
    id: 'boost_expedition_1',
    type: 'boost',
    nameKey: 'shop.boost_expedition_1.name',
    descriptionKey: 'shop.boost_expedition_1.desc',
    cost: 5,
    icon: '⚡',
    color: '#00E5FF',
    contents: {
      expeditionBoosts: 1,
    },
  },
  {
    id: 'boost_expedition_10',
    type: 'boost',
    nameKey: 'shop.boost_expedition_10.name',
    descriptionKey: 'shop.boost_expedition_10.desc',
    cost: 45,
    icon: '💎',
    color: '#00E5FF',
    contents: {
      expeditionBoosts: 10,
    },
  },

  // === GACHA SPINS ===
  {
    id: 'gacha_ticket_1',
    type: 'spin',
    nameKey: 'shop.gacha_ticket_1.name',
    descriptionKey: 'shop.gacha_ticket_1.desc',
    cost: 10,
    icon: '🎰',
    color: '#FF6B6B',
    contents: {
      premiumTickets: 1,
    },
  },
  {
    id: 'gacha_ticket_5',
    type: 'spin',
    nameKey: 'shop.gacha_ticket_5.name',
    descriptionKey: 'shop.gacha_ticket_5.desc',
    cost: 45,
    icon: '🎰',
    color: '#FF6B6B',
    contents: {
      premiumTickets: 5,
    },
  },

  // === COSMETICS ===
  {
    id: 'cosmetic_frame_bronze',
    type: 'cosmetic_frame',
    nameKey: 'shop.cosmetic_frame_bronze.name',
    descriptionKey: 'shop.cosmetic_frame_bronze.desc',
    cost: 100,
    icon: '🖼️',
    color: '#CD7F32',
    contents: {
      cosmeticFrame: 'bronze_frame',
    },
  },
  {
    id: 'cosmetic_frame_silver',
    type: 'cosmetic_frame',
    nameKey: 'shop.cosmetic_frame_silver.name',
    descriptionKey: 'shop.cosmetic_frame_silver.desc',
    cost: 200,
    icon: '🖼️',
    color: '#C0C0C0',
    contents: {
      cosmeticFrame: 'silver_frame',
    },
  },
  {
    id: 'cosmetic_frame_gold',
    type: 'cosmetic_frame',
    nameKey: 'shop.cosmetic_frame_gold.name',
    descriptionKey: 'shop.cosmetic_frame_gold.desc',
    cost: 500,
    icon: '🖼️',
    color: '#FFD700',
    contents: {
      cosmeticFrame: 'gold_frame',
    },
  },
  {
    id: 'cosmetic_frame_legendary',
    type: 'cosmetic_frame',
    nameKey: 'shop.cosmetic_frame_legendary.name',
    descriptionKey: 'shop.cosmetic_frame_legendary.desc',
    cost: 1000,
    icon: '🖼️',
    color: '#A855F7',
    contents: {
      cosmeticFrame: 'legendary_frame',
    },
  },

  // === CHAT BADGES ===
  {
    id: 'badge_explorer',
    type: 'chat_badge',
    nameKey: 'shop.badge_explorer.name',
    descriptionKey: 'shop.badge_explorer.desc',
    cost: 150,
    icon: '🏅',
    color: '#00E5FF',
    contents: {
      chatBadge: 'explorer_badge',
    },
  },
  {
    id: 'badge_scholar',
    type: 'chat_badge',
    nameKey: 'shop.badge_scholar.name',
    descriptionKey: 'shop.badge_scholar.desc',
    cost: 300,
    icon: '🏅',
    color: '#A855F7',
    contents: {
      chatBadge: 'scholar_badge',
    },
  },
  {
    id: 'badge_legend',
    type: 'chat_badge',
    nameKey: 'shop.badge_legend.name',
    descriptionKey: 'shop.badge_legend.desc',
    cost: 500,
    icon: '🏅',
    color: '#FFD700',
    contents: {
      chatBadge: 'legend_badge',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// COSMETIC DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

export interface CosmeticFrame {
  id: string;
  nameKey: string;
  gradient: string; // CSS gradient
  borderColor: string;
  glowColor: string;
}

export interface ChatBadge {
  id: string;
  nameKey: string;
  icon: string;
  color: string;
}

export interface ProfileBackground {
  id: string;
  nameKey: string;
  gradient: string;
}

export const COSMETIC_FRAMES: CosmeticFrame[] = [
  { id: 'bronze_frame', nameKey: 'cosmetic.bronze_frame.name', gradient: 'linear-gradient(135deg, #CD7F32, #8B4513)', borderColor: '#CD7F32', glowColor: 'rgba(205, 127, 50, 0.5)' },
  { id: 'silver_frame', nameKey: 'cosmetic.silver_frame.name', gradient: 'linear-gradient(135deg, #C0C0C0, #808080)', borderColor: '#C0C0C0', glowColor: 'rgba(192, 192, 192, 0.5)' },
  { id: 'gold_frame', nameKey: 'cosmetic.gold_frame.name', gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', borderColor: '#FFD700', glowColor: 'rgba(255, 215, 0, 0.5)' },
  { id: 'legendary_frame', nameKey: 'cosmetic.legendary_frame.name', gradient: 'linear-gradient(135deg, #A855F7, #6366F1)', borderColor: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.5)' },
];

export const CHAT_BADGES: ChatBadge[] = [
  { id: 'explorer_badge', nameKey: 'badge.explorer.name', icon: '🧭', color: '#00E5FF' },
  { id: 'scholar_badge', nameKey: 'badge.scholar.name', icon: '📚', color: '#A855F7' },
  { id: 'patron_badge', nameKey: 'badge.patron.name', icon: '👑', color: '#FFD700' },
  { id: 'legend_badge', nameKey: 'badge.legend.name', icon: '⭐', color: '#FF6B6B' },
];

// ═══════════════════════════════════════════════════════════════════════
// DAILY FREE REWARD
// ═══════════════════════════════════════════════════════════════════════

export interface DailyFreeReward {
  premiumTicket: number;
  expeditionBoost: number;
  xpBonus: number; // flat XP
}

export const DAILY_FREE_REWARD: DailyFreeReward = {
  premiumTicket: 1,
  expeditionBoost: 1,
  xpBonus: 100,
};

// ═══════════════════════════════════════════════════════════════════════
// ECONOMY BALANCING CONSTRAINTS
// Maximum bonus caps to prevent infinite multipliers
// ═══════════════════════════════════════════════════════════════════════

export const ECONOMY_MAX_BONUSES = {
  expeditionSpeed: 0.50,      // max 50% speed bonus
  xpBonus: 0.50,             // max 50% XP bonus
  museumIncome: 0.50,         // max 50% museum income bonus
  adBonus: 0.25,              // max 25% from ads
  reputationBonus: 0.50,      // max 50% reputation bonus
  artifactChance: 0.30,       // max 30% artifact chance
};

// ═══════════════════════════════════════════════════════════════════════
// PLAYER PREMIUM STATISTICS
// ═══════════════════════════════════════════════════════════════════════

export interface PremiumStats {
  adsWatched: number;
  starsSpent: number;
  premiumDaysUsed: number;
  totalPurchases: number;
  lifetimeStars: number;
  favoriteCosmetic: string | null;
}

// Helper functions
export function getShopItemById(id: string): ShopItem | undefined {
  return PREMIUM_SHOP_ITEMS.find(item => item.id === id);
}

export function getShopItemsByType(type: ShopItemType): ShopItem[] {
  return PREMIUM_SHOP_ITEMS.filter(item => item.type === type);
}

export function getCosmeticById(id: string): CosmeticFrame | undefined {
  return COSMETIC_FRAMES.find(frame => frame.id === id);
}

export function getBadgeById(id: string): ChatBadge | undefined {
  return CHAT_BADGES.find(badge => badge.id === id);
}
