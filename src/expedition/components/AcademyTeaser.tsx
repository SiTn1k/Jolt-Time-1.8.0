/**
 * Academy Teaser Component
 * 
 * Shows locked Academy preview to create anticipation.
 * Displays features, screenshots, and unlock requirements.
 */

import { motion } from 'motion/react';
import { Lock, Users, Map, Building, BookOpen } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useTranslation } from '../../i18n';
import { useExpeditionStore } from '../store';

interface AcademyFeature {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  color: string;
}

const ACADEMY_FEATURES: AcademyFeature[] = [
  { 
    id: 'heroes', 
    icon: Users, 
    titleKey: 'heroes', 
    descKey: 'heroes_desc', 
    color: '#9747FF' 
  },
  { 
    id: 'expeditions', 
    icon: Map, 
    titleKey: 'expeditions', 
    descKey: 'expeditions_desc', 
    color: '#00E5FF' 
  },
  { 
    id: 'buildings', 
    icon: Building, 
    titleKey: 'buildings', 
    descKey: 'buildings_desc', 
    color: '#FFC72C' 
  },
  { 
    id: 'story', 
    icon: BookOpen, 
    titleKey: 'story', 
    descKey: 'story_desc', 
    color: '#10B981' 
  },
];

export function AcademyTeaser() {
  const { t } = useTranslation();
  const historicalPrestige = useExpeditionStore((s) => s.historicalPrestige);
  
  const ACADEMY_THRESHOLD = 3000;
  const progressPercent = (historicalPrestige / ACADEMY_THRESHOLD) * 100;
  const isUnlocked = historicalPrestige >= ACADEMY_THRESHOLD;
  
  if (isUnlocked) {
    return null;
  }
  
  return (
    <Card className="border-[#FF2A5F]/30 p-4 bg-gradient-to-br from-[#FF2A5F]/5 to-transparent overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2A5F]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FFC72C]/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-5 h-5 text-[#FF2A5F]" />
            </motion.div>
            <span className="text-sm font-bold text-[#FF2A5F]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {t('teaser.locked_academy')}
            </span>
          </div>
          <Badge style={{ backgroundColor: '#FF2A5F', color: '#fff', fontSize: '10px' }}>
            {t('teaser.unlock_at')} {ACADEMY_THRESHOLD} {t('academy.prestige')}
          </Badge>
        </div>
        
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            {t('teaser.academy_title')}
          </h3>
          <p className="text-xs text-white/50">
            {t('teaser.academy_subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {ACADEMY_FEATURES.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-2 border border-white/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FeatureIcon className="w-4 h-4" style={{ color: feature.color }} />
                  <span className="text-xs font-medium text-white/80">
                    {t(`teaser.${feature.titleKey}`)}
                  </span>
                </div>
                <p className="text-[10px] text-white/40">
                  {t(`teaser.${feature.descKey}`)}
                </p>
              </motion.div>
            );
          })}
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">{t('teaser.progress')}</span>
            <span className="text-xs font-bold" style={{ color: '#FFC72C' }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FF2A5F, #FFC72C)' }}
              animate={{ width: `${Math.min(100, progressPercent)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] text-white/40 mt-1 text-center">
            {historicalPrestige.toLocaleString()} / {ACADEMY_THRESHOLD.toLocaleString()} {t('academy.prestige')}
          </p>
        </div>
        
        <motion.div
          className="mt-4 text-center"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <p className="text-xs text-white/50">
            {t('teaser.collect_artifacts')}
          </p>
        </motion.div>
      </div>
    </Card>
  );
}
