/**
 * Game Data Validation Schemas (Zod)
 *
 * SECURITY: Provides runtime validation for all game data
 * to prevent type corruption and injection attacks.
 */

import { z } from 'zod';

// =====================================================
// CORE TELEGRAM SCHEMAS
// =====================================================

export const TelegramUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
});

export const InitDataSchema = z.object({
  query_id: z.string().optional(),
  user: TelegramUserSchema,
  receiver: TelegramUserSchema.optional(),
  chat: z.object({
    id: z.number(),
    type: z.string(),
  }).optional(),
  chat_instance: z.string().optional(),
  auth_date: z.number().int().positive(),
  hash: z.string().min(1),
});

// =====================================================
// EPOCH SCHEMAS
// =====================================================

export const EpochIdSchema = z.enum([
  'trypillia', 'scythia', 'antiquity', 'kyiv_rus',
  'halych_volhynia', 'polish_lithuanian', 'cossack',
  'hetmanate', 'empire', 'revolution', 'soviet', 'independence'
]);

// =====================================================
// GENERATOR SCHEMAS
// =====================================================

export const OwnedGeneratorSchema = z.object({
  generatorId: z.string(),
  level: z.number().int().min(1)
});

// =====================================================
// DAILY TASK SCHEMAS
// =====================================================

export const DailyCountersSchema = z.object({
  tap: z.number().int().min(0).default(0),
  buy_generator: z.number().int().min(0).default(0),
  open_gacha: z.number().int().min(0).default(0),
  upgrade_tap: z.number().int().min(0).default(0),
  earn_xp: z.number().min(0).default(0)
});

export const DailyTasksStateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskIds: z.array(z.string()),
  counters: DailyCountersSchema,
  claimed: z.array(z.string())
});

// =====================================================
// BOOSTER SCHEMAS
// =====================================================

export const ActiveBoostersSchema = z.object({
  xp_boost_end: z.number().nullable().optional(),
  xp_boost_mult: z.number().min(1).max(10).optional(),
  currency_boost_end: z.number().nullable().optional(),
  currency_boost_mult: z.number().min(1).max(10).optional(),
  super_boost_end: z.number().nullable().optional(),
  super_boost_mult: z.number().min(1).max(10).optional(),
  legendary_next_gacha: z.boolean().optional(),
  offline_boost_end: z.number().nullable().optional()
}).strict();

export const PrestigeResearchSchema = z.object({
  rare_artifact_chance: z.number().int().min(0).max(10).optional(),
  passive_income: z.number().int().min(0).max(10).optional(),
  xp_gain: z.number().int().min(0).max(20).optional()
});

// =====================================================
// DAILY AD VIEWS SCHEMA
// =====================================================

export const DailyAdViewsSchema = z.object({
  energy_ads: z.number().int().min(0).optional(),
  chest_ads: z.number().int().min(0).optional(),
  offline_ads: z.number().int().min(0).optional(),
  session_ads: z.number().int().min(0).optional(),
  last_reset: z.string().optional()
});

// =====================================================
// FULL GAME STATE SCHEMA
// =====================================================

export const GameStateSchema = z.object({
  epochId: EpochIdSchema,
  level: z.number().int().min(1).max(999),
  xp: z.number().min(0),
  xpToNextLevel: z.number().min(1),
  totalXp: z.number().min(0),
  currency: z.number().min(0),
  totalCurrencyEarned: z.number().min(0),
  ownedGenerators: z.array(OwnedGeneratorSchema),
  tapPower: z.number().int().min(1),
  passiveXpPerSecond: z.number().min(0),
  unlockedEpochs: z.array(EpochIdSchema),
  lastSavedAt: z.number(),
  artifactParts: z.record(z.string(), z.number().int().min(0)),
  artifactLevels: z.record(z.string(), z.number().int().min(1).max(4)),
  completedArtifacts: z.array(z.string()),
  artifactDupes: z.record(z.string(), z.number().int().min(0)),
  referrerId: z.number().int().nullable().optional(),
  referralsCount: z.number().int().min(0).default(0),
  referralEarnings: z.number().min(0).default(0),
  activeBoosters: ActiveBoostersSchema,
  dailyStreak: z.number().int().min(0).default(0),
  bestStreak: z.number().int().min(0).default(0),
  lastLoginDate: z.string().nullable(),
  dailyTasksState: DailyTasksStateSchema.nullable(),
  lastCheckIn: z.string().nullable(),
  checkInStreak: z.number().int().min(0).default(0),
  prestigeLevel: z.number().int().min(0).default(0),
  prestigePoints: z.number().min(0).default(0),
  prestigeResearch: PrestigeResearchSchema,
  energy: z.number().int().min(0).max(1000),
  maxEnergy: z.number().int().min(100).max(1000),
  lastOnlineAt: z.number(),
  sessionStartAt: z.number(),
  dailyAdViews: DailyAdViewsSchema
}).strict();

// =====================================================
// HERO & NPC SCHEMAS (for expeditions)
// =====================================================

export const HeroSchema = z.object({
  id: z.string().min(1),
  level: z.number().int().min(0).max(999),
  experience: z.number().int().min(0),
  unlocked: z.boolean(),
});

export const NPCSchema = z.object({
  id: z.string().min(1),
  trust: z.number().min(0).max(100),
  trustLevel: z.number().int().min(0).max(10),
});

export const ExpeditionSchema = z.object({
  id: z.string().min(1),
  heroId: z.string().min(1),
  regionId: z.string().min(1),
  startedAt: z.number().int().positive(),
  completesAt: z.number().int().positive(),
  status: z.enum(['active', 'completed', 'collected']),
  collected: z.boolean(),
});

export const ActiveEffectSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  expiresAt: z.number().int().positive(),
});

// =====================================================
// LEADERBOARD SCHEMA
// =====================================================

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  telegram_id: z.number().int().positive(),
  username: z.string().nullable(),
  first_name: z.string().nullable(),
  level: z.number().int().min(1).max(999),
  total_xp: z.number().min(0),
  prestige_level: z.number().int().min(0),
  referrals_count: z.number().int().min(0)
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { ok: true, data: result.data };
    }
    return { ok: false, error: result.error.message };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function isValidReferralId(id: unknown): id is number {
  if (typeof id !== 'number') return false;
  if (!Number.isInteger(id)) return false;
  if (id < 1 || id > 99999999999) return false;
  return true;
}

export function clampToBounds(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// =====================================================
// TYPE EXPORTS
// =====================================================

export type TelegramUser = z.infer<typeof TelegramUserSchema>;
export type InitData = z.infer<typeof InitDataSchema>;
export type EpochId = z.infer<typeof EpochIdSchema>;
export type OwnedGenerator = z.infer<typeof OwnedGeneratorSchema>;
export type DailyCounters = z.infer<typeof DailyCountersSchema>;
export type DailyTasksState = z.infer<typeof DailyTasksStateSchema>;
export type ActiveBoosters = z.infer<typeof ActiveBoostersSchema>;
export type PrestigeResearch = z.infer<typeof PrestigeResearchSchema>;
export type DailyAdViews = z.infer<typeof DailyAdViewsSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type Hero = z.infer<typeof HeroSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type Expedition = z.infer<typeof ExpeditionSchema>;
export type ActiveEffect = z.infer<typeof ActiveEffectSchema>;
