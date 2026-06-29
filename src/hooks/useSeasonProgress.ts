import { useState, useEffect, useCallback } from 'react';

const SEASON_END_DATE = new Date('2027-03-01T00:00:00Z');

interface SeasonInfo {
  daysRemaining: number;
  progress: number; // 0-100
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface MilestoneProgress {
  milestone: number;
  current: number;
  required: number;
  reward: {
    type: 'currency' | 'xp' | 'artifact' | 'energy';
    amount: number;
  };
  claimed: boolean;
}

export function useSeasonProgress() {
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>({
    daysRemaining: 0,
    progress: 0,
    startDate: new Date('2026-06-01'),
    endDate: SEASON_END_DATE,
    isActive: true,
  });

  const [milestones, setMilestones] = useState<MilestoneProgress[]>([
    { milestone: 30, current: 0, required: 30, reward: { type: 'currency', amount: 1000 }, claimed: false },
    { milestone: 60, current: 0, required: 60, reward: { type: 'artifact', amount: 1 }, claimed: false },
    { milestone: 90, current: 0, required: 90, reward: { type: 'xp', amount: 5000 }, claimed: false },
    { milestone: 120, current: 0, required: 120, reward: { type: 'energy', amount: 500 }, claimed: false },
    { milestone: 150, current: 0, required: 150, reward: { type: 'currency', amount: 5000 }, claimed: false },
    { milestone: 180, current: 0, required: 180, reward: { type: 'artifact', amount: 1 }, claimed: false },
    { milestone: 210, current: 0, required: 210, reward: { type: 'xp', amount: 10000 }, claimed: false },
    { milestone: 240, current: 0, required: 240, reward: { type: 'energy', amount: 1000 }, claimed: false },
    { milestone: 270, current: 0, required: 270, reward: { type: 'currency', amount: 10000 }, claimed: false },
  ]);

  // Calculate season progress
  const updateSeasonProgress = useCallback(() => {
    const now = new Date();
    const totalDays = Math.ceil((SEASON_END_DATE.getTime() - new Date('2026-06-01').getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - new Date('2026-06-01').getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((SEASON_END_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    setSeasonInfo({
      daysRemaining,
      progress,
      startDate: new Date('2026-06-01'),
      endDate: SEASON_END_DATE,
      isActive: now < SEASON_END_DATE,
    });
  }, []);

  // Update on mount and every minute
  useEffect(() => {
    updateSeasonProgress();
    const interval = setInterval(updateSeasonProgress, 60000);
    return () => clearInterval(interval);
  }, [updateSeasonProgress]);

  // Track user activity for milestones
  const trackActivity = useCallback((daysActive: number) => {
    setMilestones(prev => prev.map(m => ({
      ...m,
      current: Math.min(daysActive, m.required),
      claimed: daysActive >= m.milestone ? m.claimed : false,
    })));
  }, []);

  // Claim milestone reward
  const claimMilestone = useCallback((milestoneId: number) => {
    setMilestones(prev => prev.map(m => 
      m.milestone === milestoneId ? { ...m, claimed: true } : m
    ));
  }, []);

  // Get next unclaimed milestone
  const getNextMilestone = useCallback(() => {
    return milestones.find(m => !m.claimed && m.current >= m.required);
  }, [milestones]);

  // Format days remaining as readable string
  const formatDaysRemaining = useCallback(() => {
    const { daysRemaining } = seasonInfo;
    if (daysRemaining <= 0) return 'Season ended';
    if (daysRemaining === 1) return '1 day left';
    if (daysRemaining < 7) return `${daysRemaining} days left`;
    if (daysRemaining < 30) {
      const weeks = Math.floor(daysRemaining / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} left`;
    }
    const months = Math.floor(daysRemaining / 30);
    return `${months} month${months > 1 ? 's' : ''} left`;
  }, [seasonInfo]);

  return {
    seasonInfo,
    milestones,
    trackActivity,
    claimMilestone,
    getNextMilestone,
    formatDaysRemaining,
    updateSeasonProgress,
  };
}
