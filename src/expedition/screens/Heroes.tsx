import { useExpeditionStore } from '../store';
import { motion } from 'motion/react';
import { Sword, BookOpen, Compass, MessageCircle, Star, Crown, Award, Sparkles } from 'lucide-react';
import { Card, Badge, Progress, ScrollArea } from '../ui';
import { useState } from 'react';
import type { Rarity } from '../data';
import { useTranslation } from '../../i18n';

const rarityConfig: Record<Rarity, { color: string; icon: typeof Star; bg: string; labelKey: string }> = {
  common: { color: '#8B949E', icon: Star, bg: 'rgba(139, 148, 158, 0.1)', labelKey: 'artifacts.rarity_common' },
  rare: { color: '#00E5FF', icon: Sparkles, bg: 'rgba(0, 229, 255, 0.1)', labelKey: 'artifacts.rarity_rare' },
  epic: { color: '#9747FF', icon: Award, bg: 'rgba(151, 71, 255, 0.1)', labelKey: 'artifacts.rarity_epic' },
  legendary: { color: '#FF2A5F', icon: Crown, bg: 'rgba(255, 42, 95, 0.1)', labelKey: 'artifacts.rarity_legendary' },
};

const heroStats = [
  { key: 'leadership', icon: Sword, color: '#FFC72C', labelKey: 'expedition.hero_leadership' },
  { key: 'knowledge', icon: BookOpen, color: '#9747FF', labelKey: 'expedition.hero_knowledge' },
  { key: 'exploration', icon: Compass, color: '#00E5FF', labelKey: 'expedition.hero_exploration' },
  { key: 'diplomacy', icon: MessageCircle, color: '#FF2A5F', labelKey: 'expedition.hero_diplomacy' },
];

export function Heroes() {
  const { t } = useTranslation();
  const heroes = useExpeditionStore((s) => s.heroes);
  const [selectedId, setSelectedId] = useState(heroes[0].id);
  const selectedHero = heroes.find((h) => h.id === selectedId) || heroes[0];

  return (
    <div className="min-h-full bg-[#0D1117] flex">
      <div className="w-28 bg-[#161B22] border-r border-white/10">
        <ScrollArea className="h-full pb-20">
          <div className="p-2 space-y-2">
            {heroes.map((hero) => {
              const RarityIcon = rarityConfig[hero.rarity].icon;
              const isSelected = selectedHero.id === hero.id;
              return (
                <motion.div key={hero.id} className="relative cursor-pointer" onClick={() => setSelectedId(hero.id)} whileTap={{ scale: 0.98 }}>
                  <Card
                    className="p-2 border-2 transition-all"
                    style={{
                      backgroundColor: rarityConfig[hero.rarity].bg,
                      borderColor: isSelected ? rarityConfig[hero.rarity].color : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      className="w-full aspect-square rounded mb-1 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${rarityConfig[hero.rarity].color}40, ${rarityConfig[hero.rarity].color}10)`,
                        border: `1px solid ${rarityConfig[hero.rarity].color}`,
                      }}
                    >
                      <RarityIcon className="w-7 h-7" style={{ color: rarityConfig[hero.rarity].color }} />
                    </div>
                    <div className="text-[10px] line-clamp-2 mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>{hero.name}</div>
                    <Badge className="w-full text-[8px] px-1 justify-center" style={{ backgroundColor: rarityConfig[hero.rarity].color, color: '#0D1117' }}>
                      {t('common.level')} {hero.level}
                    </Badge>
                    {hero.assigned && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#00E5FF', boxShadow: '0 0 8px #00E5FF' }} />
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <motion.div key={selectedHero.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="p-4">
          <div
            className="rounded-lg p-4 mb-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${rarityConfig[selectedHero.rarity].color}30, ${rarityConfig[selectedHero.rarity].color}10)`,
              border: `1px solid ${rarityConfig[selectedHero.rarity].color}`,
            }}
          >
            <div className="relative z-10">
              <Badge className="mb-2 text-[10px]" style={{ backgroundColor: rarityConfig[selectedHero.rarity].color, color: '#0D1117' }}>
                {t(rarityConfig[selectedHero.rarity].labelKey)}
              </Badge>
              <h1 className="text-xl mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>{selectedHero.name}</h1>
              <p className="text-sm text-muted-foreground mb-3">{selectedHero.title}</p>
              <div className="bg-[#0D1117]/50 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">{t('common.level')} {selectedHero.level}</span>
                  <span className="text-xs" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {Math.round(selectedHero.experience)} / {(selectedHero.level + 1) * 200} XP
                  </span>
                </div>
                <Progress value={(selectedHero.experience / ((selectedHero.level + 1) * 200)) * 100} className="h-1.5" />
              </div>
            </div>
          </div>

          <Card className="border-white/10 p-4 mb-4">
            <h3 className="text-sm mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('expedition.heroes_title')}</h3>
            <div className="space-y-3">
              {heroStats.map((attr) => {
                const Icon = attr.icon;
                const value = selectedHero[attr.key as keyof typeof selectedHero] as number;
                return (
                  <div key={attr.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: attr.color }} />
                        <span className="text-xs">{t(attr.labelKey)}</span>
                      </div>
                      <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: attr.color }}>{value}</span>
                    </div>
                    <Progress value={value} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="border-white/10 p-4 mb-4">
            <h3 className="text-sm mb-2" style={{ fontFamily: "'Exo 2', sans-serif" }}>Biography</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{selectedHero.biography}</p>
          </Card>

          <Card className="border-white/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('common.status') || 'Status'}</span>
              {selectedHero.assigned ? (
                <Badge style={{ backgroundColor: '#00E5FF', color: '#0D1117' }}>{t('expedition.hero_assigned')}: {selectedHero.assignedTo}</Badge>
              ) : (
                <Badge variant="outline" style={{ borderColor: '#FFC72C', color: '#FFC72C' }}>{t('expedition.hero_available')}</Badge>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
