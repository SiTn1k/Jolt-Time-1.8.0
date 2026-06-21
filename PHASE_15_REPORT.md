# PHASE 15 REPORT — Story Progression System

## 📋 Summary
Implemented story arc progression infrastructure with automatic unlocking and manual unlock UI.

---

## ✅ COMPLETED

### 1. Data Model Updates (`src/expedition/storyData.ts`)

**StoryProgress interface expanded:**
```ts
currentArc: number;      // Currently active arc
unlockedArcs: number[]; // All unlocked arc numbers
completedArcs: number[]; // Completed arc numbers
```

**Default values (initialStoryProgress):**
```ts
currentArc: 1;
unlockedArcs: [1]; // Arc 1 unlocked by default
completedArcs: [];
```

---

### 2. Store Methods (`src/expedition/store.ts`)

**`checkArcRequirements()`**
- Builds current state for requirement checking (reputation, prestige, quests, arcs, NPC relationships, museum collections, artifacts)
- Iterates through all STORY_ARCS not yet unlocked
- Uses existing `checkArcRequirements()` helper from storyData.ts
- Auto-unlocks arcs when requirements are met
- Shows toast: `"Нова сюжетна арка відкрита: {icon} {name}!"`
- Recursively checks for cascading unlocks

**`unlockArc(arcNumber: number): boolean`**
- Validates arc is not already unlocked
- Verifies requirements via `checkArcRequirements()`
- Adds arc to `unlockedArcs`
- Sets `currentArc` to newly unlocked arc
- Shows confirmation toast

---

### 3. Auto-Check Integration

`checkArcRequirements()` called automatically after:

| Event | Location |
|-------|----------|
| Quest completion | `completeQuest()` |
| Reputation gain (quest rewards) | Quest reward case |
| NPC relationship level-up | `interactWithNpc()` |
| Museum collection completion | `checkCollectionCompletion()` |
| NPC collection (reputation) | `collectNpc()` |

---

### 4. UI - Arc Tab (`src/expedition/components/StorySystem.tsx`)

**New tab: "arcs"**
- Tab icon: Star (imported from lucide-react)
- Tab label: `t('arc.arcs')` / "Arcs"

**Arc Overview Card:**
- Shows current arc icon and name
- Badge: `{unlockedCount} / {totalArcs}`

**Arc List:**
- Iterates through all STORY_ARCS
- Shows lock icon (🔒) for locked arcs
- Shows arc icon for unlocked arcs
- Shows arc name and description
- **Locked arcs display requirements** (up to 3 missing items)
- **"Ready" arcs show green "Відкрити" button**
- Current arc highlighted with gold border

**Style:** Uses existing Card system, no neon/absolute positioning/overflow

---

### 5. Academy Screen Integration (`src/expedition/screens/Academy.tsx`)

- Added `unlockArc` store selector
- Added `handleUnlockArc` handler
- Passed `onUnlockArc` prop to StorySystem

---

## 📁 FILES CHANGED

| File | Lines Added | Description |
|------|-------------|-------------|
| `src/expedition/storyData.ts` | +8 | Added arc fields to StoryProgress |
| `src/expedition/store.ts` | +104 | checkArcRequirements, unlockArc, auto-checks |
| `src/expedition/components/StorySystem.tsx` | +130 | Arc tab UI |
| `src/expedition/screens/Academy.tsx` | +12 | Wire up unlockArc handler |

**Total: 4 files, ~254 lines added**

---

## ⚠️ RISKS

1. **Partial state for requirement checking in UI**: `getCurrentState()` in StorySystem passes 0 for `reputation` and `historicalPrestige`. Full state not available in component. Requirements may show incorrectly for arcs requiring these stats.

2. **Cascading unlock recursion**: Uses `setTimeout` to avoid infinite loop. Could miss arcs if requirements change during timeout.

3. **No manual arc completion tracking**: `completedArcs` is tracked but no logic to mark arcs complete yet.

---

## 🔍 VALIDATION

```bash
✅ npx tsc --noEmit       # PASSED
✅ npm run lint           # PASSED (0 errors, 7 warnings pre-existing)
✅ npm run build          # PASSED
```

---

## 📝 COMMIT

```
commit 7cf2ae9ae160aa5b8949e32f860d43117d7b3884
feat: implement story arc progression system (Phase 15)
```

**Status:** Pushed to `origin/fix/typescript-errors` (local commit ready)

---

## ⏸️ PHASE 16

**DO NOT begin automatically.** Awaiting next phase instruction.
