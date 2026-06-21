# PHASE 3 REPORT: STORY SYSTEM

**Date:** 2026-06-19
**Status:** Ready for Implementation

---

## CORE RULES (MANDATORY)

1. **Academy Timeline = Phase 2**, not a separate game
2. **Single economy** - no duplicate currencies
3. **Unlock:** `state.prestigeLevel >= 2` ONLY
4. **NO new state:** No rebirthLevel, academyPrestige, academyUnlockedState
5. **Ukrainian default:** `defaultLocale = "uk"`
6. **Supabase persistence** for all new systems

---

## 1. CURRENT STATE

### 1.1 Existing NPC System

**Location:** `src/expedition/components/NPCSystem.tsx`

**Current Implementation:**
- Simple marker on courtyard map
- Click to talk dialog
- Work toggle
- Income collection

**Missing:**
- Portrait images
- Biography text
- Story progression
- Quest system
- Rewards integration

---

## 2. REQUIRED NPC DATA

### 2.1 NPC Interface

```typescript
interface NPC {
  id: string;
  name: string;
  portrait: string; // URL to image
  biography: string;
  role: NpcRole;
  roleLabel: string;
  dialogues: string[];
  quests?: Quest[];
}

interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: Objective[];
  rewards: Reward;
  dialogue: {
    start: string;
    progress: string;
    complete: string;
  };
}

interface Objective {
  type: 'collect' | 'expedition' | 'visit' | 'prestige';
  target: string;
  count: number;
  current: number;
}

interface Reward {
  type: 'karbovanets' | 'xp' | 'reputation' | 'artifact';
  amount: number;
  itemId?: string;
}
```

---

## 3. NPC CATEGORIES

### 3.1 Required NPC Types

| Role | Ukrainian Name | Description |
|------|---------------|-------------|
| `knyaz` | Князь | Ruler of Kyivan Rus |
| `hetman` | Гетьман | Cossack leader |
| `researcher` | Дослідник | Academy researcher |
| `archaeologist` | Археолог | Field excavator |
| `historian` | Історик | Document analyzer |
| `guard` | Вартовий | Academy security |

### 3.2 Epoch-Specific NPCs

**Trypillia (1-50):**
- `trypillia_chief` — Племінна рада
- `trypillia_shaman` — Шаман

**Scythia (51-100):**
- `scythian_warrior` — Скіфський воїн
- `scythian_goldsmith` — Златокузнець

**Kyiv Rus (151-250):**
- `knyaz_vladimir` — Князь Володимир
- `monk_pereiaslav` — Печерський ченець

**Cossack (421-550):**
- `hetman_khmelnytsky` — Гетьман Хмельницький
- `cossack_otaman` — Отаман

**Independence (951+):**
- `modern_historian` — Сучасний історик
- `museum_curator` — Куратор музею

---

## 4. STORY INTEGRATION

### 4.1 Story Flow per Epoch

Each epoch has:
1. **Introduction** — NPC explains the era
2. **Main Story** — Quests to complete
3. **Completion** — Rewards and progression

### 4.2 Example: Trypillia

**NPC:** Племінна рада (Chief Council)

**Dialogues:**
- Start: "Ласкаві stranger. Наше плем'я потребує допомоги..."
- Progress: "Ти чесно працюєш. Продовжуй..."
- Complete: "Ти показав себе гідним! Прийми цей дар..."

**Quests:**
1. "Збери 10 артефактів трипільської культури"
2. "Заверши 3 експедиції до Трипілля"
3. "Побудуй Хатину дослідника"

---

## 5. FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/expedition/data/npcs.ts` | NPC definitions with portraits, dialogues, quests |
| `src/expedition/components/StoryModal.tsx` | Story display component |
| `src/expedition/components/QuestPanel.tsx` | Active quest tracker |

---

## 6. FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/expedition/store.ts` | Add quest state |
| `src/expedition/components/NPCSystem.tsx` | Add portrait, biography, quest integration |
| `src/i18n/uk.json` | Add story translations |
| `src/i18n/en.json` | Add story translations |

---

## 7. TRANSLATION KEYS REQUIRED

```json
{
  "story": {
    "introduction": "Вступ",
    "quest": "Завдання",
    "rewards": "Нагороди",
    "progress": "Прогрес",
    "complete": "Завершено",
    "start_quest": "Розпочати"
  },
  "npc": {
    "biography": "Біографія",
    "quests_available": "Завдання доступні",
    "quest_completed": "Завдання виконано"
  }
}
```

---

## 8. NO CHANGES REQUIRED

- `supabase/functions/` — unchanged
- `supabase/migrations/` — unchanged
- `src/App.tsx` — unchanged
- `src/hooks/useGame.ts` — unchanged

---

## 9. VERIFICATION CHECKLIST

- [ ] NPC portrait images sourced
- [ ] Biography text written for each NPC
- [ ] Quest system implemented
- [ ] Story progression tied to epochs
- [ ] Rewards properly distributed
- [ ] Ukrainian translations complete
- [ ] English translations complete

---

**Waiting for approval to begin implementation.**
