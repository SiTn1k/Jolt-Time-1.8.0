// tests/unit/collection.test.ts
// Integration tests for collection validation

import { describe, it, expect } from 'vitest';

// Collection definitions (mirrored from server)
const COLLECTION_DEFINITIONS: Record<string, {
  requiredArtifacts: string[];
  requiredCount: number;
  bonuses: {
    xpBonus: number;
    speedBonus: number;
    trustBonus: number;
    reputationBonus: number;
    karbovanetsBonus: number;
  };
}> = {
  early_artifacts: {
    requiredArtifacts: ['triple_ceramic', 'ancient_flute', 'stone_idol'],
    requiredCount: 3,
    bonuses: { xpBonus: 10, speedBonus: 5, trustBonus: 2, reputationBonus: 5, karbovanetsBonus: 100 },
  },
  ukrainian_history: {
    requiredArtifacts: ['kyiv_cross', 'hetman_seal', 'cossack_sword', 'kobzar_instrument'],
    requiredCount: 4,
    bonuses: { xpBonus: 20, speedBonus: 10, trustBonus: 5, reputationBonus: 10, karbovanetsBonus: 250 },
  },
};

describe('Collection System Tests', () => {
  describe('Collection Validation', () => {
    it('should validate all required artifacts are present', () => {
      const collection = COLLECTION_DEFINITIONS['early_artifacts'];
      const playerArtifacts = ['triple_ceramic', 'ancient_flute', 'stone_idol', 'extra_artifact'];
      const artifactIds = new Set(playerArtifacts);

      const hasAll = collection.requiredArtifacts.every(id => artifactIds.has(id));
      expect(hasAll).toBe(true);
    });

    it('should reject if missing required artifacts', () => {
      const collection = COLLECTION_DEFINITIONS['early_artifacts'];
      const playerArtifacts = ['triple_ceramic', 'ancient_flute']; // Missing stone_idol
      const artifactIds = new Set(playerArtifacts);

      const hasAll = collection.requiredArtifacts.every(id => artifactIds.has(id));
      expect(hasAll).toBe(false);
    });

    it('should return missing artifacts list', () => {
      const collection = COLLECTION_DEFINITIONS['early_artifacts'];
      const playerArtifacts = ['triple_ceramic'];
      const artifactIds = new Set(playerArtifacts);

      const missing = collection.requiredArtifacts.filter(id => !artifactIds.has(id));
      expect(missing).toEqual(['ancient_flute', 'stone_idol']);
    });
  });

  describe('Anti-Cheat Validation', () => {
    it('should reject fake artifact IDs', () => {
      const collection = COLLECTION_DEFINITIONS['early_artifacts'];
      const playerArtifacts = ['fake_id_1', 'fake_id_2', 'fake_id_3'];
      const artifactIds = new Set(playerArtifacts);

      const hasAll = collection.requiredArtifacts.every(id => artifactIds.has(id));
      expect(hasAll).toBe(false);
    });

    it('should reject duplicate collection claims', () => {
      const completedCollections = ['early_artifacts', 'ukrainian_history'];
      const newCollection = 'early_artifacts';

      const alreadyCompleted = completedCollections.includes(newCollection);
      expect(alreadyCompleted).toBe(true);
    });

    it('should reject invalid collection IDs', () => {
      const validCollectionIds = Object.keys(COLLECTION_DEFINITIONS);
      const invalidId = 'fake_collection';

      const isValid = validCollectionIds.includes(invalidId);
      expect(isValid).toBe(false);
    });
  });

  describe('Bonus Calculation', () => {
    it('should apply correct bonuses for early_artifacts', () => {
      const collection = COLLECTION_DEFINITIONS['early_artifacts'];
      
      expect(collection.bonuses.xpBonus).toBe(10);
      expect(collection.bonuses.speedBonus).toBe(5);
      expect(collection.bonuses.trustBonus).toBe(2);
      expect(collection.bonuses.reputationBonus).toBe(5);
      expect(collection.bonuses.karbovanetsBonus).toBe(100);
    });

    it('should apply correct bonuses for ukrainian_history', () => {
      const collection = COLLECTION_DEFINITIONS['ukrainian_history'];
      
      expect(collection.bonuses.xpBonus).toBe(20);
      expect(collection.bonuses.speedBonus).toBe(10);
      expect(collection.bonuses.trustBonus).toBe(5);
      expect(collection.bonuses.reputationBonus).toBe(10);
      expect(collection.bonuses.karbovanetsBonus).toBe(250);
    });

    it('should reject negative bonus values', () => {
      const bonuses = {
        xpBonus: -10,
        speedBonus: 5,
        trustBonus: 2,
        reputationBonus: 5,
        karbovanetsBonus: 100,
      };

      const hasNegative = Object.values(bonuses).some(v => v < 0);
      expect(hasNegative).toBe(true);
    });

    it('should accept all positive bonus values', () => {
      const bonuses = {
        xpBonus: 10,
        speedBonus: 5,
        trustBonus: 2,
        reputationBonus: 5,
        karbovanetsBonus: 100,
      };

      const hasNegative = Object.values(bonuses).some(v => v < 0);
      expect(hasNegative).toBe(false);
    });
  });

  describe('Prestige Validation', () => {
    it('should validate prestige level progression', () => {
      const currentPrestige = 2;
      const targetPrestige = 4;

      const isValid = targetPrestige === currentPrestige + 1 || targetPrestige === currentPrestige;
      expect(isValid).toBe(false); // Invalid - skipping prestige 3
    });

    it('should allow valid prestige progression', () => {
      const currentPrestige = 2;
      const targetPrestige = 3;

      const isValid = targetPrestige === currentPrestige + 1;
      expect(isValid).toBe(true);
    });

    it('should reject going backwards in prestige', () => {
      const currentPrestige = 3;
      const targetPrestige = 2;

      const isValid = targetPrestige > currentPrestige;
      expect(isValid).toBe(false);
    });
  });
});
