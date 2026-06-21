// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS SERVICE
// Client-side analytics tracking for Firebase/Supabase/Amplitude
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from './lib/supabase';
import { gameEvents } from './playerGuidanceData';

// Analytics configuration
const ANALYTICS_CONFIG = {
  enabled: true,
  debug: false,
  platforms: ['supabase'] as const,
};

// Event types for type safety
export type AnalyticsEventType =
  | 'screen_view'
  | 'expedition_started'
  | 'expedition_completed'
  | 'expedition_collected'
  | 'hero_unlocked'
  | 'hero_level_up'
  | 'npc_interaction'
  | 'npc_relationship_up'
  | 'museum_artifact_placed'
  | 'collection_completed'
  | 'story_arc_completed'
  | 'prestige_completed'
  | 'daily_reward_claimed'
  | 'ad_watched'
  | 'premium_purchased'
  | 'item_purchased'
  | 'game_saved'
  | 'game_loaded'
  | 'session_started'
  | 'session_ended'
  | 'quest_completed'
  | 'achievement_unlocked'
  | 'artifact_found'
  | 'artifact_restored';

// Track an analytics event
export async function trackEvent(
  eventName: AnalyticsEventType,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!ANALYTICS_CONFIG.enabled) return;

  const eventData = {
    event: eventName,
    properties: {
      ...properties,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    },
  };

  // Log in debug mode
  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics]', eventData);
  }

  // Emit to internal event system
  gameEvents.emit(eventName, properties || {});

  // Send to Supabase
  if (ANALYTICS_CONFIG.platforms.includes('supabase')) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('analytics_events').insert({
          telegram_id: user.id, // This should be telegram_id
          event_name: eventName,
          event_category: categorizeEvent(eventName),
          payload: properties || {},
          screen_name: properties?.screenName as string || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
}

// Categorize event for easier querying
function categorizeEvent(eventName: string): string {
  if (eventName.includes('purchase') || eventName.includes('premium')) return 'purchase';
  if (eventName.includes('session') || eventName.includes('game_')) return 'session';
  if (eventName.includes('screen')) return 'navigation';
  return 'gameplay';
}

// Track screen view
export function trackScreenView(screenName: string): void {
  trackEvent('screen_view', { screenName });
}

// Track expedition actions
export function trackExpeditionStarted(heroId: string, regionId: string): void {
  trackEvent('expedition_started', { heroId, regionId });
}

export function trackExpeditionCompleted(expeditionId: string, regionId: string): void {
  trackEvent('expedition_completed', { expeditionId, regionId });
}

export function trackExpeditionCollected(expeditionId: string, rewards: Record<string, unknown>): void {
  trackEvent('expedition_collected', { expeditionId, rewards });
}

// Track hero actions
export function trackHeroUnlocked(heroId: string, rarity: string): void {
  trackEvent('hero_unlocked', { heroId, rarity });
}

export function trackHeroLevelUp(heroId: string, newLevel: number): void {
  trackEvent('hero_level_up', { heroId, newLevel });
}

// Track NPC interactions
export function trackNpcInteraction(npcId: string): void {
  trackEvent('npc_interaction', { npcId });
}

export function trackNpcRelationshipUp(npcId: string, newLevel: number): void {
  trackEvent('npc_relationship_up', { npcId, newLevel });
}

// Track museum actions
export function trackMuseumArtifactPlaced(artifactId: string, slotIndex: number): void {
  trackEvent('museum_artifact_placed', { artifactId, slotIndex });
}

export function trackCollectionCompleted(collectionId: string): void {
  trackEvent('collection_completed', { collectionId });
}

// Track story progression
export function trackStoryArcCompleted(arcNumber: number): void {
  trackEvent('story_arc_completed', { arcNumber });
}

// Track prestige
export function trackPrestigeCompleted(fromLevel: number, toLevel: number): void {
  trackEvent('prestige_completed', { fromLevel, toLevel });
}

// Track daily rewards
export function trackDailyRewardClaimed(streak: number, reward: number): void {
  trackEvent('daily_reward_claimed', { streak, reward });
}

// Track ads
export function trackAdWatched(adType: string, reward: string): void {
  trackEvent('ad_watched', { adType, reward });
}

// Track purchases
export function trackPremiumPurchased(itemId: string, starsCost: number): void {
  trackEvent('premium_purchased', { itemId, starsCost });
}

export function trackItemPurchased(itemId: string, cost: number, currency: string): void {
  trackEvent('item_purchased', { itemId, cost, currency });
}

// Track session
export function trackSessionStarted(sessionId: string): void {
  trackEvent('session_started', { sessionId });
}

export function trackSessionEnded(sessionId: string, duration: number): void {
  trackEvent('session_ended', { sessionId, duration });
}

// Track game saves
export function trackGameSaved(saveVersion: number): void {
  trackEvent('game_saved', { saveVersion });
}

export function trackGameLoaded(hasCloudSave: boolean): void {
  trackEvent('game_loaded', { hasCloudSave });
}

// Track quests and achievements
export function trackQuestCompleted(questId: string, rewards: Record<string, unknown>): void {
  trackEvent('quest_completed', { questId, rewards });
}

export function trackAchievementUnlocked(achievementId: string): void {
  trackEvent('achievement_unlocked', { achievementId });
}

// Track artifacts
export function trackArtifactFound(artifactId: string, rarity: string, era: string): void {
  trackEvent('artifact_found', { artifactId, rarity, era });
}

export function trackArtifactRestored(artifactId: string): void {
  trackEvent('artifact_restored', { artifactId });
}

// Subscribe to game events for automatic tracking
export function initializeAnalytics(): () => void {
  const unsubscribers: (() => void)[] = [];

  // Subscribe to internal game events
  unsubscribers.push(
    gameEvents.subscribe('hero_unlocked', (event) => {
      trackHeroUnlocked(
        event.data.heroId as string,
        event.data.rarity as string
      );
    })
  );

  unsubscribers.push(
    gameEvents.subscribe('expedition_completed', (event) => {
      trackExpeditionCompleted(
        event.data.expeditionId as string,
        event.data.regionId as string
      );
    })
  );

  unsubscribers.push(
    gameEvents.subscribe('prestige_reached', (event) => {
      trackPrestigeCompleted(
        event.data.from as number,
        event.data.to as number
      );
    })
  );

  unsubscribers.push(
    gameEvents.subscribe('achievement_unlocked', (event) => {
      trackAchievementUnlocked(event.data.achievementId as string);
    })
  );

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}
