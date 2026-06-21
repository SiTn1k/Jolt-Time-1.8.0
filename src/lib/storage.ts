import { supabase } from './supabase';
import { GameState, EpochId, OwnedGenerator, LeaderboardEntry, ActiveBoosters, PrestigeResearch, DailyAdViews, Epoch } from '../types/game';
import { getTelegramUserId, getTelegramUserInfo, getReferrerId } from './telegram';
import { getCurrentEpochByLevel, EPOCHS } from '../data/epochs';
import { generateUUID } from './cryptoUtils';
import { 
  GameStateSchema, 
  ActiveBoostersSchema, 
  LeaderboardEntrySchema,
} from '../schemas/game';
import { validateReferrerId, verifyReferrerExists } from './referralValidation';

const LOCAL_STORAGE_KEY = 'ukraine_tap_game_state';
const DEVICE_ID_KEY = 'ukraine_tap_device_id';

export const REFERRER_BONUS = 100;
export const NEW_USER_BONUS = 50;

// Offline income caps
export const OFFLINE_CAP_PRESTIGE_0 = 8 * 3600; // 8 hours in seconds
export const OFFLINE_CAP_PRESTIGE_1 = 6 * 3600; // 6 hours in seconds

// Ensure unlockedEpochs includes all epochs the player has reached
function fixUnlockedEpochs(saved: EpochId[], level: number, currentEpochId: EpochId): EpochId[] {
  const result = new Set<EpochId>(saved);
  result.add(currentEpochId);
  for (const epoch of EPOCHS) {
    if (epoch.unlockLevel <= level) {
      result.add(epoch.id as EpochId);
    }
  }
  return [...result];
}

function calculateXpToLevel(level: number): number {
  const epoch = getCurrentEpochByLevel(level);
  const { min, max } = epoch.levelRange;
  const rangeSize = Math.max(1, max - min + 1);
  const progress = Math.min(1, Math.max(0, (level - min) / rangeSize));

  const epochIndex = EPOCHS.findIndex(e => e.id === epoch.id);
  let minSeconds: number;
  let maxSeconds: number;

  if (epochIndex === 0) {
    minSeconds = 60;
    maxSeconds = 300;
  } else if (epochIndex === 1) {
    minSeconds = 60;
    maxSeconds = 480;
  } else if (epochIndex === 2) {
    minSeconds = 120;
    maxSeconds = 900;
  } else {
    minSeconds = 120 + (epochIndex - 3) * 60;
    maxSeconds = 1800 + (epochIndex - 3) * 600;
  }

  const targetSeconds = minSeconds + progress * (maxSeconds - minSeconds);
  const levelInEpoch = Math.max(1, level - min + 1);
  const estimatedPassive = estimatePassiveForEpoch(epoch, levelInEpoch);
  return Math.max(50, Math.floor(estimatedPassive * targetSeconds));
}

function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number {
  const tierWeights = [1, 0.5, 0.25, 0.1, 0.03];
  let total = 0;
  for (let i = 0; i < epoch.generators.length && i < tierWeights.length; i++) {
    const g = epoch.generators[i];
    const owned = Math.max(1, Math.floor(levelInEpoch * tierWeights[i]));
    total += g.baseProduction * owned;
  }
  return Math.max(1, total);
}

function ensureJson<T>(value: T | string): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { /* return original on parse error */ }
  }
  return value as T;
}

function sanitizeId(value: number | null | undefined): number | null {
  return value && value > 0 ? value : null;
}

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export { getTelegramUserId, getTelegramUserInfo, getReferrerId } from './telegram';

export function saveLocalState(state: GameState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...state,
      lastSavedAt: Date.now(),
    }));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }
}

export async function saveRemoteState(state: GameState): Promise<void> {
  if (!supabase) return;

  const telegramId = getTelegramUserId();
  const userInfo = getTelegramUserInfo();
  const deviceId = getDeviceId();

  const boostersWithDaily: ActiveBoosters = {
    ...state.activeBoosters,
    _daily: {
      streak: state.dailyStreak || 0,
      best: state.bestStreak || 0,
      lastDate: state.lastLoginDate || null,
      tasks: state.dailyTasksState || null,
    },
  };

  const payload = {
    epoch_id: state.epochId,
    level: state.level,
    xp: state.xp,
    xp_to_next_level: state.xpToNextLevel,
    total_xp: state.totalXp,
    currency: state.currency,
    total_currency_earned: state.totalCurrencyEarned,
    tap_power: state.tapPower,
    passive_xp_per_second: state.passiveXpPerSecond,
    owned_generators: ensureJson(state.ownedGenerators) as OwnedGenerator[],
    unlocked_epochs: ensureJson(state.unlockedEpochs) as string[],
    artifact_parts: ensureJson(state.artifactParts || {}) as Record<string, number>,
    artifact_levels: ensureJson(state.artifactLevels || {}) as Record<string, number>,
    completed_artifacts: ensureJson(state.completedArtifacts || []) as string[],
    artifact_dupes: ensureJson(state.artifactDupes || {}) as Record<string, number>,
    referrer_id: sanitizeId(state.referrerId),
    referrals_count: state.referralsCount || 0,
    referral_earnings: state.referralEarnings || 0,
    username: userInfo?.username || null,
    first_name: userInfo?.first_name || null,
    photo_url: userInfo?.photo_url || null,
    last_saved_at: new Date().toISOString(),
    active_boosters: boostersWithDaily,
    last_check_in: state.lastCheckIn || null,
    current_streak: state.checkInStreak || 0,
    // Phase 2 fields
    prestige_level: state.prestigeLevel || 0,
    prestige_points: state.prestigePoints || 0,
    prestige_research: ensureJson(state.prestigeResearch || {}) as PrestigeResearch,
    energy: state.energy ?? 1000,
    max_energy: state.maxEnergy ?? 1000,
    last_online_at: new Date().toISOString(),
    session_start_at: new Date(state.sessionStartAt || Date.now()).toISOString(),
    daily_ad_views: ensureJson(state.dailyAdViews || {}) as DailyAdViews,
  };

  try {
    if (telegramId) {
      const { error } = await supabase
        .from('game_progress')
        .upsert({ ...payload, telegram_id: telegramId }, { onConflict: 'telegram_id' });
      if (error) throw error;

      await supabase
        .from('game_progress')
        .delete()
        .eq('device_id', deviceId)
        .is('telegram_id', null);
    } else {
      const { data: existing } = await supabase
        .from('game_progress')
        .select('id')
        .eq('device_id', deviceId)
        .is('telegram_id', null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('game_progress')
          .update(payload)
          .eq('device_id', deviceId)
          .is('telegram_id', null);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('game_progress')
          .insert({ ...payload, device_id: deviceId });
        if (error) throw error;
      }
    }
  } catch (e) {
    console.error('Supabase save failed:', e);
  }
}

export async function loadGameState(): Promise<GameState | null> {
  const telegramId = getTelegramUserId();
  const referrerId = getReferrerId();
  const deviceId = getDeviceId();

  if (supabase) {
    try {
      const { data } = telegramId
        ? await supabase
            .from('game_progress')
            .select('*')
            .eq('telegram_id', telegramId)
            .maybeSingle()
        : await supabase
            .from('game_progress')
            .select('*')
            .eq('device_id', deviceId)
            .is('telegram_id', null)
            .maybeSingle();

      if (data) {
        if (telegramId) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        return hydrateFromDb(data);
      }

      if (telegramId) {
        const userInfo = getTelegramUserInfo();
        let bonus = 20;
        let validReferrerId: number | null = null;

        // SECURITY: Validate referrer ID before processing
        if (referrerId) {
          const validation = validateReferrerId(referrerId);
          if (validation.valid && validation.referrerId !== null && validation.referrerId !== telegramId) {
            // Verify referrer exists in database
            const exists = await verifyReferrerExists(supabase, validation.referrerId);
            if (exists) {
              validReferrerId = validation.referrerId;
              await applyReferralBonus(telegramId, validReferrerId);
              bonus = 20 + NEW_USER_BONUS;
            } else {
              console.warn('Referrer does not exist:', validation.referrerId);
            }
          } else if (!validation.valid) {
            console.warn('Invalid referrer ID:', validation.error);
          } else if (validation.referrerId === telegramId) {
            console.warn('Self-referral blocked');
          }
        }

        const newRow = {
          telegram_id: telegramId,
          epoch_id: 'trypillia',
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          total_xp: 0,
          currency: bonus,
          total_currency_earned: bonus,
          tap_power: 1,
          passive_xp_per_second: 0,
          owned_generators: [],
          unlocked_epochs: ['trypillia'],
          artifact_parts: {},
          artifact_levels: {},
          completed_artifacts: [],
          artifact_dupes: {},
          referrer_id: validReferrerId,
          referrals_count: 0,
          referral_earnings: 0,
          active_boosters: {},
          username: userInfo?.username ?? null,
          first_name: userInfo?.first_name ?? null,
          photo_url: userInfo?.photo_url ?? null,
          last_saved_at: new Date().toISOString(),
          prestige_level: 0,
          prestige_points: 0,
          prestige_research: {},
          energy: 1000,
          max_energy: 1000,
          last_online_at: new Date().toISOString(),
          session_start_at: new Date().toISOString(),
          daily_ad_views: {},
        };

        const { error } = await supabase.from('game_progress').insert(newRow);
        if (error) console.error('New user insert failed:', error);

        const hasRef = validReferrerId !== null;
        return {
          epochId: 'trypillia',
          level: 1,
          xp: 0,
          xpToNextLevel: calculateXpToLevel(1),
          totalXp: 0,
          currency: bonus,
          totalCurrencyEarned: bonus,
          tapPower: 1,
          passiveXpPerSecond: 0,
          ownedGenerators: [],
          unlockedEpochs: ['trypillia'],
          artifactParts: {},
          artifactLevels: {},
          completedArtifacts: [],
          artifactDupes: {},
          lastSavedAt: Date.now(),
          referrerId: hasRef ? sanitizeId(referrerId) : null,
          referralsCount: 0,
          referralEarnings: 0,
          activeBoosters: {},
          dailyStreak: 0,
          bestStreak: 0,
          lastLoginDate: null,
          dailyTasksState: null,
          lastCheckIn: null,
          checkInStreak: 0,
          prestigeLevel: 0,
          prestigePoints: 0,
          prestigeResearch: {},
          energy: 1000,
          maxEnergy: 1000,
          lastOnlineAt: Date.now(),
          sessionStartAt: Date.now(),
          lastSessionAdAt: 0,
          dailyAdViews: {},
        };
      }
    } catch (e) {
      console.error('Supabase load failed:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return sanitizeLoadedState(parsed);
  } catch (e) {
    console.error('localStorage load failed:', e);
    return null;
  }
}

function hydrateFromDb(data: Record<string, unknown>): GameState {
  // Map DB snake_case to camelCase for Zod validation
  const mapped = {
    epochId: data.epoch_id,
    level: data.level,
    xp: data.xp,
    xpToNextLevel: data.xp_to_next_level,
    totalXp: data.total_xp,
    currency: data.currency,
    totalCurrencyEarned: data.total_currency_earned,
    ownedGenerators: data.owned_generators || [],
    tapPower: data.tap_power,
    passiveXpPerSecond: data.passive_xp_per_second || 0,
    unlockedEpochs: data.unlocked_epochs || ['trypillia'],
    lastSavedAt: data.last_saved_at ? new Date(data.last_saved_at as string).getTime() : Date.now(),
    artifactParts: data.artifact_parts || {},
    artifactLevels: data.artifact_levels || {},
    completedArtifacts: data.completed_artifacts || [],
    artifactDupes: data.artifact_dupes || {},
    referrerId: data.referrer_id,
    referralsCount: data.referrals_count || 0,
    referralEarnings: data.referral_earnings || 0,
    activeBoosters: data.active_boosters || {},
    dailyStreak: (data.active_boosters as ActiveBoosters)?._daily?.streak || 0,
    bestStreak: (data.active_boosters as ActiveBoosters)?._daily?.best || 0,
    lastLoginDate: (data.active_boosters as ActiveBoosters)?._daily?.lastDate || null,
    dailyTasksState: (data.active_boosters as ActiveBoosters)?._daily?.tasks || null,
    lastCheckIn: data.last_check_in || null,
    checkInStreak: data.current_streak || 0,
    prestigeLevel: data.prestige_level || 0,
    prestigePoints: data.prestige_points || 0,
    prestigeResearch: data.prestige_research || {},
    energy: data.energy ?? 1000,
    maxEnergy: data.max_energy ?? 1000,
    lastOnlineAt: data.last_online_at ? new Date(data.last_online_at as string).getTime() : Date.now(),
    sessionStartAt: data.session_start_at ? new Date(data.session_start_at as string).getTime() : Date.now(),
    lastSessionAdAt: data.last_session_ad_at ? new Date(data.last_session_ad_at as string).getTime() : 0,
    dailyAdViews: data.daily_ad_views || {},
  };

  // Validate with Zod
  const parseResult = GameStateSchema.safeParse(mapped);

  if (!parseResult.success) {
    console.error('Invalid game state from DB:', parseResult.error.issues);
    // Return initial state instead of crashing
    return getInitialState();
  }

  // Fix unlocked epochs
  const level = parseResult.data.level || 1;
  const epochId = parseResult.data.epochId || 'trypillia';

  return {
    ...parseResult.data,
    unlockedEpochs: fixUnlockedEpochs(
      parseResult.data.unlockedEpochs as EpochId[],
      level,
      epochId
    ),
    lastSavedAt: Number.isFinite(parseResult.data.lastSavedAt) ? parseResult.data.lastSavedAt : Date.now(),
    lastOnlineAt: Number.isFinite(parseResult.data.lastOnlineAt) ? parseResult.data.lastOnlineAt : Date.now(),
    sessionStartAt: Number.isFinite(parseResult.data.sessionStartAt) ? parseResult.data.sessionStartAt : Date.now(),
  };
}

function getInitialState(): GameState {
  return {
    epochId: 'trypillia',
    level: 1,
    xp: 0,
    xpToNextLevel: calculateXpToLevel(1),
    totalXp: 0,
    currency: 20,
    totalCurrencyEarned: 20,
    tapPower: 1,
    passiveXpPerSecond: 0,
    ownedGenerators: [],
    unlockedEpochs: ['trypillia'],
    lastSavedAt: Date.now(),
    artifactParts: {},
    artifactLevels: {},
    completedArtifacts: [],
    artifactDupes: {},
    referralsCount: 0,
    referralEarnings: 0,
    activeBoosters: {},
    dailyStreak: 0,
    bestStreak: 0,
    lastLoginDate: null,
    dailyTasksState: null,
    lastCheckIn: null,
    checkInStreak: 0,
    prestigeLevel: 0,
    prestigePoints: 0,
    prestigeResearch: {},
    energy: 1000,
    maxEnergy: 1000,
    lastOnlineAt: Date.now(),
    sessionStartAt: Date.now(),
    lastSessionAdAt: 0,
    dailyAdViews: {},
  };
}

function sanitizeLoadedState(parsed: GameState): GameState {
  const rawBoosters = parsed.activeBoosters || {};
  const daily = rawBoosters._daily;
  const { _daily: _ignored, ...cleanBoosters } = rawBoosters;
  void _ignored;

  return {
    ...parsed,
    artifactParts: parsed.artifactParts || {},
    artifactLevels: parsed.artifactLevels || {},
    completedArtifacts: parsed.completedArtifacts || [],
    artifactDupes: parsed.artifactDupes || {},
    referrerId: sanitizeId(parsed.referrerId),
    referralsCount: parsed.referralsCount || 0,
    referralEarnings: parsed.referralEarnings || 0,
    activeBoosters: cleanBoosters,
    lastSavedAt: Number.isFinite(parsed.lastSavedAt) ? parsed.lastSavedAt : Date.now(),
    dailyStreak: parsed.dailyStreak || daily?.streak || 0,
    bestStreak: parsed.bestStreak || daily?.best || 0,
    lastLoginDate: parsed.lastLoginDate || daily?.lastDate || null,
    dailyTasksState: parsed.dailyTasksState || daily?.tasks || null,
    // Phase 2 defaults
    prestigeLevel: parsed.prestigeLevel || 0,
    prestigePoints: parsed.prestigePoints || 0,
    prestigeResearch: parsed.prestigeResearch || {},
    energy: parsed.energy ?? 1000,
    maxEnergy: parsed.maxEnergy ?? 1000,
    lastOnlineAt: parsed.lastOnlineAt || Date.now(),
    sessionStartAt: parsed.sessionStartAt || Date.now(),
    dailyAdViews: parsed.dailyAdViews || {},
  };
}

async function applyReferralBonus(_newUserId: number, referrerId: number): Promise<void> {
  if (!supabase) return;

  const { error: e1 } = await supabase
    .from('game_progress')
    .update({
      currency: supabase.rpc('increment_currency', { amount: REFERRER_BONUS }),
      total_currency_earned: supabase.rpc('increment_currency', { amount: REFERRER_BONUS }),
      referrals_count: supabase.rpc('increment_referrals'),
      referral_earnings: supabase.rpc('increment_earnings', { amount: REFERRER_BONUS }),
    })
    .eq('telegram_id', referrerId);
  if (e1) console.error('Failed to apply referral bonus:', e1);
}

// =====================================================
// LEADERBOARD - Optimized with materialized view
// See optimized functions below
// =====================================================

export async function fetchActiveBoosters(telegramId: number): Promise<ActiveBoosters> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('game_progress')
      .select('active_boosters')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (error) {
      console.error('fetchActiveBoosters error:', error);
      return {};
    }

    const raw = (data?.active_boosters as ActiveBoosters) || {};
    const { _daily: _ignored, ...cleanBoosters } = raw;
    void _ignored;

    // Validate with Zod
    const parseResult = ActiveBoostersSchema.safeParse(cleanBoosters);

    if (!parseResult.success) {
      console.error('Invalid boosters from DB:', parseResult.error.issues);
      return {};
    }

    return parseResult.data;
  } catch (e) {
    console.error('fetchActiveBoosters failed:', e);
    return {};
  }
}

export function calculateOfflineCap(prestigeLevel: number): number {
  return prestigeLevel > 0 ? OFFLINE_CAP_PRESTIGE_1 : OFFLINE_CAP_PRESTIGE_0;
}

// =====================================================
// SERVER TIME - Prevent client clock manipulation
// =====================================================

const serverTimeCache = {
  time: 0,
  fetchedAt: 0,
  ttl: 30000, // 30 seconds cache
};

export async function getServerTime(): Promise<number> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (now - serverTimeCache.fetchedAt < serverTimeCache.ttl && serverTimeCache.time > 0) {
    return serverTimeCache.time;
  }

  if (!supabase) return now;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-server-time`
    );
    
    if (!response.ok) {
      console.error('Server time fetch failed:', response.status);
      return serverTimeCache.time > 0 ? serverTimeCache.time : now;
    }

    const data = await response.json();
    
    if (data.server_time && typeof data.server_time === 'number') {
      serverTimeCache.time = data.server_time;
      serverTimeCache.fetchedAt = now;
      return data.server_time;
    }
    
    return serverTimeCache.time > 0 ? serverTimeCache.time : now;
  } catch (error) {
    console.error('Failed to get server time:', error);
    return serverTimeCache.time > 0 ? serverTimeCache.time : now;
  }
}

// =====================================================
// LEADERBOARD - Optimized with materialized view
// =====================================================

const LEADERBOARD_CACHE_KEY = 'ukraine_tap_leaderboard_cache';
const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedLeaderboard {
  data: LeaderboardEntry[];
  timestamp: number;
  totalCount: number;
}

function getCachedLeaderboard(): CachedLeaderboard | null {
  try {
    const cached = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as CachedLeaderboard;
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setCachedLeaderboard(data: LeaderboardEntry[], totalCount: number): void {
  try {
    localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
      totalCount,
    }));
  } catch {
    // Ignore cache errors
  }
}

export async function getLeaderboard(limit = 50, forceRefresh = false): Promise<LeaderboardEntry[]> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedLeaderboard();
    if (cached && Date.now() - cached.timestamp < LEADERBOARD_CACHE_TTL) {
      return cached.data.slice(0, limit);
    }
  }

  if (!supabase) return [];
  
  try {
    // Use RPC for optimized query
    const { data, error } = await supabase.rpc('get_leaderboard_top', { p_limit: limit });

    if (error) {
      console.error('Leaderboard fetch error:', error);
      // Fallback to cached data if available
      const cached = getCachedLeaderboard();
      return cached?.data.slice(0, limit) || [];
    }

    // Validate entries with Zod
    const entries: LeaderboardEntry[] = [];
    for (const row of data || []) {
      const parseResult = LeaderboardEntrySchema.safeParse({
        rank: row.rank,
        telegram_id: row.telegram_id,
        first_name: row.first_name,
        username: row.username,
        level: row.level,
        total_xp: row.total_xp,
        prestige_level: row.prestige_level || 0,
        referrals_count: row.referrals_count || 0,
      });

      if (parseResult.success) {
        entries.push(parseResult.data);
      }
    }

    // Get total count
    const { data: countData } = await supabase.rpc('get_leaderboard_count');
    const totalCount = countData || entries.length;

    // Cache the results
    setCachedLeaderboard(entries, totalCount);

    return entries;
  } catch (e) {
    console.error('Leaderboard fetch failed:', e);
    return [];
  }
}

export async function getUserRank(telegramId: number): Promise<number | null> {
  if (!supabase) return null;
  
  try {
    // Use RPC for optimized rank lookup
    const { data, error } = await supabase.rpc('get_user_rank', { p_telegram_id: telegramId });

    if (error) {
      console.error('User rank fetch error:', error);
      return null;
    }

    return typeof data === 'number' ? data : null;
  } catch (e) {
    console.error('User rank fetch failed:', e);
    return null;
  }
}
