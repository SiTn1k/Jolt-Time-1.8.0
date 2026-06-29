import { useState, useEffect } from 'react';
import { Crown, Gift, Clock } from 'lucide-react';
import { useTranslation } from '../i18n';

const SEASON_END_DATE = new Date('2027-03-01T00:00:00Z');

interface SeasonReward {
  id: string;
  day: number;
  type: 'currency' | 'xp' | 'artifact' | 'energy';
  amount: number;
  claimed: boolean;
}

interface SeasonProgressProps {
  totalEarned: number;
  onRewardClaim?: (reward: SeasonReward) => void;
}

export function SeasonProgress({ totalEarned, onRewardClaim }: SeasonProgressProps) {
  const { t } = useTranslation();
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateSeason = () => {
      const now = new Date();
      const diff = SEASON_END_DATE.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      setDaysRemaining(days);

      // Progress based on days passed since game start (approximate)
      const totalDays = 275; // Approximate days from June 2026 to March 2027
      const daysPassed = Math.max(0, totalDays - days);
      setProgress(Math.min(100, (daysPassed / totalDays) * 100));
    };

    calculateSeason();
    const interval = setInterval(calculateSeason, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const seasonRewards: SeasonReward[] = [
    { id: 's1', day: 30, type: 'currency', amount: 1000, claimed: false },
    { id: 's2', day: 60, type: 'artifact', amount: 1, claimed: false },
    { id: 's3', day: 90, type: 'xp', amount: 5000, claimed: false },
    { id: 's4', day: 120, type: 'energy', amount: 500, claimed: false },
    { id: 's5', day: 150, type: 'currency', amount: 5000, claimed: false },
    { id: 's6', day: 180, type: 'artifact', amount: 1, claimed: false },
    { id: 's7', day: 210, type: 'xp', amount: 10000, claimed: false },
    { id: 's8', day: 240, type: 'energy', amount: 1000, claimed: false },
    { id: 's9', day: 270, type: 'currency', amount: 10000, claimed: false },
  ];

  return (
    <div className="bg-[#161B22] rounded-2xl p-4 border border-[#FFC72C]/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#FFC72C]" />
          <span className="font-bold text-[#E6EDF3]">Season 1</span>
        </div>
        <div className="flex items-center gap-1 text-[#8B949E] text-sm">
          <Clock className="w-4 h-4" />
          <span>{daysRemaining} {t('common.days_left', { count: daysRemaining })}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FFC72C] to-[#FF9500] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#8B949E] mt-1">
          <span>Start</span>
          <span>{Math.round(progress)}%</span>
          <span>March 2027</span>
        </div>
      </div>

      {/* Rewards Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#E6EDF3]">
          <Gift className="w-4 h-4 text-[#FFC72C]" />
          <span>{t('season.milestone_rewards')}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {seasonRewards.slice(0, 5).map((reward) => (
            <div 
              key={reward.id}
              className="px-3 py-1 bg-[#0d1117] rounded-lg text-xs"
            >
              <span className="text-[#8B949E]">Day {reward.day}: </span>
              <span className="text-[#FFC72C]">
                {reward.amount} {reward.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
