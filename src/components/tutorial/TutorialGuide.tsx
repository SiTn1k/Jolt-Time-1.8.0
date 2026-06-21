/**
 * TutorialGuide Component
 * 
 * Main orchestrator for the Academy tutorial system.
 * Integrates with expedition store for state persistence.
 */

import { useTranslation } from '../../i18n';
import { useExpeditionStore } from '../../expedition/store';
import { TutorialBubble } from './TutorialBubble';
import { TutorialOverlay } from './TutorialOverlay';

// Tutorial steps - 9 steps as specified
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    titleKey: 'tutorial.academy_welcome_title',
    contentKey: 'tutorial.academy_welcome_content',
    targetSelector: undefined,
    screen: 'academy',
  },
  {
    id: 'map',
    titleKey: 'tutorial.map_title',
    contentKey: 'tutorial.map_content',
    targetSelector: '[data-tutorial="map"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'first_expedition',
    titleKey: 'tutorial.expedition_title',
    contentKey: 'tutorial.expedition_content',
    targetSelector: '[data-tutorial="start-expedition"]',
    action: 'click',
    screen: 'map',
  },
  {
    id: 'collect_rewards',
    titleKey: 'tutorial.rewards_title',
    contentKey: 'tutorial.rewards_content',
    targetSelector: '[data-tutorial="collect-expedition"]',
    action: 'wait',
    screen: 'map',
  },
  {
    id: 'laboratory',
    titleKey: 'tutorial.laboratory_title',
    contentKey: 'tutorial.laboratory_content',
    targetSelector: '[data-tutorial="laboratory"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'museum',
    titleKey: 'tutorial.museum_title',
    contentKey: 'tutorial.museum_content',
    targetSelector: '[data-tutorial="museum"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'heroes',
    titleKey: 'tutorial.heroes_title',
    contentKey: 'tutorial.heroes_content',
    targetSelector: '[data-tutorial="heroes"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'buildings',
    titleKey: 'tutorial.buildings_title',
    contentKey: 'tutorial.buildings_content',
    targetSelector: '[data-tutorial="buildings"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'complete',
    titleKey: 'tutorial.complete_title',
    contentKey: 'tutorial.complete_content',
    targetSelector: undefined,
    screen: 'academy',
  },
];

export function TutorialGuide() {
  const { t } = useTranslation();
  const tutorialState = useExpeditionStore((s) => s.tutorialState);
  const nextTutorialStep = useExpeditionStore((s) => s.nextTutorialStep);
  const skipTutorial = useExpeditionStore((s) => s.skipTutorial);
  const completeTutorial = useExpeditionStore((s) => s.completeTutorial);

  // Check if tutorial should be shown
  const isActive = !tutorialState.completed && tutorialState.currentStep < 9;
  const currentStep = Math.min(tutorialState.currentStep, TUTORIAL_STEPS.length - 1);
  const currentStepInfo = isActive ? TUTORIAL_STEPS[currentStep] : null;
  const totalSteps = TUTORIAL_STEPS.length;

  // Don't render if not active
  if (!isActive || !currentStepInfo) {
    return null;
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep >= totalSteps - 1) {
      completeTutorial();
    } else {
      nextTutorialStep();
    }
  };

  // Guide character - Young Museum Researcher
  const guideName = t('tutorial.guide_name') || 'Молодий дослідник';
  const guideAvatar = '🧑‍🔬';

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
