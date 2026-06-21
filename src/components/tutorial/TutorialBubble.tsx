/**
 * TutorialBubble Component
 * 
 * Bottom sheet style bubble with guide character.
 * Inspired by Monobank/Revolut design language.
 * Mobile-first responsive design with safe area support.
 */

import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../../i18n';

interface TutorialStep {
  id: string;
  titleKey: string;
  contentKey: string;
  targetSelector?: string;
  screen: string;
}

interface TutorialBubbleProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  guideName: string;
  guideAvatar: string;
  onNext: () => void;
  onSkip: () => void;
  position?: 'bottom' | 'center';
}

export function TutorialBubble({
  step,
  stepNumber,
  totalSteps,
  guideName,
  guideAvatar,
  onNext,
  onSkip,
  position = 'bottom',
}: TutorialBubbleProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed z-[100] pointer-events-none"
        style={{
          left: '50%',
          transform: `translateX(-50%) ${position === 'center' ? 'translateY(-50%)' : 'translateY(0)'}`,
          bottom: position === 'bottom' ? `calc(80px + env(safe-area-inset-bottom))` : 'auto',
          top: position === 'center' ? '50%' : 'auto',
          width: 'min(calc(100vw - 32px), 420px)',
        }}
      >
        <div
          className="pointer-events-auto overflow-hidden"
          style={{
            background: 'rgba(22, 27, 34, 0.98)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header with guide */}
          <div className="flex items-center gap-3 p-4 border-b border-white/[0.08]">
            {/* Guide Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
              style={{
                background: '#FFC72C',
              }}
            >
              {guideAvatar}
            </div>

            {/* Guide info */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-semibold truncate"
                style={{ fontFamily: "'Exo 2', sans-serif", color: '#E6EDF3' }}
              >
                {guideName}
              </h3>
              <p className="text-xs" style={{ color: '#8B949E' }}>
                {stepNumber} / {totalSteps}
              </p>
            </div>

            {/* Skip button */}
            <button
              onClick={onSkip}
              className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-white/[0.08] shrink-0"
              style={{ color: '#8B949E' }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Title */}
            <h4
              className="text-sm font-semibold mb-2 truncate"
              style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}
            >
              {t(step.titleKey)}
            </h4>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: '#8B949E' }}>
              {t(step.contentKey)}
            </p>

            {/* Progress bar */}
            <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#FFC72C' }}
                initial={{ width: 0 }}
                animate={{ width: `${(stepNumber / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Action button */}
            <button
              onClick={onNext}
              className="w-full h-10 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center"
              style={{
                background: '#FFC72C',
                color: '#0d1117',
              }}
            >
              {stepNumber === totalSteps ? t('tutorial.finish') : t('tutorial.got_it')}
            </button>

            {/* Skip link */}
            <button
              onClick={onSkip}
              className="w-full mt-2 py-1.5 text-xs transition-colors"
              style={{ color: '#8B949E' }}
            >
              {t('tutorial.skip_tutorial')}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
