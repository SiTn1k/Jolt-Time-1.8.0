/**
 * Game Data Validation Schemas (Zod)
 * 
 * SECURITY: Provides runtime validation for all game data
 * to prevent type corruption and injection attacks.
 */

import { z } from 'zod';

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

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  telegram_id: z.number().int().positive(),
  username: z.string().nullable(),
  first_name: z.string().nullable(),
  level: z.number().int().min(1).max(999),
  total_xp: z.number().int().min(0),
  prestige_level: z.number().int().min(0),
  referrals_count: z.number().int().min(0),
});

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

export type TelegramUser = z.infer<typeof TelegramUserSchema>;
export type InitData = z.infer<typeof InitDataSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type Hero = z.infer<typeof HeroSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type Expedition = z.infer<typeof ExpeditionSchema>;
export type ActiveEffect = z.infer<typeof ActiveEffectSchema>;
