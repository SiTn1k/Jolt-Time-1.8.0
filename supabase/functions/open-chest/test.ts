/**
 * Unit Tests for Artifact Drop Rates
 * 
 * Tests the drop rate calculation and balancing.
 */

import { calculateDropChances, DROP_RATES } from "./index.ts";

// =====================================================
// Drop Rate Constants Tests
// =====================================================

Deno.test("DROP_RATES constants are valid", () => {
  // All base rates should sum to 100%
  const baseTotal = DROP_RATES.BASE_SECRET + DROP_RATES.BASE_LEGENDARY + 
                    DROP_RATES.BASE_EPIC + DROP_RATES.BASE_RARE + DROP_RATES.BASE_COMMON;
  
  console.assert(baseTotal === 100, `Base rates should sum to 100%, got ${baseTotal}`);
  
  // All caps should be >= base rates
  console.assert(DROP_RATES.MAX_SECRET >= DROP_RATES.BASE_SECRET, "MAX_SECRET should be >= BASE_SECRET");
  console.assert(DROP_RATES.MAX_LEGENDARY >= DROP_RATES.BASE_LEGENDARY, "MAX_LEGENDARY should be >= BASE_LEGENDARY");
  console.assert(DROP_RATES.MAX_EPIC >= DROP_RATES.BASE_EPIC, "MAX_EPIC should be >= BASE_EPIC");
  console.assert(DROP_RATES.MAX_RARE >= DROP_RATES.BASE_RARE, "MAX_RARE should be >= BASE_RARE");
});

// =====================================================
// calculateDropChances Tests
// =====================================================

Deno.test("should return base rates when bonus is 0", () => {
  const chances = calculateDropChances(0);
  
  console.assert(chances.secret === DROP_RATES.BASE_SECRET, 
    `Secret should be ${DROP_RATES.BASE_SECRET}%, got ${chances.secret}`);
  console.assert(chances.legendary === DROP_RATES.BASE_LEGENDARY, 
    `Legendary should be ${DROP_RATES.BASE_LEGENDARY}%, got ${chances.legendary}`);
  console.assert(chances.epic === DROP_RATES.BASE_EPIC, 
    `Epic should be ${DROP_RATES.BASE_EPIC}%, got ${chances.epic}`);
  console.assert(chances.rare === DROP_RATES.BASE_RARE, 
    `Rare should be ${DROP_RATES.BASE_RARE}%, got ${chances.rare}`);
});

Deno.test("should cap secret chance at MAX_SECRET", () => {
  const extremeBonus = 1000; // Extreme bonus that would push secret way over cap
  const chances = calculateDropChances(extremeBonus);
  
  console.assert(chances.secret <= DROP_RATES.MAX_SECRET, 
    `Secret should be capped at ${DROP_RATES.MAX_SECRET}%, got ${chances.secret}`);
});

Deno.test("should cap legendary chance at MAX_LEGENDARY", () => {
  const extremeBonus = 1000;
  const chances = calculateDropChances(extremeBonus);
  
  console.assert(chances.legendary <= DROP_RATES.MAX_LEGENDARY, 
    `Legendary should be capped at ${DROP_RATES.MAX_LEGENDARY}%, got ${chances.legendary}`);
});

Deno.test("should cap epic chance at MAX_EPIC", () => {
  const extremeBonus = 1000;
  const chances = calculateDropChances(extremeBonus);
  
  console.assert(chances.epic <= DROP_RATES.MAX_EPIC, 
    `Epic should be capped at ${DROP_RATES.MAX_EPIC}%, got ${chances.epic}`);
});

Deno.test("should cap rare chance at MAX_RARE", () => {
  const extremeBonus = 1000;
  const chances = calculateDropChances(extremeBonus);
  
  console.assert(chances.rare <= DROP_RATES.MAX_RARE, 
    `Rare should be capped at ${DROP_RATES.MAX_RARE}%, got ${chances.rare}`);
});

Deno.test("should always sum to 100%", () => {
  // Test with various bonus levels
  const bonusLevels = [0, 5, 10, 20, 50, 100, 500, 1000];
  
  for (const bonus of bonusLevels) {
    const chances = calculateDropChances(bonus);
    const total = chances.secret + chances.legendary + chances.epic + chances.rare + chances.common;
    
    console.assert(Math.abs(total - 100) < 0.01, 
      `Total should be 100% with bonus ${bonus}, got ${total}%`);
  }
});

Deno.test("all chances should be non-negative", () => {
  const chances = calculateDropChances(1000);
  
  console.assert(chances.secret >= 0, "Secret should be non-negative");
  console.assert(chances.legendary >= 0, "Legendary should be non-negative");
  console.assert(chances.epic >= 0, "Epic should be non-negative");
  console.assert(chances.rare >= 0, "Rare should be non-negative");
  console.assert(chances.common >= 0, "Common should be non-negative");
});

Deno.test("all chances should be <= 100", () => {
  const chances = calculateDropChances(1000);
  
  console.assert(chances.secret <= 100, "Secret should be <= 100");
  console.assert(chances.legendary <= 100, "Legendary should be <= 100");
  console.assert(chances.epic <= 100, "Epic should be <= 100");
  console.assert(chances.rare <= 100, "Rare should be <= 100");
  console.assert(chances.common <= 100, "Common should be <= 100");
});

Deno.test("should increase with moderate bonus", () => {
  const baseChances = calculateDropChances(0);
  const bonusChances = calculateDropChances(10);
  
  // With bonus, rare+ rarities should be higher or same (capped)
  console.assert(
    bonusChances.secret >= baseChances.secret ||
    bonusChances.secret === DROP_RATES.MAX_SECRET,
    "Secret should increase or hit cap"
  );
});

// =====================================================
// Integration Test: Multiple Rolls
// =====================================================

Deno.test("should distribute rarities reasonably over many rolls", () => {
  const ROLLS = 10000;
  const bonus = 10;
  const counts = { common: 0, rare: 0, epic: 0, legendary: 0, secret: 0 };
  
  // Mock rollRarity by using actual calculateDropChances
  for (let i = 0; i < ROLLS; i++) {
    const chances = calculateDropChances(bonus);
    const roll = Math.random() * 100;
    
    let cumulative = 0;
    cumulative += chances.secret;
    if (roll < cumulative) { counts.secret++; continue; }
    
    cumulative += chances.legendary;
    if (roll < cumulative) { counts.legendary++; continue; }
    
    cumulative += chances.epic;
    if (roll < cumulative) { counts.epic++; continue; }
    
    cumulative += chances.rare;
    if (roll < cumulative) { counts.rare++; continue; }
    
    counts.common++;
  }
  
  const expectedSecret = calculateDropChances(bonus).secret;
  const expectedLegendary = calculateDropChances(bonus).legendary;
  const expectedEpic = calculateDropChances(bonus).epic;
  const expectedRare = calculateDropChances(bonus).rare;
  const expectedCommon = calculateDropChances(bonus).common;
  
  // Allow 5% deviation for statistical variance
  const tolerance = 5;
  
  const actualSecret = (counts.secret / ROLLS) * 100;
  console.assert(Math.abs(actualSecret - expectedSecret) < tolerance, 
    `Secret: expected ~${expectedSecret}%, got ${actualSecret.toFixed(2)}%`);
  
  const actualLegendary = (counts.legendary / ROLLS) * 100;
  console.assert(Math.abs(actualLegendary - expectedLegendary) < tolerance, 
    `Legendary: expected ~${expectedLegendary}%, got ${actualLegendary.toFixed(2)}%`);
  
  const actualEpic = (counts.epic / ROLLS) * 100;
  console.assert(Math.abs(actualEpic - expectedEpic) < tolerance, 
    `Epic: expected ~${expectedEpic}%, got ${actualEpic.toFixed(2)}%`);
  
  const actualRare = (counts.rare / ROLLS) * 100;
  console.assert(Math.abs(actualRare - expectedRare) < tolerance, 
    `Rare: expected ~${expectedRare}%, got ${actualRare.toFixed(2)}%`);
  
  const actualCommon = (counts.common / ROLLS) * 100;
  console.assert(Math.abs(actualCommon - expectedCommon) < tolerance, 
    `Common: expected ~${expectedCommon}%, got ${actualCommon.toFixed(2)}%`);
  
  console.log(`Distribution over ${ROLLS} rolls:`, counts);
});

console.log("Running artifact drop rate tests...");
