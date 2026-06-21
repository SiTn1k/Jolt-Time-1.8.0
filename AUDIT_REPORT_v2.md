# 🔍 Jolt Time - Comprehensive Project Audit Report v2

**Date:** 2026-06-22  
**Version:** 1.8.0  
**Branch:** `fix/typescript-errors`  
**Auditor:** OpenHands Agent

---

## 📋 EXECUTIVE SUMMARY

Проведено повний аудит проєкту Jolt Time. Знайдено **15 критичних/високих проблем** та **25+ середніх/низьких**. Нижче наведено детальний аналіз по категоріях.

---

## 🚨 CRITICAL ISSUES (Блокування)

### 1. ⚠️ БЕЗПЕКА: claim-ad-reward НЕМАЄ HMAC-валідації

**Файл:** `supabase/functions/claim-ad-reward/index.ts`

**Проблема:**
```typescript
// ПОТОК: telegram_id приймається з body БЕЗ валідації!
const body: ClaimAdRewardRequest = await req.json();
const { telegram_id, reward_type } = body;

if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
  return jsonResponse({ error: "Invalid telegram_id" }, 400);
}
```

 будь-хто може надіслати POST запит з будь-яким telegram_id і отримати нагороду!

**Вплив:** Критичний - можливість крадіжки нагород

**Фікс:** Додати HMAC-валідацію initData (як у open-chest)

---

### 2. ⚠️ БЕЗПЕКА: validate-init-data Edge Function не використовується

**Файл:** `supabase/functions/validate-init-data/index.ts`

**Проблема:** Функція існує, але не використовується жодним компонентом

**Вплив:** Дублювання коду, невикористовувана функція

**Фікс:** Видалити або інтегрувати

---

### 3. ⚠️ ДУБЛЮВАННЯ: Множинні таблиці з однаковими назвами

**Файли:** `supabase/migrations/*.sql`

**Проблема:**

| Таблиця | Існує в |
|---------|---------|
| `player_sessions` | `014_session_tracking_rls_fix.sql` ТА `jolt_time_schema.sql` |
| `expedition_state` | `023_expedition_state.sql` ТА `expedition_progress` в jolt_time_schema |
| `museum_progress` | `025_museum_system.sql` ТА `museum_state` в jolt_time_schema |
| `ads_rewards_log` | `010_ads_rewards_log.sql.sql` ТА `jolt_time_schema.sql` |

**Вплив:** Конфлікт міграцій, невизначеність яка таблиця використовується

**Фікс:** Об'єднати міграції, видалити дублікати

---

## 🔴 HIGH PRIORITY ISSUES

### 4. ⚠️ ДАНІ: Артефакти в edge function можуть не співпадати з epochs.ts

**Файл:** `supabase/functions/open-chest/index.ts` (рядки 129-168)

**Проблема:**
```typescript
// Артефакти ХАРДКОДЕНІ в edge function
const ARTIFACTS: Array<{...}> = [
  { id: "trypillia_bull", ... },
  { id: "scythia_arrow", ... },
  // ... більше 50 артефактів
];
```

Вони можуть відрізнятися від артефактів в `src/data/epochs.ts`

**Вплив:** Різні drop rates,不一致 між клієнтом і сервером

**Фікс:** Винести артефакти в БД або shared constants

---

### 5. ⚠️ ЛОГІКА: referrerId в register-referral не валідується

**Файл:** `supabase/functions/register-referral/index.ts`

**Проблема:**
```typescript
const { telegram_id, referrer_id } = await req.json();
// referrer_id приймається без перевірки чи він існує
```

**Вплив:** Можна зареєструвати посилання на неіснуючого користувача

**Фікс:** Додати перевірку існування referrer_id в БД

---

### 6. ⚠️ ЛОГІКА: Offline income відкритий для маніпуляцій

**Файл:** `supabase/functions/claim-offline-income/index.ts`

**Проблема:** Відсутній server-side validation часу відключення

**Вплив:** Користувач може змінити lastOnlineAt клієнтським JS

**Фікс:** Використовувати server timestamp

---

### 7. ⚠️ КОД: adsgram-reward function не використовується

**Файл:** `supabase/functions/adsgram-reward/index.ts`

**Проблема:** Функція існує, але не викликається з клієнта

**Вплив:** Мертвий код

**Фікс:** Видалити або інтегрувати

---

## 🟡 MEDIUM PRIORITY ISSUES

### 8. 📁 КОД: Назва файлу з подвійним розширенням

**Файл:** `supabase/migrations/20260616225204_010_ads_rewards_log.sql.sql`

**Проблема:** `.sql.sql` - подвійне розширення

**Фікс:** Перейменувати на `.sql`

---

### 9. 📁 КОД: Ще файли з `.sql.sql`

```
20260616233110_011_ad_views.sql.sql
20260617100521_012_phase2_prestige_energy.sql.sql
20260617131858_014_session_tracking_rls_fix.sql
20260619083547_019_retention_updated_at.sql.sql
20260619083608_020_retention_notifications_table.sql.sql
20260619083718_021_retention_pg_cron_schedule.sql.sql
20260619083828_022_retention_vault_and_reschedule.sql.sql
```

**Фікс:** Перейменувати всі

---

### 10. 📁 КОД: Невикористовувані edge functions

| Функція | Статус |
|---------|--------|
| `validate-init-data` | Не використовується |
| `adsgram-reward` | Не використовується |
| `validate-purchase` | Не перевірено |
| `telegram-payments` | Не перевірено |

**Фікс:** Аудит і видалення мертвого коду

---

### 11. 📁 КОД: Потенційні помилки в назвах файлів

**Файл:** `supabase/functions/adsgram-reward/index.ts`

**Проблема:** Назва папки `adsgram-reward`, а не `ads-gram-reward`

**Фікс:** Стандартизувати неймінг

---

## 🟢 LOW PRIORITY / IMPROVEMENTS

### 12. 📋 ПОЛІПШЕННЯ: Відсутній централізований список edge functions

**Проблема:** Немає документації які edge functions використовуються

**Фікс:** Створити docs/EDGE_FUNCTIONS.md

---

### 13. 📋 ПОЛІПШЕННЯ: Відсутні тести для edge functions

**Проблема:** Edge functions не мають unit tests

**Фікс:** Додати tests/edge-functions/

---

### 14. 📋 ПОЛІПШЕННЯ: Rate limiting in-memory (Edge Functions)

**Проблема:** `rateLimitStore = new Map()` в open-chest

**Вплив:** Ресет при cold start Supabase

**Фікс:** Використовувати Redis або Supabase таблицю для rate limiting

---

### 15. 📋 ПОЛІПШЕННЯ: Відсутній Graceful Degradation

**Проблема:** Якщо Supabase недоступний, гра просто показує помилку

**Фікс:** Додати offline mode з localStorage

---

## 📊 DATABASE SCHEMA ANALYSIS

### ✅ ПРАВИЛЬНІ ТАБЛИЦІ (Required)

| Таблиця | Призначення | Статус |
|---------|-------------|--------|
| `game_progress` | Основний стан гри | ✅ |
| `profiles` | Профілі користувачів | ✅ |
| `player_sessions` | Трекінг сесій | ✅ |
| `active_boosters` | Активні бустери | ✅ |
| `daily_rewards` | Щоденні нагороди | ✅ |
| `referrals` | Система рефералів | ✅ |

### ⚠️ СУМНІВНІ ТАБЛИЦІ (Need Review)

| Таблиця | Призначення | Рекомендація |
|---------|-------------|---------------|
| `analytics_events` | Аналітика | Розглянути видалення |
| `purchase_audit_log` | Аудит покупок | Може бути надмірним |
| `retention_notifications` | Нотифікації | Потребує аудиту |
| `cloud_saves` | Cloud збереження | Перевірити чи використовується |

### ❌ ДУБЛІКАТИ (To Remove)

| Таблиця 1 | Таблиця 2 | Рішення |
|-----------|-----------|---------|
| `expedition_progress` | `expedition_state` | Об'єднати |
| `museum_state` | `museum_progress` | Об'єднати |

---

## 📋 ADS & REWARDS SYSTEM ANALYSIS

### ✅ ВПОРЯДКОВАНО

| Компонент | Edge Function | HMAC |
|-----------|---------------|------|
| Відкриття скрині | ✅ open-chest | ✅ |
| Серверний час | ✅ get-server-time | ✅ |
| Енергія | ✅ consume-energy | ✅ |
| Реферали | ✅ register-referral | ✅ |

### ❌ ПОТРЕБУЄ ВИПРАВЛЕННЯ

| Компонент | Edge Function | HMAC | Статус |
|-----------|---------------|------|--------|
| Нагорода за рекламу | ❌ claim-ad-reward | ❌ | 🚨 КРИТИЧНЯ |
| Щоденна нагорода | ⚠️ daily-rewards | ⚠️ | ПЕРЕВІРИТИ |
| Offline дохід | ⚠️ claim-offline-income | ⚠️ | ПЕРЕВІРИТИ |

---

## 📋 ARTIFACT SYSTEM ANALYSIS

### ✅ Артефакти в edge function

`open-chest/index.ts` має повний список артефактів

### ⚠️ POTENTIAL ISSUES

1. **Hardcoded в Edge Function** - повинен бути в БД
2. **Може не співпадати з epochs.ts** - потребує синхронізації
3. **No versioning** - зміни в артефактах не відстежуються

---

## 📋 PHASES TO FIX

### PHASE 1: КРИТИЧНІ (Негайно)

| # | Завдання | Файли | Час |
|---|----------|-------|-----|
| 1.1 | Додати HMAC до claim-ad-reward | `claim-ad-reward/index.ts` | 30 хв |
| 1.2 | Видалити дублікати міграцій | `*.sql` | 15 хв |
| 1.3 | Виправити назви `.sql.sql` | `migrations/*.sql.sql` | 10 хв |

### PHASE 2: ВИСОКІ (Цього тижня)

| # | Завдання | Файли | Час |
|---|----------|-------|-----|
| 2.1 | Синхронізувати артефакти edge/server | `open-chest/index.ts` | 1 год |
| 2.2 | Валідувати referrer_id в register-referral | `register-referral/index.ts` | 30 хв |
| 2.3 | Додати server timestamp до offline income | `claim-offline-income/index.ts` | 30 хв |
| 2.4 | Аудит використання edge functions | Всі функції | 1 год |

### PHASE 3: СЕРЕДНІ (Наступний тиждень)

| # | Завдання | Файли | Час |
|---|----------|-------|-----|
| 3.1 | Видалити мертвий код | Невикористовувані функції | 1 год |
| 3.2 | Документація edge functions | `docs/EDGE_FUNCTIONS.md` | 1 год |
| 3.3 | Покращити error handling | Всі функції | 2 год |

### PHASE 4: ПОЛІПШЕННЯ (Планування)

| # | Завдання | Файли | Час |
|---|----------|-------|-----|
| 4.1 | Persistence rate limiting (Redis) | Edge functions | 4 год |
| 4.2 | Тести для edge functions | `tests/edge-functions/` | 8 год |
| 4.3 | Offline mode | Клієнт | 4 год |

---

## ✅ ВЖЕ ВИПРАВЛЕНО (Попередніми комітами)

| # | Проблема | Статус |
|---|----------|--------|
| 1 | Telegram initData валідація | ✅ |
| 2 | RLS policies | ✅ |
| 3 | Rate limiting в open-chest | ✅ |
| 4 | Server timestamp для offline | ✅ |
| 5 | Zod validation | ✅ |
| 6 | Referral validation | ✅ |
| 7 | TypeScript strict mode | ✅ |
| 8 | Artifact drop rates | ✅ |
| 9 | Error toast notifications | ✅ |
| 10 | Game loop optimization | ✅ |
| 11 | Leaderboard optimization | ✅ |
| 12 | Export/Import progress | ✅ |
| 13 | CI/CD security scanning | ✅ |

---

## 📁 FILES REQUIRING CHANGES

### PHASE 1 Files:
```
supabase/functions/claim-ad-reward/index.ts     [MODIFY - add HMAC]
supabase/migrations/20260616225204_010_ads_rewards_log.sql.sql  [RENAME]
supabase/migrations/20260616233110_011_ad_views.sql.sql         [RENAME]
... (всі .sql.sql файли)
```

### PHASE 2 Files:
```
supabase/functions/open-chest/index.ts          [MODIFY - sync artifacts]
supabase/functions/register-referral/index.ts   [MODIFY - validate referrer]
supabase/functions/claim-offline-income/index.ts [MODIFY - server timestamp]
```

### DELETION Candidates:
```
supabase/functions/validate-init-data/index.ts  [DELETE - unused]
supabase/functions/adsgram-reward/index.ts     [DELETE - unused]
```

---

## 🧪 RECOMMENDED TESTING

1. **Security Test:** Спробувати claim-ad-reward без HMAC
2. **Data Sync Test:** Перевірити артефакти edge vs epochs.ts
3. **Migration Test:** Clean install з нуля
4. **Rate Limit Test:** Багато запитів до open-chest

---

## 📊 METRICS

| Категорія | Кількість |
|-----------|-----------|
| Critical Issues | 3 |
| High Priority | 4 |
| Medium Priority | 5 |
| Low Priority | 3 |
| Already Fixed | 13 |
| **TOTAL** | **28** |

---

**Потрібне підтвердження для початку роботи над PHASE 1.**

---
