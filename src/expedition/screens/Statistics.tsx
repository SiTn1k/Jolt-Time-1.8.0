// ═══════════════════════════════════════════════════════════════════════
// STATISTICS SCREEN
// Player statistics and achievements overview
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { 
  TrendingUp, Map, Users, Star, Trophy, Building, BookOpen, 
  Clock, Gem, Award, Target, Zap, Crown
} from 'lucide-react';
import { Card, Badge } from '../ui';
import { useExpeditionStore } from '../store';
import { useLiveOpsStore } from '../liveOpsStore';
import { achievements } from '../liveOpsData';
import { AchievementsSystem } from '../components/AchievementsSystem';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtext?: string;
}

function StatCard({ icon, label, value, color, subtext }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl overflow-hidden"
    >
      <Card className="bg-[#161B22] border-white/5 p-4 h-full">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>
          <div>
            <p className="text-xs text-[#8B949E]">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            {subtext && <p className="text-xs text-[#8B949E]">{subtext}</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatRow({ icon, label, value, color }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <div style={{ color }}>{icon}</div>
        <span className="text-sm text-[#E6EDF3]">{label}</span>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

export function Statistics() {
  // Expedition store data
  const expeditions = useExpeditionStore(s => s.expeditions);
  const heroes = useExpeditionStore(s => s.heroes);
  const artifacts = useExpeditionStore(s => s.artifacts);
  const museumItems = useExpeditionStore(s => s.museumItems);
  const museumState = useExpeditionStore(s => s.museumState);
  const storyState = useExpeditionStore(s => s.storyState);
  const npcRelationships = useExpeditionStore(s => s.npcRelationships);
  const historicalPrestige = useExpeditionStore(s => s.historicalPrestige);
  const reputation = useExpeditionStore(s => s.reputation);
  const karbovanets = useExpeditionStore(s => s.karbovanets);
  const academyLevel = useExpeditionStore(s => s.academyLevel);
  
  // LiveOps store data
  const achievementsProgress = useLiveOpsStore(s => s.achievementsProgress);
  const playerStats = useLiveOpsStore(s => s.playerStats);

  // Calculate stats
  const completedExpeditions = expeditions.filter(e => e.collected).length;
  const totalExpeditions = expeditions.length;
  const unlockedHeroes = heroes.filter(h => h.unlocked).length;
  const legendaryArtifacts = artifacts.filter(a => a.rarity === 'legendary').length;
  const epicArtifacts = artifacts.filter(a => a.rarity === 'epic').length;
  const rareArtifacts = artifacts.filter(a => a.rarity === 'rare').length;
  const completedCollections = museumState.completedCollections?.length || 0;
  const activeNpcs = npcRelationships ? Object.keys(npcRelationships).length : 0;
  const completedQuests = storyState.completedQuests?.length || 0;
  const completedArcs = storyState.completedArcs?.length || 0;
  
  // Achievement stats
  const totalAchievements = achievements.length;
  const unlockedAchievements = Object.values(achievementsProgress).filter(a => a.unlocked).length;

  // Format play time
  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}год ${minutes}хв`;
    }
    return `${minutes}хв`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-[#FFD700]/20 to-[#FF6B00]/20 border-[#FFD700]/30 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/30 flex items-center justify-center">
              <Crown className="w-10 h-10 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FFD700]">Статистика</h2>
              <p className="text-sm text-[#E6EDF3]/80">Твій прогрес в Академії</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Map className="w-6 h-6 text-[#00E5FF]" />}
          label="Експедицій"
          value={completedExpeditions}
          color="#00E5FF"
          subtext={`з ${totalExpeditions} запущено`}
        />
        <StatCard
          icon={<Gem className="w-6 h-6 text-[#A855F7]" />}
          label="Артефактів"
          value={artifacts.length}
          color="#A855F7"
          subtext={`${legendaryArtifacts}🟡 ${epicArtifacts}💎 ${rareArtifacts}🔵`}
        />
        <StatCard
          icon={<Star className="w-6 h-6 text-[#FFD700]" />}
          label="Героїв"
          value={`${unlockedHeroes}/${heroes.length}`}
          color="#FFD700"
          subtext="відкрито"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6 text-[#10B981]" />}
          label="Досягнень"
          value={`${unlockedAchievements}/${totalAchievements}`}
          color="#10B981"
          subtext="відкрито"
        />
      </div>

      {/* Detailed Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#161B22] border-white/5 p-4">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
            Загальна статистика
          </h3>
          
          <div className="space-y-1">
            <StatRow
              icon={<Map className="w-4 h-4" />}
              label="Успішних експедицій"
              value={completedExpeditions}
              color="#00E5FF"
            />
            <StatRow
              icon={<Building className="w-4 h-4" />}
              label="Музейних експонатів"
              value={museumItems.length}
              color="#A855F7"
            />
            <StatRow
              icon={<BookOpen className="w-4 h-4" />}
              label="Завершених колекцій"
              value={completedCollections}
              color="#F59E0B"
            />
            <StatRow
              icon={<Users className="w-4 h-4" />}
              label="Активних NPC"
              value={activeNpcs}
              color="#FF6B6B"
            />
            <StatRow
              icon={<Target className="w-4 h-4" />}
              label="Завершених квестів"
              value={completedQuests}
              color="#10B981"
            />
            <StatRow
              icon={<Award className="w-4 h-4" />}
              label="Завершених арок"
              value={completedArcs}
              color="#FFD700"
            />
          </div>
        </Card>
      </motion.div>

      {/* Hero & Academy Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#161B22] border-white/5 p-4">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#FFD700]" />
            Герої та Академія
          </h3>
          
          <div className="space-y-1">
            <StatRow
              icon={<Star className="w-4 h-4" />}
              label="Рівень Академії"
              value={academyLevel}
              color="#FFD700"
            />
            <StatRow
              icon={<TrendingUp className="w-4 h-4" />}
              label="Репутація"
              value={reputation.toLocaleString()}
              color="#A855F7"
            />
            <StatRow
              icon={<Zap className="w-4 h-4" />}
              label="Історичний престиж"
              value={historicalPrestige.toLocaleString()}
              color="#00E5FF"
            />
            <StatRow
              icon={<Gem className="w-4 h-4" />}
              label="Карбованців"
              value={karbovanets.toLocaleString()}
              color="#FFC72C"
            />
          </div>
        </Card>
      </motion.div>

      {/* Artifacts by Rarity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#161B22] border-white/5 p-4">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4 flex items-center gap-2">
            <Gem className="w-4 h-4 text-[#A855F7]" />
            Артефакти за рідкістю
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
                <span className="text-sm text-[#E6EDF3]">Легендарні</span>
              </div>
              <Badge className="bg-[#FFD700]/20 text-[#FFD700]">{legendaryArtifacts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#A855F7]" />
                <span className="text-sm text-[#E6EDF3]">Епічні</span>
              </div>
              <Badge className="bg-[#A855F7]/20 text-[#A855F7]">{epicArtifacts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                <span className="text-sm text-[#E6EDF3]">Рідкісні</span>
              </div>
              <Badge className="bg-[#3B82F6]/20 text-[#3B82F6]">{rareArtifacts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B949E]" />
                <span className="text-sm text-[#E6EDF3]">Звичайні</span>
              </div>
              <Badge className="bg-white/10 text-[#8B949E]">
                {artifacts.filter(a => a.rarity === 'common').length}
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Time Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#161B22] border-white/5 p-4">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            Час гри
          </h3>
          
          <div className="space-y-1">
            <StatRow
              icon={<Clock className="w-4 h-4" />}
              label="Всього в грі"
              value={formatPlayTime(playerStats.totalPlayTime || 0)}
              color="#F59E0B"
            />
            <StatRow
              icon={<Target className="w-4 h-4" />}
              label="Днів підряд"
              value={playerStats.consecutiveDays || 1}
              color="#10B981"
            />
          </div>
        </Card>
      </motion.div>

      {/* Achievements Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#FFD700] flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Досягнення
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {achievements.slice(0, 4).map(achievement => {
            const progress = achievementsProgress[achievement.id];
            const unlocked = progress?.unlocked || false;
            return (
              <Card 
                key={achievement.id}
                className={`bg-[#161B22] border-white/5 p-3 ${!unlocked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-xl">
                    {unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#E6EDF3] truncate">
                      {achievement.nameKey.replace('achievement.', '').replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-[#8B949E]">
          Дякуємо за гру в Jolt Time: Академія!
        </p>
      </div>
    </div>
  );
}
