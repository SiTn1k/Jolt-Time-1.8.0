# OpenHands Agent Memory

## Проєкт: Ukraine Tap (Jolt-Time-1.8.0)
Telegram Mini App game про історію України.

## Команди Git
```bash
git add -A && git commit -m "message"  # коміт
git push  # пуш на remote
```

## Структура
- Phase 8-14: Expedition system (heroes, artifacts, museum, NPC, collections)
- UI Style: Monobank/Revolut - темний, мінімалістичний
- Card style: `bg rgba(255,255,255,0.04), border 1px rgba(255,255,255,0.08), radius 20px`
- Two app entry points: App.tsx (old game) → ExpeditionApp.tsx (prestige 2+)

## Design Tokens
```css
--bg-primary: #161B22
--bg-secondary: #0D1117
--text-primary: #E6EDF3
--text-secondary: #8B949E
--accent-primary: #FFC72C
--accent-success: #10B981
--accent-info: #00E5FF
--accent-error: #EF4444
--card-bg: rgba(255,255,255,0.04)
--card-border: rgba(255,255,255,0.08)
```

## Button Standards
- Height: 48px (h-12) or 44px (h-11) for compact
- Border-radius: 16px (rounded-2xl)
- Primary: `bg-[#FFC72C] text-[#0d1117]`
- Disabled: `bg-white/[0.08] text-[#8B949E]`

## CRITICAL: position:fixed + overflow:hidden
**NEVER use position:fixed inside containers with overflow:hidden/auto/scroll**

Root cause: overflow creates new containing block for fixed elements.
- Fixed positioning becomes relative to that container
- Element gets clipped to container bounds

**Solution: Use React Portal**
```tsx
import { createPortal } from 'react-dom';
return createPortal(<Component />, document.body);
```

This applies to: TutorialBubble, TutorialOverlay, modals, toasts

## Component Versions (Intended Duplicates)
| Component | File | When Used |
|-----------|------|-----------|
| DailyRewards | src/components/ | prestige 0-1 |
| DailyRewards | src/expedition/screens/ | prestige 2+ |
| TutorialModal | src/components/ | First game tutorial |

## Navigation Flow
```
prestigeLevel 0-1:
  App.tsx
  ├─ Header (currency, level)
  ├─ TapArea
  ├─ Tab Bar (shop, epochs, artifacts, boosters, referrals, stats)
  └─ Academy Preview (locked cards with progress)

prestigeLevel 2+:
  ExpeditionApp (via createPortal for modals)
  ├─ Academy (default screen)
  ├─ WorldMap
  ├─ Heroes
  ├─ Laboratory
  ├─ Museum
  ├─ DailyRewards
  ├─ Treasury
  ├─ Buildings
  └─ Bottom Nav (h-16)
```

## Academy Unlock Flow
1. User reaches prestigeLevel = 2
2. AcademyUnlockModal shows (one-time via localStorage)
3. User clicks "Почати дослідження"
4. localStorage.setItem('academy_unlock_seen', 'true')
5. ExpeditionApp renders permanently

## Academy Preview (prestige < 2)
- Location: App.tsx line ~878
- Condition: `(state.prestigeLevel || 0) < 2`
- Shows 6 locked preview cards with progress bar

## LocalStorage Keys
- `academy_unlock_seen` - Controls AcademyUnlockModal
- `tutorial_seen` - Controls TutorialModal
- `game_active_tab` - Duplicate tab prevention

## Поточний стан
- Branch: `fix/typescript-errors`
- Latest commits:
  - ff70cdb TutorialBubble Portal fix
  - 55838cf TutorialBubble centering fix
  - 8eb4bda Mobile responsive sizing
  - ff980d1 Academy Preview for new players

## Translation Keys Structure
- `daily.*` - Daily rewards system
- `expedition.*` - Expedition/Academy content
- `tutorial.*` - Tutorial steps
- `ad.*` - Ad-related strings
- `objective.*` - Player objectives and reminders
- `laboratory.*` - Lab/restoration system

## Player Journey Features (Phase 17)
### Current Objective System (Academy.tsx)
Priority system for guiding players:
1. Complete active quests
2. Start expedition
3. Restore damaged artifacts
4. Send artifact to museum
5. Increase reputation
6. Continue exploring

### Empty States
- WorldMap: "Запустіть першу експедицію"
- Museum: "Колекція ще не створена"
- Laboratory: Existing states preserved

### Museum Collection Progress
- Shows percentage of artifacts in museum vs total found
- Progress bar in Academy header

## Phase History
- Phase 16: TutorialBubble mobile fix (Portal rendering)
- Phase 17: Player Journey & Progression
