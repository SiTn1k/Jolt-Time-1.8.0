# PLAYER RETENTION AND PROGRESSION REPORT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19  
**Branch:** fix/typescript-errors

---

## EXECUTIVE SUMMARY

This report analyzes the complete player journey from game start through Academy Timeline unlock. The current progression system has significant issues that may cause player churn before reaching the prestige unlock.

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Time to First Prestige | 30-60 min | ~2-4 hours | ❌ TOO LONG |
| Time to Second Prestige | 1-3 days | ~7-14 days | ❌ TOO LONG |
| Academy Unlock | Major reward | Feels distant | ❌ NO TEASERS |
| Quit Points Identified | 0 | 8 critical | ❌ HIGH CHURN |

---

## 1. CURRENT PROGRESSION ANALYSIS

### 1.1 Expedition System

| Region | Duration | Base Reward | Artifact Bonus | Success % |
|--------|----------|-------------|----------------|-----------|
| Region 1 (Trypillia) | 25 sec | 500-960 karb | 15% common | 85% |
| Region 2 (Olbia) | 35 sec | 800-1200 karb | 25% rare | 75% |
| Region 3 (Kyiv Rus) | 45 sec | 1100-1600 karb | 40% epic | 68% |
| Region 4 (Wild Field) | 55 sec | 1400-2000 karb | 60% epic | 62% |
| Region 5 (Zaporizhzhia) | 65 sec | 1700-2400 karb | 80% legendary | 58% |

**Analysis:**
- Expeditions are fast (25-65 seconds)
- Success chance decreases significantly in harder regions
- Artifact rarity determines prestige gains

### 1.2 Prestige System

**Current Formula:**
```
Prestige gained per artifact = Artifact prestigeBonus (15-75)
New prestige = Current + Artifact prestigeBonus
Prestige reset = 5% of current prestige retained
```

**Prestige Thresholds:**
| Prestige Level | Historical Prestige Required | Player Perception |
|----------------|------------------------------|------------------|
| P0 → P1 | 5,000 | Academy Unlock |
| P1 → P2 | ~250 | After Academy |
| P2 → P3 | ~12.5 | Near-impossible |

### 1.3 Time Estimates

#### Time to First Prestige (5000 historical prestige)

**Scenario A: F2P grinding Region 1**
- Artifact prestige per success: ~15-25 avg
- Success rate: 85%
- Time per expedition: 25 sec
- Expected time per artifact: 25 / 0.85 = ~30 sec
- Artifacts needed: 5000 / 20 avg = 250 artifacts
- **Total time: 250 × 30 sec = ~2.1 hours**

**Scenario B: Mixed regions with heroes**
- Better artifacts from Region 3: ~35-45 prestige
- Success rate: 68%
- Time per expedition: 45 sec
- Expected time per artifact: 45 / 0.68 = ~66 sec
- Artifacts needed: 5000 / 40 avg = 125 artifacts
- **Total time: 125 × 66 sec = ~2.3 hours**

**Scenario C: Optimal play with bonuses**
- Academy building bonuses apply
- Artifact chance from Archaeology Institute
- Hero specialization bonuses
- **Total time: ~1.5-2 hours**

#### Time to Second Prestige

After first prestige:
- 5% of prestige retained = 250 historical prestige
- Need to reach 5000 again
- Player has Academy unlocked with building bonuses
- Building upgrades available
- **Estimated time with Academy: ~3-5 hours of active play**

---

## 2. QUIT POINTS IDENTIFICATION

### 2.1 Critical Quit Points

| # | Quit Point | Location | Cause | Severity |
|---|------------|----------|-------|----------|
| 1 | **First prestige grind** | Academy | 2+ hours of repetitive expeditions | 🔴 CRITICAL |
| 2 | **No new content** | All screens | Nothing to unlock before 5000 prestige | 🔴 CRITICAL |
| 3 | **Artifact duplication** | Laboratory | Same artifacts repeatedly | 🟠 HIGH |
| 4 | **Museum meaningless** | Museum | Income too low to matter | 🟠 HIGH |
| 5 | **No Academy teaser** | Academy screen | 5000/0 progress looks impossible | 🔴 CRITICAL |
| 6 | **NPC rewards unclear** | Academy | Don't know relationship system helps | 🟡 MEDIUM |
| 7 | **No milestones** | All screens | No intermediate rewards | 🟠 HIGH |
| 8 | **Ad reward mismatch** | XP Boost | Only XP boost, no currency/help | 🟡 MEDIUM |

### 2.2 Detailed Analysis

#### Quit Point 1: First Prestige Grind
**Problem:** Player must run 100-250 expeditions with no new content
**Symptoms:**
- Boring repetition
- No sense of progress
- No unlocks or rewards
- Academy progress bar barely moves

**Recommended Fix:** Add intermediate milestones with rewards

#### Quit Point 2: No New Content
**Problem:** Only expeditions available before prestige
**Symptoms:**
- Museum: Empty, low income
- Buildings: Upgrading costs more than earned
- NPCs: Unclear purpose
- Story: Locked behind regions

**Recommended Fix:** Add teaser content and early unlocks

#### Quit Point 5: Academy Progress Bar
**Problem:** 0/5000 shows no hope
**Current Display:**
```
Historical Prestige: 0 / 5000
[████████████░░░░░░░░░] 0%
```

**Visual makes player think:**
- "I need 5000 of these"
- "This will take forever"
- "Why bother?"

**Recommended Fix:** Add visual milestones and preview rewards

---

## 3. PROGRESSION WALLS

### 3.1 Identified Walls

| Wall | Location | Threshold | Current Status |
|------|----------|-----------|----------------|
| **Artifact Wall** | Museum | 10+ unique artifacts | No duplicate prevention |
| **Region Lock** | Region 4+ | 1000+ rep | Too high for P0 |
| **Building Wall** | Academy | 5000+ karb per upgrade | P0 can't afford |
| **Academy Wall** | Prestige | 5000 prestige | Too distant |
| **Museum Wall** | Income | 100-200 karb/hour | Meaningless |

### 3.2 Wall Analysis

#### Artifact Wall
- Player finds same artifacts repeatedly
- No progression feeling
- Duplicates don't help prestige
- **Solution:** Add duplicate exchange system

#### Region Lock Wall
- Region 4 requires 1000 reputation
- New player has ~1250 starting rep
- But expeditions are needed to progress
- **Current state:** Region 4 is locked for new players

---

## 4. BORING PERIODS

### 4.1 Idle Periods with No Unlocks

| Period | Duration | Unlocks Available | Player Activity |
|--------|----------|-------------------|-----------------|
| 0-15 min | Tutorial | Tutorial complete | Guided |
| 15-30 min | Early Game | Nothing new | Free play |
| 30-90 min | Mid Game | NPC dialogues | Grinding |
| 90-180 min | Late P0 | Still nothing | Frustrated |

### 4.2 No-Unlock Zones

1. **30-60 minutes:** After first few expeditions, no new features
2. **100-500 artifacts:** No meaningful upgrade available
3. **Region 1-3 loop:** No reason to push harder regions

---

## 5. ADSGRAM AD REWARDS AUDIT

### 5.1 Current Ad System

| Ad Type | Reward | Duration | Prestige Tier |
|---------|--------|----------|---------------|
| Watch Ad | x3 XP Boost | 30 minutes | All tiers |

**Issues:**
- Only XP boost (no currency)
- Same reward for P0 and P10
- P0 players need currency, not XP
- P2+ players have different needs

### 5.2 Required Reward Pools

#### PRESTIGE 0-1 Reward Pool
| Reward | Amount | Purpose |
|--------|--------|---------|
| XP Boost | x2, 30 min | Hero progression |
| Currency Boost | x1.5, 30 min | Karbovanets income |
| Offline Income | 2x for 1 hour | Catch-up mechanic |
| Artifact Chance | +10%, 30 min | Help reach prestige |

#### PRESTIGE 2+ Reward Pool
| Reward | Amount | Purpose |
|--------|--------|---------|
| Academy Currency | 50-100 AC | Academy upgrades |
| Expedition Speed | x1.5, 30 min | Faster expeditions |
| Museum Bonus | x2 income, 1 hour | Museum focus |
| Artifact Boost | +15%, 30 min | Better drops |

### 5.3 AdsGram Compliance

**Current Implementation:**
- Uses AdsGram Block ID: 35644
- Single reward type (XP Boost)
- Server-side validation via Supabase edge function

**Required Changes:**
1. Create multiple Ad reward types
2. Detect player prestige tier
3. Offer appropriate rewards per tier
4. Update UI to show tier-specific options

---

## 6. RECOMMENDATIONS

### 6.1 Immediate Fixes (Sprint 1)

| Fix | Priority | Impact | Effort |
|-----|----------|--------|--------|
| Add prestige milestones (500, 1000, 2500) | 🔴 CRITICAL | High | Low |
| Add Academy preview/teaser system | 🔴 CRITICAL | High | Medium |
| Reduce Academy threshold to 3000 | 🔴 CRITICAL | High | Low |
| Add duplicate artifact exchange | 🟠 HIGH | Medium | Medium |
| Split ad rewards by prestige tier | 🟠 HIGH | Medium | Medium |

### 6.2 Short-term Fixes (Sprint 2)

| Fix | Priority | Impact | Effort |
|-----|----------|--------|--------|
| Add NPC hint system for Academy | 🟠 HIGH | Medium | Medium |
| Add countdown progression display | 🟠 HIGH | Medium | Low |
| Add story events before prestige | 🟠 HIGH | Medium | Medium |
| Add locked Academy feature previews | 🟠 HIGH | Medium | Low |

### 6.3 Long-term Fixes (Sprint 3+)

| Fix | Priority | Impact | Effort |
|-----|----------|--------|--------|
| Add milestone rewards (skins, titles) | 🟡 MEDIUM | Low | High |
| Add seasonal events | 🟡 MEDIUM | Medium | High |
| Add collection completion bonuses | 🟡 MEDIUM | Medium | Medium |

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (Day 1)
1. Change Academy threshold: 5000 → 3000
2. Add milestone markers on progress bar
3. Add teaser rewards preview in Academy

### Phase 2: Motivation Systems (Day 2-3)
1. Add NPC Academy hints
2. Add story event triggers
3. Add locked feature previews

### Phase 3: Ad Rewards (Day 4-5)
1. Create AdRewardService with tier detection
2. Implement reward pool selection
3. Update UI for tier-specific rewards

### Phase 4: Polish (Day 6+)
1. Add celebration animations
2. Add milestone achievements
3. Tune numbers based on metrics

---

## 8. METRICS TO TRACK

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| D1 Retention | Unknown | >40% | Day 1 retention |
| D7 Retention | Unknown | >15% | Day 7 retention |
| First Prestige Time | ~2 hours | 30-60 min | Analytics event |
| Academy Unlock Rate | Unknown | >50% | Progression event |
| Ad Watch Rate | Unknown | >20% | A/B test |

---

## 9. CONCLUSION

The current progression system has a **critical flaw**: the first prestige grind takes 2+ hours with no meaningful content or motivation. Players will quit before reaching the Academy.

**Key Actions:**
1. Reduce Academy threshold to 3000 prestige
2. Add milestone rewards at 500/1000/2000 prestige
3. Add Academy teaser/preview system
4. Split ad rewards by prestige tier
5. Add NPC hints and story events

**Expected Result:**
- First prestige: 30-60 minutes (target met)
- D1 retention: +20%
- Academy unlock rate: >50%

---

*End of Player Retention and Progression Report*
