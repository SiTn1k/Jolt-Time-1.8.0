# 🎮 Jolt Time - Game Flow & Academy Bug Audit

**Date:** 2026-06-22  
**Focus:** Game Start → End Game, Academy System, Ad System  
**Auditor:** OpenHands Agent

---

## 🎯 GAME FLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GAME FLOW                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [1. LOGIN] → [2. TUTORIAL] → [3. MAIN GAME] → [4. PRESTIGE]     │
│       ↓              ↓              ↓              ↓                 │
│  Telegram Auth   Story Quests   Tap/Generators   Reset + Bonus     │
│       ↓              ↓              ↓              ↓                 │
│  [5. EXPEDITION] → [6. ACADEMY] → [7. MUSEUM] → [8. END GAME]    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 CRITICAL BUGS FOUND

### BUG #1: ADS NOT INTEGRATED IN ACADEMY 🔴

**Location:** `src/expedition/adRewardsService.ts`

**Problem:**
```typescript
// Function exists but is NEVER called
export async function watchAdAndClaimReward(
  _reward: AdReward, // _reward is unused!
  telegramId: number
): Promise<{ success: boolean; error?: string }> {
  // ... implementation exists
}
```

**Why it doesn't work:**
1. The function is defined but not imported in `Academy.tsx`
2. The UI in `Academy` shows ads but doesn't call `watchAdAndClaimReward`
3. No button triggers the ad watching flow

**Impact:** Players cannot claim ad rewards in Academy

**Files affected:**
- `src/expedition/screens/Academy.tsx` - Missing ad button integration
- `src/expedition/components/` - Ad reward UI not connected

---

### BUG #2: DOUBLE AD SYSTEM CONFUSION 🔴

**Problem:** Two separate ad systems exist:

| System | Edge Function | Rewards |
|--------|---------------|---------|
| `adsgram.ts` → `adsgram-reward` | XP Boost only (x3, 30 min) |
| `claim-ad-reward` | Energy, Chest Bonus, Offline x2, Session Ad |

**Inconsistency:**
```typescript
// adsgram.ts - calls adsgram-reward
export async function grantXpBoostFromServer(telegramId: number) {
  const url = getEdgeFunctionUrl(); // returns /functions/v1/adsgram-reward
}

// BUT claim-ad-reward is separate and not used!
```

**Impact:** 
- `adsgram-reward` only grants XP boost
- `claim-ad-reward` exists but isn't called by the UI
- Players see ads but rewards may not work correctly

---

### BUG #3: ACADEMY_UNLOCK THRESHOLD = 0 🟠

**Location:** `src/expedition/screens/Academy.tsx:18`

```typescript
// Academy unlock threshold - reduced from 5000 to 3000 for better retention
// TEMP: Set to 0 for testing Academy functionality
const ACADEMY_PRESTIGE_THRESHOLD = 0;
```

**Problem:** Academy is unlocked for ALL players (testing code)

**Impact:** Players who should unlock at prestige 2 can access it immediately

---

### BUG #4: EXPEDITION STATE NOT SYNCING 🔴

**Location:** `src/expedition/store.ts`

**Problem:** Multiple expedition data sources:

```typescript
// expedition_state in game_progress
// expedition_progress in expedition_state table
// expeditions in store
```

**Duplicate data:**
| Table | Contains |
|-------|----------|
| `expedition_state` (table) | expedition progress |
| `expedition_progress` (table) | Same data? |
| `game_progress.expedition_state` | JSON blob |

**Impact:** 
- Data inconsistency between sources
- Unknown which source is authoritative
- Sync issues when completing expeditions

---

### BUG #5: ADSGRAM SDK NOT LOADING IN PRODUCTION 🟠

**Location:** `src/services/adsgram.ts`

```typescript
export function initAdsgram(): Sad | null {
  if (!window.Sad) {
    console.error('[adsgram] SDK not loaded - window.Sad is undefined');
    // Returns null!
    return null;
  }
  return window.Sad;
}
```

**Problem:** 
- SDK script not loaded in production build
- No fallback for when SDK is unavailable
- UI shows ad button but ad can't play

---

### BUG #6: PRESTIGE NOT SYNCING STATE 🟠

**Location:** `src/components/PrestigeSystem.tsx`

**Problem:**
```typescript
const handlePrestige = async () => {
  // ... perform prestige ...
  await rpcPrestige(level, ...);
  
  // Reload from server
  const data = await loadGameState(telegramId); // Maybe
  
  // But useGame state may not update!
};
```

**Impact:** After prestige, game state may be inconsistent

---

## 📋 ACADEMY SPECIFIC BUGS

### ACADEMY BUG #1: No Expedition Completion Flow 🔴

**Location:** `src/expedition/screens/Academy.tsx:272-313`

```typescript
<Card> {/* Building cards */}
  {/* No onClick handler for expeditions! */}
</Card>
```

**Problem:**
- Expeditions are displayed but not interactive
- No "Complete Expedition" button
- No callback when expedition finishes

---

### ACADEMY BUG #2: Story Quests Not Connected 🔴

**Location:** `src/expedition/components/StorySystem.tsx`

```typescript
const handleCompleteQuest = (questId: string) => {
  completeQuest(questId);
  // But how does this sync to server?
};
```

**Problem:**
- Quest completion is local only
- No RPC call to sync quest progress
- Reload page = progress lost

---

### ACADEMY BUG #3: Museum Not Syncing 🔴

**Location:** `src/expedition/screens/Academy.tsx`

```typescript
// Museum items are artifacts with status 'museum'
const museumItems = (artifacts || []).filter((a) => a.status === 'museum');

// But there's no save button or auto-save!
```

**Problem:**
- Museum state not persisted
- No server sync for museum collections
- Progress lost on reload

---

### ACADEMY BUG #4: Reputation System Unclear 🟡

**Location:** `src/expedition/screens/Academy.tsx:33`

```typescript
const reputation = useExpeditionStore((s) => s.reputation);
// But where does reputation come from?
// How is it calculated?
// Is it saved?
```

**Problem:**
- Reputation displayed but source unclear
- No calculation logic visible
- May not be persisted

---

## 🎬 GAME START BUGS

### START BUG #1: Tutorial Skip Issue 🟡

**Location:** `src/components/TutorialModal.tsx`

**Problem:**
```typescript
// Tutorial can be skipped but state may persist incorrectly
const handleSkip = () => {
  localStorage.setItem('tutorial_completed', 'true');
  // But game state may not be set correctly
};
```

---

### START BUG #2: First-Time User State 🟡

**Location:** `src/lib/storage.ts`

**Problem:**
- New users get default state
- But some fields may be undefined
- No migration for missing fields

---

## 🏁 GAME END (ALL ARCS COMPLETE) BUGS

### END BUG #1: No "Game Complete" State 🟠

**Location:** `src/data/epochs.ts`

**Problem:**
```typescript
// Last epoch is 'modern_ukraine'
// But no "You completed everything!" celebration
// No special rewards for completing all arcs
```

---

### END BUG #2: Arc 6-12 Story Not Implemented 🟡

**Location:** `src/expedition/storyData.ts`

**Problem:**
```typescript
// Only arcs 1-5 have story content
// Arcs 6-12 (WW2, Modern, etc.) have no quests
```

---

## 📊 BUG SEVERITY MATRIX

| Bug | Severity | Game Start | Academy | Ads | Expedition | End Game |
|-----|----------|-----------|---------|-----|------------|----------|
| #1 Ads not integrated | 🔴 CRITICAL | - | ✅ | ✅ | - | - |
| #2 Double ad system | 🔴 CRITICAL | - | ✅ | ✅ | - | - |
| #3 Threshold = 0 | 🟠 HIGH | - | ✅ | - | - | - |
| #4 Expedition sync | 🔴 CRITICAL | - | ✅ | - | ✅ | - |
| #5 SDK not loading | 🔴 CRITICAL | - | ✅ | ✅ | - | - |
| #6 Prestige sync | 🟠 HIGH | - | - | - | ✅ | ✅ |
| A1 Expedition flow | 🔴 CRITICAL | - | ✅ | - | ✅ | - |
| A2 Story not sync | 🔴 CRITICAL | - | ✅ | - | ✅ | - |
| A3 Museum not sync | 🔴 CRITICAL | - | ✅ | - | - | ✅ |
| A4 Reputation unclear | 🟡 MEDIUM | - | ✅ | - | - | - |
| S1 Tutorial skip | 🟡 MEDIUM | ✅ | - | - | - | - |
| E1 No game complete | 🟡 MEDIUM | - | - | - | - | ✅ |
| E2 Arcs 6-12 empty | 🟡 MEDIUM | - | ✅ | - | ✅ | ✅ |

---

## 🔧 FIX PLAN

### PHASE 1: ADS INTEGRATION (Critical)

| # | Task | Files | Time |
|---|------|-------|------|
| 1.1 | Connect `watchAdAndClaimReward` to Academy UI | `Academy.tsx` | 1h |
| 1.2 | Fix double ad system confusion | `adsgram.ts`, `claim-ad-reward` | 1h |
| 1.3 | Add SDK loading fallback | `adsgram.ts` | 30m |
| 1.4 | Test ad flow end-to-end | All | 1h |

### PHASE 2: ACADEMY SYNC (Critical)

| # | Task | Files | Time |
|---|------|-------|------|
| 2.1 | Add expedition completion RPC | `expedition-complete/` | 1h |
| 2.2 | Connect story quest to server | `StorySystem.tsx` | 1h |
| 2.3 | Sync museum state to server | `store.ts`, `validate-collection/` | 1h |
| 2.4 | Fix Academy unlock threshold | `Academy.tsx` | 10m |

### PHASE 3: DATA CONSISTENCY (High)

| # | Task | Files | Time |
|---|------|-------|------|
| 3.1 | Remove duplicate expedition tables | `migrations/` | 2h |
| 3.2 | Add prestige state sync | `PrestigeSystem.tsx` | 1h |
| 3.3 | Validate all state saves | `storage.ts` | 1h |

### PHASE 4: CONTENT (Medium)

| # | Task | Files | Time |
|---|------|-------|------|
| 4.1 | Add "Game Complete" celebration | `App.tsx` | 1h |
| 4.2 | Implement arcs 6-12 stories | `storyData.ts` | 4h |

---

## 📁 FILES REQUIRING CHANGES

### Phase 1:
```
src/expedition/screens/Academy.tsx           [MODIFY - add ad integration]
src/services/adsgram.ts                       [MODIFY - add fallback]
supabase/functions/adsgram-reward/          [MODIFY - consolidate]
src/expedition/adRewardsService.ts          [MODIFY - export properly]
```

### Phase 2:
```
src/expedition/components/StorySystem.tsx    [MODIFY - add RPC]
src/expedition/store.ts                      [MODIFY - add sync]
supabase/functions/expedition-complete/     [CREATE/MODIFY]
supabase/functions/validate-collection/      [MODIFY - museum sync]
```

### Phase 3:
```
supabase/migrations/                          [MODIFY - consolidate tables]
src/components/PrestigeSystem.tsx           [MODIFY - add sync]
src/lib/storage.ts                          [MODIFY - validate saves]
```

---

## ✅ QUICK WINS (Do First)

1. **Set ACADEMY_PRESTIGE_THRESHOLD to 2** (or proper value)
2. **Add console.log to ad system** to debug SDK loading
3. **Check expedition-sync is called** on expedition completion
4. **Verify story quests call RPC** on completion

---

**Потрібне підтвердження для початку роботи над Phase 1 (ADS INTEGRATION)?**