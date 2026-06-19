# PHASE 5 REPORT: BUILDING PROGRESSION

**Date:** 2026-06-19
**Status:** Ready for Implementation

---

## CORE RULES (MANDATORY)

1. Academy Timeline = Phase 2 Jolt Time, NOT a separate game
2. Single economy - use existing `karbovanets` currency
3. Unlock: `state.prestigeLevel >= 2` ONLY
4. NO new state variables except building-specific state
5. Ukrainian default language
6. Supabase persistence for all new data

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Existing Building Data

**Location:** `src/expedition/data.ts`

**Current Buildings:**
```typescript
export const buildings: Building[] = [
  { id: 'building-1', name: 'Інститут археології', level: 3, ... },
  { id: 'building-2', name: 'Експедиційний корпус', level: 2, ... },
  { id: 'building-3', name: 'Реставраційна лабораторія', level: 4, ... },
  { id: 'building-4', name: 'Національний музей', level: 5, ... },
  { id: 'building-5', name: 'Історичний архів', level: 2, ... },
  { id: 'building-6', name: 'Скарбниця', level: 3, ... },
];
```

### 1.2 Current Limitations

| Issue | Impact |
|-------|--------|
| Static levels | No progression |
| No upgrade timers | Instant upgrades |
| No visual progression | Buildings look same |
| No bonuses calculation | Stats not used |
| No upgrade costs | Hardcoded values |

---

## 2. PROPOSED BUILDING SYSTEM

### 2.1 Building Interface

```typescript
interface Building {
  id: string;
  name: string;
  description: string;
  icon: string;  // Emoji or icon name
  
  // Progression
  level: number;
  maxLevel: number;  // Usually 10
  
  // Economy
  upgradeCost: number;
  upgradeTime: number;  // Seconds
  
  // Upgrade in progress
  upgradeStartedAt?: number;
  upgradeEndsAt?: number;
  
  // Bonuses
  bonusType: string;      // What it improves
  bonusValue: number;      // Base bonus per level
  bonusDescription: string;
}
```

### 2.2 Building Definitions

| Building | ID | Level | Bonus | Bonus/Level |
|----------|-----|-------|-------|-------------|
| Академія | academy | 1-10 | Academy XP gain | +5% |
| Інститут археології | archaeology | 1-10 | Expedition success | +2% |
| Експедиційний корпус | expedition | 1-10 | Expedition slots | +1 per 2 levels |
| Реставраційна лабораторія | laboratory | 1-10 | Restore speed | -10% |
| Історичний архів | archive | 1-10 | Hero XP gain | +5% |
| Скарбниця | treasury | 1-10 | Max karbovanets | +500 |
| Крамниця | shop | 1-5 | Visitor income | +15% |
| Маркетинг | marketing | 1-5 | Daily visitors | +20% |

### 2.3 Upgrade Cost Formula

```typescript
function getUpgradeCost(baseCost: number, currentLevel: number): number {
  return Math.floor(baseCost * Math.pow(1.5, currentLevel));
}

function getUpgradeTime(baseTime: number, currentLevel: number): number {
  return baseTime * (1 + currentLevel * 0.5);  // Increases 50% per level
}
```

### 2.4 Building Upgrade Data

| Building | Base Cost | Base Time | Max Level |
|----------|-----------|-----------|-----------|
| Академія | 5000 | 1 hour | 10 |
| Інститут археології | 3000 | 30 min | 10 |
| Експедиційний корпус | 4000 | 45 min | 10 |
| Реставраційна лабораторія | 3500 | 40 min | 10 |
| Історичний архів | 2500 | 30 min | 10 |
| Скарбниця | 5000 | 1 hour | 10 |
| Крамниця | 10000 | 2 hours | 5 |
| Маркетинг | 8000 | 2 hours | 5 |

### 2.5 Visual Progression

**Level-based Visual Indicators:**

| Level | Visual |
|-------|--------|
| 1-3 | Basic building, small |
| 4-6 | Enhanced building, medium |
| 7-9 | Premium building, large |
| 10 | Legendary with glow |

**Animation:**
- Upgrade in progress: Construction animation
- Upgrade complete: Celebration particles
- Max level: Subtle ambient glow

---

## 3. STORE CHANGES

### 3.1 New State Variables

```typescript
interface GameState {
  // Existing
  academyLevel: number;
  
  // New
  buildings: BuildingState[];
  
  // Actions
  startBuildingUpgrade: (buildingId: string) => boolean;
  collectBuildingUpgrade: (buildingId: string) => void;
  getBuildingBonus: (buildingId: string) => number;
  getTotalBuildingBonus: (bonusType: string) => number;
}
```

### 3.2 Bonus Calculation

```typescript
function calculateBonuses(buildings: BuildingState[]) {
  return {
    expeditionSuccess: buildings
      .filter(b => b.id === 'archaeology')
      .reduce((sum, b) => sum + b.level * 2, 0),
    
    expeditionSlots: 3 + Math.floor(
      buildings.find(b => b.id === 'expedition')?.level / 2
    ),
    
    restoreSpeed: buildings
      .filter(b => b.id === 'laboratory')
      .reduce((sum, b) => sum + b.level * 10, 0),  // -10% per level
    
    heroXpBonus: buildings
      .filter(b => b.id === 'archive')
      .reduce((sum, b) => sum + b.level * 5, 0),
    
    maxKarbovanets: 10000 + buildings
      .filter(b => b.id === 'treasury')
      .reduce((sum, b) => sum + b.level * 500, 0),
    
    visitorIncome: buildings
      .filter(b => b.id === 'shop')
      .reduce((sum, b) => sum + b.level * 15, 0),
    
    dailyVisitors: buildings
      .filter(b => b.id === 'marketing')
      .reduce((sum, b) => sum + b.level * 20, 0),
  };
}
```

---

## 4. FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/expedition/data/buildingData.ts` | Building definitions with upgrade data |
| `src/expedition/components/BuildingCard.tsx` | Individual building component |
| `src/expedition/components/BuildingUpgradeModal.tsx` | Upgrade confirmation modal |

---

## 5. FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/expedition/store.ts` | Add building state, upgrade functions |
| `src/expedition/screens/Academy.tsx` | Integrate building UI |
| `src/expedition/data.ts` | Update building data structure |
| `src/i18n/uk.json` | Add building translations |
| `src/i18n/en.json` | Add building translations |

---

## 6. TRANSLATION KEYS

```json
{
  "buildings": {
    "academy": "Академія",
    "archaeology": "Інститут археології",
    "expedition": "Експедиційний корпус",
    "laboratory": "Реставраційна лабораторія",
    "archive": "Історичний архів",
    "treasury": "Скарбниця",
    "shop": "Крамниця",
    "marketing": "Маркетинг",
    "level": "Рівень",
    "max_level": "Макс. рівень",
    "upgrade": "Покращити",
    "upgrade_in_progress": "Покращення...",
    "upgrade_complete": "Готово!",
    "upgrade_cost": "Вартість",
    "upgrade_time": "Час",
    "bonus": "Бонус",
    "collect": "Забрати"
  }
}
```

---

## 7. INTEGRATION POINTS

### 7.1 With Expedition System
- Expedition success bonus from archaeology building
- Extra slots from expedition building

### 7.2 With Laboratory System
- Faster restoration from laboratory building

### 7.3 With Hero System
- Extra XP from archive building

### 7.4 With Museum System
- More visitors from marketing building
- Better income from shop building

### 7.5 With Economy
- Higher karbovanets cap from treasury building

---

## 8. NO CHANGES REQUIRED

- `supabase/functions/` — unchanged
- `supabase/migrations/` — unchanged
- `src/App.tsx` — unchanged
- `src/hooks/useGame.ts` — unchanged

---

## 9. VERIFICATION CHECKLIST

- [ ] Building data structure defined
- [ ] Upgrade cost formula implemented
- [ ] Upgrade timer system works
- [ ] Bonus calculations accurate
- [ ] Visual progression indicators
- [ ] Integration with all systems
- [ ] Ukrainian translations complete
- [ ] English translations complete
- [ ] TypeScript compilation passes
- [ ] Build passes

---

**Waiting for approval to begin implementation.**
