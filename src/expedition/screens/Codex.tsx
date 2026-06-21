// ═══════════════════════════════════════════════════════════════════════
// CODEX SCREEN
// Unified encyclopedia for all game content
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useState } from 'react';
import { BookOpen, Package } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useExpeditionStore } from '../store';
import { CODEX_SECTIONS, type CodexSection } from '../playerGuidanceData';
import type { Hero, Npc, Region } from '../data';

export function Codex() {
  const [activeSection, setActiveSection] = useState<CodexSection>('heroes');
  const heroes = useExpeditionStore(s => s.heroes);
  const npcs = useExpeditionStore(s => s.npcs);
  const regions = useExpeditionStore(s => s.regions);

  const renderContent = () => {
    switch (activeSection) {
      case 'heroes':
        return <HeroesContent heroes={heroes} />;
      case 'npcs':
        return <NpcsContent npcs={npcs} />;
      case 'regions':
        return <RegionsContent regions={regions} />;
      case 'story_arcs':
        return <StoryArcsContent />;
      case 'collections':
        return <CollectionsContent />;
      case 'artifacts':
        return <ArtifactsContent />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#A855F7]/20 to-[#6366F1]/20 border-[#A855F7]/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-[#A855F7]/30 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#A855F7]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#A855F7]">
              Кодекс
            </h2>
            <p className="text-sm text-[#E6EDF3]/80">
              Енциклопедія гри
            </p>
          </div>
        </div>
      </Card>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {CODEX_SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-white/10 text-[#E6EDF3]'
                : 'bg-white/5 text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
            style={{
              backgroundColor: activeSection === section.id ? `${section.color}20` : undefined,
              color: activeSection === section.id ? section.color : undefined,
            }}
          >
            <span>{section.icon}</span>
            <span>{section.nameKey.replace('codex.', '')}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}

function HeroesContent({ heroes }: { heroes: Hero[] }) {
  const unlockedCount = heroes.filter(h => h.unlocked).length;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#E6EDF3]">Герої</h3>
        <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">
          {unlockedCount} / {heroes.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {heroes.map(hero => (
          <Card 
            key={hero.id}
            className={`bg-[#161B22] border-white/5 p-4 ${
              hero.unlocked ? '' : 'opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                {hero.unlocked ? (hero.avatar || '👤') : '🔒'}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[#E6EDF3]">
                  {hero.name || hero.id}
                </h4>
                {hero.unlocked && hero.level && (
                  <p className="text-xs text-[#8B949E]">
                    Рівень {hero.level}
                  </p>
                )}
                {!hero.unlocked && hero.unlockCondition && (
                  <p className="text-xs text-[#8B949E]">
                    Потребує: {hero.unlockCondition.type} {hero.unlockCondition.value}
                  </p>
                )}
              </div>
              {hero.rarity && (
                <Badge 
                  className="text-[10px]"
                  style={{
                    backgroundColor: hero.rarity === 'legendary' ? '#FFD70020' : 
                                   hero.rarity === 'epic' ? '#A855F720' : '#00E5FF20',
                    color: hero.rarity === 'legendary' ? '#FFD700' : 
                           hero.rarity === 'epic' ? '#A855F7' : '#00E5FF',
                  }}
                >
                  {hero.rarity}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NpcsContent({ npcs }: { npcs: Npc[] }) {
  const activeCount = npcs.filter(n => (n.trust || 0) > 0).length;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#E6EDF3]">NPC</h3>
        <Badge className="bg-[#FF6B6B]/20 text-[#FF6B6B]">
          {activeCount} / {npcs.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {npcs.map(npc => (
          <Card 
            key={npc.id}
            className="bg-[#161B22] border-white/5 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                {(npc.trust || 0) > 0 ? '👤' : '🔒'}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[#E6EDF3]">
                  {npc.name || npc.id}
                </h4>
                {(npc.trust || 0) > 0 && (
                  <p className="text-xs text-[#10B981]">
                    Довіра: {npc.trust}
                  </p>
                )}
                {(npc.trust || 0) === 0 && (
                  <p className="text-xs text-[#8B949E]">
                    Ще не зустрічався
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RegionsContent({ regions }: { regions: Region[] }) {
  const unlockedCount = regions.filter(r => r.unlocked).length;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#E6EDF3]">Регіони</h3>
        <Badge className="bg-[#F59E0B]/20 text-[#F59E0B]">
          {unlockedCount} / {regions.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {regions.map(region => (
          <Card 
            key={region.id}
            className={`bg-[#161B22] border-white/5 p-4 ${
              region.unlocked ? '' : 'opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                {region.unlocked ? '🗺️' : '🔒'}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[#E6EDF3]">
                  {region.name || region.id}
                </h4>
                {region.era && (
                  <p className="text-xs text-[#8B949E]">
                    {region.era}
                  </p>
                )}
                {!region.unlocked && (
                  <p className="text-xs text-[#8B949E]">
                    Закритий
                  </p>
                )}
              </div>
              {region.difficulty && (
                <Badge className="bg-white/10 text-[#E6EDF3] text-[10px]">
                  ⚡ {region.difficulty}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StoryArcsContent() {
  const storyState = useExpeditionStore(s => s.storyState);
  const completedArcs = storyState?.completedQuests?.length || 0;
  const totalArcs = 12;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#E6EDF3]">Сюжетні арки</h3>
        <Badge className="bg-[#A855F7]/20 text-[#A855F7]">
          {completedArcs} / {totalArcs}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: totalArcs }, (_, i) => {
          const arcNum = i + 1;
          const isCompleted = completedArcs >= arcNum;
          
          return (
            <Card 
              key={arcNum}
              className={`bg-[#161B22] border-white/5 p-4 ${
                isCompleted ? '' : 'opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                  {isCompleted ? '✓' : arcNum}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-[#E6EDF3]">
                    Арка {arcNum}
                  </h4>
                  <p className="text-xs text-[#8B949E]">
                    {isCompleted ? 'Завершено' : 'В очікуванні'}
                  </p>
                </div>
                {isCompleted && (
                  <Badge className="bg-[#10B981]/20 text-[#10B981] text-[10px]">
                    ✓
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CollectionsContent() {
  const museumState = useExpeditionStore(s => s.museumState);
  const completedCollections = museumState?.completedCollections?.length || 0;
  const totalCollections = 14;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#E6EDF3]">Колекції</h3>
        <Badge className="bg-[#10B981]/20 text-[#10B981]">
          {completedCollections} / {totalCollections}
        </Badge>
      </div>
      
      <Card className="bg-[#161B22] border-white/5 p-4 text-center">
        <Package className="w-12 h-12 mx-auto text-[#8B949E] mb-3 opacity-50" />
        <p className="text-sm text-[#8B949E]">
          Колекції музею з&apos;являються після відкриття Академії
        </p>
      </Card>
    </div>
  );
}

function ArtifactsContent() {
  const artifacts = useExpeditionStore(s => s.artifacts);
  const totalArtifacts = artifacts.length;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#E6EDF3]">Артефакти</h3>
        <Badge className="bg-[#8B5CF6]/20 text-[#8B5CF6]">
          {totalArtifacts}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {artifacts.slice(0, 12).map(artifact => (
          <Card 
            key={artifact.id}
            className="bg-[#161B22] border-white/5 p-3"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🏺</div>
              <h4 className="text-xs font-medium text-[#E6EDF3] truncate">
                {artifact.name || artifact.id}
              </h4>
              <Badge 
                className="text-[10px] mt-1"
                style={{
                  backgroundColor: artifact.rarity === 'legendary' ? '#FFD70020' : 
                                 artifact.rarity === 'epic' ? '#A855F720' : '#00E5FF20',
                  color: artifact.rarity === 'legendary' ? '#FFD700' : 
                         artifact.rarity === 'epic' ? '#A855F7' : '#00E5FF',
                }}
              >
                {artifact.rarity}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
      
      {totalArtifacts > 12 && (
        <p className="text-center text-xs text-[#8B949E]">
          +{totalArtifacts - 12} більше артефактів
        </p>
      )}
    </div>
  );
}
