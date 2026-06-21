/**
 * TutorialHighlight Component
 * 
 * Wrapper component that adds tutorial highlight to any element.
 * Adds data-tutorial attribute for overlay targeting.
 */

import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';

interface TutorialHighlightProps {
  tutorialId: string;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
  enabled?: boolean;
}

export function TutorialHighlight({
  tutorialId,
  children,
  className = '',
  pulse = true,
  enabled = true,
}: TutorialHighlightProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      setIsHighlighted(false);
      return;
    }

    // Check if this element is the current tutorial target
    const checkHighlight = () => {
      const currentTarget = window.sessionStorage.getItem('tutorial_current_target');
      setIsHighlighted(currentTarget === tutorialId);
    };

    // Initial check
    checkHighlight();

    // Listen for tutorial changes
    const handleStorage = () => checkHighlight();
    const interval = setInterval(checkHighlight, 500);

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [enabled, tutorialId]);

  return (
    <div
      ref={ref}
      data-tutorial={tutorialId}
      className={className}
    >
      <motion.div
        animate={
          isHighlighted && pulse
            ? {
                scale: [1, 1.02, 1],
                boxShadow: [
                  '0 0 0 0 rgba(255, 199, 44, 0)',
                  '0 0 20px 4px rgba(255, 199, 44, 0.4)',
                  '0 0 0 0 rgba(255, 199, 44, 0)',
                ],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          borderRadius: isHighlighted ? 12 : 0,
          outline: isHighlighted ? '2px solid #FFC72C' : 'none',
          outlineOffset: isHighlighted ? 4 : 0,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Hook to set current tutorial target
 */
export function useTutorialHighlight(tutorialId: string, enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      window.sessionStorage.setItem('tutorial_current_target', tutorialId);
    } else {
      window.sessionStorage.removeItem('tutorial_current_target');
    }

    return () => {
      window.sessionStorage.removeItem('tutorial_current_target');
    };
  }, [tutorialId, enabled]);
}
