/**
 * Academy Timeline Sync Service
 * 
 * Syncs Academy Timeline state to Supabase using existing tables:
 * - expedition_state: expeditions, heroes, artifacts
 * - story_progress: NPC relationships, quests
 * - museum_progress: museum exhibitions, upgrades
 * 
 * localStorage (Zustand) remains as cache for fast reads.
 * Supabase is source of truth for cross-device sync.
 */

import { supabase } from '../lib/supabase';
import { getTelegramUserId } from '../lib/telegram';
import type { MuseumState } from './museumData';
import type { StoryProgress } from './storyData';
import type { Hero, Artifact, Region, Expedition, Npc } from './data';

const EXPEDITION_SYNC_KEY = 'academy_sync_pending';
const SYNC_DEBOUNCE_MS = 3000;

interface ExpeditionData {
  academyLevel: number;
  reputation: number;
  karbovanets: number;
  historicalPrestige: number;
  heroes: Hero[];
  artifacts: Artifact[];
  regions: Region[];
  expeditions: Expedition[];
  npcs: Npc[];
  expeditionSlots: number;
  lastTick: number;
  incomeBuffer: number;
  buildingLevels: Record<string, number>;
  buildingUpgradeEndTimes: Record<string, number>;
}

class AcademySyncService {
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Save expedition data to expedition_state table
   */
  async saveExpeditionData(data: ExpeditionData): Promise<boolean> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return false;

    try {
      const { error } = await supabase
        .from('expedition_state')
        .upsert({
          telegram_id: telegramId,
          state_data: {
            academyLevel: data.academyLevel,
            reputation: data.reputation,
            karbovanets: data.karbovanets,
            historicalPrestige: data.historicalPrestige,
            heroes: data.heroes,
            artifacts: data.artifacts,
            regions: data.regions,
            expeditions: data.expeditions,
            npcs: data.npcs,
            expeditionSlots: data.expeditionSlots,
            lastTick: data.lastTick,
            incomeBuffer: data.incomeBuffer,
            buildingLevels: data.buildingLevels,
            buildingUpgradeEndTimes: data.buildingUpgradeEndTimes,
          } as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'telegram_id',
        });

      if (error) {
        console.error('Failed to save expedition data:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Expedition sync error:', e);
      this.queuePendingSync('expedition', data);
      return false;
    }
  }

  /**
   * Load expedition data from expedition_state table
   */
  async loadExpeditionData(): Promise<ExpeditionData | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('expedition_state')
        .select('state_data, updated_at')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load expedition data:', error);
        return null;
      }

      if (!data?.state_data) return null;

      return data.state_data as unknown as ExpeditionData;
    } catch (e) {
      console.error('Expedition load error:', e);
      return null;
    }
  }

  /**
   * Save story/progress data to story_progress table
   */
  async saveStoryData(storyState: StoryProgress): Promise<boolean> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return false;

    try {
      const { error } = await supabase
        .from('story_progress')
        .upsert({
          telegram_id: telegramId,
          current_chapter: storyState.currentChapter,
          completed_chapters: storyState.completedChapters,
          active_quests: storyState.activeQuests,
          completed_quests: storyState.completedQuests,
          npc_relationships: storyState.npcRelationships as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'telegram_id',
        });

      if (error) {
        console.error('Failed to save story data:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Story sync error:', e);
      this.queuePendingSync('story', storyState);
      return false;
    }
  }

  /**
   * Load story data from story_progress table
   */
  async loadStoryData(): Promise<StoryProgress | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('story_progress')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load story data:', error);
        return null;
      }

      if (!data) return null;

      return {
        currentChapter: data.current_chapter,
        completedChapters: data.completed_chapters || [],
        activeQuests: data.active_quests || [],
        completedQuests: data.completed_quests || [],
        npcRelationships: (data.npc_relationships || {}) as Record<string, import('./storyData').NpcRelationship>,
      };
    } catch (e) {
      console.error('Story load error:', e);
      return null;
    }
  }

  /**
   * Save museum data to museum_progress table
   */
  async saveMuseumData(museumState: MuseumState, reputation: number, visitors: number): Promise<boolean> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return false;

    try {
      const { error } = await supabase
        .from('museum_progress')
        .upsert({
          telegram_id: telegramId,
          museum_state: museumState as unknown as Record<string, unknown>,
          reputation: reputation,
          total_visitors: visitors,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'telegram_id',
        });

      if (error) {
        console.error('Failed to save museum data:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Museum sync error:', e);
      this.queuePendingSync('museum', { museumState, reputation, visitors });
      return false;
    }
  }

  /**
   * Load museum data from museum_progress table
   */
  async loadMuseumData(): Promise<{ museumState: MuseumState; reputation: number; totalVisitors: number } | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('museum_progress')
        .select('museum_state, reputation, total_visitors')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load museum data:', error);
        return null;
      }

      if (!data) return null;

      return {
        museumState: data.museum_state as unknown as MuseumState,
        reputation: data.reputation || 0,
        totalVisitors: data.total_visitors || 0,
      };
    } catch (e) {
      console.error('Museum load error:', e);
      return null;
    }
  }

  /**
   * Queue failed sync for retry
   */
  private queuePendingSync(type: string, data: unknown): void {
    localStorage.setItem(EXPEDITION_SYNC_KEY, JSON.stringify({
      type,
      data,
      timestamp: Date.now(),
    }));
  }

  /**
   * Debounced sync all Academy data
   */
  debouncedFullSync(expeditionData: ExpeditionData, storyData: StoryProgress, museumState: MuseumState, museumRep: number, museumVis: number): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(async () => {
      await Promise.all([
        this.saveExpeditionData(expeditionData),
        this.saveStoryData(storyData),
        this.saveMuseumData(museumState, museumRep, museumVis),
      ]);
      localStorage.removeItem(EXPEDITION_SYNC_KEY);
    }, SYNC_DEBOUNCE_MS);
  }

  /**
   * Force immediate full sync
   */
  async forceFullSync(expeditionData: ExpeditionData, storyData: StoryProgress, museumState: MuseumState, museumRep: number, museumVis: number): Promise<void> {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    await Promise.all([
      this.saveExpeditionData(expeditionData),
      this.saveStoryData(storyData),
      this.saveMuseumData(museumState, museumRep, museumVis),
    ]);
  }

  /**
   * Check if there's a pending sync
   */
  hasPendingSync(): boolean {
    const pending = localStorage.getItem(EXPEDITION_SYNC_KEY);
    if (!pending) return false;

    try {
      const { timestamp } = JSON.parse(pending);
      return Date.now() - timestamp < 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  /**
   * Retry pending sync
   */
  async retryPendingSync(): Promise<boolean> {
    const pending = localStorage.getItem(EXPEDITION_SYNC_KEY);
    if (!pending) return true;

    try {
      const { type, data, timestamp } = JSON.parse(pending);
      
      // Only retry if less than 1 hour old
      if (Date.now() - timestamp > 60 * 60 * 1000) {
        localStorage.removeItem(EXPEDITION_SYNC_KEY);
        return true;
      }

      switch (type) {
        case 'expedition':
          return await this.saveExpeditionData(data as ExpeditionData);
        case 'story':
          return await this.saveStoryData(data as StoryProgress);
        case 'museum':
          const mData = data as { museumState: MuseumState; reputation: number; visitors: number };
          return await this.saveMuseumData(mData.museumState, mData.reputation, mData.visitors);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const academySync = new AcademySyncService();

// React hook for Academy Timeline sync
import { useEffect, useCallback, useRef } from 'react';
import { useExpeditionStore } from './store';

export function useAcademySync() {
  const store = useExpeditionStore((s) => s);
  const hasHydrated = useRef(false);

  // Initial load from Supabase on mount
  useEffect(() => {
    const loadFromServer = async () => {
      if (hasHydrated.current) return;
      
      const [expeditionData, storyData, museumData] = await Promise.all([
        academySync.loadExpeditionData(),
        academySync.loadStoryData(),
        academySync.loadMuseumData(),
      ]);

      // Apply expedition data to store
      if (expeditionData) {
        const updates: Partial<ReturnType<typeof useExpeditionStore.getState>> = {};
        if (expeditionData.academyLevel !== undefined) updates.academyLevel = expeditionData.academyLevel;
        if (expeditionData.reputation !== undefined) updates.reputation = expeditionData.reputation;
        if (expeditionData.karbovanets !== undefined) updates.karbovanets = expeditionData.karbovanets;
        if (expeditionData.historicalPrestige !== undefined) updates.historicalPrestige = expeditionData.historicalPrestige;
        if (expeditionData.heroes?.length) updates.heroes = expeditionData.heroes;
        if (expeditionData.artifacts?.length) updates.artifacts = expeditionData.artifacts;
        if (expeditionData.regions?.length) updates.regions = expeditionData.regions;
        if (expeditionData.expeditions?.length) updates.expeditions = expeditionData.expeditions;
        if (expeditionData.npcs?.length) updates.npcs = expeditionData.npcs;
        if (expeditionData.expeditionSlots !== undefined) updates.expeditionSlots = expeditionData.expeditionSlots;
        if (expeditionData.lastTick !== undefined) updates.lastTick = expeditionData.lastTick;
        if (expeditionData.incomeBuffer !== undefined) updates.incomeBuffer = expeditionData.incomeBuffer;
        if (expeditionData.buildingLevels) updates.buildingLevels = expeditionData.buildingLevels;
        if (expeditionData.buildingUpgradeEndTimes) updates.buildingUpgradeEndTimes = expeditionData.buildingUpgradeEndTimes;
        useExpeditionStore.setState(updates);
      }

      // Apply story data to store
      if (storyData) {
        useExpeditionStore.setState({ storyState: storyData });
      }

      // Apply museum data to store
      if (museumData) {
        const updates: Partial<ReturnType<typeof useExpeditionStore.getState>> = {};
        if (museumData.museumState) updates.museumState = museumData.museumState;
        if (museumData.reputation !== undefined) updates.reputation = museumData.reputation;
        if (museumData.totalVisitors !== undefined) updates.museumVisitors = museumData.totalVisitors;
        useExpeditionStore.setState(updates);
      }

      hasHydrated.current = true;
      console.log('Academy data hydrated from Supabase');
    };

    loadFromServer();
    academySync.retryPendingSync();
  }, []);

  // Sync to Supabase on store changes
  const syncToServer = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AcademySync] Syncing to server...');
    }
    
    const expeditionData: ExpeditionData = {
      academyLevel: store.academyLevel,
      reputation: store.reputation,
      karbovanets: store.karbovanets,
      historicalPrestige: store.historicalPrestige,
      heroes: store.heroes,
      artifacts: store.artifacts,
      regions: store.regions,
      expeditions: store.expeditions,
      npcs: store.npcs,
      expeditionSlots: store.expeditionSlots,
      lastTick: store.lastTick,
      incomeBuffer: store.incomeBuffer,
      buildingLevels: store.buildingLevels,
      buildingUpgradeEndTimes: store.buildingUpgradeEndTimes,
    };

    academySync.debouncedFullSync(
      expeditionData,
      store.storyState,
      store.museumState,
      store.reputation,
      store.museumVisitors,
    );
  }, [store]);

  // Subscribe to store changes and trigger sync on significant actions
  useEffect(() => {
    const unsubscribe = useExpeditionStore.subscribe(
      (state, prevState) => {
        // Check for significant changes that warrant immediate sync
        const significantChanges = [
          // Quest completion
          state.storyState.completedQuests.length !== prevState.storyState.completedQuests.length,
          // NPC interaction
          state.storyState.npcRelationships !== prevState.storyState.npcRelationships,
          // Building upgrade
          JSON.stringify(state.buildingLevels) !== JSON.stringify(prevState.buildingLevels),
          JSON.stringify(state.buildingUpgradeEndTimes) !== JSON.stringify(prevState.buildingUpgradeEndTimes),
          // Museum changes
          JSON.stringify(state.museumState) !== JSON.stringify(prevState.museumState),
          // Expedition completion
          state.expeditions.length !== prevState.expeditions.length,
          // Hero progression
          state.heroes.length !== prevState.heroes.length,
          // Currency changes (only sync on significant amounts)
          Math.abs(state.karbovanets - prevState.karbovanets) > 100,
        ];

        if (significantChanges.some(Boolean)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[AcademySync] Significant change detected, triggering sync');
          }
          syncToServer();
        }
      }
    );

    return unsubscribe;
  }, [syncToServer]);

  return { syncToServer };
}

// Export old name for backward compatibility
export const useExpeditionSync = useAcademySync;
