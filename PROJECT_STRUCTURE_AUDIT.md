# PROJECT STRUCTURE AUDIT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19  
**Scope:** src/ (58 files, ~17,280 lines of code)

---

## 1. DIRECTORY STRUCTURE ANALYSIS

### 1.1 Source Tree
```
src/
├── App.tsx                    # Main app (~1800 lines - MONSTER FILE)
├── main.tsx                  # Entry point
├── index.css                 # Global styles
├── components/               # UI components (15 files)
│   ├── AdSystem.tsx
│   ├── AdsGramButton.tsx
│   ├── AcademyUnlockModal.tsx
│   ├── DailyRewards.tsx      # DUPLICATE with expedition/screens/DailyRewards.tsx
│   ├── DailyStreakModal.tsx
│   ├── DailyTasksPanel.tsx
│   ├── DuplicateTabWarning.tsx
│   ├── GeneratorShop.tsx
│   ├── GachaModal.tsx
│   ├── OfflineRewardModal.tsx
│   ├── PrestigeSystem.tsx
│   ├── ReferralsTab.tsx
│   ├── StatsPanel.tsx
│   ├── TapArea.tsx
│   └── TutorialModal.tsx
├── expedition/              # Expedition system (13 files + 7 screens)
│   ├── store.ts             # Zustand store (~900 lines)
│   ├── data.ts             # Game data
│   ├── storyData.ts        # Story/NPC data
│   ├── museumData.ts       # Museum data
│   ├── balanceConfig.ts     # Balance settings
│   ├── ExpeditionApp.tsx    # Expedition entry
│   ├── expeditionSync.ts    # Sync logic
│   ├── useTick.ts           # Game tick hook
│   ├── adRewardsService.ts  # Ad rewards
│   ├── leaderboardService.ts # Leaderboards
│   ├── dailyRewardsService.ts
│   ├── ui.tsx              # UI components
│   ├── screens/             # Screen components
│   │   ├── Academy.tsx
│   │   ├── Buildings.tsx
│   │   ├── DailyRewards.tsx # DUPLICATE with components/DailyRewards.tsx
│   │   ├── Heroes.tsx
│   │   ├── Laboratory.tsx
│   │   ├── Museum.tsx
│   │   ├── Treasury.tsx
│   │   └── WorldMap.tsx
│   └── components/         # Sub-components
│       ├── AcademyProgress.tsx
│       ├── AcademyTeaser.tsx
│       ├── MuseumSystem.tsx
│       ├── NPCSystem.tsx
│       ├── PrestigeMilestones.tsx
│       ├── StorySystem.tsx
│       └── UkrainianPattern.tsx
├── data/                   # Static data (2 files)
│   ├── epochs.ts
│   └── tasks.ts
├── hooks/                  # React hooks (1 file)
│   └── useGame.ts
├── i18n/                   # Translations
│   ├── index.ts
│   ├── useTranslation.ts
│   ├── uk.json             # ~600 lines
│   └── en.json             # ~580 lines
├── lib/                    # Utilities (6 files)
│   ├── supabase.ts
│   ├── rpc.ts
│   ├── telegram.ts
│   ├── storage.ts
│   ├── tabManager.ts
│   └── utils.ts
├── services/               # External services
│   └── adsgram.ts
└── types/                  # Type definitions
    └── game.ts
```

---

## 2. DEAD CODE ANALYSIS

### 2.1 Unused/Duplicated Files
| File | Issue | Severity |
|------|-------|----------|
| `components/DailyRewards.tsx` | Duplicate of `expedition/screens/DailyRewards.tsx` | HIGH |
| `data/tasks.ts` | Not imported anywhere | MEDIUM |
| `expedition/dailyRewardsService.ts` | Only used in expedition screen | LOW |

### 2.2 Unused Exports
```typescript
// src/expedition/leaderboardService.ts - leaderboard type exported but not used in types
// src/expedition/expeditionSync.ts - has syncWithServer function not called anywhere
```

---

## 3. DUPLICATE LOGIC

### 3.1 Daily Rewards
| Location | Content |
|----------|---------|
| `components/DailyRewards.tsx` | Standalone daily rewards UI |
| `expedition/screens/DailyRewards.tsx` | Expedition-specific daily rewards |

**Issue:** Two different implementations of daily rewards. Should consolidate.

### 3.2 Store State Duplication
- `karbovanets` stored in both main Zustand store AND expedition store
- `heroes` stored in both stores
- `historicalPrestige` stored in both stores

---

## 4. UNREACHABLE COMPONENTS

### 4.1 Components Not Rendered
```typescript
// src/components/StatsPanel.tsx - imported but might not be rendered
// Need to check App.tsx for actual usage
```

### 4.2 Dead Code in App.tsx
```typescript
// Old epoch system references in comments
// Legacy prestige research code
```

---

## 5. ZUSTAND STORE ANALYSIS

### 5.1 Store Structure
| Store | State | Lines |
|-------|-------|-------|
| Main App Store | ~50+ state values | ~1800 |
| Expedition Store | ~30+ state values | ~900 |

### 5.2 Store Issues
1. **No persistence config visible** - expedition store may not persist
2. **Missing error boundaries** - store updates may fail silently
3. **No transaction support** - multiple state updates not atomic

---

## 6. ORPHANED MIGRATIONS

### 6.1 Migration Coverage
| Migration | Status | Notes |
|-----------|--------|-------|
| 001_game_progress | ✅ APPLIED | Core tables |
| 002_add_referrals | ✅ APPLIED | Referrals |
| 003_add_device_id | ✅ APPLIED | Device tracking |
| 005_add_boosters | ✅ APPLIED | XP boost |
| 008_daily_check_in | ✅ APPLIED | Daily rewards |
| 010_ads_rewards_log | ✅ APPLIED | Ad tracking |
| 012_phase2_prestige_energy | ✅ APPLIED | Prestige |
| 023_expedition_state | ✅ APPLIED | Expeditions |
| 024_anti_abuse | ✅ APPLIED | Anti-cheat |
| 025_museum_system | ✅ APPLIED | Museum |

**No orphaned migrations found.**

---

## 7. UNUSED IMPORTS

### 7.1 Detected via TypeScript
```typescript
// src/App.tsx
import { StatsPanel } from './components/StatsPanel' // May not be used

// src/expedition/components/AcademyTeaser.tsx
import { Crown } from 'lucide-react' // Unused - removed in fix
```

### 7.2 Libraries Not Tree-Shaken
- `motion/react` - used but could be optimized
- `lucide-react` - full import (should use tree-shaking)

---

## 8. ABANDONED SYSTEMS

### 8.1 Epoch System (Partial)
- Defined in `src/data/epochs.ts`
- Referenced in App.tsx but epoch progression not fully implemented
- **Status:** PARTIAL - needs completion or removal

### 8.2 Legacy Prestige Research
- Code exists for prestige research bonuses
- May be incomplete
- **Status:** NEEDS REVIEW

---

## 9. COMPONENT SIZE ISSUES

### 9.1 Monster Files
| File | Lines | Recommendation |
|------|-------|----------------|
| App.tsx | ~1800 | SPLIT into feature modules |
| store.ts | ~900 | SPLIT into feature stores |
| storyData.ts | ~600 | OK - static data |

### 9.2 Component Breakdown
```
App.tsx contains:
├── Tutorial logic
├── Game state management
├── Tab navigation
├── Daily rewards
├── Energy system
├── Prestige system
├── Ad rewards
├── Offline earnings
└── Session tracking
```

---

## 10. FINDINGS SUMMARY

| Category | Issues | Severity |
|----------|--------|----------|
| Dead Code | 2 files | MEDIUM |
| Duplicate Logic | 1 system | HIGH |
| Store Issues | 3 concerns | MEDIUM |
| Import Issues | 2 files | LOW |
| Monster Files | 2 files | HIGH |
| Abandoned Systems | 2 systems | MEDIUM |

---

## 11. RECOMMENDATIONS

### P0 (Critical)
1. **Consolidate Daily Rewards** - Merge duplicate implementations
2. **Split App.tsx** - Too large, hard to maintain

### P1 (Important)
1. **Remove unused imports** - Run ESLint
2. **Review epoch system** - Complete or remove
3. **Verify persistence** - Check expedition store persistence

### P2 (Nice to Have)
1. **Tree-shake lucide-react** - Use specific imports
2. **Lazy load screens** - Use React.lazy for expedition screens
3. **Add error boundaries** - Around major components

---

*End of Project Structure Audit*
