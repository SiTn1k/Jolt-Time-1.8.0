// ═══════════════════════════════════════════════════════════════════════
// HERO ARCHIVE SCREEN
// Complete overview of all heroes with unlock conditions
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Users, Lock, Star } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useExpeditionStore } from '../store';
import { type Rarity, type Hero } from '../data';
import { HERO_SYNERGIES } from '../heroRpgData';

// Rarity colors
const RARITY_COLORS: Record<Rarity, string> = {
  common: '#8B949E',
  rare: '#00E5FF',
  epic: '#A855F7',
  legendary: '#FFD700',
};

function HeroCard({ 
  hero, 
  prestigeLevel, 
  playerLevel 
}: { 
  hero: Hero; 
  prestigeLevel: number;
  playerLevel: number;
}) {
  const isUnlocked = hero.unlocked;
  const canUnlock = checkCanUnlock(hero, prestigeLevel, playerLevel);

  // Find synergies
  const heroSynergies = HERO_SYNERGIES.filter(s => s.heroIds.includes(hero.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className={`bg-[#161B22] border-white/5 p-4 ${
          isUnlocked ? '' : 'opacity-60'
        }`}
        style={{ 
          borderLeft: `3px solid ${RARITY_COLORS[hero.rarity]}`
        }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar/Icon */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{ 
              backgroundColor: isUnlocked ? `${RARITY_COLORS[hero.rarity]}20` : 'rgba(139, 148, 158, 0.2)',
              border: `2px solid ${isUnlocked ? RARITY_COLORS[hero.rarity] : '#8B949E'}`
            }}
          >
            {isUnlocked ? hero.avatar || '👤' : <Lock className="w-6 h-6 text-[#8B949E]" />}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name & Rarity */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-[#E6EDF3] truncate">
                {hero.name || hero.id}
              </h4>
              <Badge 
                className="text-[10px]"
                style={{ 
                  backgroundColor: `${RARITY_COLORS[hero.rarity]}20`,
                  color: RARITY_COLORS[hero.rarity]
                }}
              >
                {hero.rarity}
              </Badge>
            </div>

            {/* Level */}
            {isUnlocked && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-[#FFD700]" />
                <span className="text-xs text-[#FFD700]">Level {hero.level || 1}</span>
                <span className="text-xs text-[#8B949E]">
                  ({hero.experience || 0} XP)
                </span>
              </div>
            )}

            {/* Unlock condition */}
            {!isUnlocked && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs text-[#8B949E]">
                  <Lock className="w-3 h-3" />
                  {hero.unlockCondition?.type === 'prestige' && (
                    <span>Prestige {hero.unlockCondition.value}+</span>
                  )}
                  {hero.unlockCondition?.type === 'epoch' && (
                    <span>Epoch: {hero.unlockCondition.value}</span>
                  )}
                  {hero.unlockCondition?.type === 'level' && (
                    <span>Level {hero.unlockCondition.value}+</span>
                  )}
                </div>
                {canUnlock && (
                  <Badge className="mt-1 bg-green-500/20 text-green-400 text-[10px]">
                    Available!
                  </Badge>
                )}
              </div>
            )}

            {/* Stats (if unlocked) */}
            {isUnlocked && hero.specialization && (
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge className="bg-white/10 text-[#E6EDF3] text-[10px]">
                  {hero.specialization}
                </Badge>
              </div>
            )}

            {/* Synergies */}
            {heroSynergies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {heroSynergies.map(synergy => (
                  <Badge key={synergy.id} className="bg-[#A855F7]/20 text-[#A855F7] text-[10px]">
                    {synergy.icon} {synergy.nameKey.split('.')[1].replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function checkCanUnlock(hero: Hero, prestigeLevel: number, playerLevel: number): boolean {
  if (!hero.unlockCondition) return false;
  
  switch (hero.unlockCondition.type) {
    case 'prestige':
      return prestigeLevel >= (hero.unlockCondition.value as number);
    case 'epoch':
      return true; // Would need to check unlocked epochs
    case 'level':
      return playerLevel >= (hero.unlockCondition.value as number);
    default:
      return false;
  }
}

export function HeroArchive() {
  const heroes = useExpeditionStore(s => s.heroes);
  const reputation = useExpeditionStore(s => s.reputation);

  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filteredHeroes = heroes.filter(hero => {
    if (filter === 'unlocked') return hero.unlocked;
    if (filter === 'locked') return !hero.unlocked;
    return true;
  });

  const unlockedCount = heroes.filter(h => h.unlocked).length;
  const totalCount = heroes.length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#A855F7]/20 to-[#6366F1]/20 border-[#A855F7]/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-[#A855F7]/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-[#A855F7]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#A855F7]">
              Герої
            </h2>
            <p className="text-sm text-[#E6EDF3]/80">
              Всі герої та їх синергії
            </p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-bold text-[#A855F7]">
              {unlockedCount}/{totalCount}
            </span>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#A855F7]/20 text-[#A855F7]'
                : 'bg-white/5 text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            {f === 'all' ? 'Всі' : f === 'unlocked' ? 'Відкриті' : 'Закриті'}
          </button>
        ))}
      </div>

      {/* Hero Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredHeroes.map(hero => (
          <HeroCard 
            key={hero.id} 
            hero={hero} 
            prestigeLevel={0}
            playerLevel={reputation}
          />
        ))}
      </div>

      {/* Synergy Legend */}
      <Card className="bg-[#161B22] border-white/5 p-4">
        <h3 className="text-sm font-medium text-[#E6EDF3] mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-[#A855F7]" />
          Синергії героїв
        </h3>
        <div className="space-y-2">
          {HERO_SYNERGIES.map(synergy => (
            <div key={synergy.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span>{synergy.icon}</span>
                <span className="text-[#E6EDF3]">
                  {synergy.nameKey.split('.')[1].replace(/_/g, ' + ')}
                </span>
              </div>
              <Badge 
                className="text-[10px]"
                style={{ 
                  backgroundColor: synergy.bonus.type === 'xp' ? '#10B98120' : '#00E5FF20',
                  color: synergy.bonus.type === 'xp' ? '#10B981' : '#00E5FF'
                }}
              >
                +{synergy.bonus.value}%
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
