# PHASES 7-12 REPORTS: FULL IMPLEMENTATION PLAN

**Date:** 2026-06-19
**Status:** Ready for Implementation (Phase 7+)

---

## PHASE 7: STORY CAMPAIGN

### Goal
Create long-term story progression with 30+ quests and major story arcs.

### Story Structure

**5 Major Arcs:**

1. **Arc 1: Dawn of Ukraine** (Trypillia - Scythia)
   - 6 quests
   - Introduction to Academy

2. **Arc 2: Kyivan Rus Glory** (Kyiv Rus)
   - 8 quests
   - Prince Vladimir story

3. **Arc 3: Cossack Age** (Cossack era)
   - 8 quests
   - Hetman Khmelnytsky story

4. **Arc 4: Independence Movements** (19th-20th century)
   - 8 quests
   - Cultural renaissance

5. **Arc 5: Modern Ukraine** (1991+)
   - 6 quests
   - Museum founding

### Quest Chain Example

```
ARC 1: DAWN OF UKRAINE
├── Chapter 1: First Steps
│   ├── Quest 1.1: "Знайомство з Академією"
│   ├── Quest 1.2: "Перші розкопки"
│   └── Quest 1.3: "Перший артефакт"
│
├── Chapter 2: Trypillia Secrets
│   ├── Quest 2.1: "Таємниці трипільців"
│   ├── Quest 2.2: "Кераміка предків"
│   └── Quest 2.3: "Велика знахідка"
│
└── Chapter 3: Scythian Legacy
    ├── Quest 3.1: "Скіфське золото"
    ├── Quest 3.2: "Легендарний меч"
    └── Quest 3.3: "Кінець епохи"
```

### Files to Create
- `src/expedition/data/storyArcs.ts` - Arc definitions
- `src/expedition/data/questChains.ts` - Quest chains

---

## PHASE 8: HERO SYSTEM

### Goal
Transform heroes into collectible characters with progression.

### Hero Interface Extensions

```typescript
interface Hero {
  // Existing
  id: string;
  name: string;
  rarity: Rarity;
  level: number;
  experience: number;
  leadership: number;
  knowledge: number;
  exploration: number;
  diplomacy: number;
  
  // New
  equipment: Equipment[];
  specializations: string[];
  expeditionBonus: number;
  levelProgress: number;  // XP to next level
  fragments: number;      // For ascension
  ascensionLevel: number; // 0-5
  isLocked: boolean;
}
```

### Hero Progression

| Stage | Requirement | Unlocks |
|-------|-------------|---------|
| 1★ | Default | Basic stats |
| 2★ | 50 fragments | +20% all stats |
| 3★ | 150 fragments | Special ability |
| 4★ | 400 fragments | +30% all stats |
| 5★ | 1000 fragments | Ultimate ability |
| 6★ | 2500 fragments | Legendary form |

### Specializations

| Hero | Specialization 1 | Specialization 2 | Ultimate |
|------|------------------|------------------|----------|
| Дмитро Вишневецький | Козацький ватажок | Дипломат | Козацька рада |
| Княгиня Ольга | Стратег | Мудрий правитель | Володимирова спадщина |
| Нестор Літописець | Історик | Дослідник | Літописне знання |
| Богдан Хмельницький | Воєначальник | Дипломат | Козацька держава |
| Агатангел Кримський | Мовознавець | Археолог | Східні таємниці |
| Козак-розвідник | Розвідник | Виживальник | Дике поле |

### Files to Modify
- `src/expedition/data.ts` - Hero interface extensions
- `src/expedition/screens/Heroes.tsx` - Hero management UI

---

## PHASE 9: EXPEDITION SYSTEM EXPANSION

### Goal
Add depth to expeditions with difficulty, risk, and random events.

### New Expedition Features

#### 1. Difficulty Levels

| Difficulty | Success Modifier | Rewards | Unlock |
|------------|-----------------|---------|--------|
| Звичайний | 0% | 1x | Default |
| Складний | -15% | 1.5x | Level 10 |
| Героїчний | -30% | 2.5x | Level 20 |
| Легендарний | -50% | 5x | Level 30 |

#### 2. Weather Modifiers

| Weather | Effect | Chance |
|---------|--------|--------|
| Ясно | +10% success | 40% |
| Хмарно | 0% | 30% |
| Дощ | -5% success | 15% |
| Буря | -15% success | 10% |
| Туман | -10% success | 5% |

#### 3. Random Events

```typescript
type ExpeditionEvent = 
  | { type: 'artifact_found'; bonus: number }
  | { type: 'weather_change'; weather: Weather }
  | { type: 'danger'; risk: number }
  | { type: 'discovery'; artifact: string }
  | { type: 'local_help'; bonus: number }
  | { type: 'equipment_break'; heroId: string }
  | { type: 'rare_find'; artifact: string }
  | { type: 'nothing'; }
```

#### 4. Expedition Timeline

```
Експедиція до "Київських пагорбів"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Тривалість: 45 хвилин
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[████████░░░░░░░░░░░░░░░░░] 35%

⏱ Залишилось: 29 хвилин
⚔️ Команда: Дмитро, Нестор
📍 Прогрес: Розкопки тривають...
🌤 Погода: Хмарно
🎲 Випадкова подія: Знайдено монети (+50 карб.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Шанс успіху: 73%
Можлива нагорода:
• 850 карбованців
• Репутація +35
• Трипільська кераміка (epic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Files to Modify
- `src/expedition/store.ts` - Expedition expansion
- `src/expedition/screens/WorldMap.tsx` - New expedition UI

---

## PHASE 10: TELEGRAM MONETIZATION

### Goal
Complete monetization audit and anti-abuse protection.

### Current Purchases (Telegram Stars)

| Item | Stars | Effect | Cooldown |
|------|-------|--------|----------|
| Герой | 25 | Random hero | None |
| Прискорення | 10 | -50% time | None |
| Слот | 15 | +1 slot | None |
| VIP день | 20 | x5 visitors | 7 days |
| Реставрація | 5 | Complete now | None |

### Anti-Abuse Protection

```typescript
interface PurchaseLimits {
  maxPurchasesPerDay: {
    heroes: 3;
    speedups: 10;
    slots: 2;
    vip: 1;
  };
  cooldownPeriods: {
    vip: 7 * 24 * 60 * 60 * 1000; // 7 days
  };
  serverValidation: boolean;  // All purchases validated server-side
}
```

### New Monetization Options

| Item | Stars | Effect |
|------|-------|--------|
| Пакет карбованців S | 50 | 5000 karb. |
| Пакет карбованців M | 150 | 20000 karb. |
| Пакет карбованців L | 350 | 50000 karb. |
| Рідкісний герой | 100 | Epic guaranteed |
| Легендарний герой | 500 | Legendary guaranteed |
| Пакет артефактів | 200 | 10 random artifacts |

### Server-Side Validation

```typescript
// In Supabase Edge Function
async function validatePurchase(telegramId: number, itemId: string, stars: number) {
  // 1. Check user has enough stars
  // 2. Check cooldown
  // 3. Check daily limit
  // 4. Deduct stars
  // 5. Grant item
  // 6. Log transaction
  // 7. Return result
}
```

### Files to Modify
- `supabase/functions/purchase-stars/index.ts` - Existing function
- `src/expedition/screens/Treasury.tsx` - Shop UI

---

## PHASE 11: SUPABASE PERSISTENCE

### Goal
Ensure all Academy Timeline data persists in Supabase.

### Current Tables

```sql
-- Existing
game_progress          -- Main player data
```

### Required Tables

```sql
-- Academy Progress
CREATE TABLE academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL REFERENCES game_progress(telegram_id),
  academy_level INT DEFAULT 1,
  academy_xp BIGINT DEFAULT 0,
  total_expeditions INT DEFAULT 0,
  successful_expeditions INT DEFAULT 0,
  museum_visits_total INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id)
);

-- Story Progress
CREATE TABLE story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL REFERENCES game_progress(telegram_id),
  current_chapter INT DEFAULT 1,
  completed_chapters INT[] DEFAULT '{}',
  active_quests TEXT[] DEFAULT '{}',
  completed_quests TEXT[] DEFAULT '{}',
  npc_relationships JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id)
);

-- NPC Relationships
CREATE TABLE npc_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL REFERENCES game_progress(telegram_id),
  npc_id VARCHAR(50) NOT NULL,
  relationship_level INT DEFAULT 1,
  trust_points INT DEFAULT 0,
  completed_quests TEXT[] DEFAULT '{}',
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id, npc_id)
);

-- Museum Progress
CREATE TABLE museum_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL REFERENCES game_progress(telegram_id),
  museum_visitors INT DEFAULT 0,
  reputation INT DEFAULT 0,
  historical_prestige INT DEFAULT 0,
  exhibition_slots INT DEFAULT 3,
  museum_level INT DEFAULT 1,
  completed_collections TEXT[] DEFAULT '{}',
  daily_visitors INT DEFAULT 0,
  daily_streak INT DEFAULT 0,
  last_visit_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id)
);

-- Building Progress
CREATE TABLE building_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL REFERENCES game_progress(telegram_id),
  buildings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id)
);

-- Hero Progress
CREATE TABLE hero_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL REFERENCES game_progress(telegram_id),
  heroes JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id)
);
```

### Sync Strategy

```typescript
// Sync flow
1. On app load: Load from Supabase
2. On state change: Debounced save (2 seconds)
3. On major action: Immediate save
4. On app close: Save immediately
5. Conflict resolution: Server wins (merge timestamps)
```

---

## PHASE 12: BALANCE

### Goal
Ensure 30+ day retention for all player types.

### Player Segments

| Segment | Play Style | Retention Goal |
|---------|------------|----------------|
| Casual | <30 min/day | 7 days |
| Active | 30-120 min/day | 14 days |
| Hardcore | >120 min/day | 30+ days |

### Progression Design

**Casual Player (30 min/day):**
- ~50 expeditions/week
- ~10 artifacts/week
- ~1 hero fragment/week
- Complete 2-3 quests/week

**Active Player (2 hours/day):**
- ~200 expeditions/week
- ~40 artifacts/week
- ~4 hero fragments/week
- Complete 8-10 quests/week

**Hardcore Player (4+ hours/day):**
- ~400 expeditions/week
- ~80 artifacts/week
- ~8 hero fragments/week
- Complete 15+ quests/week

### Balance Formulas

```typescript
// Expedition rewards
function calculateExpeditionReward(difficulty: number, duration: number): Reward {
  const baseReward = 100 * difficulty;
  const timeBonus = Math.floor(duration / 60) * 5;
  return {
    karbovanets: baseReward + timeBonus,
    reputation: difficulty * 10,
    xp: difficulty * 20,
  };
}

// Building upgrade costs
function balanceUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.5, level));
}

// Player retention hooks
function calculateRetentionMetrics(player: Player): RetentionScore {
  return {
    dailyLogin: calculateStreak(player.loginDates),
    expeditionCount: player.expeditionsThisWeek,
    questCompletion: player.completedQuests.length,
    npcInteraction: player.npcInteractions.length,
    museumVisits: player.museumVisitsThisWeek,
  };
}
```

### Dead End Prevention

| Issue | Solution |
|-------|----------|
| Can't afford anything | Daily free rewards |
| Can't complete expeditions | Guild/help system |
| No progression | Catch-up mechanics |
| Bored after 2 weeks | New content every 2 weeks |
| Pay-to-win | F2P progression path |

### Content Release Schedule

| Week | Content |
|------|---------|
| 1-2 | Core gameplay |
| 3-4 | 5 new NPCs |
| 5-6 | Quest chains |
| 7-8 | Hero expansions |
| 9-10 | New region |
| 11-12 | Seasonal event |
| 13+ | Repeat cycle with variations |

---

## IMPLEMENTATION PRIORITY

| Phase | Priority | Estimated Time |
|-------|----------|---------------|
| Phase 7: Story Campaign | 1 | 1-2 days |
| Phase 8: Hero System | 2 | 1-2 days |
| Phase 9: Expedition Expansion | 3 | 2-3 days |
| Phase 10: Monetization | 4 | 1 day |
| Phase 11: Supabase | 5 | 1-2 days |
| Phase 12: Balance | 6 | Ongoing |

---

## VERIFICATION CHECKLIST

All phases require:
- [ ] TypeScript compilation passes
- [ ] Build passes
- [ ] Ukrainian translations complete
- [ ] English translations complete
- [ ] Server-side validation (if applicable)
- [ ] Anti-abuse protection (monetization)

---

**Ready for implementation approval.**
