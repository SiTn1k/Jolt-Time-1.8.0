// ═══════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS SYSTEM COMPONENT
// Achievement categories and progress tracking
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Star, Users, Map, BookOpen, Building, Lock, Unlock } from 'lucide-react';
import { Card, Badge, Progress } from '../ui';
import { useExpeditionStore } from '../store';
import { useLiveOpsStore } from '../liveOpsStore';
import { achievements, Achievement, AchievementCategory } from '../liveOpsData';
import { useTranslation } from '../../i18n';

const categoryIcons: Record<AchievementCategory, typeof Star> = {
  expedition: Map,
  hero: Star,
  museum: Building,
  npc: Users,
  story: BookOpen,
  academy: Trophy,
};

const categoryNames: Record<AchievementCategory, string> = {
  expedition: 'Експедиції',
  hero: 'Герої',
  museum: 'Музей',
  npc: 'NPC',
  story: 'Сюжет',
  academy: 'Академія',
};

const categoryColors: Record<AchievementCategory, string> = {
  expedition: '#00E5FF',
  hero: '#FFD700',
  museum: '#A855F7',
  npc: '#F59E0B',
  story: '#FF6B6B',
  academy: '#10B981',
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const progress = useLiveOpsStore(s => s.achievementsProgress[achievement.id]);
  const claimReward = useLiveOpsStore(s => s.claimAchievementReward);
  const addKarbovanets = useExpeditionStore(s => s.addKarbovanets);
  const addXp = useExpeditionStore(s => s.addXp);
  const { t } = useTranslation();

  const unlocked = progress?.unlocked || false;
  const color = categoryColors[achievement.category];

  const handleClaim = () => {
    claimReward(achievement.id);
    if (achievement.reward.karbovanets) {
      addKarbovanets(achievement.reward.karbovanets);
    }
    if (achievement.reward.xp) {
      addXp(achievement.reward.xp);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative ${unlocked ? 'ring-2 ring-[#FFD700]' : 'opacity-60'} rounded-xl overflow-hidden`}
    >
      <Card 
        className={`bg-[#161B22] border-white/5 p-3 ${!unlocked ? 'grayscale' : ''} cursor-pointer hover:bg-white/5 transition-colors`}
        style={{ borderLeft: `3px solid ${unlocked ? '#FFD700' : color}` }}
        onClick={handleClaim}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: unlocked ? `${color}20` : 'rgba(255,255,255,0.05)' }}
          >
            {unlocked ? achievement.icon : <Lock className="w-5 h-5 text-[#8B949E]" />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-[#E6EDF3]">
                {achievement.secret && !unlocked ? '???' : 
                  t(achievement.nameKey)
                }
              </h4>
              {unlocked && (
                <Badge className="bg-[#FFD700]/20 text-[#FFD700]">
                  <Unlock className="w-3 h-3 mr-1" />
                  Відкрито
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-[#8B949E] mt-0.5">
              {achievement.secret && !unlocked 
                ? 'Секретне досягнення' 
                : t(achievement.descriptionKey)
              }
            </p>
            
            {/* Reward Preview */}
            <div className="flex items-center gap-2 mt-2">
              {achievement.reward.karbovanets && (
                <span className="text-xs text-[#FFC72C]">
                  +{achievement.reward.karbovanets} 💰
                </span>
              )}
              {achievement.reward.xp && (
                <span className="text-xs text-[#00E5FF]">
                  +{achievement.reward.xp} XP
                </span>
              )}
              {achievement.reward.reputation && (
                <span className="text-xs text-[#A855F7]">
                  +{achievement.reward.reputation} ⚔️
                </span>
              )}
              {achievement.reward.expeditionSpeedBoost && (
                <span className="text-xs text-[#10B981]">
                  +{achievement.reward.expeditionSpeedBoost}% ⚡
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function AchievementsSystem() {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  
  const achievementsProgress = useLiveOpsStore(s => s.achievementsProgress);
  const totalAchievements = achievements.length;
  const unlockedAchievements = Object.values(achievementsProgress).filter(a => a.unlocked).length;
  const progressPercent = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;

  const filteredAchievements = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  const categories: (AchievementCategory | 'all')[] = [
    'all', 'expedition', 'hero', 'museum', 'npc', 'story', 'academy'
  ];

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card className="bg-gradient-to-r from-[#FFD700]/10 to-[#FF6B00]/10 border-[#FFD700]/20 p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-[#FFD700]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#FFD700]">
                Досягнення
              </h3>
              <span className="text-sm text-[#E6EDF3]">
                {unlockedAchievements}/{totalAchievements}
              </span>
            </div>
            <div className="mt-2">
              <Progress 
                value={progressPercent} 
                className="h-2 bg-white/10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map(cat => {
          const count = cat === 'all' 
            ? totalAchievements 
            : achievements.filter(a => a.category === cat).length;
          const unlockedCount = cat === 'all'
            ? unlockedAchievements
            : achievements.filter(a => a.category === cat && achievementsProgress[a.id]?.unlocked).length;
          
          const Icon = cat === 'all' ? Trophy : categoryIcons[cat];
          const color = cat === 'all' ? '#FFD700' : categoryColors[cat];
          
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'text-black'
                  : 'bg-white/5 text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
              style={{ 
                backgroundColor: activeCategory === cat ? color : undefined 
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{cat === 'all' ? 'Всі' : categoryNames[cat]}</span>
              <span className={`text-xs ${activeCategory === cat ? 'opacity-70' : 'text-[#8B949E]'}`}>
                {unlockedCount}/{count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Achievements List */}
      <div className="space-y-3">
        {filteredAchievements.map((achievement, i) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <AchievementCard achievement={achievement} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}


