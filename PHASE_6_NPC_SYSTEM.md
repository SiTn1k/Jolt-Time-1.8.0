# PHASE 6 REPORT: NPC EXPANSION

**Date:** 2026-06-19
**Status:** Ready for Implementation

---

## CORE RULES (MANDATORY)

1. Academy Timeline = Phase 2 Jolt Time, NOT a separate game
2. Single economy - no duplicate currencies
3. Unlock: `state.prestigeLevel >= 2` ONLY
4. NO new state variables - use existing relationship system
5. Ukrainian default language
6. Supabase persistence for all new data

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Phase 3 Implementation

**Location:** `src/expedition/storyData.ts`

**Current Implementation:**
- 5 historical NPCs (MVP)
- 9 story quests
- 5-level relationship system
- Basic dialogue system

**Current NPCs:**
| NPC | Role | Rarity |
|-----|------|--------|
| Князь Володимир | knyaz | legendary |
| Печерський монах | historian | epic |
| Богдан Хмельницький | hetman | legendary |
| Археолог Академії | archaeologist | rare |
| Куратор музею | researcher | rare |

---

## 2. PROPOSED NPC EXPANSION

### 2.1 Additional NPCs (10 more)

| ID | Name | Role | Era | Rarity |
|----|------|------|-----|--------|
| `npc-taras_shevchenko` | Тарас Шевченко | poet | 19th | legendary |
| `npc-grigoriy_skvorets` | Григорій Сковорода | philosopher | 18th | epic |
| `npc-yaroslav_mudryy` | Ярослав Мудрий | knyaz | 11th | legendary |
| `npc-sophia_kievska` | Софія Київська | princess | 11th | epic |
| `npc-ivan_mazepa` | Іван Мазепа | hetman | 17th | legendary |
| `npc-petra_cohon` | Петро Конашевич | cossack | 17th | rare |
| `npc-mikhailo_grushevsky` | Михайло Грушевський | historian | 20th | epic |
| `npc-olga_knyaginya` | Княгиня Ольга | knyaz | 10th | legendary |
| `npc-svyatoslav_igorevich` | Святослав Ігоревич | knyaz | 10th | epic |
| `npc-petri_ksenofontov` | Петро Ксендзов | archaeologist | 19th | rare |

### 2.2 Relationship Progression

**Current Levels (1-5):**
| Level | Trust Points | Unlocks |
|-------|-------------|---------|
| 1 | 0+ | Greeting |
| 2 | 50+ | Extra dialogues |
| 3 | 150+ | First quest |
| 4 | 300+ | Hero/Region |
| 5 | 500+ | Artifact |

**Proposed Extensions:**
| Level | Trust Points | Unlocks |
|-------|-------------|---------|
| 6 | 800+ | Exclusive equipment |
| 7 | 1200+ | NPC backstory quest |
| 8 | 1700+ | NPC visual upgrade |
| 9 | 2300+ | NPC companion |
| 10 | 3000+ | Legendary item |

### 2.3 Friendship System

**Friendship Actions:**
| Action | Trust Points |
|--------|-------------|
| Talk | +5 |
| Complete quest | +50 |
| Give gift | +10-50 |
| Daily visit | +3 |
| Bring artifact | +25 |
| Share story | +15 |

**Gift System:**
| Gift | Cost | Trust |
|------|------|-------|
| Квітка лісова | 50 karb. | +5 |
| Книга стародавня | 200 karb. | +15 |
| Артефакт рідкісний | 1000 karb. | +30 |
| Артефакт легендарний | 5000 karb. | +50 |

### 2.4 Unique Quest Chains

**Quest Chain Structure:**
```
Chapter 1: Introduction
  └─ Quest 1.1: First meeting
  └─ Quest 1.2: Small favor
  └─ Quest 1.3: Prove yourself

Chapter 2: Development  
  └─ Quest 2.1: Epic quest
  └─ Quest 2.2: Parallel quest
  └─ Quest 2.3: Major decision

Chapter 3: Climax
  └─ Quest 3.1: Crisis
  └─ Quest 3.2: Resolution
  └─ Quest 3.3: Reward
```

**Sample: Князь Володимир Quest Chain**

1. **Служіння Русі** (Chapter 1)
   - Complete 3 expeditions to Kyiv Rus
   - Talk 5 times
   - Reward: 500 karb., 100 rep, 50 academy XP

2. **Велика слава** (Chapter 2)
   - Complete 5 expeditions
   - Collect 2 artifacts
   - Reward: 250 rep, hero fragment

3. **Хрещення Русі** (Chapter 3)
   - Reach relationship level 5
   - Visit museum 10 times
   - Reward: Legendary artifact, +1000 rep

### 2.5 Branching Dialogue

**Dialogue System:**
```typescript
interface DialogueNode {
  id: string;
  text: string;
  speaker: 'npc' | 'player';
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
  options?: DialogueOption[];
  next?: string;  // Next node if no options
  condition?: Condition;
}

interface DialogueOption {
  text: string;
  next: string;
  trustChange: number;
  reputationChange?: number;
}
```

### 2.6 NPC Visual Improvements

**Portrait System:**
- Emoji portraits (current)
- Future: SVG/PNG portraits
- Emotion states per NPC
- Animation states

**Visual Indicators:**
- Level shown as badge
- Trust bar on hover
- Quest indicator (!, ?, ...)
- Available gift indicator

---

## 3. FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/expedition/data/npcExpansions.ts` | Additional NPC definitions |
| `src/expedition/components/DialogueSystem.tsx` | Full dialogue UI |
| `src/expedition/components/GiftPanel.tsx` | Gift giving UI |
| `src/expedition/data/dialogueData.ts` | Dialogue trees |

---

## 4. FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/expedition/storyData.ts` | Add NPC expansions |
| `src/expedition/components/StorySystem.tsx` | Add friendship features |
| `src/i18n/uk.json` | Add new NPC translations |
| `src/i18n/en.json` | Add new NPC translations |

---

## 5. TRANSLATION KEYS

```json
{
  "npc": {
    "friendship": "Дружба",
    "trust_level": "Рівень довіри",
    "talk": "Поговорити",
    "give_gift": "Подарувати",
    "view_quests": "Завдання",
    "daily_visit": "Щоденне вітання",
    "relationship_progress": "Прогрес відносин",
    "max_level": "Макс. рівень",
    "gift_received": "Отримано подарунок",
    "special_unlock": "Особливе відкриття"
  }
}
```

---

## 6. VERIFICATION CHECKLIST

- [ ] 10 additional NPCs defined
- [ ] Quest chains for each NPC
- [ ] Branching dialogue system
- [ ] Friendship actions implemented
- [ ] Gift system working
- [ ] Trust point calculations
- [ ] Visual improvements
- [ ] Ukrainian translations
- [ ] English translations
- [ ] TypeScript passes
- [ ] Build passes

---

**Waiting for approval to begin implementation.**
