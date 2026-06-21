# PLAYER JOURNEY AUDIT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19  
**Branch:** fix/typescript-errors

---

## EXECUTIVE SUMMARY

Complete analysis of the optimized player journey from Game Start → First Prestige → Second Prestige → Academy Timeline. All progression systems have been rebalanced for maximum retention.

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Prestige Time | ~2 hours | **30-45 min** | **67% faster** |
| Second Prestige Time | ~7-14 days | **2-4 days** | **70% faster** |
| Academy Unlock | Too distant | **Immediately visible** | **Teaser system** |
| Milestone Rewards | None | **6 milestones** | **New feature** |

---

## 1. FIRST PRESTIGE OPTIMIZATION (30-45 minutes)

### 1.1 Balance Changes

| System | Before | After | Impact |
|--------|--------|-------|--------|
| Expedition Duration | 15-65 sec | **10-35 sec** | 40% faster |
| Expedition Rewards | 500-2400 | **875-4200** | 75% increase |
| Artifact Prestige | 15-75 | **22-112** | 50% increase |
| Quest Rewards | 1.5x | **2.0x** | 33% increase |
| Building Costs | 0.8x | **0.5x** | 37% cheaper |

### 1.2 Time Calculation

**Scenario: Active Player (10 min sessions, 3 sessions/day)**

| Phase | Duration | Activities |
|-------|----------|------------|
| Tutorial | 5 min | First artifact, first expedition |
| First Hour | 20 min | 10 expeditions, 5 artifacts |
| Second Hour | 15 min | 15 expeditions, 8 artifacts |
| **Total** | **~40 min** | **20+ artifacts → First Prestige** |

### 1.3 First 10 Minutes Experience

| Minute | Event |
|--------|-------|
| 0-1 | Tutorial: Game intro, tap to earn |
| 1-2 | Tutorial: Generators explained |
| 2-3 | Tutorial: Artifacts intro |
| 3-4 | Tutorial: Expeditions intro |
| 4-5 | Tutorial: Prestige system |
| 5-6 | Tutorial: Academy teaser |
| 6-7 | Tutorial: Boosters |
| 7-8 | First expedition launched |
| 8-9 | First artifact collected |
| 9-10 | First milestone reached |

### 1.4 First 30 Minutes Experience

| Minute | Unlock |
|--------|--------|
| 5 | First generator upgrade |
| 10 | First artifact sent to museum |
| 15 | **Milestone 500 - First Reward** |
| 20 | Second expedition |
| 25 | **Milestone 1000 - Second Reward** |
| 30 | **Milestone 1500 - Halfway to Academy!** |

---

## 2. SECOND PRESTIGE OPTIMIZATION (2-4 days)

### 2.1 Time Calculation

**Active Player:**
- 3-4 hours/day play
- ~300 artifacts/day
- **Time to Second Prestige: 2-3 days**

**Casual Player:**
- 1-2 hours/day play
- ~100 artifacts/day
- **Time to Second Prestige: 5-7 days**

### 2.2 Prestige Milestones

| Milestone | Prestige | Reward | Purpose |
|-----------|----------|--------|---------|
| 🎯 First Step | 500 | +500 karb | Early encouragement |
| ⭐ Discovery | 1000 | +1000 karb | Mid-game boost |
| 🔮 Explorer | 1500 | +1500 karb | Halfway marker |
| 🏆 Master | 2000 | +2000 karb | Late P0 motivation |
| 💎 Expert | 2500 | +2500 karb | Almost there! |
| 🏛️ **Academy** | 3000 | Title + Full Unlock | **GOAL ACHIEVED** |

---

## 3. ACADEMY CONVERSION OPTIMIZATION

### 3.1 Teaser System

**Academy Teaser Card** displays:
- Locked status with visual indicator
- Progress to unlock (X%)
- Preview of 4 features:
  - Heroes
  - Expeditions
  - Buildings
  - Story Campaign
- Call to action: "Collect artifacts"

### 3.2 NPC Story Hints

NPCs now include Academy mentions at relationship levels:
- Level 1: "I've heard about the Academy..."
- Level 2: "The Academy is watching you!"
- Level 3: "Keep collecting artifacts!"
- Level 4: "The Academy might invite you soon."
- Level 5: "The Academy will welcome you!"

### 3.3 Conversion Funnel

```
New Player → Tutorial (5 min)
    ↓
First Expedition (10 min)
    ↓
First Artifact (15 min)
    ↓
Milestone 500 (15 min) ← First reward!
    ↓
Milestone 1000 (20 min) ← Halfway excited!
    ↓
Milestone 1500 (25 min) ← Seeing progress!
    ↓
Milestone 2000 (30 min) ← Almost there!
    ↓
Milestone 2500 (35 min) ← So close!
    ↓
🎉 MILESTONE 3000 - ACADEMY UNLOCKED! (40 min)
    ↓
Welcome to Academy Timeline!
```

---

## 4. RETENTION RISKS & MITIGATION

### 4.1 Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Early quit (0-5 min) | HIGH | CRITICAL | Tutorial optimization |
| Tutorial boredom | MEDIUM | HIGH | Shorter tutorial, faster pacing |
| No rewards | MEDIUM | HIGH | Milestone rewards every 500 |
| Grind wall | MEDIUM | CRITICAL | Reduced costs, faster expeditions |
| No clear goal | LOW | HIGH | Academy teaser visible from start |
| Repetitive gameplay | MEDIUM | MEDIUM | Story events, NPC interactions |

### 4.2 Mitigation Strategies

1. **Early Rewards:** Every 500 prestige = instant reward
2. **Visible Progress:** Milestone markers on progress bar
3. **Clear Goal:** Academy teaser visible from minute 1
4. **Story Integration:** NPCs hint at Academy progression
5. **Variety:** Mix of expeditions, generators, story

---

## 5. PROGRESSION BOTTLENECKS

### 5.1 Identified Bottlenecks

| Bottleneck | Location | Severity | Solution |
|------------|----------|----------|----------|
| Artifact duplicates | Museum | MEDIUM | Milestone rewards help |
| Region unlock | Rep 1000+ | LOW | Started with basic region |
| Building upgrade | High cost | MEDIUM | 50% cost reduction |
| Hero assignment | 2 max slots | LOW | Milestones unlock slots |

### 5.2 No Critical Walls

After optimization, there are **no critical progression walls** in the first prestige journey.

---

## 6. ADSGRAM STRATEGY

### 6.1 Reward Tiers

**Prestige 0-1 (Beginner):**
| Reward | Duration | Value |
|--------|----------|-------|
| XP Boost | 30 min | x2 |
| Currency Boost | 30 min | x1.5 |
| Offline Income | 1 hour | x2 |
| Artifact Chance | 30 min | +10% |

**Prestige 2+ (Advanced):**
| Reward | Duration | Value |
|--------|----------|-------|
| Academy Currency | Instant | +50 AC |
| Expedition Speed | 30 min | x1.5 |
| Museum Bonus | 1 hour | x2 |
| Artifact Boost | 30 min | +15% |

### 6.2 Moderation Compliance

✅ All ads are voluntary (button-triggered only)  
✅ Rewards clearly described before watching  
✅ Server-side validation prevents exploitation  
✅ No forced watching or dark patterns  
✅ Privacy compliant (only Telegram ID shared)

---

## 7. FIRST SESSION CHECKLIST

### 7.1 First 10 Minutes

| Time | Experience | System |
|------|------------|--------|
| ✅ 0-1 min | Tutorial step 1 | Tutorial |
| ✅ 1-2 min | Tutorial step 2 | Generators |
| ✅ 2-3 min | Tutorial step 3 | Artifacts |
| ✅ 3-4 min | Tutorial step 4 | Expeditions |
| ✅ 4-5 min | Tutorial step 5 | Prestige |
| ✅ 5-6 min | Tutorial step 6 | Academy teaser |
| ✅ 6-7 min | Tutorial step 7 | Boosters |
| ✅ 7-8 min | First generator purchase | Economy |
| ✅ 8-9 min | First expedition launched | Expeditions |
| ✅ 9-10 min | First artifact collected | Museum |

### 7.2 First 30 Minutes

| Time | Experience | System |
|------|------------|--------|
| ✅ 10 min | Second expedition | Expeditions |
| ✅ 12 min | Artifact sent to museum | Museum |
| ✅ 15 min | **MILESTONE 500** | Milestones |
| ✅ 18 min | Third expedition | Expeditions |
| ✅ 20 min | First upgrade | Generators |
| ✅ 22 min | Fourth expedition | Expeditions |
| ✅ 25 min | **MILESTONE 1000** | Milestones |
| ✅ 28 min | Fifth expedition | Expeditions |
| ✅ 30 min | **MILESTONE 1500** | Milestones |

---

## 8. METRICS TO TRACK

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Prestige Time | <45 min | Analytics event |
| D1 Retention | >50% | Day 1 retention |
| D3 Retention | >30% | Day 3 retention |
| Academy Unlock Rate | >40% | Milestone reached |
| Ad Watch Rate | >25% | A/B test |
| First Session Length | >5 min | Session duration |

---

## 9. CONCLUSION

### 9.1 Journey Summary

```
START → Tutorial (5 min)
   ↓
GRIND → First Prestige (30-40 min)
   ↓
MILESTONES → Every 500 prestige = reward
   ↓
CELEBRATE → Academy Unlock at 3000
   ↓
CONTINUE → Academy Timeline
```

### 9.2 Key Optimizations

1. **67% faster first prestige** through balance changes
2. **6 milestone rewards** every 500 prestige
3. **Academy teaser** visible from minute 1
4. **NPC hints** create anticipation
5. **Tiered ad rewards** match player needs
6. **Tutorial** now covers key systems

### 9.3 Expected Results

| Metric | Current | Target | Confidence |
|--------|---------|--------|------------|
| First Prestige | 120 min | 30-45 min | HIGH |
| D1 Retention | Unknown | >50% | MEDIUM |
| Academy Unlock | Unknown | >40% | MEDIUM |
| Player Satisfaction | Unknown | >70% | LOW |

---

## 10. IMPLEMENTATION STATUS

| Component | Status | File |
|-----------|--------|------|
| Balance Config | ✅ DONE | `balanceConfig.ts` |
| Expeditions Speed | ✅ DONE | `store.ts` |
| Artifact Prestige | ✅ DONE | `store.ts` |
| Milestones System | ✅ DONE | `PrestigeMilestones.tsx` |
| Academy Teaser | ✅ DONE | `AcademyTeaser.tsx` |
| NPC Hints | ✅ DONE | `storyData.ts` |
| Ad Rewards | ✅ DONE | `adRewardsService.ts` |
| Tutorial Update | ✅ DONE | `TutorialModal.tsx` |
| UK Translations | ✅ DONE | `uk.json` |
| EN Translations | ✅ DONE | `en.json` |

---

*End of Player Journey Audit*
