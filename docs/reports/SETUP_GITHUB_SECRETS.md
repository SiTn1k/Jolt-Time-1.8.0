# 🔐 GitHub Secrets Setup Guide

## Як налаштувати автоматичне розгортання через GitHub Actions

### 1. Отримати Secrets з Supabase

#### SUPABASE_ACCESS_TOKEN
1. Відкрий: https://supabase.com/dashboard/project/iyxhzisfwcdfhuxuqxso/settings/api
2. Скроль до **"Personal Access Tokens"**
3. Натисни **"New Token"**
4. Назви: `github-actions`
5. Скопіюй токен

#### TELEGRAM_BOT_TOKEN
1. Відкрий @BotFather
2. `/mybots` → вибери свого бота
3. Скопіюй токен бота

#### ADSGRAM_SECRET
1. Відкрий https://adsgram.ai/
2. Знайди свій App → Settings
3. Скопіюй Secret

#### RETENTION_BOT_USERNAME
1. Ім'я твого бота (без @), напр. `UkraineTapBot`

---

### 2. Додати Secrets до GitHub

1. Відкрий репозиторій: https://github.com/SiTn1k/Jolt-Time-1.8.0
2. Перейди: **Settings** → **Secrets and variables** → **Actions**
3. Натисни **"New repository secret"**
4. Додай кожен secret:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_ACCESS_TOKEN` | Токен з кроку 1 |
| `SUPABASE_PROJECT_REF` | `iyxhzisfwcdfhuxuqxso` |
| `TELEGRAM_BOT_TOKEN` | Токен бота |
| `ADSGRAM_SECRET` | Secret з AdsGram |
| `RETENTION_BOT_USERNAME` | Ім'я бота |
| `SUPABASE_DB_URL` | (опціонально) Пряме підключення до БД |

---

### 3. Підключити Supabase до GitHub (для автоматичного деплою)

1. Відкрий: https://supabase.com/dashboard/project/iyxhzisfwcdfhuxuqxso/integrations/connect
2. Натисни **"Connect to GitHub"**
3. Авторизуй Supabase в GitHub
4. Вибери репозиторій: `SiTn1k/Jolt-Time-1.8.0`
5. Вибери гілку: `fix/typescript-errors` (або `main`)

Це дозволить Supabase автоматично деплоїти edge functions при пуші в гілку!

---

### 4. Як це працює

```
Push to fix/typescript-errors
         ↓
    GitHub Actions
         ↓
   Typecheck + Build
         ↓
   supabase db push (SQL migrations)
         ↓
   supabase functions deploy
         ↓
      ✅ Готово!
```

---

### 5. Troubleshooting

#### "Access token not provided"
- Переконайся що `SUPABASE_ACCESS_TOKEN` додано в GitHub Secrets

#### "Project not found"
- Перевір що `SUPABASE_PROJECT_REF = iyxhzisfwcdfhuxuqxso`

#### Edge functions не деплояться
- Переконайся що Supabase підключено до GitHub (крок 3)

---

### 6. Secrets потрібні для Edge Functions

Edge functions читають ці змінні з `Deno.env.get()`:

| Secret | Опис | Де використовується |
|--------|------|---------------------|
| `TELEGRAM_BOT_TOKEN` | Токен бота | Всі Telegram функції |
| `ADSGRAM_SECRET` | AdsGram секрет | adsgram-reward |
| `SUPABASE_URL` | URL проекту | Автоматично |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Автоматично |

---

### 7. Після налаштування

1. Пушни будь-яку зміну в гілку `fix/typescript-errors`
2. Перейди: GitHub → **Actions** вкладка
3. Спостерігай за deploy логами
4. Edge functions з'являться в Supabase Dashboard

---

**Час налаштування:** ~10 хвилин
**Після налаштування:** Автоматичний деплой при кожному пуші! 🚀
