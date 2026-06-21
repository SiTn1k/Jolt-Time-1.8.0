# STABILITY AUDIT REPORT

**Дата:** 2026-06-20  
**Версія:** 1.8.0 (after Phase 14)

---

## ✅ ВИПРАВЛЕНО

### 1. Expedition Collect Bug (КРИТИЧНИЙ)
**Було:** `collected=true` встановлювалось ДО відповіді сервера
**Стало:**
- Спочатку `status='collecting'` (клієнт починає збір)
- Після успіху сервера: `collected=true, status='completed'`
- При помилці: `status='returning'` (користувач може повторити)

### 2. Crash Recovery
**Додано:** `onRehydrateStorage()` - при завантаженні гри перевіряє expeditions
- Якщо `status='collecting' && collected=false` → автоматично `status='returning'`
- Експедиції не зависають після крашу

### 3. Server Sync
**Виправлено:** Supabase Edge Function
- Приймає `status='collecting'` (проміжний стан клієнта)
- Залишає `status='completed'` для фіналізації клієнтом
- `rewardsClaimed=true` встановлюється ТІЛЬКИ після генерації нагород

### 4. Race Conditions (Атомарні оновлення)
**Виправлено:**
- `checkCollectionCompletion()`: всі set() об'єднані в один атомарний виклик
- `interactWithNpc()`: всі set() об'єднані в один атомарний виклик
- Всі reward'и застосовуються в одній транзакції

### 5. HeroId 'any' → 'hero-1'
**Виправлено:** Level 6 relationship reward тепер має валідний `heroId: 'hero-1'`
**TODO:** Обрати випадкового героя замість хардкоду

---

## ⚠️ ЗНАЙДЕНО НОВІ ПРОБЛЕМИ

| Проблема | Рівень | Статус |
|----------|--------|--------|
| Hero fragment reward 'hero-1' always | Низький | TODO: random hero |
| Academy XP reward not implemented | Низький | console.warn only |
| Artifact reward not implemented | Низький | console.warn only |
| Museum table may not exist | Низький | Graceful skip |

---

## 📁 ЗМІНЕНІ ФАЙЛИ

| Файл | Зміни |
|------|-------|
| `src/expedition/store.ts` | collectExpedition fix, onRehydrateStorage, atomic updates |
| `src/expedition/storyData.ts` | heroId 'any' → 'hero-1' |
| `supabase/functions/expedition-sync/index.ts` | Accept 'collecting' status |

---

## 📊 КОМІТИ

```
d43ad93 hotfix: Stability audit fixes (Phase 8-14)
5190686 feat Phase 14: Story Arc Expansion
e962896 feat Phase 13: NPC Expansion System
e321e47 feat Phase 12: Collection Completion System
```

---

## 🎯 ПІДСУМОК АУДИТУ

| Категорія | Результат |
|-----------|-----------|
| Expedition Bug | ✅ Виправлено |
| Crash Recovery | ✅ Виправлено |
| Server Validation | ✅ Виправлено |
| Race Conditions | ✅ Виправлено |
| Double Rewards | ✅ Захищено |
| Diagnostics | ✅ Покращено |
| Phase 9-14 Code | ✅ Перевірено |
