import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Target, ShoppingBag, Gift, Zap, BookOpen, Map, Award } from 'lucide-react';
import { hapticImpact } from '../lib/telegram';
import { useTranslation } from '../i18n';

interface TutorialModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: <Target className="w-12 h-12 text-[#FFC72C]" />,
    titleKey: 'tutorial.welcome_title',
    contentKey: 'tutorial.welcome_content',
  },
  {
    icon: <ShoppingBag className="w-12 h-12 text-[#10B981]" />,
    titleKey: 'tutorial.generators_title',
    contentKey: 'tutorial.generators_content',
  },
  {
    icon: <Gift className="w-12 h-12 text-[#9747FF]" />,
    titleKey: 'tutorial.artifacts_title',
    contentKey: 'tutorial.artifacts_content',
  },
  {
    icon: <Map className="w-12 h-12 text-[#00E5FF]" />,
    titleKey: 'tutorial.expeditions_title',
    contentKey: 'tutorial.expeditions_content',
  },
  {
    icon: <Award className="w-12 h-12 text-[#FFC72C]" />,
    titleKey: 'tutorial.prestige_title',
    contentKey: 'tutorial.prestige_content',
  },

  {
    icon: <Zap className="w-12 h-12 text-[#FFC72C]" />,
    titleKey: 'tutorial.boosters_title',
    contentKey: 'tutorial.boosters_content',
  },
];

export function TutorialModal({ onClose }: TutorialModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    hapticImpact('light');
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    hapticImpact('light');
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    hapticImpact('medium');
    onClose();
  };

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-[#161B22] rounded-3xl overflow-hidden border border-white/[0.08]">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-[#8B949E] hover:text-[#E6EDF3] z-10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="pt-8 pb-6 px-6 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            {currentStep.icon}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-[#E6EDF3] mb-3">
            {t(currentStep.titleKey)}
          </h2>

          {/* Content */}
          <p className="text-[#8B949E] text-sm leading-relaxed mb-6">
            {t(currentStep.contentKey)}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[#FFC72C]' : 'w-2 bg-white/[0.1]'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 h-12 rounded-2xl bg-white/[0.08] text-[#E6EDF3] font-medium hover:bg-white/[0.12] transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} />
                {t('tutorial.back')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 h-12 rounded-2xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-[#FFC72C] text-[#0d1117]"
            >
              {step === STEPS.length - 1 ? (
                <>
                  <BookOpen size={18} />
                  {t('tutorial.start_game')}
                </>
              ) : (
                <>
                  {t('tutorial.next')}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="mt-4 text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
          >
            {t('tutorial.skip_tutorial')}
          </button>
        </div>
      </div>
    </div>
  );
}
