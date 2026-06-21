# PHASE 4 REPORT: MUSEUM SYSTEM

**Date:** 2026-06-19
**Status:** Ready for Implementation

---

## CORE RULES (MANDATORY)

1. Academy Timeline = Phase 2 Jolt Time, NOT a separate game
2. Single economy - no duplicate currencies
3. Unlock: `state.prestigeLevel >= 2` ONLY
4. NO new state variables: Use existing `reputation`, `museumVisitors`
5. Ukrainian default language
6. Supabase persistence for all new data

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Existing Museum Implementation

**Location:** `src/expedition/screens/Museum.tsx`

**Current Features:**
- ✅ Artifacts displayed by era (grouped)
- ✅ Visitor count display
- ✅ Hourly income calculation
- ✅ Reputation progress bar
- ✅ Rarity badges (common/rare/epic/legendary)
- ✅ Value and prestige bonus display

**Current Store State:**
```typescript
museumVisitors: number;      // Current visitors
reputation: number;          // 0-2000 progress
historicalPrestige: number;  // Permanent bonus
```

### 1.2 What's Missing

| Feature | Status | Required |
|---------|--------|----------|
| Exhibition slots | ❌ | Required |
| Artifact categories | ❌ | Required |
| Daily visitors | ❌ | Required |
| Museum upgrades | ❌ | Required |
| Collection bonuses | ❌ | Required |
| Visual progression | ❌ | Required |

---

## 2. PROPOSED MUSEUM SYSTEM

### 2.1 New Store State

```typescript
interface MuseumState {
  // Existing
  museumVisitors: number;
  reputation: number;
  historicalPrestige: number;
  
  // New
  exhibitionSlots: number;           // Base: 3, upgradeable
  exhibitionSlotsMax: number;        // Max slots (upgradeable)
  exhibitionSlotsUsed: number;       // Currently displayed
  dailyVisitors: number;             // Reset daily
  dailyVisitorsLastReset: string;     // Date string for reset
  totalMuseumVisits: number;         // Lifetime counter
  completedCollections: string[];     // Collection IDs
  
  // Upgrades
  museumLevel: number;               // 1-10
  upgradeStartTime?: number;         // For ongoing upgrade
  upgradeDuration: number;           // Seconds
}
```

### 2.2 Exhibition Slots System

**Concept:** Limited display slots for artifacts in museum halls

**Mechanics:**
- Base: 3 slots
- Upgradable to 12 max
- Each slot shows one artifact
- Artifacts can be added/removed freely

**Upgrade Costs:**
| Level | Slots | Cost | Time |
|-------|-------|------|------|
| 1 | 3 | - | - |
| 2 | 4 | 1000 karb. | 30 min |
| 3 | 5 | 2500 karb. | 1 hour |
| 4 | 6 | 5000 karb. | 2 hours |
| 5 | 7 | 10000 karb. | 4 hours |
| 6 | 8 | 20000 karb. | 8 hours |
| 7 | 9 | 40000 karb. | 12 hours |
| 8 | 10 | 80000 karb. | 24 hours |
| 9 | 11 | 150000 karb. | 48 hours |
| 10 | 12 | 300000 karb. | 72 hours |

### 2.3 Collection System

**Concept:** Complete artifact sets for bonus rewards

**Collections by Era:**
| Collection | Artifacts | Bonus |
|------------|-----------|-------|
| Трипільська культура | 3 | +10% expedition success |
| Грецькі колонії | 3 | +15% gold find |
| Київська Русь | 3 | +20% XP |
| Запорозька Січ | 3 | +10% reputation |
| Карпатські скарби | 3 | +5% all bonuses |

**Collection Completion Rewards:**
- 3/3: 500 karbovanets
- 6/3 (any 2): 2000 karbovanets + epic chest
- 12/3 (all 5): 10000 karbovanets + legendary chest

### 2.4 Daily Visitors System

**Concept:** Track daily museum visits for quests and bonuses

**Mechanics:**
- Reset at midnight (local time)
- Each museum visit = +1 daily visitor
- Quest progress tracks daily visitors
- Weekly bonus for 7-day streak

**Streak Bonuses:**
| Streak | Bonus |
|--------|-------|
| 3 days | +50 reputation |
| 7 days | +200 reputation + 1 random artifact |
| 30 days | +1000 reputation + rare artifact guaranteed |

### 2.5 Museum Upgrades

**Upgrade Categories:**

1. **Exhibition Hall Expansion**
   - Increases display slots
   - Visual: Hall gets larger

2. **Restoration Lab**
   - Reduces restoration time by 10% per level
   - Max level: 5

3. **Gift Shop**
   - Increases visitor income by 25% per level
   - Max level: 5

4. **Marketing Campaign**
   - Increases daily visitors by 20% per level
   - Max level: 5

### 2.6 Artifact Display Improvements

**Visual Elements:**
- Artifact frame with era-appropriate styling
- Rarity glow effect (CSS animation)
- Hover tooltip with full description
- Click to view details/remove

**Rarity Visual Indicators:**
| Rarity | Border | Glow | Animation |
|---------|--------|------|----------|
| Common | Gray | None | None |
| Rare | Cyan | Subtle | Pulse |
| Epic | Purple | Medium | Shimmer |
| Legendary | Red/Pink | Strong | Sparkle |

---

## 3. FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/expedition/data/museumCollections.ts` | Collection definitions |
| `src/expedition/components/MuseumUpgrades.tsx` | Upgrade panel |
| `src/expedition/components/ArtifactDisplay.tsx` | Improved artifact card |

---

## 4. FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/expedition/store.ts` | Add museum state, upgrade functions |
| `src/expedition/screens/Museum.tsx` | Add slots, collections, upgrades |
| `src/i18n/uk.json` | Add museum upgrade translations |
| `src/i18n/en.json` | Add museum upgrade translations |

---

## 5. TRANSLATION KEYS

```json
{
  "museum": {
    "exhibition_slots": "Слоти експозиції",
    "exhibition_slots_used": "Використано",
    "daily_visitors": "Відвідувачів сьогодні",
    "streak": "Серія",
    "days": "днів",
    "upgrade_museum": "Покращити музей",
    "upgrade_exhibition": "Розширити залу",
    "upgrade_restoration": "Покращити реставрацію",
    "upgrade_giftshop": "Покращити крамницю",
    "upgrade_marketing": "Маркетингова кампанія",
    "collection_progress": "Прогрес колекції",
    "collection_complete": "Колекцію завершено!",
    "collection_bonus": "Бонус колекції",
    "view_artifact": "Переглянути",
    "remove_artifact": "Забрати"
  }
}
```

---

## 6. NO CHANGES REQUIRED

- `supabase/functions/` — unchanged
- `supabase/migrations/` — unchanged (localStorage persistence)
- `src/App.tsx` — unchanged
- `src/hooks/useGame.ts` — unchanged

---

## 7. VERIFICATION CHECKLIST

- [ ] Exhibition slots UI implemented
- [ ] Collection progress tracking
- [ ] Daily visitors counter
- [ ] Museum upgrade panel
- [ ] Artifact display improvements
- [ ] Ukrainian translations complete
- [ ] English translations complete
- [ ] TypeScript compilation passes
- [ ] Build passes

---

**Waiting for approval to begin implementation.**
