import { useState } from 'react';
import { Trophy, Zap, Coins, Gift, Check, RotateCcw } from 'lucide-react';
import { Button } from './ui';
import { formatNumber } from '../lib/utils';

interface DailyChallenge {
  id: string;
  titleKey: string;
  description: string;
  target: number;
  current: number;
  reward: { type: 'karbovanets' | 'gacha_ticket' | 'booster'; amount: number };
  completed: boolean;
  claimed: boolean;
}

interface DailyChallengesProps {
  totalTaps: number;
  totalCurrency: number;
  generatorCount: number;
  currentStreak: number;
  onClaim: (reward: { type: string; amount: number }) => void;
  dayChallenges: {
    ids: string[];
    progress: Record<string, number>;
    claimed: string[];
  };
}

const CHALLENGES_POOL = [
  { id: 'tap_100', titleKey: 'Tap 100 times', description: 'Tap 100 times anywhere', target: 100, reward: { type: 'karbovanets' as const, amount: 100 } },
  { id: 'tap_500', titleKey: 'Tap 500 times', description: 'Tap 500 times anywhere', target: 500, reward: { type: 'karbovanets' as const, amount: 500 } },
  { id: 'tap_1000', titleKey: 'Tap 1000 times', description: 'Tap 1000 times anywhere', target: 1000, reward: { type: 'gacha_ticket' as const, amount: 1 } },
  { id: 'currency_5000', titleKey: 'Collect 5,000 coins', description: 'Reach 5,000 coins earned', target: 5000, reward: { type: 'karbovanets' as const, amount: 200 } },
  { id: 'currency_20000', titleKey: 'Collect 20,000 coins', description: 'Reach 20,000 coins earned', target: 20000, reward: { type: 'karbovanets' as const, amount: 800 } },
  { id: 'generators_3', titleKey: 'Own 3 generators', description: 'Own 3 different generators', target: 3, reward: { type: 'booster' as const, amount: 1 } },
  { id: 'generators_5', titleKey: 'Own 5 generators', description: 'Own 5 different generators', target: 5, reward: { type: 'gacha_ticket' as const, amount: 2 } },
  { id: 'streak_3', titleKey: 'Login 3 days', description: 'Login 3 days in a row', target: 3, reward: { type: 'karbovanets' as const, amount: 300 } },
  { id: 'streak_7', titleKey: 'Login 7 days', description: 'Login 7 days in a row', target: 7, reward: { type: 'booster' as const, amount: 2 } },
];

function getDailyChallenges(date: string): typeof CHALLENGES_POOL {
  // Use date as seed for consistent daily challenges
  const seed = date.split('-').reduce((a, b) => a + parseInt(b), 0);
  const shuffled = [...CHALLENGES_POOL].sort((a, b) => {
    const aSeed = (seed * a.id.charCodeAt(0)) % 100;
    const bSeed = (seed * b.id.charCodeAt(0)) % 100;
    return aSeed - bSeed;
  });
  return shuffled.slice(0, 3);
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function DailyChallenges({
  totalTaps,
  totalCurrency,
  generatorCount,
  currentStreak,
  onClaim,
  dayChallenges,
}: DailyChallengesProps) {
  const [expanded, setExpanded] = useState(false);
  const todayDate = getTodayDate();
  const dailyChallenges = getDailyChallenges(todayDate);

  const getProgress = (challengeId: string): number => {
    const counterKey = `challenge_${challengeId}`;
    if (dayChallenges.ids.includes(challengeId)) {
      return dayChallenges.progress[counterKey] || 0;
    }
    // Fallback to direct checks
    if (challengeId.startsWith('tap_')) return totalTaps;
    if (challengeId.startsWith('currency_')) return totalCurrency;
    if (challengeId.startsWith('generators_')) return generatorCount;
    if (challengeId.startsWith('streak_')) return currentStreak;
    return 0;
  };

  const challenges: DailyChallenge[] = dailyChallenges.map((c) => {
    const current = Math.min(getProgress(c.id), c.target);
    const completed = current >= c.target;
    const claimed = dayChallenges.claimed?.includes(c.id) || false;
    return {
      ...c,
      current,
      completed,
      claimed,
    };
  });

  const claimedCount = challenges.filter((c) => c.claimed).length;

  const handleClaim = (challenge: DailyChallenge) => {
    if (!challenge.completed || challenge.claimed) return;
    onClaim(challenge.reward);
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'karbovanets':
        return <Coins className="w-4 h-4 text-[#FFC72C]" />;
      case 'gacha_ticket':
        return <Gift className="w-4 h-4 text-[#9747FF]" />;
      case 'booster':
        return <Zap className="w-4 h-4 text-[#00E5FF]" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full p-3 rounded-xl border border-white/10 bg-gradient-to-r from-[#FFC72C]/10 to-[#9747FF]/10 hover:border-[#FFC72C]/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-[#FFC72C]" />
            <span className="text-sm font-medium">Daily Challenges</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {claimedCount}/{challenges.length}
            </span>
            <div className="flex gap-1">
              {challenges.map((c, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    c.claimed
                      ? 'bg-[#10B981]'
                      : c.completed
                      ? 'bg-[#FFC72C]'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#161B22] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#FFC72C]" />
          <h3 className="text-sm font-semibold">Daily Challenges</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {claimedCount}/{challenges.length} completed
          </span>
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-muted-foreground hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`p-3 rounded-lg border ${
              challenge.claimed
                ? 'border-[#10B981]/30 bg-[#10B981]/5'
                : challenge.completed
                ? 'border-[#FFC72C]/30 bg-[#FFC72C]/5'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium mb-1">{challenge.titleKey}</h4>
                <p className="text-xs text-muted-foreground">{challenge.description}</p>
              </div>
              <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                {getRewardIcon(challenge.reward.type)}
                <span className="text-xs font-medium">
                  {challenge.reward.amount}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {formatNumber(challenge.current)}/{formatNumber(challenge.target)}
                </span>
                <span className={challenge.completed ? 'text-[#10B981]' : 'text-muted-foreground'}>
                  {Math.round((challenge.current / challenge.target) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    challenge.claimed
                      ? 'bg-[#10B981]'
                      : challenge.completed
                      ? 'bg-[#FFC72C]'
                      : 'bg-[#00E5FF]'
                  }`}
                  style={{ width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Claim button */}
            {challenge.completed && !challenge.claimed && (
              <Button
                onClick={() => handleClaim(challenge)}
                className="w-full h-8 text-xs"
                style={{
                  backgroundColor: '#FFC72C',
                  color: '#0D1117',
                }}
              >
                <Check className="w-3 h-3 mr-1" />
                Claim Reward
              </Button>
            )}
            {challenge.claimed && (
              <div className="flex items-center justify-center gap-1 text-xs text-[#10B981]">
                <Check className="w-3 h-3" />
                Claimed
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <RotateCcw className="w-3 h-3" />
          <span>New challenges every day at midnight</span>
        </div>
      </div>
    </div>
  );
}

export default DailyChallenges;
