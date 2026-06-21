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

## Поточний стан
- Branch: `fix/typescript-errors`
- Останні коміти:
  - 409b6e1 UI/UX refactor (Monobank style)
  - d43ad93 Stability audit fixes
  - 5190686 Phase 14: Story Arc Expansion
  - e962896 Phase 13: NPC Expansion
  - e321e47 Phase 12: Collection System

## Відомі проблеми (TODO)
- Academy XP reward not implemented
- Artifact reward from quests not implemented
- Museum table may not exist in Supabase
