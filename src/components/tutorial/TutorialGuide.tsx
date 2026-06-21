/**
 * TutorialGuide Component
 * 
 * Main orchestrator for the Academy tutorial system.
 * Combines overlay, bubble, and guide character.
 */

import { useEffect } from 'react';
import { useTutorial } from './useTutorial';
import { TutorialBubble } from './TutorialBubble';
import { TutorialOverlay } from './TutorialOverlay';

interface TutorialGuideProps {
  onComplete?: () => void;
}

export function TutorialGuide({ onComplete }: TutorialGuideProps) {
  const {
    isActive,
    currentStep,
    currentStepInfo,
    totalSteps,
    progress,
    nextStep,
    skipTutorial,
    completeTutorial,
  } = useTutorial();

  // Call onComplete when tutorial finishes
  useEffect(() => {
    if (!isActive && progress === 100 && onComplete) {
      onComplete();
    }
  }, [isActive, progress, onComplete]);

  // Handle step completion
  const handleNext = () => {
    if (currentStep >= totalSteps - 1) {
      completeTutorial();
    } else {
      nextStep();
    }
  };

  // Guide character - Young Museum Researcher
  const guideName = 'Молодий дослідник';
  const guideAvatar = '🧑‍🔬';

  // Don't render if not active
  if (!isActive || !currentStepInfo) {
    return null;
  }

  return (
    <>
      {/* Overlay with highlight */}
      <TutorialOverlay
        isActive={isActive}
        targetSelector={currentStepInfo.targetSelector}
      />

      {/* Tutorial bubble */}
      <TutorialBubble
        step={currentStepInfo}
        stepNumber={currentStep + 1}
        totalSteps={totalSteps}
        guideName={guideName}
        guideAvatar={guideAvatar}
        onNext={handleNext}
        onSkip={skipTutorial}
        position="bottom"
      />
    </>
  );
}
