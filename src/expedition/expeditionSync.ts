/**
 * Expedition Sync Service
 * 
 * Syncs all game state between localStorage (Zustand) and Supabase
 * - Expeditions
 * - Museum state
 * - Story/Quest state
 * - Hero progress
 * - Artifact progress
 */

import { supabase } from '../lib/supabase';
import { getTelegramUserId } from '../lib/telegram';
import type { Expedition } from './data';
import type { MuseumState } from './museumData';
import type { StoryProgress } from './storyData';

const EXPEDITION_SYNC_KEY = 'game_state_sync_pending';
const SYNC_DEBOUNCE_MS = 2000;

interface GameStateSnapshot {
  // Core game state
  expeditions: Expedition[];
  heroes: unknown[];
  artifacts: unknown[];
  regions: unknown[];
  karbovanets: number;
  reputation: number;
  historicalPrestige: number;
  museumVisitors: number;
  
  // Museum state
  museumState: MuseumState;
  
  // Story/Quest state  
  storyState: StoryProgress;
  
  // Metadata
  lastSyncAt: number;
}

class ExpeditionSyncService {
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Save full game state to Supabase
   */
  async saveGameState(state: GameStateSnapshot): Promise<boolean> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return false;

    try {
      const snapshot: GameStateSnapshot = {
        ...state,
        lastSyncAt: Date.now(),
      };

      const { error } = await supabase
        .from('game_state')
        .upsert({
          telegram_id: telegramId,
          state_data: snapshot as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'telegram_id',
        });

      if (error) {
        console.error('Failed to save game state:', error);
        return false;
      }

      localStorage.removeItem(EXPEDITION_SYNC_KEY);
      return true;
    } catch (e) {
      console.error('Game state sync error:', e);
      // Store locally for retry
      localStorage.setItem(EXPEDITION_SYNC_KEY, JSON.stringify({
        state,
        timestamp: Date.now(),
      }));
      return false;
    }
  }

  /**
   * Load full game state from Supabase
   */
  async loadGameState(): Promise<GameStateSnapshot | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('game_state')
        .select('state_data')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load game state:', error);
        return null;
      }

      if (!data?.state_data) return null;

      return data.state_data as unknown as GameStateSnapshot;
    } catch (e) {
      console.error('Game state load error:', e);
      return null;
    }
  }

  /**
   * Debounced sync - call this on state changes
   */
  debouncedSync(state: GameStateSnapshot): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.saveGameState(state);
    }, SYNC_DEBOUNCE_MS);
  }

  /**
   * Force immediate sync
   */
  async forceSync(state: GameStateSnapshot): Promise<boolean> {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    return this.saveGameState(state);
  }

  /**
   * Check if there's a pending sync that failed
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
   * Get pending sync data for retry
   */
  getPendingSyncData(): GameStateSnapshot | null {
    const pending = localStorage.getItem(EXPEDITION_SYNC_KEY);
    if (!pending) return null;

    try {
      const { state } = JSON.parse(pending);
      return state;
    } catch {
      return null;
    }
  }

  /**
   * Clear pending sync
   */
  clearPendingSync(): void {
    localStorage.removeItem(EXPEDITION_SYNC_KEY);
  }
}

// Singleton instance
export const expeditionSync = new ExpeditionSyncService();

// React hook for game state sync
import { useEffect, useRef, useCallback } from 'react';
import { useExpeditionStore } from './store';

export function useExpeditionSync() {
  const lastSyncRef = useRef<number>(0);
  const expeditionState = useExpeditionStore((s) => s);

  // Initial sync on mount
  useEffect(() => {
    const loadFromServer = async () => {
      const savedState = await expeditionSync.loadGameState();
      if (savedState && savedState.lastSyncAt > lastSyncRef.current) {
        console.log('Restoring game state from server');
        // Note: Store restoration would be done via store hydration
        // For now, server state is loaded but localStorage takes precedence
      }
    };

    loadFromServer();
  }, []);

  // Sync on store changes (debounced)
  const syncToServer = useCallback(() => {
    const state: GameStateSnapshot = {
      expeditions: expeditionState.expeditions,
      heroes: expeditionState.heroes,
      artifacts: expeditionState.artifacts,
      regions: expeditionState.regions,
      karbovanets: expeditionState.karbovanets,
      reputation: expeditionState.reputation,
      historicalPrestige: expeditionState.historicalPrestige,
      museumVisitors: expeditionState.museumVisitors,
      museumState: expeditionState.museumState,
      storyState: expeditionState.storyState,
      lastSyncAt: Date.now(),
    };

    expeditionSync.debouncedSync(state);
    lastSyncRef.current = Date.now();
  }, [expeditionState]);

  return { syncToServer };
}
