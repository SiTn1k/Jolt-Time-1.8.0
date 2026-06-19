/**
 * Expedition Sync Service
 * 
 * Syncs expedition state between localStorage (Zustand) and Supabase
 */

import { supabase } from '../lib/supabase';
import { getTelegramUserId } from '../lib/telegram';
import type { Expedition } from './data';

const EXPEDITION_SYNC_KEY = 'expedition_sync_pending';
const SYNC_DEBOUNCE_MS = 2000;

interface ExpeditionStateSnapshot {
  expeditions: Expedition[];
  heroes: unknown[];
  artifacts: unknown[];
  regions: unknown[];
  karbovanets: number;
  reputation: number;
  lastSyncAt: number;
}

class ExpeditionSyncService {
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Save expedition state to Supabase
   */
  async saveExpeditionState(state: ExpeditionStateSnapshot): Promise<boolean> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return false;

    try {
      const snapshot: ExpeditionStateSnapshot = {
        ...state,
        lastSyncAt: Date.now(),
      };

      const { error } = await supabase
        .from('expedition_state')
        .upsert({
          telegram_id: telegramId,
          state_data: snapshot as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'telegram_id',
        });

      if (error) {
        console.error('Failed to save expedition state:', error);
        return false;
      }

      localStorage.removeItem(EXPEDITION_SYNC_KEY);
      return true;
    } catch (e) {
      console.error('Expedition sync error:', e);
      // Store locally for retry
      localStorage.setItem(EXPEDITION_SYNC_KEY, JSON.stringify({
        state,
        timestamp: Date.now(),
      }));
      return false;
    }
  }

  /**
   * Load expedition state from Supabase
   */
  async loadExpeditionState(): Promise<ExpeditionStateSnapshot | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('expedition_state')
        .select('state_data')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load expedition state:', error);
        return null;
      }

      if (!data?.state_data) return null;

      return data.state_data as unknown as ExpeditionStateSnapshot;
    } catch (e) {
      console.error('Expedition load error:', e);
      return null;
    }
  }

  /**
   * Debounced sync - call this on state changes
   */
  debouncedSync(state: ExpeditionStateSnapshot): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.saveExpeditionState(state);
    }, SYNC_DEBOUNCE_MS);
  }

  /**
   * Force immediate sync
   */
  async forceSync(state: ExpeditionStateSnapshot): Promise<boolean> {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    return this.saveExpeditionState(state);
  }

  /**
   * Check if there's a pending sync that failed
   */
  hasPendingSync(): boolean {
    const pending = localStorage.getItem(EXPEDITION_SYNC_KEY);
    if (!pending) return false;

    try {
      const { timestamp } = JSON.parse(pending);
      // Only consider pending if less than 1 hour old
      return Date.now() - timestamp < 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  /**
   * Get pending sync data for retry
   */
  getPendingSyncData(): ExpeditionStateSnapshot | null {
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

// React hook for expedition sync
import { useEffect, useRef, useCallback } from 'react';
import { useExpeditionStore } from './store';

export function useExpeditionSync() {
  const lastSyncRef = useRef<number>(0);
  const expeditionState = useExpeditionStore((s) => s);

  // Initial sync on mount
  useEffect(() => {
    const loadFromServer = async () => {
      const savedState = await expeditionSync.loadExpeditionState();
      if (savedState && savedState.lastSyncAt > lastSyncRef.current) {
        // Server state is newer - restore it
        console.log('Restoring expedition state from server');
        // This would need to be integrated with the store
      }
    };

    loadFromServer();
  }, []);

  // Sync on store changes (debounced)
  const syncToServer = useCallback(() => {
    const state: ExpeditionStateSnapshot = {
      expeditions: expeditionState.expeditions,
      heroes: expeditionState.heroes,
      artifacts: expeditionState.artifacts,
      regions: expeditionState.regions,
      karbovanets: expeditionState.karbovanets,
      reputation: expeditionState.reputation,
      lastSyncAt: Date.now(),
    };

    expeditionSync.debouncedSync(state);
    lastSyncRef.current = Date.now();
  }, [expeditionState]);

  return { syncToServer };
}
