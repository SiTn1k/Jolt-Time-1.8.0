import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, Users, BookOpen, Landmark, Map, Gift} from 'lucide-react';
import { useTranslation } from '../i18n';

interface AcademyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: Map, text: 'expedition.feature_expeditions', desc: 'Відправляй героїв' },
  { icon: Landmark, text: 'expedition.feature_museum', desc: 'Збери колекцію' },
  { icon: Users, text: 'expedition.feature_heroes', desc: 'Наймай героїв' },
  { icon: BookOpen, text: 'expedition.feature_story', desc: 'Проходь сюжет' },
  { icon: Gift, text: 'expedition.feature_npc', desc: 'Спілкуйся з NPC' },
  { icon: Star, text: 'expedition.feature_reputation', desc: 'Заробляй репутацію' },
];

export function AcademyUnlockModal({ isOpen, onClose }: AcademyUnlockModalProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Modal content */}
          <motion.div
            className="relative w-full max-w-sm mx-4 bg-gradient-to-b from-[#1a1f26] to-[#161B22] border border-[#FFC72C]/30 rounded-3xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Top gradient */}
            <div className="h-1 bg-gradient-to-r from-[#FFC72C] via-[#9747FF] to-[#00E5FF]" />
            
            <div className="p-6">
              {/* Content */}
              <div className="text-center">
                {/* Icon */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FFC72C] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-[#FFC72C]/30"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                >
                  <Sparkles className="w-10 h-10 text-[#0d1117]" />
                </motion.div>

                {/* Prestige badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFC72C]/10 border border-[#FFC72C]/30"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Star className="w-4 h-4 text-[#FFC72C] fill-[#FFC72C]" />
                  <span className="text-sm font-medium text-[#FFC72C]">
                    {t('expedition.second_prestige_reached')}
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  className="text-2xl font-bold text-[#E6EDF3] mb-2"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {t('expedition.academy_unlock_title')}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  className="text-sm text-[#8B949E] leading-relaxed mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  {t('expedition.academy_unlock_description')}
                </motion.p>

                {/* Features grid */}
                <motion.div
                  className="grid grid-cols-2 gap-3 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {FEATURES.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FFC72C]/10 flex items-center justify-center shrink-0">
                        <feature.icon className="w-4 h-4 text-[#FFC72C]" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#E6EDF3] block">{t(feature.text)}</span>
                        <span className="text-[10px] text-[#8B949E]">{feature.desc}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Button */}
                <motion.button
                  onClick={onClose}
                  className="w-full h-12 px-6 rounded-2xl bg-gradient-to-r from-[#FFC72C] to-[#FF8C00] text-[#0d1117] font-bold text-base active:scale-[0.98] transition-transform shadow-lg shadow-[#FFC72C]/20"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: 0.6 }}
                >
                  {t('expedition.start_research')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
