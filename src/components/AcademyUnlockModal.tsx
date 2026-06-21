import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Star } from 'lucide-react';
import { useTranslation } from '../i18n';

interface AcademyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
            className="relative w-full max-w-sm mx-4 bg-[#161B22] border border-[#FFC72C]/20 rounded-3xl p-6"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFC72C] flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              >
                <Sparkles className="w-8 h-8 text-[#0d1117]" />
              </motion.div>

              {/* Prestige badge */}
              <motion.div
                className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-[#FFC72C]/10 border border-[#FFC72C]/30"
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
                className="text-2xl font-bold text-[#E6EDF3] mb-3"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('expedition.academy_unlock_title')}
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-sm text-[#8B949E] leading-relaxed mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {t('expedition.academy_unlock_description')}
              </motion.p>

              {/* Features list */}
              <motion.div
                className="grid grid-cols-2 gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { icon: Clock, text: 'expedition.feature_expeditions' },
                  { icon: Star, text: 'expedition.feature_museum' },
                  { icon: Sparkles, text: 'expedition.feature_heroes' },
                  { icon: Sparkles, text: 'expedition.feature_story' },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                  >
                    <feature.icon className="w-4 h-4 text-[#FFC72C]" />
                    <span className="text-xs text-[#E6EDF3]">{t(feature.text)}</span>
                  </div>
                ))}
              </motion.div>

              {/* Button */}
              <motion.button
                onClick={onClose}
                className="w-full h-12 px-6 rounded-2xl bg-[#FFC72C] text-[#0d1117] font-semibold text-base active:scale-[0.98] transition-transform"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: 0.35 }}
              >
                {t('expedition.start_research')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
