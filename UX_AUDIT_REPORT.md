# 📱 UX АУДИТ - JOLT TIME v1.8.0

**Дата:** 2026-06-20  
**Версія:** 1.8.0  
**Статус:** ГОТОВО ДО РЕАЛІЗАЦІЇ

---

## 📋 ЗМІСТ

1. [Поточний стан UI](#поточний-стан-ui)
2. [Знайдені проблеми](#знайдені-проблеми)
3. [Пропонована нова структура](#пропонована-нова-структура)
4. [План реалізації](#план-реалізації)

---

## 📊 ПОТОЧНИЙ СТАН UI

### Навігація (Tab Bar)

| Tab | Іконка | Функція | Проблема |
|-----|--------|---------|----------|
| shop | 🛒 | Магазин генераторів | ✅ OK |
| epochs | 👑 | Перемикач епох | ⚠️ Занадто великий badge |
| artifacts | 🎁 | Система артефактів | ✅ OK |
| boosters | ⚡ | Бустери та реклама | ⚠️ Перевантажений |
| referrals | 👥 | Реферали | ⚠️ Не потрібен новачкам |
| stats | 🏆 | Статистика | ⚠️ Рідко використовується |

### Проблеми з екраном

1. **Tap Area** - занадто малий (30% екрану)
2. **XP Bar** - показує лише поточний рівень, не прогрес
3. **Ресурси** (енергія, валюта) - розкидані по екрану
4. **Boost Bar** - вбудований у tab content, важко знайти

---

## 🔍 ЗНАЙДЕНІ ПРОБЛЕМИ

### 1. Перевантаженість Tab Bar
```
❌ Поточний вигляд:
[Shop] [Epochs👑4] [Artifacts🎁3] [Boost⚡] [Refer👥2] [Stats🏆]

✅ Проблема: 6 табів для новачків - занадто багато
```

### 2. Tap Area занадто малий
```
❌ Поточний вигляд: 30% екрану
✅ Рекомендація: 50% екрану для кращого досвіду
```

### 3. Відсутність чіткої ієрархії
```
❌ Ресурси показуються в header без пріоритету
✅ Рекомендація: Header показує лише 3 ключові ресурси
```

### 4. Boost Bar прихований
```
❌ Всередині tab content boosters
✅ Рекомендація: Окремий фіксований бар під Tap Area
```

---

## 🎯 ПРОПОНОВАНА НОВА СТРУКТУРА

### Новий Layout

```
┌─────────────────────────────────────────────────────┐
│  HEADER (compact, sticky)                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ ⚡ 850  │ │ 💰 12.5K │ │ 🏺 45%  │               │
│  │ Energy  │ │Currency │ │  XP     │               │
│  └─────────┘ └─────────┘ └─────────┘               │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│           TAP AREA (50% screen height)              │
│                                                     │
│              [ +15 XP per tap ]                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  BOOST BAR (always visible)                         │
│  ┌─────────────────┐ ┌─────────────────┐          │
│  │ ⭐ XP x3  │ 25m │ │ 💰 Currency x2 │ 45m │     │
│  └─────────────────┘ └─────────────────┘          │
├─────────────────────────────────────────────────────┤
│                                                     │
│           CONTENT AREA (scrollable)                 │
│                                                     │
│  [Current epoch info / shop / artifacts etc]        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  NAVIGATION BAR (bottom, sticky)                   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐│
│  │  Гра  │ │Артеф. │ │Експед.│ │Профіль│ │ ⚙️    ││
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘│
└─────────────────────────────────────────────────────┘
```

### Новий Tab Bar (5 tabs)

| Tab | Українська | Опис |
|-----|------------|------|
| game | Гра | Tap area + shop + generators |
| artifacts | Артефакти | Museum, artifacts, upgrades |
| expedition | Експедиції | Expeditions (if unlocked) |
| profile | Профіль | Stats, referrals, settings |
| settings | ⚙️ | Settings (gear icon) |

### Header Components

```
┌─────────────────────────────────────────────────────┐
│ [👑 Epoch Name]           [⚡ Energy: 850/1000]      │
│ [========== XP: 45% ==========] [💰 12,500]        │
└─────────────────────────────────────────────────────┘

1. Epoch indicator (left) - click to switch epochs
2. XP progress bar (full width) - shows level + progress
3. Energy (compact) - shows current/max
4. Currency (right) - shows amount with icon
```

### Boost Bar (New)

```
┌─────────────────────────────────────────────────────┐
│ ACTIVE BOOSTS                                       │
│ ┌─────────────────┐ ┌─────────────────┐             │
│ │ ⭐ XP x3        │ │ 💰 Currency x2  │             │
│ │ ⏱️ 25:00        │ │ ⏱️ 45:00        │             │
│ │ [Watch Ad +30m] │ │                 │             │
│ └─────────────────┘ └─────────────────┘             │
│                                                     │
│ ┌─────────────────┐ ┌─────────────────┐             │
│ │ 👑 Daily: 3/3   │ │ 📊 Weekly: 1/7  │             │
│ └─────────────────┘ └─────────────────┘             │
└─────────────────────────────────────────────────────┘
```

---

## 📝 ДЕТАЛЬНІ ЗМІНИ

### 1. Header (compact)

**Було:**
```tsx
<div className="flex items-center justify-between p-4">
  <span>Level {level}</span>
  <span>XP: {xp}/{xpToNextLevel}</span>
  <span>Energy: {energy}</span>
  <span>Currency: {currency}</span>
</div>
```

**Стане:**
```tsx
<div className="px-4 py-2">
  <div className="flex justify-between items-center mb-1">
    <button className="text-sm font-medium">{epoch.name}</button>
    <span className="text-sm">{formatNumber(energy)}/{maxEnergy} ⚡</span>
    <span className="text-sm">{formatNumber(currency)} 💰</span>
  </div>
  <div className="w-full bg-gray-700 rounded-full h-2">
    <div 
      className="bg-yellow-500 h-2 rounded-full transition-all"
      style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
    />
  </div>
  <div className="flex justify-between text-xs mt-1">
    <span>Level {level}</span>
    <span>{Math.round((xp / xpToNextLevel) * 100)}%</span>
  </div>
</div>
```

### 2. Tap Area (larger)

**Було:**
```tsx
<div className="h-[30vh]">
  <TapArea onTap={handleTap} />
</div>
```

**Стане:**
```tsx
<div className="h-[50vh] flex flex-col items-center justify-center">
  <TapArea onTap={handleTap} />
  <div className="mt-4 text-center">
    <span className="text-2xl font-bold">+{tapValue} XP</span>
  </div>
</div>
```

### 3. Boost Bar (always visible)

**Новий компонент:**
```tsx
function BoostBar({ boosters, onWatchAd }: Props) {
  return (
    <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
      <div className="text-xs text-gray-400 mb-2">АКТИВНІ БУСТИ</div>
      <div className="flex gap-2 overflow-x-auto">
        {/* XP Boost */}
        <div className="flex-shrink-0 bg-yellow-900/30 rounded-lg px-3 py-2">
          <div className="text-sm">⭐ XP x{boosters.xp}</div>
          <div className="text-xs text-gray-400">{formatTime(boosters.xpEndsAt)}</div>
        </div>
        {/* Currency Boost */}
        <div className="flex-shrink-0 bg-green-900/30 rounded-lg px-3 py-2">
          <div className="text-sm">💰 x{boosters.currency}</div>
          <div className="text-xs text-gray-400">{formatTime(boosters.currencyEndsAt)}</div>
        </div>
        {/* Watch Ad Button */}
        <button 
          onClick={onWatchAd}
          className="flex-shrink-0 bg-purple-900/30 rounded-lg px-3 py-2"
        >
          <div className="text-sm">📺 Watch Ad</div>
          <div className="text-xs text-gray-400">+30 min</div>
        </button>
      </div>
    </div>
  );
}
```

### 4. Navigation Bar (bottom)

**Було:**
```tsx
<div className="flex justify-around">
  <button>Shop</button>
  <button>Epochs</button>
  <button>Artifacts</button>
  <button>Boosters</button>
  <button>Referrals</button>
  <button>Stats</button>
</div>
```

**Стане:**
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700">
  <div className="flex justify-around py-2">
    <NavButton active={tab === 'game'} icon="🎮" label="Гра" />
    <NavButton active={tab === 'artifacts'} icon="🏺" label="Артефакти" badge={count} />
    <NavButton active={tab === 'expedition'} icon="⚔️" label="Експедиції" />
    <NavButton active={tab === 'profile'} icon="👤" label="Профіль" />
    <NavButton active={tab === 'settings'} icon="⚙️" label="" />
  </div>
</div>
```

---

## 📐 ПЛАН РЕАЛІЗАЦІЇ

### Етап 1: Нові компоненти (1-2 години)

1. [ ] Створити `CompactHeader.tsx`
2. [ ] Створити `BoostBar.tsx`
3. [ ] Створити `BottomNavigation.tsx`

### Етап 2: Модифікація App.tsx (2-3 години)

1. [ ] Замінити TabBar на BottomNavigation
2. [ ] Додати CompactHeader
3. [ ] Додати BoostBar
4. [ ] Перенести контент tabів у відповідні компоненти

### Етап 3: Стилізація (1-2 години)

1. [ ] Адаптувати CSS для нової структури
2. [ ] Додати анімації для transitions
3. [ ] Оптимізувати для мобільних (320px-428px)

### Етап 4: Тестування (1 година)

1. [ ] Перевірити всі таби
2. [ ] Перевірити адаптивність
3. [ ] Перевірити продуктивність

---

## 📊 ПРІОРИТЕТИ

| Пріоритет | Зміна | Час | Складність |
|-----------|-------|-----|------------|
| 🔴 Високий | Compact Header | 1 год | Легко |
| 🔴 Високий | Larger Tap Area | 30 хв | Легко |
| 🟠 Середній | Boost Bar окремо | 1 год | Середньо |
| 🟠 Середній | Bottom Navigation | 2 год | Середньо |
| 🟢 Низький | Нові анімації | 1 год | Легко |

---

## ⚠️ ВАЖЛИВО

1. **Не видаляти функціонал** - лише реорганізувати
2. **Зберігати продуктивність** - уникати зайвих re-renders
3. **Test на реальних пристроях** - Telegram Mini App має специфічні обмеження

---

**Дата створення:** 2026-06-20  
**Автор:** OpenHands Agent  
**Статус:** ГОТОВО ДО РЕАЛІЗАЦІЇ
