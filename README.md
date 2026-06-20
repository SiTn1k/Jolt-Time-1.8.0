# 🏛️ Ukraine Tap

A Telegram Mini App game about Ukrainian history, where players collect artifacts through the ages.

## 🎮 Game Features

- **12 Historical Epochs**: From Trypillia to Independence
- **Artifact Collection**: Gather and complete artifact sets
- **Prestige System**: Reset progress for permanent bonuses
- **Expeditions**: Send heroes on archaeological missions
- **Museum System**: Display your collection
- **Daily Rewards**: Streak-based rewards system

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Telegram Mini App SDK (HMAC validated)
- **Payments**: Telegram Stars

## 📁 Project Structure

```
├── src/
│   ├── App.tsx              # Main app component
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks (useGame)
│   ├── lib/                 # Utilities (storage, telegram)
│   ├── data/                # Game data (epochs, artifacts)
│   └── expedition/          # Expedition system
├── supabase/
│   ├── functions/           # Edge functions
│   │   ├── expedition-sync/
│   │   ├── expedition-rewards/
│   │   ├── daily-rewards/
│   │   ├── story-quests/
│   │   ├── perform-prestige/
│   │   ├── telegram-payments/
│   │   ├── claim-ad-reward/
│   │   ├── adsgram-reward/
│   │   ├── open-chest/
│   │   └── claim-offline-income/
│   └── migrations/          # Database migrations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase CLI
- Telegram Bot Token

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Fill in your values:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_TELEGRAM_BOT_USERNAME=YourBotName

# Start development server
npm run dev
```

### Database Setup

```bash
# Link Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy expedition-sync
```

## 🔒 Security

All game logic is server-authoritative:
- HMAC validation for Telegram auth
- RLS policies on all tables
- Server-side rarity rolls for chests
- Atomic currency operations
- Anti-abuse measures (cooldowns, limits)

## 📖 Documentation

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) - Production deployment guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment documentation

## 🎨 Game Balance

| Epoch | Level Range | Generators |
|-------|-------------|------------|
| Trypillia | 1-50 | 5 |
| Scythia | 51-100 | 5 |
| Antiquity | 101-150 | 5 |
| Kyiv Rus | 151-250 | 5 |
| ... | ... | ... |
| Independence | 901-950 | 5 |

**Prestige**: Available at level 950 in Independence epoch

## 📱 Telegram Integration

1. Create bot via @BotFather
2. Enable Mini App in Bot Settings
3. Set webhook for payments
4. Configure Telegram Stars

## 📊 Monitoring

- Supabase Dashboard: Logs, Metrics, Functions
- Edge Function Logs: Real-time execution logs
- Database: RLS policy violations

## 📄 License

MIT

---

**Version**: 1.8.0
**Build**: Production Ready ✅
