// ═══════════════════════════════════════════════════════════════════════
// CLOUD SAVE HOOK
// Auto-save and load functionality
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useExpeditionStore } from '../store';

const SAVE_INTERVAL = 60000; // 60 seconds
const DEBOUNCE_DELAY = 5000; // 5 seconds debounce

interface CloudSaveMetadata {
  saveVersion: number;
  contentVersion: number;
  savedAt: string;
  deviceId: string;
  platform: string;
  migrationPerformed: boolean;
}

interface CloudSaveResult {
  success: boolean;
  hasCloudSave: boolean;
  saveData?: Record<string, unknown>;
  metadata?: CloudSaveMetadata;
}

/**
 * Hook for cloud save functionality
 */
export function useCloudSave() {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Get store state for saving
  const getStoreState = useExpeditionStore((state) => ({
    academyLevel: state.academyLevel,
    reputation: state.reputation,
    karbovanets: state.karbovanets,
    historicalPrestige: state.historicalPrestige,
    starsBalance: state.starsBalance,
    expeditionBoosts: state.expeditionBoosts,
    premiumTickets: state.premiumTickets,
    heroes: state.heroes,
    artifacts: state.artifacts,
    regions: state.regions,
    expeditions: state.expeditions,
    npcs: state.npcs,
    museumState: state.museumState,
    storyState: state.storyState,
    buildingLevels: state.buildingLevels,
    ownedCosmetics: state.ownedCosmetics,
    ownedBadges: state.ownedBadges,
    activeEffects: state.activeEffects,
    adsWatched: state.adsWatched,
    totalStarsSpent: state.totalStarsSpent,
  }));

  const setStoreState = useExpeditionStore((state) => state.setState);

  /**
   * Save game to cloud
   */
  const saveGame = useCallback(async (showToast = false) => {
    const now = Date.now();
    
    if (now - lastSaveRef.current < DEBOUNCE_DELAY) {
      return { success: false, reason: 'debounced' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, reason: 'not_authenticated' };
      }

      const saveData = getStoreState();
      const deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
      
      localStorage.setItem('device_id', deviceId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-game`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.session?.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            saveData,
            deviceId,
            platform: 'telegram',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      lastSaveRef.current = Date.now();
      
      if (showToast) {
        console.log('Game saved to cloud');
      }

      return { success: true };
    } catch (error) {
      console.error('Cloud save failed:', error);
      return { success: false, reason: 'error', error };
    }
  }, [getStoreState]);

  /**
   * Load game from cloud
   */
  const loadGame = useCallback(async (): Promise<CloudSaveResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, hasCloudSave: false };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/load-game`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.session?.access_token}`,
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load');
      }

      const result = await response.json();

      if (result.success && result.hasCloudSave && result.saveData) {
        setStoreState(result.saveData);
      }

      return result;
    } catch (error) {
      console.error('Cloud load failed:', error);
      return { success: false, hasCloudSave: false };
    }
  }, [setStoreState]);

  /**
   * Set up auto-save interval
   */
  const startAutoSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(() => {
      saveGame(false);
    }, SAVE_INTERVAL);
  }, [saveGame]);

  /**
   * Stop auto-save
   */
  const stopAutoSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }, []);

  /**
   * Save on page unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      const saveData = getStoreState();
      localStorage.setItem('last_save', JSON.stringify(saveData));
      localStorage.setItem('last_save_at', Date.now().toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [getStoreState]);

  useEffect(() => {
    return () => {
      stopAutoSave();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [stopAutoSave]);

  return {
    saveGame,
    loadGame,
    startAutoSave,
    stopAutoSave,
    hasPendingSave: lastSaveRef.current > 0,
    lastSaveAt: lastSaveRef.current || null,
  };
}
