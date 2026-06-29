# Technical Audit — Jolt Time

**Версія документа:** 1.0  
**Дата:** 2026-06-29  
**Автор:** OpenHands Agent  
**Проєкт:** Jolt Time (Sit Studio)  
**Версія проєкту:** 1.8.0  

---

## 1. Project Overview

### 1.1 Проект опис

Jolt Time — це Telegram Mini App/idle-гра з українською історичною тематикою, розроблена Sit Studio. Гравець проходить через 12 епох української історії (від Трипільської культури до Незалежності), тапаючи для отримання XP та розблоковуючи генератори для пасивного доходу.

### 1.2 Технічний стек

| Рівень | Технологія | Версія |
|--------|------------|--------|
| **Frontend** | React | 18.3.1 |
| **Frontend** | TypeScript | 5.5.3 |
| **Frontend** | Vite | 5.4.2 |
| **Frontend** | Zustand | 5.0.3 |
| **Frontend** | Tailwind CSS | 3.4.1 |
| **Frontend** | Motion | 12.0.0 |
| **Frontend** | Lucide React | 0.344.0 |
| **Backend** | Supabase Edge Functions | Deno |
| **Database** | Supabase (PostgreSQL) | — |
| **Integration** | Telegram WebApp SDK | — |
| **Integration** | AdsGram SDK | 1.0.2 |
| **Testing** | Vitest | 4.1.9 |
| **Testing** | Testing Library | 16.3.2 |

### 1.3 Структура проєкту

```
Jolt-Time-1.8.0/
├── src/                          # Frontend (React)
│   ├── App.tsx                   # Головний компонент
│   ├── components/               # UI компоненти
│   │   ├── AdSystem.tsx
│   │   ├── AdsGramButton.tsx
│   │   ├── DailyChallenges.tsx
│   │   ├── DailyRewards.tsx
│   │   ├── DailyStreakModal.tsx
│   │   ├── DailyTasksPanel.tsx
│   │   ├── GachaModal.tsx
│   │   ├── GeneratorShop.tsx
│   │   ├── OfflineRewardModal.tsx
│   │   ├── PrestigeSystem.tsx
│   │   ├── ReferralsTab.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── TapArea.tsx
│   │   ├── TutorialModal.tsx
│   │   ├── tutorial/
│   │   └── ui/
│   ├── data/                     # Дані ігор (епохи, таски)
│   │   ├── epochs.ts             # 12 епох + генератори + артефакти
│   │   └── tasks.ts             # Щоденні завдання
│   ├── expedition/               # Expedition Module ( Великий)
│   │   ├── ExpeditionApp.tsx
│   │   ├── store.ts
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   └── *.ts
│   ├── hooks/
│   │   └── useGame.ts            # Головний state management
│   ├── i18n/                     # Інтернаціоналізація
│   │   ├── en.json
│   │   ├── uk.json
│   │   └── useTranslation.ts
│   ├── lib/                      # Утіліти
│   │   ├── cryptoUtils.ts
│   │   ├── rpc.ts                # Server-authoritative RPC
│   │   ├── storage.ts            # Local + Remote sync
│   │   ├── supabase.ts
│   │   ├── tabManager.ts
│   │   ├── telegram.ts           # Telegram WebApp integration
│   │   └── utils.ts
│   ├── services/
│   │   ├── NotificationService.ts
│   │   └── adsgram.ts
│   ├── types/
│   │   └── game.ts               # TypeScript типи
│   └── utils/
│       └── debug.ts
├── supabase/
│   ├── migrations/               # 28 SQL міграцій
│   │   ├── 20260613144854_001_game_progress.sql
│   │   ├── 20260621000005_034_rpc_helpers.sql
│   │   └── ... (26 more migrations)
│   └── functions/                # Supabase Edge Functions (25 функцій)
│       ├── adsgram-reward/
│       ├── claim-ad-reward/
│       ├── claim-daily-reward/
│       ├── claim-offline-income/
│       ├── collect-museum-income/
│       ├── daily-rewards/
│       ├── expedition-complete/
│       ├── expedition-rewards/
│       ├── expedition-sync/
│       ├── game-action/
│       ├── generate-artifact/
│       ├── get-player-stats/
│       ├── load-game/
│       ├── open-chest/
│       ├── perform-prestige/
│       ├── prestige-reward/
│       ├── purchase-premium/
│       ├── save-game/
│       ├── send-retention-reminders/
│       ├── story-quests/
│       ├── telegram-payments/
│       ├── track-session/
│       ├── validate-collection/
│       ├── validate-init-data/
│       └── validate-purchase/
├── tests/
│   ├── e2e/
│   └── unit/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 1.4 Розмір проєкту

| Метрика | Значення |
|---------|---------|
| Загальна кількість рядків коду | ~15,925 |
| Кількість компонентів | ~20 |
| Кількість Edge Functions | 25 |
| Кількість SQL міграцій | 28 |
| Кількість епох | 12 |
| Кількість генераторів | 60 (5 на епоху) |
| Кількість артефактів | ~45+ |

---

## 2. Database Schema (Supabase)

### 2.1 Головні таблиці

#### `game_progress` — Основна таблиця гравця

```sql
CREATE TABLE game_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE,
  
  -- Core Game State
  epoch_id text NOT NULL DEFAULT 'trypillia',
  level integer NOT NULL DEFAULT 1,
  xp real NOT NULL DEFAULT 0,
  xp_to_next_level real NOT NULL DEFAULT 100,
  total_xp real NOT NULL DEFAULT 0,
  currency real NOT NULL DEFAULT 20,
  total_currency_earned real NOT NULL DEFAULT 20,
  tap_power integer NOT NULL DEFAULT 1,
  passive_xp_per_second real NOT NULL DEFAULT 0,
  
  -- Generators & Epochs
  owned_generators jsonb NOT NULL DEFAULT '[]',
  unlocked_epochs text[] NOT NULL DEFAULT ARRAY['trypillia'],
  
  -- Artifacts
  artifact_parts jsonb NOT NULL DEFAULT '{}',
  artifact_levels jsonb NOT NULL DEFAULT '{}',
  completed_artifacts text[] NOT NULL DEFAULT '{}',
  artifact_dupes jsonb NOT NULL DEFAULT '{}',
  
  -- Referrals
  referrer_id bigint,
  referrals_count integer NOT NULL DEFAULT 0,
  referral_earnings real NOT NULL DEFAULT 0,
  
  -- Boosters
  active_boosters jsonb NOT NULL DEFAULT '{}',
  
  -- Daily Systems
  current_streak integer NOT NULL DEFAULT 0,
  last_check_in date,
  
  -- Prestige System
  prestige_level integer NOT NULL DEFAULT 0,
  prestige_points integer NOT NULL DEFAULT 0,
  prestige_research jsonb NOT NULL DEFAULT '{}',
  
  -- Energy System
  energy integer NOT NULL DEFAULT 1000,
  max_energy integer NOT NULL DEFAULT 1000,
  energy_recharged_at timestamptz DEFAULT NOW(),
  
  -- Session & Offline
  last_online_at timestamptz DEFAULT NOW(),
  session_start_at timestamptz DEFAULT NOW(),
  last_saved_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  
  -- Device tracking
  device_id text,
  
  -- Ad tracking
  daily_ad_views jsonb NOT NULL DEFAULT '{}',
  
  -- Purchase limits (anti-abuse)
  purchase_limits jsonb DEFAULT '{"daily_purchases": 0, "last_purchase_reset": null}'::JSONB
);

-- Level cap constraint
ALTER TABLE game_progress ADD CONSTRAINT level_max CHECK (level <= 999);
```

#### `prestige_records` — Історія престижу

```sql
CREATE TABLE prestige_records (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  prestige_number INTEGER NOT NULL,
  previous_level INTEGER NOT NULL,
  total_xp_at_prestige REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `stars_purchases` — Покупки Telegram Stars (anti-dupe)

```sql
CREATE TABLE stars_purchases (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  charge_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `ads_rewards_log` — Лог нагород за рекламу

```sql
CREATE TABLE ads_rewards_log (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'adsgram',
  reward_amount INTEGER NOT NULL DEFAULT 100,
  ad_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(telegram_id, ad_id)
);
```

#### `ad_views` — Перегляди реклами

```sql
CREATE TABLE ad_views (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  session_id TEXT,
  reward_granted BOOLEAN DEFAULT true
);
```

#### `retention_notifications` — Лог пуш-сповіщень

```sql
CREATE TABLE retention_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  notification_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT NOW(),
  payload jsonb
);
```

#### `cloud_saves` — Хмарні збереження

```sql
CREATE TABLE cloud_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  save_data JSONB NOT NULL,
  save_version INTEGER DEFAULT 1,
  content_version INTEGER DEFAULT 1,
  save_hash TEXT,
  device_id TEXT,
  platform TEXT DEFAULT 'telegram',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `player_notifications` — Сповіщення гравців

```sql
CREATE TABLE player_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_push_sent BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

#### `museum_income_log` — Лог доходу музею

```sql
CREATE TABLE museum_income_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  income BIGINT NOT NULL,
  bonus_breakdown JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `collection_completion_log` — Лог колекцій

```sql
CREATE TABLE collection_completion_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  collection_id TEXT NOT NULL,
  reward_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `security_events` — Безпекові події

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Індекси

```sql
-- Game Progress
CREATE INDEX idx_game_progress_telegram_id ON game_progress(telegram_id);
CREATE INDEX idx_game_progress_prestige ON game_progress(prestige_level DESC, level DESC);
CREATE INDEX idx_game_progress_updated_at ON game_progress(updated_at);

-- Prestige Records
CREATE INDEX idx_prestige_records_telegram_id ON prestige_records(telegram_id);

-- Stars Purchases
CREATE INDEX idx_stars_purchases_telegram_id ON stars_purchases(telegram_id);

-- Ads Rewards Log
CREATE INDEX idx_ads_rewards_telegram_id ON ads_rewards_log(telegram_id);
CREATE INDEX idx_ads_rewards_created_at ON ads_rewards_log(created_at);

-- Retention Notifications
CREATE INDEX idx_retention_notif_type_lookup ON retention_notifications (telegram_id, notification_type, sent_at);

-- Notifications
CREATE INDEX idx_notifications_telegram_id ON player_notifications(telegram_id);
CREATE INDEX idx_notifications_unread ON player_notifications(telegram_id) WHERE is_read = false;

-- Museum/Collection logs
CREATE INDEX idx_museum_income_telegram_id ON museum_income_log(telegram_id);
CREATE INDEX idx_collection_log_telegram_id ON collection_completion_log(telegram_id);
CREATE INDEX idx_security_events_telegram_id ON security_events(telegram_id);
```

### 2.3 RLS Політики

**Важливо:** Більшість таблиць мають permissive RLS політики (`USING (true)`), оскільки Telegram Mini App використовує `anon` ключ. Безпека забезпечується через:
- HMAC-валідацію `initData` на сервері
- Edge Functions з service_role ключем

```sql
-- game_progress (PERMISSIVE - див. пояснення вище)
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_progress" ON game_progress FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_progress" ON game_progress FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- museum_income_log, collection_completion_log, security_events - SERVICE ROLE ONLY
-- Немає анонімного доступу

-- cloud_saves - JWT authenticated only
-- player_notifications - JWT authenticated only
```

### 2.4 RPC Functions

```sql
-- Atomic increments
increment_currency(p_telegram_id bigint, p_amount integer)
increment_referrals(p_telegram_id bigint)
increment_earnings(p_telegram_id bigint, p_amount integer)

-- Atomic last_online_at swap (race condition protection)
swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz) RETURNS timestamptz

-- Secure game progress update
update_game_progress(...) -- повний список параметрів
```

### 2.5 Тригери

```sql
-- Auto-update updated_at на game_progress
CREATE TRIGGER trg_game_progress_updated_at
BEFORE UPDATE ON game_progress
FOR EACH ROW
EXECUTE FUNCTION public.fn_game_progress_set_updated_at();
```

---

## 3. Backend API (Edge Functions)

### 3.1 Список Edge Functions

| Function | Метод | Призначення |
|----------|-------|-------------|
| `adsgram-reward` | GET/POST | AdsGram reward callback |
| `claim-ad-reward` | POST | Клейм нагороди за рекламу |
| `claim-daily-reward` | POST | Клейм щоденної нагороди |
| `claim-offline-income` | POST | Клейм офлайн-доходу |
| `collect-museum-income` | POST | Збір доходу музею |
| `daily-rewards` | POST | Щоденні нагороди (HMAC-validated) |
| `expedition-complete` | POST | Завершення експедиції |
| `expedition-rewards` | POST | Нагороди експедиції (HMAC-validated) |
| `expedition-sync` | GET/POST | Синхронізація експедицій |
| `game-action` | POST | Серверні ігрові дії (HMAC-validated) |
| `generate-artifact` | POST | Генерація артефакту |
| `get-player-stats` | GET | Отримання статистики |
| `load-game` | POST | Завантаження гри |
| `open-chest` | POST | Відкриття скрині |
| `perform-prestige` | POST | Престиж (HMAC-validated) |
| `prestige-reward` | POST | Нагорода за престиж |
| `purchase-premium` | POST | Покупка преміуму |
| `save-game` | POST | Збереження гри |
| `send-retention-reminders` | POST |.Retention reminders (pg_cron) |
| `story-quests` | POST | Story quests |
| `telegram-payments` | POST | Telegram Stars payments |
| `track-session` | POST | Трекінг сесії |
| `validate-collection` | POST | Валідація колекції |
| `validate-init-data` | POST | HMAC-валідація initData |
| `validate-purchase` | POST | Валідація покупки |

### 3.2 HMAC-Validated Functions

Наступні функції використовують HMAC-SHA256 валідацію `initData`:

```typescript
// Функції з validateInitData():
// - daily-rewards
// - expedition-rewards
// - expedition-sync
// - game-action
// - perform-prestige
// - validate-init-data
```

Формула валідації:
```typescript
const secretKey = createHmac("sha256", "WebAppData")
  .update(BOT_TOKEN)
  .digest();
const computed = createHmac("sha256", secretKey)
  .update(checkStr)
  .digest("hex");
```

### 3.3 Ендпоінти що потребують посиленої безпеки

| Ендпоінт | Вразливість | Пріоритет |
|----------|-------------|-----------|
| `save-game` | Немає HMAC-валідації, покладається на RLS | Високий |
| `load-game` | Немає HMAC-валідації | Середній |
| `game-action` | Має HMAC, але не всі дії серверні | Середній |

---

## 4. Frontend Architecture

### 4.1 Сторінки та маршрути

Проєкт використовує single-page архітектуру з tabs (не React Router):

**Tabs:**
- `shop` — GeneratorShop (покупка генераторів)
- `epochs` — перемикач епох
- `artifacts` — артефакти та гача
- `referrals` — реферальна система
- `stats` — статистика гравця
- `boosters` — Telegram Stars бустери

**Modals:**
- TutorialModal — навчання для нових гравців
- DailyStreakModal — щоденний streak
- DailyRewards — check-in нагороди
- SessionAdModal — реклама після 20 хв
- ChestAdModal — реклама кожні 10 скринь
- GachaModal — гача система
- OfflineRewardModal — офлайн дохід

### 4.2 Компонентна структура

```
components/
├── AdSystem.tsx           # Система реклами (SessionAd, ChestAd)
├── AdsGramButton.tsx     # AdsGram SDK integration
├── DailyChallenges.tsx   # Щоденні виклики
├── DailyRewards.tsx      # Check-in нагороди
├── DailyStreakModal.tsx  # Мodal streak
├── DailyTasksPanel.tsx   # Щоденні таски
├── ErrorBoundary.tsx     # React Error Boundary
├── GachaModal.tsx        # Гача система
├── GeneratorShop.tsx     # Магазин генераторів
├── OfflineRewardModal.tsx # Офлайн нагороди
├── PrestigeSystem.tsx    # Престиж + Museum Laboratory
├── ReferralsTab.tsx      # Реферали
├── StatsPanel.tsx        # TapUpgrade component
├── TapArea.tsx          # Головна тапа area
├── TutorialModal.tsx    # Онбординг
├── tutorial/
│   ├── TutorialBubble.tsx
│   ├── TutorialGuide.tsx
│   ├── TutorialOverlay.tsx
│   └── index.ts
└── ui/
    └── Skeleton.tsx
```

### 4.3 Управління станом (Zustand-like у useGame.ts)

**Головний hook:** `useGame.ts` (~475 рядків)

**State (GameState):**
```typescript
interface GameState {
  epochId: EpochId;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  currency: number;
  totalCurrencyEarned: number;
  ownedGenerators: OwnedGenerator[];
  tapPower: number;
  passiveXpPerSecond: number;
  unlockedEpochs: EpochId[];
  artifactParts: Record<string, number>;
  artifactLevels: Record<string, number>;
  completedArtifacts: string[];
  duplicateTab: boolean;
  // ... more fields
}
```

**Expedition Module:** має власний store (`expedition/store.ts`) з Zustand-like API

### 4.4 Збереження та синхронізація

**Local Storage:**
- Key: `ukraine_tap_game_state`
- Авто-збереження кожні 2 секунди

**Remote Storage (Supabase):**
- Авто-збереження кожні 15 секунд
- Fallback при відсутності Telegram ID — використовує `device_id`

**Синхронізація:**
```typescript
const LOCAL_SAVE_INTERVAL = 2000;
const REMOTE_SAVE_INTERVAL = 15000;
```

---

## 5. Game Mechanics

### 5.1 XP та Leveling

**XP Formula (оновлена March 2027):**

```typescript
function calculateXpToLevel(level: number): number {
  // Кожна епоха має свій діапазон секунд
  // Epoch 1: 480s (8 min) → 2400s (40 min)
  // Epoch 2: 480s → 3840s (64 min)
  // Epoch 3: 960s (16 min) → 7200s (120 min)
  // ...
  // Epoch 12+: 5760s (96 min) → 43200s (720 min)
  
  const targetSeconds = minSeconds + progress * (maxSeconds - minSeconds);
  const estimatedPassive = estimatePassiveForEpoch(epoch, levelInEpoch);
  return Math.max(100, Math.floor(estimatedPassive * targetSeconds));
}
```

**Прогресія по епохах:**
| Епоха | Рівні | Середній час на рівень |
|-------|-------|------------------------|
| Trypillia | 1-50 | ~20 хв |
| Scythia | 51-100 | ~30 хв |
| Antiquity | 101-150 | ~60 хв |
| Kyiv Rus | 151-250 | ~90 хв |
| Halych-Volhynia | 251-320 | ~120 хв |
| Polish-Lithuanian | 321-420 | ~150 хв |
| Cossack | 421-550 | ~180 хв |
| Hetmanate | 551-650 | ~210 хв |
| Empire | 651-780 | ~240 хв |
| Revolution | 781-850 | ~270 хв |
| Soviet | 851-950 | ~300 хв |
| Independence | 951+ | ~360 хв |

### 5.2 Tap Power

```typescript
const effectiveTapPower = Math.max(
  1,
  Math.round(state.tapPower * artifactMultipliers.xp * boosterMultipliers.xp * energyMultiplier * prestigeXpBonus),
  Math.round(state.passiveXpPerSecond * 0.015),
);

// Tap upgrade cost
const tapPowerCost = 25 * Math.pow(1.8, state.tapPower - 1);
```

### 5.3 Генератори

**Структура генератора:**
```typescript
interface Generator {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  baseCost: number;        // Базова ціна
  baseProduction: number;  // Базова продуктивність
  costMultiplier: number;  // 1.15 для всіх
  icon: string;
}
```

**Розрахунок ціни:**
```typescript
cost = Math.floor(baseCost * Math.pow(1.15, currentLevel));
```

**Розрахунок виробництва:**
```typescript
production = baseProduction * currentLevel;
```

**5 генераторів на епоху** (60 всього), кожен наступний значно потужніший.

### 5.4 Артефакти

**Система фрагментів:**
- Кожен артефакт має 4 рівні
- Фрагменти: Level 1 = 10, Level 2 = 10, Level 3 = 15, Level 4 = 20

```typescript
export const ARTIFACT_PARTS_PER_LEVEL: Record<number, number> = {
  1: 10,
  2: 10,
  3: 15,
  4: 20,
};
```

**Рідкість:**
- `common` — +6-8% бонус
- `rare` — +10-12% бонус
- `epic` — +15% бонус
- `legendary` — +18-20% бонус
- `secret` — +15-20% бонус (потребує Prestige 1+)

**Бонуси:**
```typescript
type: 'xp_multiplier' | 'currency_multiplier' | 'passive_boost'
```

### 5.5 Престиж

**Умови:**
- Level >= 950
- Epoch = Independence

**Що скидається:**
- level, xp, currency
- ownedGenerators
- unlockedEpochs (крім Trypillia)
- tapPower
- passiveXpPerSecond
- activeBoosters
- artifactParts, artifactDupes

**Що зберігається:**
- completedArtifacts
- artifactLevels
- prestigeLevel, prestigePoints
- prestigeResearch
- dailyStreak, bestStreak
- referralsCount, referralEarnings

**Energy System:**
- Доступна тільки після Prestige 1+
- Максимум: 1000 (зростає на 50 за кожен престиж)
- Регенерація: +2 кожні 2 хвилини
- x5 множник коли енергія > 0

### 5.6 Престижні дослідження

```typescript
interface PrestigeResearch {
  rare_artifact_chance?: number;  // +5% Rare Artifact Chance per level (max 10)
  passive_income?: number;        // +10% Passive Income per level (max 10)
  xp_gain?: number;               // +5% XP Gain per level (max 20)
}
```

### 5.7 Експедиції (Expedition Module)

Окремий великий модуль з:
- ExpeditionApp.tsx
- 12+ screens (Buildings, Codex, DailyRewards, Heroes, Laboratory, Museum, etc.)
- Story system
- NPC system
- Museum system
- Premium shop

### 5.8 Економіка

**Стартова валюта:** 20  
**Реферальний бонус:** 100 (рефереру), 50 (новому користувачу)

**Бустери (Telegram Stars):**
| Бустер | Ціна | Тривалість |
|--------|------|------------|
| XP x2 | ? Stars | 30 хв |
| Currency x2 | ? Stars | 30 хв |
| Super Boost x3 | ? Stars | 30 хв |
| Energy Restore | ? Stars | - |
| Offline x2 | ? Stars | - |

**Рекламні нагороди:**
- AdsGram: x3 XP boost 30 хв
- Session Ad (20 хв): Energy restore або XP boost
- Chest Ad (кожні 10): Energy restore або bonus

---

## 6. Integrations

### 6.1 Telegram

**Ініціалізація:**
```typescript
initTelegramMiniApp():
  - tg.ready()
  - tg.expand()
  - tg.enableClosingConfirmation()
  - Встановлює CSS variables з themeParams
```

**Haptic Feedback:**
```typescript
hapticImpact('light' | 'medium' | 'heavy')
hapticNotification('success' | 'error' | 'warning')
```

**initData Validation:**
- Raw `initData` string відправляється на сервер
- HMAC-SHA256 валідація через `validate-init-data` Edge Function
- До валідації — ID вважається "провізиційним"

### 6.2 AdsGram

**Інтеграція:**
```typescript
// @adsgram/react v1.0.2
<AdsGramButton onReward={() => {}} />
```

**Reward:** x3 XP boost на 30 хвилин (NOT extendable)

### 6.3 Telegram Stars

**Flow:**
1. Фронтенд викликає `telegram-payments` Edge Function
2. Отримує `invoice_url`
3. `tg.openInvoice(invoice_url, callback)`
4. Вебхук від Telegram підтверджує покупку

**Anti-dupe:**
- `stars_purchases` таблиця з унікальним `charge_id`
- Перевірка перед нарахуванням

### 6.4 Push-сповіщення

**Service:** `NotificationService.ts`

**Permission request:** при першому запуску

---

## 7. Infrastructure

### 7.1 Розгортання

Проєкт планується розгортати на:
- **Frontend:** Vercel / Netlify / Render
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase (PostgreSQL)

*Примітка: У репозиторії немає Dockerfile, Docker Compose, або GitHub Actions workflows. Deployment конфігурація відсутня.*

### 7.2 Environment Variables

Очікувані змінні:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TELEGRAM_BOT_TOKEN=...
ADSGRAM_SECRET=...
```

---

## 8. Issues & Bottlenecks

### 8.1 Критичні проблеми

| ID | Проблема | Опис | Пріоритет |
|----|----------|------|-----------|
| C1 | **Permissive RLS** | `game_progress` має `USING (true)` — будь-хто може читати/писати будь-які дані. Безпека покладається лише на Telegram initData | Високий |
| C2 | **HMAC не для всіх операцій** | `save-game`, `load-game` не мають HMAC-валідації | Високий |
| C3 | **Client-side формули** | XP to level, generator production — рахуються на клієнті, а не сервері | Високий |

### 8.2 Важливі проблеми

| ID | Проблема | Опис | Пріоритет |
|----|----------|------|-----------|
| I1 | **Duplicate tab detection** | `TAB_ID` генерується локально, не серверно — можливий race condition | Середній |
| I2 | **Offline income cap** | 8 годин для Prestige 0, 6 годин для Prestige 1+ — клієнт рахує | Середній |
| I3 | **Artifact generation** | Серверне, але GachaModal показує preview до server confirmation | Середній |
| I4 | **No rate limiting visible** | Відсутній rate limiting на Edge Functions | Середній |

### 8.3 Оптимізації

| ID | Проблема | Опис | Пріоритет |
|----|----------|------|-----------|
| O1 | **Local save interval** | 2 секунди — може бути занадто частим для localStorage | Низький |
| O2 | **Bundle size** | Expedition module додає ~15K рядків до бандлу | Низький |
| O3 | **No code splitting** | Всі компоненти завантажуються разом | Низький |

### 8.4 Технічний борг

| ID | Елемент | Опис |
|----|---------|------|
| T1 | **Duplicate epoch/generator data** | epochs.ts визначає генератори, epochs.ts в useGame.ts теж | Очистити |
| T2 | **Duplicate XP formulas** | storage.ts і useGame.ts мають різні версії `calculateXpToLevel` | Уніфікувати |
| T3 | **Legacy artifact system** | `artifactDupes` позначений як legacy, але все ще використовується | Переглянути |
| T4 | **No tests for core game logic** | Відсутні unit тести для game mechanics | Додати |

---

## 9. Recommendations

### Пріоритет 1 — Критичні (виправити негайно)

1. **Впровадити HMAC-валідацію для save-game та load-game**
   - Додати `init_data` параметр
   - Валідувати на сервері перед збереженням/завантаженням

2. **Перенести критичні формули на сервер**
   - XP calculation
   - Generator production
   - Level up checks
   - Prestige validation

3. **Посилити RLS політики**
   - Додати telegram_id перевірку навіть для anon
   - Або повністю перейти на JWT authenticated

### Пріоритет 2 — Важливі (виправити найближчим часом)

1. **Видалити дублювання коду**
   - Уніфікувати `calculateXpToLevel`
   - Уніфікувати генератор формули

2. **Додати rate limiting**
   - На Edge Functions
   - Особливо на game-action, save-game

3. **Покращити Expedition Module**
   - Code splitting
   - Lazy loading

4. **Документація API**
   - OpenAPI/Swagger для Edge Functions
   - Внутрішня документація

### Пріоритет 3 — Оптимізація (3-6 місяців)

1. **Додати unit тести**
   - Game mechanics
   - XP calculations
   - Artifact system

2. **Code splitting для Expedition**
   - Ліниве завантаження
   - Зменшення initial bundle

3. **Performance optimization**
   - Збільшити local save interval
   - Debounce remote saves
   - Кешування

4. **CI/CD Pipeline**
   - GitHub Actions
   - Автоматичні тести
   - Деплой на staging

---

## 10. Next Steps

### Після цього аудиту рекомендується наступний порядок дій:

1. **Промт 1.2:** Безпековий аудит — виправити Permissive RLS, HMAC для всіх critical operations
2. **Промт 1.3:** Рефакторинг — уніфікувати формули, видалити дублювання
3. **Промт 1.4:** Тести — додати unit тести для game mechanics
4. **Промт 1.5:** Performance — code splitting, optimization
5. **Промт 1.6:** CI/CD — GitHub Actions, автоматизація

---

## Додаток A: Таблиці бази даних (повний список)

| Таблиця | Призначення |
|---------|-------------|
| `game_progress` | Основні дані гравця |
| `prestige_records` | Історія престижу |
| `stars_purchases` | Покупки Telegram Stars |
| `ads_rewards_log` | Лог нагород AdsGram |
| `ad_views` | Перегляди реклами |
| `retention_notifications` | Пуши retention |
| `cloud_saves` | Хмарні збереження |
| `player_notifications` | Сповіщення |
| `museum_income_log` | Дохід музею |
| `collection_completion_log` | Завершення колекцій |
| `security_events` | Безпекові події |

## Додаток B: Edge Functions (повний список)

| Function | Роль |
|----------|------|
| `adsgram-reward` | AdsGram callback |
| `claim-ad-reward` | Ad reward claim |
| `claim-daily-reward` | Daily reward |
| `claim-offline-income` | Offline income |
| `collect-museum-income` | Museum collection |
| `daily-rewards` | Check-in rewards |
| `expedition-complete` | Expedition completion |
| `expedition-rewards` | Expedition rewards |
| `expedition-sync` | Expedition sync |
| `game-action` | Core game actions |
| `generate-artifact` | Artifact generation |
| `get-player-stats` | Player stats |
| `load-game` | Load game state |
| `open-chest` | Open chest |
| `perform-prestige` | Perform prestige |
| `prestige-reward` | Prestige reward |
| `purchase-premium` | Premium purchase |
| `save-game` | Save game state |
| `send-retention-reminders` | Retention push |
| `story-quests` | Story quests |
| `telegram-payments` | Telegram Stars |
| `track-session` | Session tracking |
| `validate-collection` | Collection validation |
| `validate-init-data` | HMAC validation |
| `validate-purchase` | Purchase validation |

---

*Документ створено автоматично на основі аналізу коду репозиторію станом на 2026-06-29*
