# Jolt Time - Release Readiness Report
## Version 1.8.0 - Post Academy Removal

---

## Game Architecture

### Overview
Jolt Time is a Telegram Mini App idle/clicker game about Ukrainian history. Players progress through 12 historical epochs by tapping and purchasing generators.

### Core Systems

#### 1. Game Progression
- **Levels**: 1-999 (soft cap at 999)
- **Prestige System**: Level 960+ in Independence epoch enables prestige
- **XP Curve**: Extended for March 2027 target (8-10x slower than original)
- **Epochs**: 12 historical periods from Trypillia (5000 BC) to Independence (1991+)

#### 2. Main Game (App.tsx)
- Tap area with visual feedback
- Generator shop (5 tiers per epoch)
- Artifact collection system
- Daily rewards and tasks
- Prestige system with Laboratory upgrades
- Referral system
- Ad integration (AdsGram)

#### 3. Expedition System (expedition/)
- Museum collection
- Heroes and expeditions
- Buildings and upgrades
- Quest system with NPCs
- Story progression
- **NOTE: This system is currently not rendered in the main app**

### Database Tables

#### Core Tables
| Table | Purpose |
|-------|---------|
| game_progress | Main player state (level, currency, generators, prestige) |
| prestige_records | History of prestige actions |
| artifacts | Player's collected artifacts |
| heroes | Hero units for expeditions |
| academy_artifacts | Academy-specific artifacts (to be removed) |
| academy_progress | Academy state (to be removed) |
| academy_expeditions | Academy expeditions (to be removed) |
| academy_research | Academy research (to be removed) |
| academy_heroes | Academy hero units (to be removed) |
| academy_progression | Academy progression state (to be removed) |
| museum_reputation | Museum reputation (to be removed) |

#### Supporting Tables
| Table | Purpose |
|-------|---------|
| player_sessions | Session tracking |
| retention_notifications | Push notification history |
| ads_rewards_log | Ad viewing history |
| ad_views | Daily ad view tracking |
| daily_rewards | Daily reward tracking |

### Key Changes Made (v1.8.0)

#### 1. Academy System Removed
- **Removed** all prestige >= 2 functionality
- **Removed** ExpeditionApp lazy loading (never rendered anyway)
- **Removed** resetExpeditionOnPrestige call on prestige
- **Removed** 4 secret artifacts with requiredPrestige 2-3:
  - secret_golden_fleece
  - secret_kyiv_sophia_secret  
  - secret_cossack_constitution
  - secret_modern_constitution_1996
- **Updated** balanceConfig comments to reflect Prestige 1 only
- **Updated** send-retention-reminders function (removed LATE_GAME_MESSAGES)

#### 2. Game Economy Extended to March 2027
- XP curve now 8-10x slower
- Target progression:
  - Day 3-5: First prestige ready (level 950)
  - Month 1: Prestige 1 player at level 100+
  - Month 3: Prestige 1 player at level 200+
  - Month 6: Prestige 1 player at level 400+
  - Month 9: Prestige 1 player at level 600+
  - Month 12 (March 2027): Prestige 1 player at level 800+

#### 3. Push Notifications Updated
- Removed all "Academy" references
- Updated messages to reference Museum instead
- Retention messages simplified for Prestige 1 only

#### 4. Translation Updates
- uk.json: Academy references → Museum
- en.json: Academy references updated

### Files Modified
```
src/App.tsx                           | Removed lazy ExpeditionApp import
src/data/epochs.ts                    | Removed 4 secret artifacts (prestige 2-3)
src/expedition/balanceConfig.ts      | Updated comments, removed Academy targets
src/hooks/useGame.ts                  | Extended XP curve for March 2027
src/services/NotificationService.ts    | Removed Academy references
supabase/functions/send-retention-    | Removed LATE_GAME_MESSAGES
reminders/index.ts                     | Updated prestige logic
```

### Build Status
- ✅ TypeScript compilation: PASS
- ✅ Vite build: PASS (3.66s)
- ✅ ESLint: 6 errors (non-blocking, pre-existing)
- ⚠️ Some unused imports warnings

### Remaining Issues to Address (Optional)

1. **ExpeditionApp**: Not rendered anywhere but still bundled
2. **Academy tables in DB**: Need SQL migration to drop
3. **adRewardsService.ts**: Still has P2_PLUS_REWARDS
4. **expedition/**: Large code folder not used in main app

### For Production Deployment

1. **Database Migration** (recommended):
```sql
-- Drop academy-related tables
DROP TABLE IF EXISTS academy_artifacts;
DROP TABLE IF EXISTS academy_progress;
DROP TABLE IF EXISTS academy_expeditions;
DROP TABLE IF EXISTS academy_research;
DROP TABLE IF EXISTS academy_heroes;
DROP TABLE IF EXISTS academy_progression;
DROP TABLE IF EXISTS museum_reputation;
```

2. **Environment Variables**:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - TELEGRAM_BOT_TOKEN (for push notifications)

3. **Supabase Edge Functions** (deploy via Supabase CLI):
   - claim-ad-reward
   - claim-daily-reward
   - claim-offline-income
   - collect-museum-income
   - daily-rewards
   - expedition-complete
   - expedition-rewards
   - expedition-sync
   - game-action
   - generate-artifact
   - load-game
   - open-chest
   - perform-prestige
   - prestige-reward
   - purchase-premium
   - save-game
   - send-retention-reminders
   - story-quests
   - telegram-payments
   - track-session
   - validate-collection

### Game Balance Summary

| Metric | Value |
|--------|-------|
| Starting Level | 1 |
| Prestige Requirement | Level 960 + Independence epoch |
| Prestige 1 Only | Yes (Academy disabled) |
| XP Curve | 8-10x slower |
| Target: March 2027 | Level 800+ for active Prestige 1 players |
| Energy System | Active for Prestige 1+ |
| Artifact System | Active with 11 secret artifacts (prestige 1) |
| Daily Tasks | 3 tasks per day |
| Ads | Session ads (20 min), Chest ads (every 10th) |

---

**Report Generated**: June 29, 2026
**Version**: 1.8.0
**Status**: Release Ready (Academy Removed)
