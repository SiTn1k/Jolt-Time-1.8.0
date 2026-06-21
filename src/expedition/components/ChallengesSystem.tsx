// ═══════════════════════════════════════════════════════════════════════
// CHALLENGES SYSTEM COMPONENT
// Daily and Weekly challenges with progress tracking
// ═══════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Clock, Star, Gift, Zap, Target, Check, ChevronRight } from 'lucide-react';
import { Card, Badge, Progress } from '../ui';
import { useExpeditionStore } from '../store';
import { useLiveOpsStore } from '../liveOpsStore';
import { dailyChallenges, weeklyChallenges, Challenge, ChallengePeriod } from '../liveOpsData';

function ChallengeCard({ challenge, period }: { challenge: Challenge; period: ChallengePeriod }) {
  const progress = useLiveOpsStore(s => 
    period === 'daily' 
      ? s.dailyChallengesProgress[challenge.id] 
      : s.weeklyChallengesProgress[challenge.id]
  );
  const claimReward = useLiveOpsStore(s => s.claimChallengeReward);
  const addKarbovanets = useExpeditionStore(s => s.addKarbovanets);
  const addXp = useExpeditionStore(s => s.addXp);
  const addReputation = useExpeditionStore(s => s.addReputation);
  const pushToast = useExpeditionStore(s => s.pushToast);

  const current = progress?.current || 0;
  const completed = progress?.completed || false;
  const claimed = progress?.claimed || false;
  const percent = Math.min(100, (current / challenge.targetCount) * 100);

  const handleClaim = () => {
    claimReward(challenge.id, period);
    
    // Apply rewards immediately
    if (challenge.reward.karbovanets) {
      addKarbovanets(challenge.reward.karbovanets);
    }
    if (challenge.reward.xp) {
      addXp(challenge.reward.xp);
    }
    if (challenge.reward.reputation) {
      addReputation(challenge.reward.reputation);
    }
    
    pushToast(`+${challenge.reward.karbovanets || 0} 💰 +${challenge.reward.xp || 0} XP`, '#FFD700');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${completed && !claimed ? 'ring-2 ring-[#FFD700]' : ''} rounded-xl overflow-hidden`}
    >
      <Card className="bg-[#161B22] border-white/5 p-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
            {challenge.icon}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-[#E6EDF3] truncate">
                {challenge.titleKey.replace('challenge.', '').replace(/_/g, ' ')}
              </h4>
              {claimed && (
                <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                  <Check className="w-3 h-3 mr-1" />
                  Отримано
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-[#8B949E] mt-0.5">
              {challenge.descriptionKey.replace('challenge.', '').replace(/_/g, ' ')}
            </p>
            
            {/* Progress */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#8B949E]">
                  {current}/{challenge.targetCount}
                </span>
                <span className="text-[#8B949E]">{Math.round(percent)}%</span>
              </div>
              <Progress 
                value={percent} 
                className="h-1.5 bg-white/10"
              />
            </div>
            
            {/* Reward */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-[#FFC72C]">
                {challenge.reward.karbovanets && (
                  <>
                    <Star className="w-3 h-3" />
                    <span>{challenge.reward.karbovanets}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#00E5FF]">
                {challenge.reward.xp && (
                  <>
                    <Zap className="w-3 h-3" />
                    <span>{challenge.reward.xp} XP</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#A855F7]">
                {challenge.reward.reputation && (
                  <>
                    <Trophy className="w-3 h-3" />
                    <span>{challenge.reward.reputation}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Claim Button */}
          {completed && !claimed && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClaim}
              className="px-3 py-2 rounded-lg bg-[#FFD700] text-black font-semibold text-xs flex items-center gap-1"
            >
              <Gift className="w-4 h-4" />
              Забрати
            </motion.button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function ChallengesSystem() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const refreshActiveEvents = useLiveOpsStore(s => s.refreshActiveEvents);
  const currentBonusMultiplier = useLiveOpsStore(s => s.currentBonusMultiplier);
  const activeEvents = useLiveOpsStore(s => s.activeEvents);
  const resetDailyChallenges = useLiveOpsStore(s => s.resetDailyChallenges);
  const resetWeeklyChallenges = useLiveOpsStore(s => s.resetWeeklyChallenges);

  // Check for resets on mount
  useState(() => {
    resetDailyChallenges();
    resetWeeklyChallenges();
    refreshActiveEvents();
  });

  const dailyCompleted = dailyChallenges.filter(c => 
    useLiveOpsStore.getState().dailyChallengesProgress[c.id]?.claimed
  ).length;
  
  const weeklyCompleted = weeklyChallenges.filter(c =>
    useLiveOpsStore.getState().weeklyChallengesProgress[c.id]?.claimed
  ).length;

  return (
    <div className="space-y-4">
      {/* Active Events Banner */}
      {activeEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
        >
          <Card className="bg-gradient-to-r from-[#FFD700]/20 to-[#FF6B00]/20 border-[#FFD700]/30 p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[#FFD700]">
                  {activeEvents[0].icon} {activeEvents[0].name}
                </h4>
                <p className="text-xs text-[#E6EDF3]/80">
                  {activeEvents[0].bonusMultiplier}x нагороди!
                </p>
              </div>
              <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                {currentBonusMultiplier}x
              </Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'daily'
              ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
              : 'text-[#8B949E] hover:text-[#E6EDF3]'
          }`}
        >
          <Clock className="w-4 h-4" />
          Щоденні
          {dailyCompleted > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#00E5FF]/20 text-[10px]">
              {dailyCompleted}/{dailyChallenges.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'weekly'
              ? 'bg-[#A855F7]/20 text-[#A855F7]'
              : 'text-[#8B949E] hover:text-[#E6EDF3]'
          }`}
        >
          <Target className="w-4 h-4" />
          Тижневі
          {weeklyCompleted > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#A855F7]/20 text-[10px]">
              {weeklyCompleted}/{weeklyChallenges.length}
            </span>
          )}
        </button>
      </div>

      {/* Challenges List */}
      <AnimatePresence mode="wait">
        {activeTab === 'daily' ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {dailyChallenges.map((challenge, i) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ChallengeCard challenge={challenge} period="daily" />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {weeklyChallenges.map((challenge, i) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ChallengeCard challenge={challenge} period="weekly" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
