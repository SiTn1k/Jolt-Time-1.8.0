// ═══════════════════════════════════════════════════════════════════════
// QUEST TRACKER COMPONENT
// Shows active objectives with progress
// ═══════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Target, ListTodo, Calendar, CalendarDays } from 'lucide-react';
import { Card, Badge } from '../ui';
import { 
  type ActiveQuest, 
  QUEST_TYPE_CONFIG,
} from '../playerGuidanceData';
import { useState } from 'react';

function QuestCard({ quest }: { quest: ActiveQuest }) {
  const config = QUEST_TYPE_CONFIG[quest.type];
  const progressPercent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
  const isComplete = quest.progress >= quest.target;

  return (
    <div className={`p-3 rounded-xl bg-[#161B22]/80 border ${
      isComplete ? 'border-green-500/50' : 'border-white/5'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#E6EDF3] truncate">
            {t(quest.titleKey)}
          </p>
        </div>
        {isComplete && (
          <Badge className="bg-green-500/20 text-green-400 text-[10px]">
            ✓ Готово
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#8B949E]">
          {quest.progress} / {quest.target}
        </span>
        <span style={{ color: config.color }}>
          {progressPercent}%
        </span>
      </div>

      {/* Rewards */}
      <div className="flex gap-1 mt-2">
        {quest.rewards.xp && (
          <Badge className="bg-[#10B981]/20 text-[#10B981] text-[10px]">
            +{quest.rewards.xp} XP
          </Badge>
        )}
        {quest.rewards.karbovanets && (
          <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
            +{quest.rewards.karbovanets} 💰
          </Badge>
        )}
        {quest.rewards.reputation && (
          <Badge className="bg-[#A855F7]/20 text-[#A855F7] text-[10px]">
            +{quest.rewards.reputation} REP
          </Badge>
        )}
      </div>
    </div>
  );
}

interface QuestTrackerProps {
  mainQuest?: ActiveQuest;
  sideQuests?: ActiveQuest[];
  dailyQuests?: ActiveQuest[];
  weeklyQuests?: ActiveQuest[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function QuestTracker({
  mainQuest,
  sideQuests = [],
  dailyQuests = [],
  weeklyQuests = [],
  isCollapsed = false,
  onToggle,
}: QuestTrackerProps) {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  // Count active quests
  const totalQuests = 
    (mainQuest ? 1 : 0) + 
    sideQuests.length + 
    dailyQuests.length + 
    weeklyQuests.length;

  const completedQuests = 
    (mainQuest && mainQuest.progress >= mainQuest.target ? 1 : 0) +
    sideQuests.filter(q => q.progress >= q.target).length +
    dailyQuests.filter(q => q.progress >= q.target).length +
    weeklyQuests.filter(q => q.progress >= q.target).length;

  const handleToggle = () => {
    setCollapsed(!collapsed);
    onToggle?.();
  };

  return (
    <Card className="bg-gradient-to-r from-[#161B22] to-[#1a1f26] border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#FFD700]" />
          <span className="text-sm font-medium text-[#E6EDF3]">
            Квести
          </span>
          <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
            {completedQuests}/{totalQuests}
          </Badge>
        </div>
        {collapsed ? (
          <ChevronDown className="w-5 h-5 text-[#8B949E]" />
        ) : (
          <ChevronUp className="w-5 h-5 text-[#8B949E]" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
              {/* Main Quest */}
              {mainQuest && (
                <div>
                  <div className="flex items-center gap-1 mb-2 text-[10px] text-[#8B949E]">
                    <ListTodo className="w-3 h-3" />
                    ГОЛОВНА ЦІЛЬ
                  </div>
                  <QuestCard quest={mainQuest} />
                </div>
              )}

              {/* Side Quests */}
              {sideQuests.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2 text-[10px] text-[#00E5FF]">
                    <ListTodo className="w-3 h-3" />
                    ПОБІЧНІ ({sideQuests.length})
                  </div>
                  <div className="space-y-2">
                    {sideQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} />
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Quests */}
              {dailyQuests.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2 text-[10px] text-[#10B981]">
                    <Calendar className="w-3 h-3" />
                    ЩОДЕННІ ({dailyQuests.length})
                  </div>
                  <div className="space-y-2">
                    {dailyQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} />
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Quests */}
              {weeklyQuests.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2 text-[10px] text-[#A855F7]">
                    <CalendarDays className="w-3 h-3" />
                    ТИЖНЕВІ ({weeklyQuests.length})
                  </div>
                  <div className="space-y-2">
                    {weeklyQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {totalQuests === 0 && (
                <div className="text-center py-4 text-[#8B949E] text-sm">
                  Немає активних квестів
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
