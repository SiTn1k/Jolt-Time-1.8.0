import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Star, Users, Map, Gift, ChevronRight } from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { useTranslation } from '../../i18n';
import { 
  storyNpcs, 
  storyQuests, 
  STORY_ARCS,
  checkArcRequirements,
  type StoryNpc, 
  type StoryQuest,
  type NpcRelationship,
  type RelationshipLevel,
  type StoryProgress,
  type ArcMetadata,
} from '../storyData';

interface StorySystemProps {
  isOpen: boolean;
  onClose: () => void;
  storyState: StoryProgress;
  onInteractWithNpc: (npcId: string) => void;
  onStartQuest: (questId: string) => void;
  onCompleteQuest?: (questId: string) => void;
  onClaimReward?: (npcId: string, rewardKey: string) => void;
  onUnlockArc?: (arcNumber: number) => void;
}

type Tab = 'npcs' | 'quests' | 'arcs';

export function StorySystem({
  isOpen,
  onClose,
  storyState,
  onInteractWithNpc,
  onStartQuest,
  onCompleteQuest,
  onClaimReward,
  onUnlockArc,
}: StorySystemProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('npcs');
  const [selectedNpc, setSelectedNpc] = useState<StoryNpc | null>(null);
  const [npcDialogue, setNpcDialogue] = useState<string>('');
  
  // Helper to build current state for arc requirement checking
  const getCurrentState = () => ({
    reputation: 0, // Will be passed from parent if needed
    historicalPrestige: 0,
    completedQuests: storyState.completedQuests,
    completedArcs: storyState.completedArcs,
    npcRelationships: storyState.npcRelationships,
    museumCompletedCollections: 0,
    totalArtifacts: 0,
  });
  
  // Get arc with requirements status
  const getArcStatus = (arc: ArcMetadata) => {
    const isUnlocked = storyState.unlockedArcs.includes(arc.arcNumber);
    
    if (isUnlocked) {
      return { status: 'unlocked' as const, progress: null, missing: [] };
    }
    
    const { met, missing } = checkArcRequirements(arc, getCurrentState());
    return { 
      status: met ? 'ready' : 'locked', 
      progress: null, 
      missing 
    };
  };

  const getRelationship = (npcId: string): NpcRelationship => {
    return storyState.npcRelationships[npcId] || {
      npcId,
      relationshipLevel: 1,
      trustPoints: 0,
      completedQuests: [],
      lastInteraction: 0,
    };
  };

  const getNpcDialogue = (npc: StoryNpc): string => {
    const relationship = getRelationship(npc.id);
    const level = relationship.relationshipLevel;
    const dialogues = level >= 2 
      ? [...npc.dialogues.greeting, ...npc.dialogues.relationship[level as RelationshipLevel] || []]
      : npc.dialogues.greeting;
    return dialogues[Math.floor(Math.random() * dialogues.length)];
  };

  const handleNpcClick = (npc: StoryNpc) => {
    setSelectedNpc(npc);
    setNpcDialogue(getNpcDialogue(npc));
    onInteractWithNpc(npc.id);
  };

  const handleTalk = () => {
    if (selectedNpc) {
      setNpcDialogue(getNpcDialogue(selectedNpc));
      onInteractWithNpc(selectedNpc.id);
    }
  };

  const availableQuests = storyQuests.filter(q => {
    const relationship = getRelationship(q.npcId);
    const activeIds = storyState.activeQuests.map(qp => qp.questId);
    return relationship.relationshipLevel >= q.requiredRelationshipLevel && 
           !activeIds.includes(q.id) && 
           !storyState.completedQuests.includes(q.id);
  });

  const activeQuestsList = storyQuests.filter(q => 
    storyState.activeQuests.some(qp => qp.questId === q.id)
  );
  const completedQuests = storyQuests.filter(q => 
    storyState.completedQuests.includes(q.id)
  );

  const getQuestProgress = (quest: StoryQuest) => {
    const questProgress = storyState.activeQuests.find(qp => qp.questId === quest.id);
    if (!questProgress) return 0;
    
    const total = quest.objectives.reduce((sum, obj) => sum + obj.count, 0);
    const current = quest.objectives.reduce((sum, obj) => {
      const progress = questProgress.objectives[`${obj.type}_${obj.target}`] || 0;
      return sum + Math.min(progress, obj.count);
    }, 0);
    return Math.round((current / total) * 100);
  };

  const getObjectiveProgress = (quest: StoryQuest) => {
    const questProgress = storyState.activeQuests.find(qp => qp.questId === quest.id);
    if (!questProgress) return [];
    
    return quest.objectives.map(obj => {
      const key = `${obj.type}_${obj.target}`;
      const current = questProgress.objectives[key] || 0;
      const completed = current >= obj.count;
      
      // Translate objective type
      let label = '';
      switch (obj.type) {
        case 'expedition':
          label = t('quest.objective_expedition');
          break;
        case 'speak':
          label = t('quest.objective_speak');
          break;
        case 'visit':
          label = t('quest.objective_visit');
          break;
        case 'prestige':
          label = t('quest.objective_prestige');
          break;
        case 'build':
          label = t('quest.objective_build');
          break;
        case 'collect':
          label = t('quest.objective_collect');
          break;
        default:
          label = obj.type;
      }
      
      return {
        ...obj,
        current,
        completed,
        label: `${label}: ${current}/${obj.count}`,
      };
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg h-[85vh] bg-[#161B22] rounded-t-3xl border-t border-white/10 flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {t('expedition.story_system') || 'Story System'}
              </h2>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('npcs')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'npcs' 
                    ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' 
                    : 'text-muted-foreground'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                {t('npc.story_npcs') || 'NPCs'}
              </button>
              <button
                onClick={() => setActiveTab('quests')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'quests' 
                    ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' 
                    : 'text-muted-foreground'
                }`}
              >
                <Map className="w-4 h-4 mx-auto mb-1" />
                {t('quest.quests') || 'Quests'}
              </button>
              <button
                onClick={() => setActiveTab('arcs')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'arcs' 
                    ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' 
                    : 'text-muted-foreground'
                }`}
              >
                <Star className="w-4 h-4 mx-auto mb-1" />
                {t('arc.arcs') || 'Arcs'}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'npcs' && (
                <div className="space-y-3">
                  {selectedNpc ? (
                    // NPC Detail View
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card>
                        <div className="flex items-start gap-4 mb-4">
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                            style={{ 
                              backgroundColor: `${selectedNpc.backgroundColor}20`,
                            }}
                          >
                            {selectedNpc.portrait}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold truncate" style={{ color: '#E6EDF3' }}>
                              {t(selectedNpc.nameKey)}
                            </h3>
                            <p className="text-xs text-[#8B949E]">
                              {t(selectedNpc.roleKey)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                style={{ 
                                  backgroundColor: `${selectedNpc.backgroundColor}30`,
                                  color: selectedNpc.backgroundColor,
                                  fontSize: '9px'
                                }}
                              >
                                {t(`artifacts.rarity_${selectedNpc.rarity}`)}
                              </Badge>
                              <span className="text-xs text-[#8B949E]">
                                {t('npc.relationship')}: {getRelationship(selectedNpc.id).relationshipLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-[#8B949E] mb-4 leading-relaxed">
                          {t(selectedNpc.biographyKey)}
                        </p>

                        {/* Dialogue */}
                        <div 
                          className="rounded-2xl p-4 mb-4"
                          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-[#00E5FF]" />
                            <span className="text-xs text-[#8B949E]">{t('npc.dialogue')}</span>
                          </div>
                          <p className="text-sm italic text-[#E6EDF3]">«{npcDialogue}»</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button 
                            onClick={handleTalk}
                            className="flex-1 h-12 rounded-xl"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: '#E6EDF3',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {t('expedition.npc_talk')}
                          </Button>
                        </div>
                      </Card>

                      {/* NPC Quests */}
                      <h4 className="text-sm font-medium mt-4 mb-2 text-[#E6EDF3]">{t('quest.quests')}:</h4>
                      <div className="space-y-2">
                        {storyQuests
                          .filter(q => q.npcId === selectedNpc.id)
                          .filter(q => getRelationship(selectedNpc.id).relationshipLevel >= q.requiredRelationshipLevel)
                          .map(quest => {
                            const isActive = storyState.activeQuests.some(qp => qp.questId === quest.id);
                            const objectives = getObjectiveProgress(quest);
                            const allComplete = objectives.every(o => o.completed);
                            
                            return (
                              <Card key={quest.id}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium">{t(quest.titleKey)}</h5>
                                    <p className="text-xs text-muted-foreground">{t(quest.descriptionKey)}</p>
                                    {/* Show objectives if active */}
                                    {isActive && objectives.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {objectives.map((obj, i) => (
                                          <div key={i} className="flex items-center gap-2 text-xs">
                                            <span style={{ color: obj.completed ? '#10B981' : '#8B949E' }}>
                                              {obj.completed ? '✓' : '○'}
                                            </span>
                                            <span className={obj.completed ? 'text-green-400' : 'text-muted-foreground'}>
                                              {obj.label}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {isActive ? (
                                    allComplete ? (
                                      <Button
                                        onClick={() => onCompleteQuest ? onCompleteQuest(quest.id) : onStartQuest(quest.id)}
                                        style={{ backgroundColor: '#10B981', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                                      >
                                        {t('quest.completed')}
                                      </Button>
                                    ) : (
                                      <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117' }}>
                                        {getQuestProgress(quest)}%
                                      </Badge>
                                    )
                                  ) : getRelationship(selectedNpc.id).completedQuests.includes(quest.id) ? (
                                    <Badge style={{ backgroundColor: '#10B981', color: '#0D1117' }}>
                                      ✓
                                    </Badge>
                                  ) : (
                                    <Button 
                                      onClick={() => onStartQuest(quest.id)}
                                      style={{ backgroundColor: '#00E5FF', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                                    >
                                      {t('quest.start')}
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                      </div>

                      {/* NPC Relationship Rewards */}
                      {selectedNpc && (() => {
                        const relationship = getRelationship(selectedNpc.id);
                        const currentLevel = relationship.relationshipLevel as RelationshipLevel;
                        const nextReward = selectedNpc.unlocksAtRelationship[currentLevel];
                        
                        if (!nextReward) return null;
                        
                        return (
                          <Card className="border-[#FFC72C]/30 p-4 mt-4">
                            <div className="flex items-center gap-3">
                              <Gift className="w-6 h-6 text-[#FFC72C]" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-[#FFC72C]">
                                  {t('npc.reward_available')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {nextReward.startsWith('dialogue_') && t('npc.reward_dialogue')}
                                  {nextReward.startsWith('quest-') && t('npc.reward_quest')}
                                  {nextReward.startsWith('hero-') && t('npc.reward_hero')}
                                  {nextReward.startsWith('artifact-') && t('npc.reward_artifact')}
                                  {nextReward.startsWith('region-') && t('npc.reward_region')}
                                </div>
                              </div>
                              <Button
                                onClick={() => onClaimReward?.(selectedNpc.id, nextReward)}
                                style={{ backgroundColor: '#FFC72C', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                              >
                                {t('npc.claim')}
                              </Button>
                            </div>
                          </Card>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    // NPC List
                    storyNpcs.map(npc => {
                      const relationship = getRelationship(npc.id);
                      return (
                        <motion.div
                          key={npc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card 
                            className="cursor-pointer transition-all active:scale-[0.98]"
                            onClick={() => handleNpcClick(npc)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                                style={{ 
                                  backgroundColor: `${npc.backgroundColor}15`,
                                }}
                              >
                                {npc.portrait}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium truncate">{t(npc.nameKey)}</h4>
                                  <Badge 
                                    style={{ 
                                      backgroundColor: `${npc.backgroundColor}30`,
                                      color: npc.backgroundColor,
                                    }}
                                  >
                                    {relationship.relationshipLevel}
                                  </Badge>
                                </div>
                                <p className="text-xs text-[#8B949E] truncate">{t(npc.roleKey)}</p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#8B949E] shrink-0" />
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'quests' && (
                <div className="space-y-4">
                  {/* Available Quests */}
                  {availableQuests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#FFC72C]">
                        {t('quest.available')} ({availableQuests.length})
                      </h4>
                      <div className="space-y-2">
                        {availableQuests.map(quest => (
                          <Card key={quest.id} className="border-white/10 p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="text-sm font-medium">{t(quest.titleKey)}</h5>
                                <p className="text-xs text-muted-foreground">{t(quest.descriptionKey)}</p>
                              </div>
                              <Button 
                                onClick={() => onStartQuest(quest.id)}
                                style={{ backgroundColor: '#00E5FF', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                              >
                                {t('quest.start')}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Gift className="w-3 h-3 text-[#FFC72C]" />
                              <span className="text-muted-foreground">
                                {quest.rewards.map(r => `${r.amount} ${t(`quest.reward_${r.type}`)}`).join(', ')}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Quests */}
                  {activeQuestsList.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#00E5FF]">
                        {t('quest.in_progress')} ({activeQuestsList.length})
                      </h4>
                      <div className="space-y-2">
                        {activeQuestsList.map(quest => {
                          const npc = storyNpcs.find(n => n.id === quest.npcId);
                          const progress = getQuestProgress(quest);
                          return (
                            <Card key={quest.id} className="border-[#FFC72C]/30 p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-xl">{npc?.portrait}</span>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium">{t(quest.titleKey)}</h5>
                                  <p className="text-xs text-muted-foreground">{t(quest.descriptionKey)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 h-2 bg-[#0D1117] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#FFC72C] rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[#FFC72C]">{progress}%</span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed Quests */}
                  {completedQuests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#10B981]">
                        {t('quest.completed')} ({completedQuests.length})
                      </h4>
                      <div className="space-y-2">
                        {completedQuests.slice(0, 5).map(quest => {
                          const npc = storyNpcs.find(n => n.id === quest.npcId);
                          return (
                            <Card key={quest.id} className="border-[#10B981]/30 p-3 opacity-70">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{npc?.portrait}</span>
                                <div>
                                  <h5 className="text-sm font-medium line-through">{t(quest.titleKey)}</h5>
                                </div>
                                <Star className="w-4 h-4 text-[#10B981] ml-auto" />
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {availableQuests.length === 0 && activeQuestsList.length === 0 && completedQuests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{t('quest.no_quests') || 'No quests available'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Arc Tab */}
              {activeTab === 'arcs' && (
                <div className="space-y-4">
                  {/* Arc Overview */}
                  <Card className="p-4 border-[#FFC72C]/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-[#FFC72C]">
                        {t('arc.current') || 'Поточна арка'}
                      </h3>
                      <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117' }}>
                        {storyState.unlockedArcs.length} / {STORY_ARCS.length}
                      </Badge>
                    </div>
                    <div className="text-2xl mb-1">
                      {STORY_ARCS.find(a => a.arcNumber === storyState.currentArc)?.icon || '📜'}
                    </div>
                    <p className="text-sm font-medium">
                      {STORY_ARCS.find(a => a.arcNumber === storyState.currentArc)?.name || 'Невідомо'}
                    </p>
                  </Card>

                  {/* Arc List */}
                  <div className="space-y-2">
                    {STORY_ARCS.map(arc => {
                      const arcStatus = getArcStatus(arc);
                      const isCurrentArc = storyState.currentArc === arc.arcNumber;
                      const isUnlocked = storyState.unlockedArcs.includes(arc.arcNumber);
                      
                      return (
                        <Card 
                          key={arc.arcNumber} 
                          className={`p-3 ${
                            isCurrentArc 
                              ? 'border-[#FFC72C]' 
                              : isUnlocked 
                                ? 'border-white/10' 
                                : 'border-white/5 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: isUnlocked ? arc.color + '20' : 'rgba(255,255,255,0.05)' }}
                            >
                              {isUnlocked ? arc.icon : '🔒'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium truncate">{arc.name}</h4>
                                {isCurrentArc && (
                                  <Badge variant="outline" className="text-[10px] border-[#FFC72C] text-[#FFC72C]">
                                    {t('arc.current') || 'Поточна'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{arc.description}</p>
                              
                              {/* Requirements for locked arcs */}
                              {!isUnlocked && arcStatus.missing.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    {t('arc.requirements') || 'Вимоги:'}
                                  </p>
                                  {arcStatus.missing.slice(0, 3).map((req, i) => (
                                    <p key={i} className="text-xs text-[#FF6B6B] flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-[#FF6B6B]" />
                                      {req}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Unlock button for ready arcs */}
                            {arcStatus.status === 'ready' && onUnlockArc && (
                              <Button
                                onClick={() => onUnlockArc(arc.arcNumber)}
                                className="text-xs"
                                style={{ backgroundColor: '#10B981', color: 'white' }}
                              >
                                {t('arc.unlock') || 'Відкрити'}
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
