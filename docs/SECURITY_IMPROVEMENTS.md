# Security Improvements — Jolt Time

**Версія:** 1.0  
**Дата:** 2026-06-29  
**Автор:** OpenHands Agent  

---

## Огляд

Цей документ описує покращення безпеки, впроваджені в Jolt Time для захисту від зловживань та атак.

---

## 1. Rate Limiting

### Таблиця `rate_limits`

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,                    -- format: action:telegram_id
  telegram_id BIGINT,                    -- user identifier
  action TEXT NOT NULL,                 -- action being limited
  count INTEGER NOT NULL DEFAULT 1,      -- requests in window
  window_start TIMESTAMPTZ NOT NULL,    -- window start
  expires_at TIMESTAMPTZ NOT NULL,      -- for cleanup
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Ліміти для різних дій

| Дія | Ліміт | Вікно | Опис |
|-----|--------|-------|------|
| `prestige` | 1 | 3600 сек (1 год) | Престиж |
| `purchase_create` | 10 | 60 сек (1 хв) | Створення інвойсу |
| `open_chest` | 30 | 60 сек (1 хв) | Відкриття скринь |
| `game_action` | 60 | 60 сек (1 хв) | Ігрові дії |
| `expedition` | 20 | 60 сек (1 хв) | Експедиції |
| `claim_daily` | 10 | 60 сек (1 хв) | Клейм нагород |
| `claim_offline` | 5 | 60 сек (1 хв) | Офлайн дохід |

### Реалізація

```typescript
// supabase/functions/_shared/rate-limit.ts
export async function checkRateLimit(
  telegramId: number,
  action: string
): Promise<RateLimitResult> {
  // Sliding window rate limiting
  // Returns { allowed, remaining, resetAt, retryAfterSeconds? }
}
```

### HTTP Response при перевищенні ліміту

```json
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-06-29T20:00:00Z

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please wait 60 seconds.",
  "retry_after": 60,
  "reset_at": "2026-06-29T20:00:00Z"
}
```

---

## 2. Security Audit Logging

### Таблиця `security_audit_log`

```sql
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT,                    -- user (NULL for failures)
  event_type TEXT NOT NULL,               -- event identifier
  event_category TEXT NOT NULL,          -- auth|purchase|prestige|abuse|system|general
  success BOOLEAN NOT NULL DEFAULT true, -- action outcome
  ip_address TEXT,                       -- client IP
  user_agent TEXT,                       -- user agent
  details JSONB DEFAULT '{}',           -- extra data
  error_message TEXT,                    -- error if applicable
  request_method TEXT,                   -- HTTP method
  request_path TEXT,                    -- endpoint
  telegram_init_data TEXT,               -- [REDACTED] for privacy
  severity TEXT NOT NULL DEFAULT 'info', -- debug|info|warning|error|critical
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Типи подій

| Категорія | Тип події | Опис |
|-----------|-----------|------|
| auth | `INVALID_INIT_DATA` | HMAC валідація провалилась |
| auth | `AUTH_SUCCESS` | Авторизація успішна |
| auth | `AUTH_FAILED` | Авторизація провалилась |
| prestige | `PRESTIGE_ATTEMPT` | Спроба престижу |
| prestige | `PRESTIGE_SUCCESS` | Престиж успішний |
| prestige | `PRESTIGE_FAILED` | Престиж провалився |
| purchase | `PURCHASE_CREATE_INVOICE` | Створено інвойс |
| purchase | `PURCHASE_SUCCESS` | Покупка успішна |
| purchase | `PURCHASE_FAILED` | Покупка провалилась |
| purchase | `PURCHASE_DUPLICATE` | Дублікат покупки |
| abuse | `RATE_LIMIT_EXCEEDED` | Перевищено rate limit |
| abuse | `SUSPICIOUS_ACTIVITY` | Підозріла активність |
| abuse | `PAYLOAD_VALIDATION_FAILED` | Невірний payload |
| system | `EDGE_FUNCTION_ERROR` | Помилка Edge Function |
| system | `DB_ERROR` | Помилка бази даних |

### Реалізація

```typescript
// supabase/functions/_shared/security-log.ts
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void>

// Зручні хелпери:
await logPrestigeEvent(req, telegramId, true, level, prestigeLevel);
await logPurchaseEvent(req, telegramId, EVENT_TYPES.PURCHASE_SUCCESS, true, boosterId);
await logRateLimitExceeded(req, action, telegramId);
```

---

## 3. Input Validation

### Валідатори

```typescript
// supabase/functions/_shared/validation.ts

validateTelegramId(value)      // Число > 0
validateEpochId(value)        // Дозволені епохи
validateChestType(value)      // "daily" | "skychest"
validatePositiveInt(value)    // Додатнє ціле число
validateBoosterId(value)      // Дозволені booster ID
validateAction(value)          // Дозволені дії
validateInitDataFormat(value)  // Формат initData
```

### Схеми запитів

```typescript
validatePrestigeRequest(body)      // { telegram_id }
validateOpenChestRequest(body)     // { telegram_id, epoch_id, chest_type?, epoch_index? }
validatePaymentsRequest(body)      // { action, booster_id?, telegram_id? }
validateGameActionRequest(body)    // { action, init_data, epoch_id?, generator_id? }
```

---

## 4. Оновлені Edge Functions

### perform-prestige

**Безпекові функції:**
- Rate limiting: 1 престиж на годину
- Input validation
- Security audit logging

```typescript
// Логування:
// - PRESTIGE_FAILED (invalid input)
// - RATE_LIMIT_EXCEEDED (abuse)
// - PRESTIGE_SUCCESS (success)
// - DB_ERROR (system error)
```

### telegram-payments

**Безпекові функції:**
- Rate limiting: 10 інвойсів на хвилину
- Input validation (telegram_id, booster_id)
- Security audit logging

```typescript
// Логування:
// - PURCHASE_FAILED (invalid input, unknown booster)
// - RATE_LIMIT_EXCEEDED (abuse)
// - PURCHASE_CREATE_INVOICE (success)
// - PURCHASE_FAILED (Telegram error)
```

### open-chest

**Безпекові функції:**
- Rate limiting: 30 скринь на хвилину
- Input validation
- Security audit logging

```typescript
// Логування:
// - PAYLOAD_VALIDATION_FAILED (invalid input)
// - RATE_LIMIT_EXCEEDED (abuse)
// - CHEST_OPENED (success/failure)
// - DB_ERROR (system error)
```

### game-action

**Безпекові функції:**
- HMAC-SHA256 валідація initData
- Rate limiting: 60 дій на хвилину
- Input validation
- Security audit logging

```typescript
// Логування:
// - PAYLOAD_VALIDATION_FAILED (invalid input)
// - INVALID_INIT_DATA (HMAC fail)
// - RATE_LIMIT_EXCEEDED (abuse)
// - INVALID_PARAMETERS (bad epoch/action)
// - EDGE_FUNCTION_ERROR (system error)
```

---

## 5. SQL Міграції

### 20260622000001_security_rate_limits.sql

Створює таблицю `rate_limits` та індекси для швидкого пошуку.

### 20260622000002_security_audit_log.sql

Створює таблицю `security_audit_log` для аудиту безпекових подій.

---

## 6. Shared Utilities

### Структура файлів

```
supabase/functions/_shared/
├── rate-limit.ts      # Rate limiting logic
├── security-log.ts     # Audit logging
└── validation.ts      # Input validation
```

### Використання

```typescript
// В Edge Function:
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { logSecurityEvent, EVENT_TYPES } from "../_shared/security-log.ts";
import { validatePrestigeRequest } from "../_shared/validation.ts";

// 1. Валідуємо вхідні дані
const validation = validatePrestigeRequest(body);
if (!validation.valid) {
  return jsonResponse({ error: validation.errors }, 400);
}

// 2. Перевіряємо rate limit
const rateLimit = await checkRateLimit(telegramId, "prestige");
if (!rateLimit.allowed) {
  return rateLimitResponse(rateLimit);
}

// 3. Логуємо результат
await logSecurityEvent({
  telegramId,
  eventType: EVENT_TYPES.PRESTIGE_SUCCESS,
  eventCategory: "prestige",
  success: true,
});
```

---

## 7. Рекомендації по розгортанню

### Перед деплоєм

1. **Застосувати міграції:**
   ```bash
   supabase db push
   # або
   psql $DATABASE_URL -f supabase/migrations/20260622000001_security_rate_limits.sql
   psql $DATABASE_URL -f supabase/migrations/20260622000002_security_audit_log.sql
   ```

2. **Перевірити Edge Functions:**
   ```bash
   supabase functions deploy perform-prestige
   supabase functions deploy telegram-payments
   supabase functions deploy open-chest
   supabase functions deploy game-action
   ```

3. **Налаштувати моніторинг:**
   - Відстежувати `security_audit_log` на предмет підозрілої активності
   - Налаштувати алерти на `RATE_LIMIT_EXCEEDED` та `SUSPICIOUS_ACTIVITY`

### Після деплою

1. **Моніторити:**
   - Кількість rate limit перевищень
   - Невдалі спроби авторизації (INVALID_INIT_DATA)
   - Підозрілу активність

2. **Коригувати ліміти:**
   - Якщо занадто багато легітимних користувачів отримують 429 — збільшити ліміти
   - Якщо зловмисники все ще проходять — зменшити ліміти

---

## 8. Майбутні покращення

1. **IP-based rate limiting** — додатковий захист від DDoS
2. **Automatic ban** — тимчасовий бан для repeat offenders
3. **Fraud detection** — ML-модель для виявлення ботів
4. **Admin dashboard** — UI для перегляду безпекових подій
5. **Webhook alerts** — сповіщення в Telegram для критичних подій

---

## 9. Пріоритети безпеки

| Пріоритет | Поліпшення | Статус |
|-----------|-----------|--------|
| Високий | Rate limiting | ✅ Впроваджено |
| Високий | Input validation | ✅ Впроваджено |
| Високий | Audit logging | ✅ Впроваджено |
| Середній | HMAC для critical actions | ✅ Вже було |
| Середній | Anti-cheat monitoring | 🔄 Покращити |
| Низький | ML fraud detection | 📋 Заплановане |

---

*Документ створено автоматично на основі впроваджених змін безпеки*
