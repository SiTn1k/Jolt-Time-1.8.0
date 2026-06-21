/**
 * useTutorial Hook
 * 
 * Manages the Academy tutorial state for new players.
 * Provides step-by-step guidance through game mechanics.
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../i18n';

export interface TutorialStep {
  id: string;
  titleKey: string;
  contentKey: string;
  targetSelector?: string;  // CSS selector for element to highlight
  action?: 'click' | 'scroll' | 'wait';
  screen?: 'academy' | 'map' | 'heroes' | 'laboratory' | 'museum' | 'buildings';
}

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
}

// Tutorial steps - 9 steps as specified
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    titleKey: 'tutorial.academy_welcome_title',
    contentKey: 'tutorial.academy_welcome_content',
    screen: 'academy',
  },
  {
    id: 'map',
    titleKey: 'tutorial.map_title',
    contentKey: 'tutorial.map_content',
    targetSelector: '[data-tutorial="map-button"]',
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
    targetSelector: '[data-tutorial="collect-result"]',
    action: 'wait',
    screen: 'map',
  },
  {
    id: 'laboratory',
    titleKey: 'tutorial.laboratory_title',
    contentKey: 'tutorial.laboratory_content',
    targetSelector: '[data-tutorial="laboratory-tab"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'museum',
    titleKey: 'tutorial.museum_title',
    contentKey: 'tutorial.museum_content',
    targetSelector: '[data-tutorial="museum-tab"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'heroes',
    titleKey: 'tutorial.heroes_title',
    contentKey: 'tutorial.heroes_content',
    targetSelector: '[data-tutorial="heroes-tab"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'buildings',
    titleKey: 'tutorial.buildings_title',
    contentKey: 'tutorial.buildings_content',
    targetSelector: '[data-tutorial="buildings-tab"]',
    action: 'scroll',
    screen: 'academy',
  },
  {
    id: 'complete',
    titleKey: 'tutorial.complete_title',
    contentKey: 'tutorial.complete_content',
    screen: 'academy',
  },
];

const STORAGE_KEY = 'academy_tutorial_state';

function loadTutorialState(): TutorialState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[tutorial] Failed to load state:', e);
  }
  return {
    isActive: false,
    currentStep: 0,
    completed: false,
    skipped: false,
  };
}

function saveTutorialState(state: TutorialState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[tutorial] Failed to save state:', e);
  }
}

export function useTutorial() {
  const { t } = useTranslation();
  const [state, setState] = useState<TutorialState>(loadTutorialState);

  // Persist state changes
  useEffect(() => {
    saveTutorialState(state);
  }, [state]);

  // Start tutorial
  const startTutorial = useCallback(() => {
    setState({
      isActive: true,
      currentStep: 0,
      completed: false,
      skipped: false,
    });
  }, []);

  // Skip tutorial
  const skipTutorial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      skipped: true,
      completed: true,
    }));
  }, []);

  // Next step
  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextStepNum = prev.currentStep + 1;
      if (nextStepNum >= TUTORIAL_STEPS.length) {
        return {
          ...prev,
          isActive: false,
          completed: true,
        };
      }
      return {
        ...prev,
        currentStep: nextStepNum,
      };
    });
  }, []);

  // Previous step
  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  // Complete tutorial
  const completeTutorial = useCallback(() => {
    setState({
      isActive: false,
      currentStep: 0,
      completed: true,
      skipped: false,
    });
  }, []);

  // Get current step info
  const currentStepInfo = state.isActive ? TUTORIAL_STEPS[state.currentStep] : null;

  // Get all steps for progress
  const steps = TUTORIAL_STEPS;
  const totalSteps = TUTORIAL_STEPS.length;

  return {
    // State
    isActive: state.isActive,
    currentStep: state.currentStep,
    completed: state.completed,
    skipped: state.skipped,
    currentStepInfo,
    steps,
    totalSteps,
    progress: state.isActive ? ((state.currentStep + 1) / totalSteps) * 100 : 100,

    // Actions
    startTutorial,
    skipTutorial,
    nextStep,
    prevStep,
    completeTutorial,

    // Translation helper
    t,
  };
}

export { TUTORIAL_STEPS };
