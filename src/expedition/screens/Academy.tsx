import { useState } from 'react';
import { useExpeditionStore } from '../store';
import { buildings } from '../data';
import { motion } from 'motion/react';
import { TrendingUp, Coins, Eye, Send, BookOpen, MessageCircle, Target, Zap, Archive, Star, CheckCircle2 } from 'lucide-react';
import { Card, Badge } from '../ui';
import { NPCSystem } from '../components/NPCSystem';
import { UkrainianPattern } from '../components/UkrainianPattern';
import { StorySystem } from '../components/StorySystem';
import { AcademyProgress } from '../components/AcademyProgress';
import { PrestigeMilestones } from '../components/PrestigeMilestones';
import { AcademyTeaser } from '../components/AcademyTeaser';
import { useLiveOpsStore } from '../liveOpsStore';
import { useTranslation } from '../../i18n';

// Academy unlock threshold - reduced from 5000 to 3000 for better retention
const ACADEMY_PRESTIGE_THRESHOLD = 3000;

export function Academy() {
  const { t } = useTranslation();
  const [showStory, setShowStory] = useState(false);

  // Story state from store
  const storyState = useExpeditionStore((s) => s.storyState);
  const interactWithNpc = useExpeditionStore((s) => s.interactWithNpc);
  const startQuest = useExpeditionStore((s) => s.startQuest);
  const completeQuest = useExpeditionStore((s) => s.completeQuest);
  const unlockArc = useExpeditionStore((s) => s.unlockArc);
  
  // Other store state
  const academyLevel = useExpeditionStore((s) => s.academyLevel);
  const reputation = useExpeditionStore((s) => s.reputation);
  const karbovanets = useExpeditionStore((s) => s.karbovanets);
  const museumVisitors = useExpeditionStore((s) => s.museumVisitors);
  const historicalPrestige = useExpeditionStore((s) => s.historicalPrestige);
  const expeditions = useExpeditionStore((s) => s.expeditions);
  const artifacts = useExpeditionStore((s) => s.artifacts);
  const museumItems = useExpeditionStore((s) => s.museumItems);
  const currentArc = useExpeditionStore((s) => s.storyState.currentArc);

  const activeExpeditions = expeditions.filter((e) => !e.collected).length;
  const damagedArtifacts = artifacts.filter((a) => a.condition < 100);
  const totalArtifacts = artifacts.length;

  // Calculate museum collection percentage
  const museumCollectionPercent = totalArtifacts > 0 
    ? Math.round((museumItems.length / totalArtifacts) * 100) 
    : 0;

  // Generate current objective based on priorities (Current Objective 2.0)
  const getCurrentObjective = () => {
    // Priority 1: Active story quest
    if (storyState.activeQuests && storyState.activeQuests.length > 0) {
      return { priority: 1, text: t('objective.complete_quest'), icon: Target, color: '#FF6B6B' };
    }
    // Priority 2: Completed expeditions to collect
    if (expeditions.some(e => !e.collected && e.status === 'completed')) {
      return { priority: 2, text: t('objective.collect_expedition'), icon: Map, color: '#00E5FF' };
    }
    // Priority 3: Active expedition available (if none running)
    if (activeExpeditions === 0 && heroes.filter(h => h.unlocked).length > 0) {
      return { priority: 3, text: t('objective.start_expedition'), icon: Zap, color: '#FFD700' };
    }
    // Priority 4: Available daily challenge
    const dailyChallenges = useLiveOpsStore.getState().dailyChallengesProgress;
    const hasUnclaimedDaily = Object.entries(dailyChallenges).some(
      ([id, progress]) => progress?.completed && !progress?.claimed
    );
    if (hasUnclaimedDaily) {
      return { priority: 4, text: t('objective.claim_daily_reward'), icon: Gift, color: '#10B981' };
    }
    // Priority 5: Damaged artifacts to restore
    if (damagedArtifacts.length > 0) {
      return { priority: 5, text: t('objective.restore_artifact'), icon: Archive, color: '#F59E0B' };
    }
    // Priority 6: Send artifact to museum
    if (museumItems.length === 0 && totalArtifacts > 0) {
      return { priority: 6, text: t('objective.send_to_museum'), icon: Landmark, color: '#A855F7' };
    }
    // Priority 7: Increase reputation
    if (reputation < 100) {
      return { priority: 7, text: t('objective.increase_reputation'), icon: TrendingUp, color: '#FF6B6B' };
    }
    // Priority 8: General exploration
    return { priority: 8, text: t('objective.continue_exploring'), icon: CheckCircle2, color: '#8B949E' };
  };

  const currentObjective = getCurrentObjective();
  const heroes = useExpeditionStore((s) => s.heroes);
  
  // Check if Academy is unlocked (prestige >= threshold)
  const isAcademyUnlocked = historicalPrestige >= ACADEMY_PRESTIGE_THRESHOLD;

  // Handle NPC interaction - delegate to store
  const handleInteractWithNpc = (npcId: string) => {
    interactWithNpc(npcId);
  };

  // Handle quest start - delegate to store
  const handleStartQuest = (questId: string) => {
    startQuest(questId);
  };

  // Handle quest complete - delegate to store
  const handleCompleteQuest = (questId: string) => {
    completeQuest(questId);
  };

  // Handle arc unlock - delegate to store
  const handleUnlockArc = (arcNumber: number) => {
    unlockArc(arcNumber);
  };

  return (
    <div className="min-h-full bg-[#0D1117] p-4 pb-20 relative overflow-hidden">
      <UkrainianPattern />

      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {t('expedition.academy_title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('expedition.academy_subtitle')}</p>
          </div>
          <Badge
            className="px-3 py-1"
            style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontFamily: "'Exo 2', sans-serif" }}
          >
            {t('common.level')} {academyLevel}
          </Badge>
        </div>

        {/* Current Objective Card */}
        <Card className="bg-white/[0.04] border-white/[0.08] rounded-3xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${currentObjective.color}20` }}>
              <currentObjective.icon className="w-5 h-5" style={{ color: currentObjective.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#8B949E] mb-0.5">{t('objective.current_objective')}</p>
              <p className="text-sm font-medium text-[#E6EDF3] truncate">{currentObjective.text}</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: currentObjective.color, color: currentObjective.color }}>
              #{currentObjective.priority}
            </Badge>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.reputation')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(reputation).toLocaleString()}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.karbovanets')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(karbovanets).toLocaleString()}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" style={{ color: '#00E5FF' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.visitors')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
              {museumVisitors}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4" style={{ color: '#9747FF' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.expeditions')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>
              {activeExpeditions}
            </div>
          </Card>
        </div>

        {/* Museum Collection Progress */}
        <Card className="bg-white/[0.04] border-white/[0.08] rounded-2xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8B949E]">{t('objective.museum_collection')}</span>
            <span className="text-sm font-medium" style={{ color: '#FFC72C' }}>{museumCollectionPercent}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ width: `${museumCollectionPercent}%`, backgroundColor: '#FFC72C' }}
            />
          </div>
        </Card>

        {/* Academy Progress with Milestones */}
        <AcademyProgress
          currentPrestige={historicalPrestige}
          targetPrestige={ACADEMY_PRESTIGE_THRESHOLD}
          isUnlocked={isAcademyUnlocked}
        />
        
        {/* Prestige Milestones System */}
        {!isAcademyUnlocked && <PrestigeMilestones />}
        
        {/* Academy Teaser */}
        {!isAcademyUnlocked && <AcademyTeaser />}

        {/* Story System Button */}
        <Card 
          className="border-[#FFC72C]/30 p-3 mt-3 cursor-pointer hover:border-[#FFC72C]/50 transition-colors"
          onClick={() => setShowStory(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#FFC72C20', border: '1px solid #FFC72C' }}
              >
                <BookOpen className="w-5 h-5" style={{ color: '#FFC72C' }} />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {t('story.story_system') || 'Story System'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('story.npcs_quests') || 'NPCs & Quests'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {storyState.activeQuests.length > 0 && (
                <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontSize: '10px' }}>
                  {storyState.activeQuests.length} {t('quest.in_progress')}
                </Badge>
              )}
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Card>
      </div>

      {/* Story System Modal */}
      <StorySystem
        isOpen={showStory}
        onClose={() => setShowStory(false)}
        storyState={storyState}
        onInteractWithNpc={handleInteractWithNpc}
        onStartQuest={handleStartQuest}
        onCompleteQuest={handleCompleteQuest}
        onUnlockArc={handleUnlockArc}
        reputation={reputation}
        historicalPrestige={historicalPrestige}
      />

      <div className="relative z-10">
        <h2 className="text-lg mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {t('expedition.buildings_title')}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {buildings.map((building, index) => (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="border-white/10 p-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm flex-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {building.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#FFC72C', color: '#FFC72C' }}>
                    {t('common.level')} {building.level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{building.description}</p>
                <div className="text-xs px-2 py-1 rounded bg-primary/10" style={{ color: '#FFC72C' }}>
                  {building.bonus}
                </div>
                {(building.id === 'building-2' && activeExpeditions > 0) || building.id === 'building-3' ? (
                  <div className="mt-2 flex items-center gap-1">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#00E5FF' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className="text-[10px]" style={{ color: '#00E5FF' }}>{t('common.active')}</span>
                  </div>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <NPCSystem />
    </div>
  );
}
