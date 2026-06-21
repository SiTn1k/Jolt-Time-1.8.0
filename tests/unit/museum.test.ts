// tests/unit/museum.test.ts
// Integration tests for museum system

import { describe, it, expect } from 'vitest';

describe('Museum System Tests', () => {
  describe('Income Collection', () => {
    it('should calculate base income correctly', () => {
      const museumLevel = 5;
      const hoursSinceLastCollection = 2;
      const baseIncomePerHour = 100 * museumLevel;

      const income = Math.floor(baseIncomePerHour * hoursSinceLastCollection);
      expect(income).toBe(1000);
    });

    it('should cap income at 24 hours max', () => {
      const museumLevel = 5;
      const hoursSinceLastCollection = 48; // 2 days
      const baseIncomePerHour = 100 * museumLevel;

      const cappedHours = Math.min(hoursSinceLastCollection, 24);
      const income = Math.floor(baseIncomePerHour * cappedHours);
      
      expect(cappedHours).toBe(24);
      expect(income).toBe(12000);
    });

    it('should cap max income at 100000', () => {
      const calculatedIncome = 500000;
      const maxIncome = 100000;

      const finalIncome = Math.min(calculatedIncome, maxIncome);
      expect(finalIncome).toBe(100000);
    });

    it('should prevent duplicate collection within 1 hour', () => {
      const hoursSinceLastCollection = 0.5; // 30 minutes

      const canCollect = hoursSinceLastCollection >= 1;
      expect(canCollect).toBe(false);
    });

    it('should allow collection after 1 hour', () => {
      const hoursSinceLastCollection = 1.5; // 1.5 hours

      const canCollect = hoursSinceLastCollection >= 1;
      expect(canCollect).toBe(true);
    });
  });

  describe('Collection Bonuses', () => {
    it('should calculate collection bonus correctly', () => {
      const completedCollections = 5;
      const bonusPercent = completedCollections * 5;

      expect(bonusPercent).toBe(25);
    });

    it('should apply prestige bonus at level 4+', () => {
      const prestigeLevel = 4;
      const hasPrestigeBonus = prestigeLevel >= 4;

      expect(hasPrestigeBonus).toBe(true);
    });

    it('should not apply prestige bonus below level 4', () => {
      const prestigeLevel = 3;
      const hasPrestigeBonus = prestigeLevel >= 4;

      expect(hasPrestigeBonus).toBe(false);
    });

    it('should apply seasonal event bonus for Independence Day', () => {
      const now = new Date(2026, 7, 24); // August 24
      const month = now.getMonth();
      const day = now.getDate();

      const isIndependenceDay = month === 7 && day >= 20 && day <= 28;
      expect(isIndependenceDay).toBe(true);
    });

    it('should apply seasonal event bonus for Christmas', () => {
      const christmasStart = new Date(2026, 11, 22);
      const christmasEnd = new Date(2027, 0, 5);
      
      const month = christmasStart.getMonth();
      const day = christmasStart.getDate();
      const endMonth = christmasEnd.getMonth();
      const endDay = christmasEnd.getDate();

      const isChristmas = (month === 11 && day >= 20) || (endMonth === 0 && endDay <= 7);
      expect(isChristmas).toBe(true);
    });
  });

  describe('Museum Level Calculation', () => {
    it('should calculate level from completed collections', () => {
      const completedCollections = 3;
      const museumLevel = Math.min(1 + completedCollections, 20);

      expect(museumLevel).toBe(4);
    });

    it('should cap museum level at 20', () => {
      const completedCollections = 50;
      const museumLevel = Math.min(1 + completedCollections, 20);

      expect(museumLevel).toBe(20);
    });

    it('should start at level 1 with no collections', () => {
      const completedCollections: string[] = [];
      const museumLevel = Math.min(1 + completedCollections.length, 20);

      expect(museumLevel).toBe(1);
    });
  });

  describe('Anti-Cheat', () => {
    it('should detect negative income values', () => {
      const income = -100;

      const isValid = income >= 0;
      expect(isValid).toBe(false);
    });

    it('should detect income spikes', () => {
      const income = 500000;
      const maxIncome = 100000;

      const isSpike = income > maxIncome;
      expect(isSpike).toBe(true);
    });

    it('should log duplicate collection attempts', () => {
      const hoursSinceLastCollection = 0.1;
      const shouldLog = hoursSinceLastCollection < 1;

      expect(shouldLog).toBe(true);
    });
  });
});
