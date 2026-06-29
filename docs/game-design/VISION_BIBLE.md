# JOLT TIME MINI — VISION BIBLE
## Telegram Mini App about Ukrainian History

**Document Version:** 1.0  
**Date:** 2026-06-29  
**Status:** Foundation Document for Future Development  
**Role:** Lead Game Director

---

## 1. PROJECT OVERVIEW

### 1.1 What Is Jolt Time Mini?

**Jolt Time Mini** is a Telegram Mini App that serves as a standalone historical adventure game centered on Ukrainian history. It is designed to:

- Run natively within Telegram (no installation required)
- Educate players about Ukrainian history through gameplay
- Generate revenue through ad monetization and Telegram Stars
- Build a community that will eventually support the main Jolt Time game
- Serve as a proof-of-concept for gameplay mechanics

### 1.2 Relationship to Main Game

| Aspect | Jolt Time Mini | Jolt Time (Main Game) |
|--------|---------------|----------------------|
| **Purpose** | Community building, validation, revenue | Full AAA experience |
| **Platform** | Telegram Mini App | Standalone app + web |
| **Scope** | Single historical thread | Complex multi-thread |
| **Release Timeline** | BEFORE main game | AFTER Mini |
| **Monetization** | Ads + Telegram Stars | Full economy |
| **Target** | Mass market (Ukrainian diaspora, youth) | Hardcore gamers |

### 1.3 Core Vision Statement

> *"Through the lens of Ukrainian history, Jolt Time Mini transforms players into time-traveling historians. Every tap builds an artifact. Every expedition uncovers a story. Every collection preserves a legacy."*

---

## 2. PROJECT CONTEXT

### 2.1 What Already Exists

The repository contains a **fully functional idle/incremental game** with the following implemented systems:

#### Game Architecture
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **State Management:** Zustand (two stores: `useGame.ts` and `expedition/store.ts`)
- **Backend:** Supabase (Edge Functions + PostgreSQL + RLS)
- **Authentication:** Telegram Mini App SDK
- **Payments:** Telegram Stars + Supabase Edge Functions

#### Implemented Systems

**Main Game Loop (Tap/Idle Layer):**
- Energy system (after Prestige 1+)
- Generator-based passive income
- 12 epochs of Ukrainian history (Trypillia → Independence)
- Level progression with XP
- Prestige/rebirth system
- Daily tasks and check-in rewards
- Artifact collection with fragment-based upgrades
- Referral system

**Expedition System (Main Feature):**
- Hero recruitment and management (6+ heroes with specializations)
- Region-based expeditions with difficulty tiers
- Artifact restoration in Laboratory
- Museum with exhibitions and collections
- NPC system with dialogues and trust relationships
- Academy with building upgrades
- World Map for navigation
- Story/Quest system with NPC relationships

**Economy:**
- Currency: Karbovanets (in-game), Stars (premium)
- Reputation system
- Historical Prestige points
- Museum visitors income

**Live Operations:**
- Daily/Weekly challenges
- Seasonal events (Independence Day, Christmas, Easter, Pokrova)
- Achievement system
- Push notifications

**Monetization:**
- Telegram Stars shop
- Premium cosmetics (frames, badges)
- Rewarded ads (12 ad types)
- Daily ad limits
- Subscription-style boosts

### 2.2 Current State

- **Maturity:** Phase 35+ of development
- **Localization:** Ukrainian language primary, i18n infrastructure exists
- **Mobile:** Optimized for Telegram Mini Apps
- **Persistence:** Cloud save via Supabase
- **Testing:** Unit and e2e tests in place

---

## 3. CORE GAME LOOP

### 3.1 Primary Loop (Main Game)

```
Player Enters Game
        ↓
[Tap] → Gain Energy + XP
        ↓
[Generators] → Passive Income (Karbovanets)
        ↓
[Epochs] → Progress Through Ukrainian History
        ↓
[Prestige] → Reset with Permanent Bonuses
        ↓
[Unlock Expedition System] → Prestige Level 2+
        ↓
[Repeat with Enhanced Stats]
```

### 3.2 Expedition Loop (Core Feature)

```
Enter Expedition System (Prestige 2+)
        ↓
[World Map] → Select Region (Era-based)
        ↓
[Heroes] → Assign Team (Leader + Specialists)
        ↓
[Launch Expedition] → Wait Timer (10-60 seconds real-time)
        ↓
[Outcome] → Success/Failure + Rewards
        ↓
[Artifacts] → Send to Laboratory for Restoration
        ↓
[Restoration Complete] → Add to Museum
        ↓
[Museum] → Complete Collections → Bonus Rewards
        ↓
[Story/Quests] → Unlock via Progress
        ↓
[Repeat]
```

### 3.3 Secondary Loops

| Loop | Trigger | Duration | Reward |
|------|---------|----------|--------|
| Daily Check-in | Every 24h | Instant | Karbovanets, XP, Tickets |
| Daily Tasks | Every UTC day | Multiple per day | XP, Reputation, Currency |
| Weekly Challenges | Every Monday | Week-long | Large XP, Reputation, Boosts |
| Seasonal Events | Calendar-based | 2-3 days | Special artifacts, x2 rewards |
| NPC Interactions | On-demand | Conversations | Trust points, Bonuses |

---

## 4. CORE PILLARS

### 4.1 Fun

**Definition:** Every interaction should feel rewarding and engaging.

**Implementation:**
- Satisfying tap feedback with haptic feedback
- Visual and audio celebrations for milestones
- Random expedition events add unpredictability
- Gacha-style artifact acquisition creates anticipation
- Hero recruitment with varied rarities and stats

**Anti-patterns to Avoid:**
- Repetitive actions without variation
- Frustrating difficulty spikes
- Unclear progression paths
- Unfair RNG without player agency

### 4.2 Learning

**Definition:** Players should absorb Ukrainian history naturally through gameplay.

**Implementation:**
- Each epoch represents a historical period with accurate generators
- Artifacts include real historical descriptions
- Heroes are based on actual Ukrainian historical figures
- Regions correspond to real locations
- Story quests teach historical events through NPC dialogues
- Museum collections tell coherent historical narratives

**Educational Goals:**
- Understanding chronological Ukrainian history
- Learning key historical figures and their contributions
- Recognizing important artifacts and cultural heritage
- Appreciating the complexity of Ukrainian statehood

### 4.3 Discovery

**Definition:** The game should reward exploration and curiosity.

**Implementation:**
- Expedition rewards are partially random (artifact rarity)
- Secret artifacts require prestige resets to unlock
- Hidden NPC dialogues and backstories
- Museum secrets and legendary collections
- Expedition random events (bonus artifacts, hero XP, rare finds)
- New regions unlock as player progresses

### 4.4 Collection

**Definition:** Collecting is the primary long-term motivation.

**Implementation:**
- **Artifacts:** 50+ artifacts across 12 epochs, each with unique bonuses
- **Collections:** Museum sets that unlock when complete (5 base + 3 legendary)
- **Heroes:** 6+ unique heroes with specializations and biographies
- **NPCs:** 6 NPCs with relationship levels (1-6)
- **Cosmetic Frames:** 4 purchasable frames
- **Chat Badges:** 4 achievement-based badges

**Collection Hierarchy:**
```
Artifacts < Collections < Complete Epoch Set < Legendary Collections
```

### 4.5 Progression

**Definition:** Clear, measurable advancement at every moment.

**Implementation:**
- **Player Level:** 1-1000+ (core progression)
- **Prestige Level:** Unlimited resets with permanent bonuses
- **Academy Level:** 1+ (expedition progression)
- **Epoch Level:** 12 epochs (historical progression)
- **Hero Levels:** 1-20 per hero
- **Hero Ranks:** Novice → Adept → Expert → Master → Legend
- **NPC Trust:** Level 1-6 per NPC
- **Museum Rank:** Based on collections completed

### 4.6 Exploration

**Definition:** The game world should feel vast and worth exploring.

**Implementation:**
- **12 Epochs:** Trypillia → Independence (5000 BC → Present)
- **17+ Regions:** Each with unique artifacts and difficulty
- **World Map:** Visual exploration interface
- **Hidden Areas:** Unlockable through prestige/story
- **Cross-epoch Content:** Secret artifacts span multiple periods

### 4.7 Long-Term Goals

**Definition:** Players should always have something to work toward.

**Implementation:**
- **Short-term:** Daily tasks, current expedition, artifact restoration
- **Medium-term:** Complete museum collections, max hero levels
- **Long-term:** All epochs unlocked, prestige 10+, legendary collections
- **Lifetime:** Perfect museum, all NPCs at trust level 6, story arcs complete

### 4.8 Daily Motivation

**Definition:** Players should want to return every day.

**Implementation:**
- **Daily Check-in:** Consecutive rewards with streak bonuses
- **Daily Tasks:** Fresh challenges every UTC day
- **Daily Rewards:** Free expedition boost, XP, tickets
- **Museum Income:** Passive karbovanets generation
- **Expedition Timers:** May complete while away (with offline bonuses)
- **Seasonal Events:** Limited-time content creates urgency

### 4.9 Social Potential

**Definition:** Players should feel part of a community.

**Current Implementation:**
- Referral system with rewards
- Leaderboard (global rankings)

**Future Potential:**
- Guild system
- Shared museum contributions
- Friend expeditions
- Community challenges
- Telegram group integration

### 4.10 Live Events

**Definition:** Regular content updates keep the game fresh.

**Implementation:**
- **Seasonal Events:** Independence Day, Christmas, Easter, Pokrova
- **Event Challenges:** Special tasks during events
- **Event Artifacts:** Unique rewards for participation
- **Bonus Multipliers:** Up to 2x rewards during events

**Event Calendar:**
| Date | Event | Type | Bonus |
|------|-------|------|-------|
| August 24-26 | Independence Day | National | 2.0x |
| October 14-16 | Pokrova | Historical | 1.5x |
| December 25-26 | Christmas | Seasonal | 1.5x |
| April 20-21 | Easter | Seasonal | 1.5x |

---

## 5. TARGET AUDIENCE

### 5.1 Primary Audience

**Ukrainian Youth (14-35 years old)**
- Native or heritage Ukrainian speakers
- Active Telegram users
- Interest in Ukrainian history and culture
- Mobile-first gaming habits
- May have limited gaming experience

**Motivation:** Cultural connection, entertainment, casual competition

### 5.2 Secondary Audience

**Ukrainian Diaspora (25-55 years old)**
- Living outside Ukraine
- Interest in maintaining cultural connection
- May share with family members

**Motivation:** Heritage preservation, teaching children, nostalgia

### 5.3 Tertiary Audience

**Gaming Enthusiasts (18-40)**
- Fans of idle/incremental games
- Completionists and collectors
- May not have Ukrainian background

**Motivation:** Game quality, progression systems, collection mechanics

### 5.4 Player Expectations

| Metric | Target |
|--------|--------|
| **Session Length** | 5-15 minutes per session |
| **Daily Playtime** | 20-45 minutes total |
| **Retention D1** | 40%+ |
| **Retention D7** | 20%+ |
| **Retention D30** | 10%+ |
| **Session Frequency** | 2-5 sessions per day |
| **Session Purpose** | Daily tasks, collection progress, social |

---

## 6. DESIGN PHILOSOPHY

### 6.1 Core Principles

#### Easy to Start
- One-tap gameplay for core loop
- Clear first-time user experience
- Guided tutorial
- Obvious next action at every step
- Telegram authentication (no account creation)

#### Hard to Master
- Deep expedition system with team optimization
- Museum collection strategy
- NPC relationship management
- Prestige planning and optimization
- Generator economy mastery
- Event participation optimization

#### No Pay-to-Win
- All purchasable items are convenience or cosmetics
- Rewarded ads provide equal benefits to paid items
- Prestige reset costs cannot be purchased
- Leaderboard based on skill/progression, not spending

#### Respect Player's Time
- Offline progress calculation
- Timers run in real-time (not game-time)
- Daily tasks completable in 10 minutes
- No forced watching of content
- Auto-save progress

#### Reward Curiosity
- Hidden dialogue options
- Secret artifact discovery
- NPC backstory reveals
- Museum secrets
- Exploration bonuses

#### Historical Authenticity
- Real historical periods
- Accurate artifact descriptions
- Heroes based on actual figures
- Events tied to real dates
- Educational facts in item descriptions

#### Beautiful Presentation
- Consistent Ukrainian-inspired visual theme
- Ukrainian pattern decorative elements
- High-quality iconography
- Smooth animations
- Mobile-optimized UI

#### Positive Emotional Experience
- Celebratory feedback for achievements
- No negative feedback (no punishment mechanics)
- Encouraging NPC dialogues
- Community-building messaging
- National pride themes

#### Educational Without Feeling Like School
- Learning through doing, not reading
- Historical context in optional tooltips
- Story quests teach naturally
- Museum descriptions are brief and engaging
- Achievements reward knowledge

---

## 7. GAME VALUES

Every feature must align with these values:

### 7.1 Educational Value
- Every artifact teaches something real
- Every epoch represents authentic history
- Every hero has biographical accuracy
- Every collection tells a coherent story
- NPC dialogues contain historical facts

### 7.2 Cultural Preservation
- Ukrainian language as primary
- Ukrainian visual identity throughout
- National symbols used appropriately
- Historical sensitivity for tragic events
- Positive representation of Ukrainian heritage

### 7.3 Player Respect
- No dark patterns
- No manipulative monetization
- Transparent odds (gacha rates visible)
- No FOMO mechanics
- Optional (not mandatory) spending

### 7.4 Quality Standards
- No placeholder content
- Every feature fully implemented
- Polish before release
- No meaningless grinding
- Every action has clear purpose

### 7.5 Long-Term Thinking
- Features designed to be expanded
- Content pipeline documented
- Technical debt avoided
- Scalable architecture
- Future-proof design

---

## 8. GAME MECHANICS SUMMARY

### 8.1 Main Game (Idle Layer)

| Mechanic | Description | Player Impact |
|----------|-------------|---------------|
| **Tapping** | Click to generate energy/XP | Early progression |
| **Generators** | Auto-producing buildings per epoch | Passive income |
| **Epochs** | 12 historical periods | Unlock through leveling |
| **Prestige** | Reset with permanent bonuses | Long-term progression |
| **Energy** | Limits tapping (post-Prestige 1) | Strategic rest cycles |
| **Artifacts** | Collect fragments, upgrade levels | Multipliers |
| **Daily Tasks** | 3 rotating challenges per day | Engagement hooks |

### 8.2 Expedition System

| Mechanic | Description | Player Impact |
|----------|-------------|---------------|
| **Heroes** | 6+ characters with specializations | Team building |
| **Regions** | 17+ locations with artifacts | Exploration |
| **Expeditions** | Timed missions (10-60 sec) | Resource investment |
| **Artifacts** | Find, restore, display | Collection |
| **Museum** | Exhibit artifacts, earn income | Passive rewards |
| **NPCs** | Dialogue, trust, bonuses | Relationship building |
| **Buildings** | Upgrade for bonuses | Strategic investment |
| **Story Quests** | Narrative progression | Context and meaning |

### 8.3 Economy

| Currency | Type | Usage |
|----------|------|-------|
| **Karbovanets** | Primary | Generators, upgrades, buildings |
| **Stars** | Premium | Shop purchases, cosmetics |
| **Reputation** | Secondary | Unlock requirements |
| **Historical Prestige** | Rare | Prestige reset currency |
| **Academy XP** | Progression | Academy leveling |
| **Trust Points** | NPC | Relationship levels |

### 8.4 Rarity System

| Rarity | Drop Rate | Fragment Cost | Value | Prestige Bonus |
|--------|-----------|---------------|-------|---------------|
| Common | 40%+ | 20 | 800 | 8 |
| Rare | 30%+ | 50 | 1,500 | 18 |
| Epic | 15%+ | 100 | 3,800 | 40 |
| Legendary | 5%+ | 250 | 8,000 | 80 |
| Secret | 3-5% | 250 | N/A | Varies |

---

## 9. UI/UX DESIGN LANGUAGE

### 9.1 Visual Identity

**Primary Colors:**
- Gold (#FFD700) - Achievement, premium, national
- Blue (#00E5FF) - Energy, technology, interactivity
- Purple (#A855F7) - Mystery, secrets, achievements
- Red (#FF2A5F) - Urgency, rare items, love of country

**Secondary Colors:**
- Ukrainian blue and yellow palette
- Historical period-appropriate accents
- Consistent rarity color coding

**Visual Elements:**
- Ukrainian geometric patterns (вишивка) as decorative borders
- Historical artifact silhouettes
- Epoch-specific color theming
- Dark mode support (Telegram theme)

### 9.2 Typography
- Clean, readable fonts
- Support for Cyrillic (Ukrainian)
- Clear hierarchy (titles, body, captions)
- Emoji integration for icons

### 9.3 Layout Principles
- Single-column mobile-first
- Bottom navigation for main sections
- Modal overlays for details
- Swipe gestures for navigation
- Pull-to-refresh where appropriate

### 9.4 Key Screens

1. **Main Game:** Epoch view with generators
2. **Expedition Hub:** Academy with building upgrades
3. **World Map:** Region selection with difficulty
4. **Heroes:** Character management and team building
5. **Museum:** Exhibition and collection view
6. **Laboratory:** Artifact restoration queue
7. **NPC:** Character interaction
8. **Treasury:** Currency and premium shop
9. **Profile:** Statistics and settings

---

## 10. TECHNICAL ARCHITECTURE

### 10.1 Frontend Stack
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation (if needed)

### 10.2 Backend Stack
- Supabase for database
- Edge Functions for serverless logic
- PostgreSQL with RLS for security
- Telegram Bot API for Mini App auth

### 10.3 Data Architecture

**Key Stores:**
- `useGame.ts` - Main game state (generators, epochs, prestige)
- `expedition/store.ts` - Expedition state (heroes, artifacts, museum)

**Persistence:**
- Local: Zustand persist middleware
- Cloud: Supabase sync
- Versioning: Migration system for saves

### 10.4 Scalability Principles

**Modular Design:**
- Each feature in isolated module
- Shared types and utilities
- Clear dependency hierarchy

**Content-Driven:**
- Data files define content (epochs, artifacts, heroes)
- No hardcoded content in components
- Easy content addition

**Extensible:**
- Feature flags for gradual rollout
- A/B testing infrastructure ready
- Analytics hooks in place

---

## 11. CONTENT PIPELINE

### 11.1 Content Types

| Content Type | Creation Process | Update Frequency |
|--------------|-----------------|------------------|
| **Artifacts** | JSON data file | Monthly additions |
| **Heroes** | JSON data + biography | Quarterly |
| **Regions** | JSON data | Quarterly |
| **Epochs** | Code + data | Rarely (major updates) |
| **NPC Dialogues** | JSON data | Monthly |
| **Story Quests** | JSON data | Monthly |
| **Seasonal Events** | Code + config | Per event |
| **Daily Challenges** | Code + config | Weekly |
| **Achievements** | JSON data | Quarterly |

### 11.2 Content Governance

**Historical Accuracy:**
- All historical claims must be verified
- Consultation with historians for sensitive periods
- No anachronisms
- Respectful treatment of tragic events

**Localization:**
- Ukrainian primary language
- i18n system ready for English
- Cultural context preserved in translation

**Quality Standards:**
- No placeholder text
- All descriptions complete
- Consistent tone and style
- Proofread before release

---

## 12. MONETIZATION STRATEGY

### 12.1 Core Principles

**Never Interrupt Gameplay:**
- No forced ads
- No paywalls on content
- No energy walls that require payment
- No wait time that requires payment

**Rewarded Ads as Primary:**
- 12 types of rewarded ads
- Daily limits prevent exploitation
- Equal benefits to paid options
- Player choice to watch

### 12.2 Revenue Streams

| Stream | Type | Player Impact |
|--------|------|--------------|
| **Rewarded Ads** | Ad view | Speed up, bonuses, free items |
| **Telegram Stars** | Direct purchase | Cosmetics, convenience |
| **Premium Shop** | Stars purchase | Cosmetics, packs, boosts |
| **Cosmetic Purchases** | Stars | Visual status symbols |

### 12.3 Ad Types (Implemented)

| Ad Type | Benefit | Daily Limit |
|---------|---------|------------|
| Expedition Skip | Complete mission instantly | 5 |
| XP Bonus | +25% XP for 30 min | 5 |
| Income Bonus | +25% income for 1 hour | 5 |
| Reputation Bonus | +25% rep for 30 min | 5 |
| Artifact Chance | +1 artifact roll | 10 |
| Hero Revive | Heal injured hero | 3 |
| Daily Free | Extra daily reward | 1 |
| Gacha Spin | Free premium spin | 3 |
| Generator Complete | Instant generator | 10 |
| Double Currency | 2x currency 30 min | 3 |
| Double Tap | 2x tap power 15 min | 5 |

### 12.4 Premium Shop Items

**Starter Packs:** 50-399 Stars
**Individual Boosts:** 5-45 Stars
**Cosmetic Frames:** 100-1000 Stars
**Chat Badges:** 150-500 Stars

### 12.5 Anti-Predatory Practices

- No loot box gambling mechanics
- No premium currency for real money conversion
- No gacha with real money only options
- No energy that forces payment
- No time-limited pressure purchases
- No social comparison that shames spending

---

## 13. LIVE OPERATIONS

### 13.1 Event Calendar

**Regular Events:**
- Daily challenges (reset every UTC day)
- Weekly challenges (reset every Monday)
- Seasonal events (national/religious/cultural)

**Special Events:**
- Game anniversaries
- Historical commemorations
- Community milestones
- New content celebrations

### 13.2 Content Updates

**Regular Cadence:**
- Monthly: New artifacts, dialogues, challenges
- Quarterly: New heroes, regions, features
- Annually: Major content expansions

**Update Communication:**
- In-game event notifications
- Telegram channel announcements
- Social media teasers

### 13.3 Player Support

**Feedback Channels:**
- In-game feedback form
- Telegram bot support
- Community group monitoring

**Issue Resolution:**
- Bug reporting system
- Rollback capability for purchases
- Compensation policy for issues

---

## 14. SUCCESS METRICS

### 14.1 Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **DAU** | 10,000+ | Daily active users |
| **MAU** | 50,000+ | Monthly active users |
| **Session Length** | 5-15 min | Average per session |
| **Sessions/Day** | 3-5 | Average per user |
| **Retention D1** | 40%+ | Day 1 return |
| **Retention D7** | 20%+ | Day 7 return |
| **Retention D30** | 10%+ | Day 30 return |

### 14.2 Progression Metrics

| Metric | Target | Meaning |
|--------|--------|---------|
| **Avg Level** | 50+ | Mid-game reached |
| **Prestige 1+** | 30%+ | Long-term commitment |
| **Museum Collections** | 2+ avg | Engagement depth |
| **Heroes Unlocked** | 3+ avg | Investment in system |
| **NPC Trust 3+** | 2+ avg | Relationship building |

### 14.3 Monetization Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **Ad View Rate** | 20%+ | Users watching ads |
| **Conversion Rate** | 2-5% | Free → Paying |
| **ARPU** | $0.50+ | Average per user |
| **ARPPU** | $5.00+ | Average per paying user |

### 14.4 Educational Impact

| Metric | Measurement |
|--------|-------------|
| **Completion Rate** | Users finishing epochs |
| **Collection Progress** | Artifacts gathered |
| **Story Completion** | Quests/arcs finished |
| **Return for Learning** | Engagement with educational content |

---

## 15. LONG-TERM VISION (3-5 YEARS)

### 15.1 Content Roadmap

**Year 1:**
- 12 epochs fully populated
- 100+ artifacts
- 20+ heroes
- Full story arc (10 chapters)
- Guild system launch

**Year 2:**
- User-generated content tools
- Community events
- Historical documentary tie-ins
- Museum partnerships

**Year 3+:**
- International expansion (English, Polish)
- Main Jolt Time game launch
- Cross-promotion ecosystem
- Educational partnerships

### 15.2 Technical Evolution

**Phase 1 (Current):**
- Telegram Mini App
- Supabase backend
- Basic analytics

**Phase 2:**
- Enhanced analytics
- ML-based personalization
- A/B testing infrastructure

**Phase 3:**
- AI-generated content (dialogues, descriptions)
- Dynamic difficulty adjustment
- Predictive player modeling

### 15.3 Community Building

**Short-term:**
- Telegram community
- Player feedback integration
- Content creator program

**Long-term:**
- Ambassador program
- Educational institution partnerships
- Museum collaborations
- Cultural heritage initiatives

---

## 16. COMPETITIVE POSITIONING

### 16.1 Market Context

**Idle/Clicker Games:**
- Cookie.clicker, Adventure Capitalist
- Tap by numerous developers
- Market is saturated with generic clones

**Educational Games:**
- Usually dry, classroom-focused
- Poor game feel
- Limited retention

**Ukrainian-Themed Games:**
- Almost non-existent
- Massive cultural gap
- No competition in this space

### 16.2 Unique Position

**Jolt Time Mini is:**
- First major Ukrainian historical game
- Only Telegram-native idle game with depth
- First to combine education + idle mechanics
- Community-driven development
- Culturally authentic representation

**Competitive Advantages:**
- No direct competition
- Cultural relevance for Ukrainian audience
- Authentic Ukrainian content
- Telegram platform dominance in Ukraine
- Early mover in market

---

## 17. RISK ASSESSMENT

### 17.1 Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Historical Sensitivity** | High | Expert consultation, balanced portrayal |
| **Platform Dependency** | Medium | Cross-platform preparation |
| **Content Drought** | Medium | Content pipeline documentation |
| **Monetization Perception** | Medium | Transparency, player respect |
| **Community Toxicity** | Low | Clear guidelines, active moderation |
| **Technical Scalability** | Medium | Modular architecture |

### 17.2 Mitigation Strategies

- Historical accuracy review board
- Regular content updates
- Player feedback integration
- Transparent monetization
- Community guidelines
- Scalable architecture decisions

---

## 18. DEVELOPMENT PRINCIPLES FOR FUTURE AI AGENTS

### 18.1 Decision Framework

When implementing new features, always consider:

1. **Does this teach something about Ukrainian history?**
2. **Does this respect player time?**
3. **Is this monetized ethically?**
4. **Is this content-driven (data-based)?**
5. **Can this be expanded in the future?**
6. **Does this align with the core pillars?**

### 18.2 Code Standards

- TypeScript strict mode
- Component isolation
- Data-driven content (no hardcoding)
- i18n-ready (Ukrainian primary)
- Mobile-first responsive design
- Accessibility compliance

### 18.3 Feature Checklist

Before releasing any feature, verify:

- [ ] All text is localized or i18n-ready
- [ ] All content follows data schema
- [ ] All interactions have haptic feedback
- [ ] All states have loading/success/error UI
- [ ] All buttons have clear purpose
- [ ] All features are fully implemented (no placeholders)
- [ ] Historical content is accurate
- [ ] No dark patterns or manipulation
- [ ] Analytics tracking in place

---

## 19. GLOSSARY

| Term | Definition |
|------|------------|
| **Epoch** | Historical period (e.g., Trypillia, Cossack Era) |
| **Generator** | Auto-producing building in idle game |
| **Expedition** | Mission to find artifacts |
| **Prestige** | Reset with permanent bonuses |
| **Karbovanets** | Primary in-game currency |
| **Stars** | Telegram premium currency |
| **NPC** | Non-player character (academy staff) |
| **Museum** | Place to exhibit artifacts for bonuses |
| **Collection** | Set of artifacts that unlock bonuses |
| **Hero** | Character that joins expeditions |
| **Region** | Location for expeditions |
| **Trust** | NPC relationship level (1-6) |

---

## 20. APPENDIX: EXISTING DOCUMENTATION

For detailed technical information, refer to:

- [ARCHITECTURE_REPORT.md](../reports/ARCHITECTURE_REPORT.md) - Technical architecture
- [FULL_PROJECT_AUDIT.md](../reports/FULL_PROJECT_AUDIT.md) - Complete system audit
- [COMPLETE_PROJECT_AUDIT.md](../reports/COMPLETE_PROJECT_AUDIT.md) - Phase-by-phase development
- [ECONOMY_BALANCE.md](../reports/ECONOMY_BALANCE.md) - If exists
- [STORY_SYSTEM.md](../reports/STORY_SYSTEM.md) - If exists

---

## 21. APPROVAL AND VERSIONING

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-29 | Lead Game Director | Initial Vision Bible |

---

*This Vision Bible is the foundational document for all future development on Jolt Time Mini. Every feature, content piece, and design decision should align with the principles established here.*

**END OF DOCUMENT**
