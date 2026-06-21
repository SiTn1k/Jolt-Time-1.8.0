// ═══════════════════════════════════════════════════════════════════════
// ACADEMY PREVIEW COMPONENT
// Shows locked Academy content to motivate prestige progression
// ═══════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Lock, Star, Map, Users, Landmark, BookOpen, Gift, TrendingUp, Sparkles } from 'lucide-react';
import { Card, Badge } from '../expedition/ui';
import { useTranslation } from '../i18n';

// Academy milestones that unlock content
const MILESTONES = [
  { level: 5, name: 'Перші герої', icon: Users, color: '#FFD700' },
  { level: 10, name: 'Музейна лабораторія', icon: Landmark, color: '#A855F7' },
  { level: 15, name: 'Сюжетні арки', icon: BookOpen, color: '#FF6B6B' },
  { level: 20, name: 'NPC союзи', icon: Gift, color: '#F59E0B' },
  { level: 25, name: 'Колекції', icon: TrendingUp, color: '#10B981' },
  { level: 30, name: 'Легендарні герої', icon: Sparkles, color: '#00E5FF' },
];

// Locked heroes preview
const LOCKED_HEROES = [
  { name: 'Князь Володимир', prestige: 2, color: '#FFD700' },
  { name: 'Козаки Запорожжя', prestige: 3, color: '#FF6B00' },
  { name: 'Гетьман Хмельницький', prestige: 4, color: '#A855F7' },
  { name: 'Тарас Шевченко', prestige: 5, color: '#10B981' },
];

// Locked regions preview
const LOCKED_REGIONS = [
  { name: 'Західна Україна', prestige: 2 },
  { name: 'Крим', prestige: 3 },
  { name: 'Карпати', prestige: 4 },
  { name: 'Чорне море', prestige: 5 },
];

interface AcademyPreviewProps {
  currentPrestige: number;
  requiredPrestige?: number;
}

export function AcademyPreview({ currentPrestige, requiredPrestige = 2 }: AcademyPreviewProps) {
  const { t } = useTranslation();
  
  const isUnlocked = currentPrestige >= requiredPrestige;
  const progressPercent = Math.min(100, (currentPrestige / requiredPrestige) * 100);

  if (isUnlocked) {
    return null; // Don't show if already unlocked
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#FFD700]/10 to-[#FF6B00]/10 border-[#FFD700]/20 p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
            <Star className="w-8 h-8 text-[#FFD700]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#FFD700]">
                Академія
              </h3>
              <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
                <Lock className="w-3 h-3 mr-1" />
                Закрите
              </Badge>
            </div>
            <p className="text-sm text-[#E6EDF3]/80">
              Відкривається на {requiredPrestige} переродженні
            </p>
            <div className="mt-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF6B00]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <p className="text-xs text-[#8B949E] mt-1">
                {currentPrestige}/{requiredPrestige} перероджень
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* What's Inside */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[#E6EDF3] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFD700]" />
          Що чекає всередині:
        </h4>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-2">
          <FeatureCard
            icon={<Map className="w-5 h-5" />}
            title="Експедиції"
            desc="Досліджуй Україну"
            color="#00E5FF"
          />
          <FeatureCard
            icon={<Users className="w-5 h-5" />}
            title="Герої"
            desc="Наймай легенд"
            color="#FFD700"
          />
          <FeatureCard
            icon={<Landmark className="w-5 h-5" />}
            title="Музей"
            desc="Збери колекцію"
            color="#A855F7"
          />
          <FeatureCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Сюжет"
            desc="12 арок на рік"
            color="#FF6B6B"
          />
        </div>

        {/* Milestones Preview */}
        <Card className="bg-[#161B22] border-white/5 p-3">
          <h5 className="text-xs font-medium text-[#8B949E] mb-2">Рівні Академії:</h5>
          <div className="flex flex-wrap gap-2">
            {MILESTONES.map((milestone, i) => (
              <motion.div
                key={milestone.level}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5"
              >
                <milestone.icon className="w-3 h-3" style={{ color: milestone.color }} />
                <span className="text-[10px] text-[#E6EDF3]">
                  {milestone.name}
                </span>
                <span className="text-[10px] text-[#8B949E]">
                  ({milestone.level})
                </span>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Locked Heroes Preview */}
        <Card className="bg-[#161B22] border-white/5 p-3">
          <h5 className="text-xs font-medium text-[#8B949E] mb-2">Легендарні герої:</h5>
          <div className="space-y-1.5">
            {LOCKED_HEROES.map((hero) => (
              <div
                key={hero.name}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-[#8B949E]" />
                  <span className="text-xs text-[#E6EDF3]">{hero.name}</span>
                </div>
                <Badge
                  className="text-[10px]"
                  style={{ backgroundColor: `${hero.color}20`, color: hero.color }}
                >
                  P{hero.prestige}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Locked Regions Preview */}
        <Card className="bg-[#161B22] border-white/5 p-3">
          <h5 className="text-xs font-medium text-[#8B949E] mb-2">Нові регіони:</h5>
          <div className="flex flex-wrap gap-2">
            {LOCKED_REGIONS.map((region) => (
              <div
                key={region.name}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5"
              >
                <Lock className="w-3 h-3 text-[#8B949E]" />
                <span className="text-[10px] text-[#E6EDF3]">{region.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Motivation Text */}
        <Card className="bg-gradient-to-r from-[#FFD700]/5 to-transparent border-[#FFD700]/10 p-3 text-center">
          <p className="text-xs text-[#FFD700]">
            ✨ Продовжуйте грати, щоб відкрити Академію!
          </p>
          <p className="text-[10px] text-[#8B949E] mt-1">
            Герої, експедиції, музей, сюжет та багато іншого
          </p>
        </Card>
      </div>
    </motion.div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

function FeatureCard({ icon, title, desc, color }: FeatureCardProps) {
  return (
    <Card className="bg-[#161B22] border-white/5 p-3">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
      <h5 className="text-xs font-medium text-[#E6EDF3]">{title}</h5>
      <p className="text-[10px] text-[#8B949E]">{desc}</p>
    </Card>
  );
}
