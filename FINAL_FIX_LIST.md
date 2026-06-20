# FINAL FIX LIST
**For Production Release**

---

## PRIORITY 1: CRITICAL (Must Fix)

### 1.1 Daily Rewards UI - NOT INTEGRATED
**File:** `src/expedition/dailyRewardsService.ts`
**Issue:** Service exists but no UI component
**Status:** DEAD CODE

**Required Actions:**
- [ ] Create `src/expedition/screens/DailyRewards.tsx` component
- [ ] Add navigation entry in ExpeditionApp.tsx
- [ ] Add `dailyRewardState` to Zustand store
- [ ] Connect `claimReward()` to store actions
- [ ] Add UI button to trigger daily claim

---

### 1.2 Sync Triggers - NOT CONNECTED
**File:** `src/expedition/expeditionSync.ts`
**Issue:** `debouncedFullSync()` is never called
**Status:** SYNC DISABLED

**Required Actions:**
- [ ] Add store subscription in ExpeditionApp.tsx
- [ ] Call `syncToServer()` on state changes
- [ ] Or add middleware to store for auto-sync
- [ ] Add sync indicator to UI

---

### 1.3 Balance Multipliers - NOT APPLIED
**File:** `src/expedition/balanceConfig.ts`
**Issue:** Constants defined but never used
**Status:** IGNORED

**Required Actions:**
- [ ] Import multipliers in `store.ts`
- [ ] Apply `QUEST_REWARD_MULTIPLIER` in `completeQuest()`
- [ ] Apply `BUILDING_COST_MULTIPLIER` in `upgradeBuilding()`
- [ ] Apply `EXPEDITION_REWARD_MULTIPLIER` in `collectExpedition()`

---

### 1.4 claimNpcReward UI - MISSING BUTTON
**File:** `src/expedition/store.ts`
**Issue:** Function exists but no UI to trigger
**Status:** UNREACHABLE

**Required Actions:**
- [ ] Add "Claim Reward" button in NPCSystem.tsx
- [ ] Check `unlocksAtRelationship[currentLevel]` 
- [ ] Call `claimNpcReward()` with correct rewardKey
- [ ] Show reward modal/toast

---

## PRIORITY 2: HIGH (Should Fix)

### 2.1 Leaderboard Translations - HARDCODED
**File:** `src/expedition/components/MuseumSystem.tsx`
**Issue:** Labels hardcoded in RankingsTab

**Required Actions:**
- [ ] Move metricLabels to `uk.json`
- [ ] Use `t('expedition.metric_*)` for labels
- [ ] Add `en.json` translations

---

### 2.2 Leaderboard Not in Sync Cycle
**File:** `src/expedition/leaderboardService.ts`
**Issue:** Scores not saved during sync

**Required Actions:**
- [ ] Add `updatePlayerScore()` call to sync
- [ ] Add leaderboard sync to `debouncedFullSync()`
- [ ] Or call on prestige/artifact/hero changes

---

### 2.3 Building Timer Drift
**File:** `src/expedition/expeditionSync.ts`
**Issue:** `buildingUpgradeEndTimes` uses local timestamps

**Required Actions:**
- [ ] Store upgrade start time, not end time
- [ ] Calculate remaining time on load
- [ ] Add server-side time sync

---

### 2.4 Daily Reward State Not in Store
**File:** `src/expedition/store.ts`
**Issue:** DailyRewardState not persisted in Zustand

**Required Actions:**
- [ ] Add `dailyRewardState` to store interface
- [ ] Add initial state
- [ ] Sync with Supabase on load/save

---

## PRIORITY 3: MEDIUM (Nice to Have)

### 3.1 ExpeditionApp Telegram Viewport
**File:** `src/expedition/ExpeditionApp.tsx`
**Issue:** Missing viewport/safe-area meta

**Required Actions:**
- [ ] Add Telegram viewport meta
- [ ] Add safe-area padding
- [ ] Test in Telegram Mini App

---

### 3.2 Leaderboard Supabase Schema
**File:** `src/expedition/leaderboardService.ts`
**Issue:** `game_progress` table not verified

**Required Actions:**
- [ ] Create migration for game_progress table
- [ ] Verify table schema matches query
- [ ] Add indexes for telegram_id, metrics

---

### 3.3 Gacha Rewards Hardcoded
**File:** `src/expedition/components/GachaModal.tsx`
**Issue:** Reward pool defined in component

**Required Actions:**
- [ ] Move to data.ts or config
- [ ] Add to balanceConfig.ts
- [ ] Make tunable without code change

---

### 3.4 Missing Unit Tests
**Issue:** No test coverage

**Required Actions:**
- [ ] Add Vitest setup
- [ ] Test store actions
- [ ] Test sync functions
- [ ] Test balance calculations

---

## PRIORITY 4: LOW (Polish)

### 4.1 Error Messages Not Translated
**Issue:** Some error messages hardcoded

**Required Actions:**
- [ ] Audit all console.error / toast messages
- [ ] Move to translation files

---

### 4.2 Console Logs in Production
**File:** `src/expedition/expeditionSync.ts`
**Issue:** Debug console.log remaining

**Required Actions:**
- [ ] Remove `console.log('Academy data hydrated...')`
- [ ] Add production logging

---

### 4.3 Offline Mode
**Issue:** No offline detection

**Required Actions:**
- [ ] Add connection status indicator
- [ ] Queue actions when offline
- [ ] Retry on reconnect

---

## SUPABASE MIGRATIONS NEEDED

### Migration 1: game_progress Table
```sql
CREATE TABLE game_progress (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  historical_prestige INT DEFAULT 0,
  reputation INT DEFAULT 0,
  artifacts_count INT DEFAULT 0,
  hero_power_score INT DEFAULT 0,
  daily_reward_state JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 2: Indexes
```sql
CREATE INDEX idx_game_progress_prestige ON game_progress(historical_prestige DESC);
CREATE INDEX idx_game_progress_reputation ON game_progress(reputation DESC);
CREATE INDEX idx_game_progress_artifacts ON game_progress(artifacts_count DESC);
```

### Migration 3: RLS Policies
```sql
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all" ON game_progress FOR SELECT USING (true);
CREATE POLICY "Users can update own" ON game_progress FOR UPDATE USING (telegram_id = auth.uid());
```

---

## FILE CHECKLIST

| File | Priority | Action |
|------|----------|--------|
| `screens/DailyRewards.tsx` | 1.1 | CREATE |
| `screens/Buildings.tsx` | 1.1 | INTEGRATE |
| `store.ts` | 1.2, 1.3, 2.4 | UPDATE |
| `expeditionSync.ts` | 1.2, 2.2 | UPDATE |
| `MuseumSystem.tsx` | 1.4, 2.1 | UPDATE |
| `NPCSystem.tsx` | 1.4 | UPDATE |
| `ExpeditionApp.tsx` | 3.1 | UPDATE |
| `leaderboardService.ts` | 2.2 | UPDATE |
| `balanceConfig.ts` | N/A | IMPORT |

---

## ESTIMATED WORK

| Priority | Tasks | Time |
|----------|-------|------|
| P1 Critical | 4 | 4-6 hours |
| P2 High | 4 | 2-3 hours |
| P3 Medium | 4 | 2-3 hours |
| P4 Low | 3 | 1-2 hours |
| **Total** | **15** | **9-14 hours** |

---

## BEFORE RELEASE CHECKLIST

- [ ] All P1 issues resolved
- [ ] All P2 issues resolved
- [ ] Supabase migrations applied
- [ ] TypeScript passes
- [ ] Build succeeds
- [ ] Manual testing complete
- [ ] Telegram Mini App tested
- [ ] Cross-device sync tested
- [ ] Error boundaries added
- [ ] Analytics events added

---

*End of Fix List*
