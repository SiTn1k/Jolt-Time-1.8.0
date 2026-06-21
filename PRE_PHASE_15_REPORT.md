# PRE-PHASE 15 STABILITY CHECK REPORT

**Date:** 2026-06-20  
**Status:** ✅ READY FOR PHASE 15

---

## ✅ CHECK 1: status='collecting' Type Coverage

**Problem Found:**
- `ExpeditionStatus` type in `data.ts` was MISSING 'collecting' status
- Only had: `'traveling' | 'excavating' | 'returning' | 'completed'`

**Fixed:**
```typescript
// data.ts line 211
status: 'traveling' | 'excavating' | 'returning' | 'collecting' | 'completed';
```

**WorldMap.tsx Fix:**
```typescript
// Added handling for collecting status
const isCollecting = exp.status === 'collecting';
const ready = isCollecting || now >= exp.endsAt;
```

**getStatusLabel Fix:**
```typescript
case 'collecting': return t('expedition.status_completed');
```

---

## ✅ CHECK 2: checkCollectionCompletion() Atomic Updates

**Verified:** Line 479 correctly uses single atomic set()
```typescript
set((st) => ({
  reputation: st.reputation + repReward,
  karbovanets: st.karbovanets + carbReward,
  museumState: {
    ...st.museumState,
    completedCollections: completed,
    collectionProgress: newProgress,
  },
}));
```
**Result:** PASSED - No separate set() calls

---

## ✅ CHECK 3: NPC Hero Fragment Rewards

**Problem Found:**
- Level 6 relationship reward hardcoded `heroId: 'hero-1'`
- All fragments would go to same hero

**Fixed in store.ts:**
```typescript
// Handle hero fragment reward - award to random locked hero
const newHeroes = [...st.heroes];
if (heroFragReward) {
  const lockedHeroes = newHeroes.filter(h => !h.unlocked);
  const targetHeroes = lockedHeroes.length > 0 ? lockedHeroes : newHeroes;
  if (targetHeroes.length > 0) {
    const randomHero = targetHeroes[Math.floor(Math.random() * targetHeroes.length)];
    randomHero.fragments = (randomHero.fragments || 0) + heroFragReward.amount;
  }
}
```

**Result:** PASSED - Now awards to random locked hero

---

## ✅ CHECK 4: Artifact Assembly Duplicate Protection

**Verified:** Line 373-375 correctly excludes museum artifacts
```typescript
const ownedNames = state.artifacts
  .filter(a => a.status !== 'museum')  // ← Correctly excludes museum
  .map(a => a.name);
```

**Result:** PASSED - Only checks non-museum artifacts for duplicates

---

## ✅ CHECK 5: onRehydrateStorage Crash Recovery

**Verified:** Line 1520 correctly checks both conditions
```typescript
if (e.status === 'collecting' && !e.collected) {
  console.warn('[expedition] Crash recovery: fixing stuck expedition', e.id);
  return { ...e, status: 'returning' as const };
}
```

**Logic:**
- Only resets if BOTH conditions are true
- If `status='collecting'` but `collected=true` → NO reset (correct!)

**Result:** PASSED

---

## ✅ CHECK 6: Build Verification

| Command | Result |
|---------|--------|
| `npm run build` | ✅ Passed |
| `npm run lint` | ✅ 0 errors, 7 warnings (fast refresh only) |
| `tsc --noEmit` | ✅ Passed |

**Lint Fixes Applied:**
- Removed unused imports (TrendingUp, Settings, Trophy, Crown) from MuseumSystem.tsx
- Removed unused `calculateCollectionProgress` from Museum.tsx
- Removed unused `i` variable in Museum.tsx
- Changed `let` to `const` for fragReward in store.ts

---

## 🚀 PHASE 15 RECOMMENDATION

**Status:** ✅ READY TO START

Phase 15 (Story Progression System) can begin with confidence:

1. ✅ All status checks handle 'collecting' correctly
2. ✅ Atomic updates verified in critical paths
3. ✅ Hero fragments now distribute correctly
4. ✅ Artifact assembly duplicate protection works
5. ✅ Crash recovery logic verified
6. ✅ Build passes all checks

### Phase 15 Suggested Scope:
1. `currentArc` in storyState
2. `unlockedArcs: number[]`
3. `checkArcRequirements()` integration
4. Arc unlock toast notifications
5. Arc progress UI

**Do NOT add Arc 6-8 quests yet** - stabilize architecture first.
