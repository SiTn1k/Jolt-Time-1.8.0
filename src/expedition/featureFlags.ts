// ═══════════════════════════════════════════════════════════════════════
// FEATURE FLAGS SYSTEM
// Control feature rollout without code deployment
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

// Feature flag types
export type FeatureFlag =
  | 'FEATURE_HEROES'
  | 'FEATURE_NPC_EVOLUTION'
  | 'FEATURE_SEASON_EVENTS'
  | 'FEATURE_PREMIUM'
  | 'FEATURE_GACHA'
  | 'FEATURE_STREAK_SYSTEM'
  | 'FEATURE_WEEKLY_CHALLENGES'
  | 'FEATURE_BADGES'
  | 'FEATURE_NOTIFICATIONS'
  | 'FEATURE_CLOUD_SAVE'
  | 'FEATURE_ANALYTICS'
  | 'FEATURE_CRASH_REPORTING';

// Feature flag configuration
interface FeatureFlagConfig {
  flag: FeatureFlag;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  description: string;
  minVersion?: string; // Optional minimum version
}

// Default feature flags (can be overridden by environment)
const DEFAULT_FEATURE_FLAGS: FeatureFlagConfig[] = [
  {
    flag: 'FEATURE_HEROES',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Hero system with RPG mechanics',
  },
  {
    flag: 'FEATURE_NPC_EVOLUTION',
    enabled: true,
    rolloutPercentage: 100,
    description: 'NPC relationship evolution',
  },
  {
    flag: 'FEATURE_SEASON_EVENTS',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Seasonal events and celebrations',
  },
  {
    flag: 'FEATURE_PREMIUM',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Telegram Stars premium shop',
  },
  {
    flag: 'FEATURE_GACHA',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Hero gacha system',
  },
  {
    flag: 'FEATURE_STREAK_SYSTEM',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Daily login streaks',
  },
  {
    flag: 'FEATURE_WEEKLY_CHALLENGES',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Weekly challenges',
  },
  {
    flag: 'FEATURE_BADGES',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Achievement badges',
  },
  {
    flag: 'FEATURE_NOTIFICATIONS',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Push notifications',
  },
  {
    flag: 'FEATURE_CLOUD_SAVE',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Cloud save functionality',
  },
  {
    flag: 'FEATURE_ANALYTICS',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Analytics tracking',
  },
  {
    flag: 'FEATURE_CRASH_REPORTING',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Sentry crash reporting',
  },
];

// Get all feature flags
export function getAllFeatureFlags(): FeatureFlagConfig[] {
  return DEFAULT_FEATURE_FLAGS;
}

// Check if a feature is enabled for a specific user
export function isFeatureEnabled(
  flag: FeatureFlag,
  userId?: string
): boolean {
  const config = DEFAULT_FEATURE_FLAGS.find(f => f.flag === flag);
  
  if (!config) {
    console.warn(`[FeatureFlags] Unknown flag: ${flag}`);
    return false;
  }

  if (!config.enabled) {
    return false;
  }

  // Check rollout percentage
  if (config.rolloutPercentage < 100) {
    if (!userId) {
      return false;
    }
    
    // Simple hash-based rollout
    const hash = hashString(userId + flag);
    const userPercentile = hash % 100;
    return userPercentile < config.rolloutPercentage;
  }

  return true;
}

// Hash function for consistent user bucketing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Hook for React components
export function useFeatureFlag(flag: FeatureFlag, userId?: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check flag with potential server fetch
    checkFlagFromServer(flag).then(serverEnabled => {
      if (serverEnabled !== null) {
        setEnabled(serverEnabled);
      } else {
        // Fallback to local check
        setEnabled(isFeatureEnabled(flag, userId));
      }
    });
  }, [flag, userId]);

  return enabled;
}

// Hook for multiple flags
export function useFeatureFlags(flags: FeatureFlag[], userId?: string): Record<FeatureFlag, boolean> {
  const [states, setStates] = useState<Record<FeatureFlag, boolean>>(
    () => flags.reduce((acc, flag) => ({ ...acc, [flag]: false }), {} as Record<FeatureFlag, boolean>)
  );

  useEffect(() => {
    const newStates: Record<FeatureFlag, boolean> = {};
    flags.forEach(flag => {
      newStates[flag] = isFeatureEnabled(flag, userId);
    });
    setStates(newStates);
  }, [flags.join(','), userId]);

  return states;
}

// Update flag configuration (admin only - would be server-side)
export async function updateFeatureFlag(
  flag: FeatureFlag,
  enabled: boolean,
  rolloutPercentage?: number
): Promise<boolean> {
  // This would call an admin Edge Function
  console.log(`[FeatureFlags] Would update ${flag}: enabled=${enabled}, rollout=${rolloutPercentage}`);
  
  // For now, just log and return success
  return true;
}

// Export types for TypeScript
export type { FeatureFlagConfig };
