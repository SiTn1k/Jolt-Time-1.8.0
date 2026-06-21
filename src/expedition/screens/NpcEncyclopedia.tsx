// ═══════════════════════════════════════════════════════════════════════
// NPC ENCYCLOPEDIA SCREEN
// Complete overview of all NPCs with relationship tracking
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { MessageCircle, Heart } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useExpeditionStore } from '../store';
import { getNpcLevelReward } from '../metaProgressionData';
import type { Npc } from '../data';

// Extended NPC type for encyclopedia with relationship data
interface NpcWithTrust extends Npc {
  trustLevel?: number;
  trust?: number;
}

// Relationship level colors and names
const RELATIONSHIP_CONFIG = {
  stranger: { color: '#8B949E', name: 'Незнайомець', icon: '👤' },
  neutral: { color: '#00E5FF', name: 'Нейтральний', icon: '🤝' },
  friendly: { color: '#10B981', name: 'Дружній', icon: '😊' },
  trusted: { color: '#A855F7', name: 'Довірений', icon: '💜' },
  ally: { color: '#FFD700', name: 'Союзник', icon: '⭐' },
  legendary_ally: { color: '#FF6B6B', name: 'Легендарний', icon: '👑' },
};

interface RelationshipLevel {
  level: keyof typeof RELATIONSHIP_CONFIG;
  progress: number; // 0-100 to next level
  currentPoints: number;
  pointsNeeded: number;
}

function NpcCard({ 
  npc, 
  relationship 
}: { 
  npc: NpcWithTrust; 
  relationship?: RelationshipLevel;
}) {
  const config = RELATIONSHIP_CONFIG[relationship?.level || 'stranger'];
  const nextRewards = getNpcLevelReward(relationship?.level || 'stranger');
  
  // Calculate progress to next level
  const progress = relationship?.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className="bg-[#161B22] border-white/5 p-4"
        style={{ borderLeft: `3px solid ${config.color}` }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{ 
              backgroundColor: `${config.color}20`,
              border: `2px solid ${config.color}`
            }}
          >
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name & Relationship */}
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium text-[#E6EDF3]">
                {npc.name || npc.id}
              </h4>
              <Badge 
                className="text-[10px]"
                style={{ 
                  backgroundColor: `${config.color}20`,
                  color: config.color
                }}
              >
                {config.icon} {config.name}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-xs text-[#8B949E] mb-3">
              {npc.description || 'NPC з унікальною історією'}
            </p>

            {/* Progress Bar */}
            {relationship && relationship.level !== 'legendary_ally' && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-[#8B949E] mb-1">
                  <span>Прогрес</span>
                  <span>{relationship.currentPoints}/{relationship.pointsNeeded}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Bonuses */}
            <div className="flex flex-wrap gap-1 mb-3">
              {nextRewards.xp && (
                <Badge className="bg-[#10B981]/20 text-[#10B981] text-[10px]">
                  +XP {nextRewards.xp}
                </Badge>
              )}
              {nextRewards.karbovanets && (
                <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
                  +💰 {nextRewards.karbovanets}
                </Badge>
              )}
              {nextRewards.reputation && (
                <Badge className="bg-[#A855F7]/20 text-[#A855F7] text-[10px]">
                  +REP {nextRewards.reputation}
                </Badge>
              )}
              {nextRewards.expeditionSpeedBonus && (
                <Badge className="bg-[#00E5FF]/20 text-[#00E5FF] text-[10px]">
                  ⚡ +{nextRewards.expeditionSpeedBonus}% speed
                </Badge>
              )}
              {nextRewards.artifactBonus && (
                <Badge className="bg-[#FF6B6B]/20 text-[#FF6B6B] text-[10px]">
                  🏺 +{nextRewards.artifactBonus}% artifacts
                </Badge>
              )}
            </div>

            {/* Last Interaction */}
            {relationship && (
              <div className="text-[10px] text-[#8B949E]">
                Остання взаємодія: {relationship.currentPoints} очок довіри
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function NpcEncyclopedia() {
  const npcs = useExpeditionStore(s => s.npcs);

  const [filter, setFilter] = useState<'all' | 'active' | 'locked'>('all');

  // Create mock relationship data for display
  const npcRelationships: Record<string, RelationshipLevel> = {};
  npcs.forEach(npc => {
    npcRelationships[npc.id] = {
      level: (npc.trustLevel || 1) as keyof typeof RELATIONSHIP_CONFIG,
      progress: Math.random() * 100, // Mock for display
      currentPoints: npc.trust || 0,
      pointsNeeded: 100,
    };
  });

  const filteredNpcs = npcs.filter(npc => {
    const rel = npcRelationships[npc.id];
    if (filter === 'active') return rel && rel.level !== 'stranger';
    if (filter === 'locked') return !rel || rel.level === 'stranger';
    return true;
  });

  const activeCount = npcs.filter(n => (n.trust || 0) > 0).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#10B981]/20 to-[#00E5FF]/20 border-[#10B981]/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-[#10B981]/30 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#10B981]">
              NPC Довідник
            </h2>
            <p className="text-sm text-[#E6EDF3]/80">
              Історія, довіра та бонуси
            </p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-bold text-[#10B981]">
              {activeCount}/{npcs.length}
            </span>
            <p className="text-[10px] text-[#8B949E]">активні</p>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="bg-[#161B22] border-white/5 p-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(RELATIONSHIP_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1">
              <span>{config.icon}</span>
              <span className="text-[10px]" style={{ color: config.color }}>
                {config.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#10B981]/20 text-[#10B981]'
                : 'bg-white/5 text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            {f === 'all' ? 'Всі' : f === 'active' ? 'Активні' : 'Без контакту'}
          </button>
        ))}
      </div>

      {/* NPC Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredNpcs.map(npc => (
          <NpcCard 
            key={npc.id} 
            npc={npc} 
            relationship={npcRelationships[npc.id]}
          />
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-[#161B22] border-white/5 p-4">
        <h3 className="text-sm font-medium text-[#E6EDF3] mb-2 flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#FF6B6B]" />
          Система довіри NPC
        </h3>
        <p className="text-xs text-[#8B949E]">
          Кожна взаємодія з NPC збільшує рівень довіри. 
          Вищий рівень — кращі бонуси та унікальні нагороди.
          Взаємодія з NPC відбувається через експедиції, сюжетні квести та спеціальні події.
        </p>
      </Card>
    </div>
  );
}
