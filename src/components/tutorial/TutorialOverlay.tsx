/**
 * TutorialOverlay Component
 * 
 * Dark overlay that dims the screen and allows only
 * highlighted elements to be interactive.
 */

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface TutorialOverlayProps {
  isActive: boolean;
  targetSelector?: string;
  children?: React.ReactNode;
}

export function TutorialOverlay({ isActive, targetSelector, children }: TutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !targetSelector) {
      setTargetRect(null);
      return;
    }

    // Find and measure target element
    const findTarget = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll target into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Initial find
    findTarget();

    // Re-find on resize or scroll
    const handleResize = () => findTarget();
    const handleScroll = () => findTarget();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    // Also try to find after a small delay (for animations)
    const timeout = setTimeout(findTarget, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      clearTimeout(timeout);
    };
  }, [isActive, targetSelector]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] pointer-events-auto"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        >
          {/* Cut out the target element */}
          {targetRect && (
            <>
              {/* Top cutout */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: 0,
                  height: targetRect.top,
                }}
              />

              {/* Left cutout */}
              <div
                className="absolute"
                style={{
                  top: targetRect.top,
                  left: 0,
                  width: targetRect.left,
                  height: targetRect.height,
                }}
              />

              {/* Right cutout */}
              <div
                className="absolute"
                style={{
                  top: targetRect.top,
                  right: 0,
                  width: window.innerWidth - targetRect.left - targetRect.width,
                  height: targetRect.height,
                }}
              />

              {/* Bottom cutout */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: targetRect.top + targetRect.height,
                  bottom: 0,
                }}
              />

              {/* Highlighted element border with pulse */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  top: targetRect.top - 4,
                  left: targetRect.left - 4,
                  width: targetRect.width + 8,
                  height: targetRect.height + 8,
                  borderRadius: 12,
                  border: '2px solid #FFC72C',
                  boxShadow: '0 0 20px rgba(255, 199, 44, 0.5), inset 0 0 20px rgba(255, 199, 44, 0.2)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255, 199, 44, 0.5), inset 0 0 20px rgba(255, 199, 44, 0.2)',
                    '0 0 30px rgba(255, 199, 44, 0.7), inset 0 0 30px rgba(255, 199, 44, 0.3)',
                    '0 0 20px rgba(255, 199, 44, 0.5), inset 0 0 20px rgba(255, 199, 44, 0.2)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />

              {/* Clickable area for the target */}
              <div
                className="absolute cursor-pointer"
                style={{
                  top: targetRect.top,
                  left: targetRect.left,
                  width: targetRect.width,
                  height: targetRect.height,
                }}
                onClick={() => {
                  // Allow click through to the actual element
                  const target = document.querySelector(targetSelector) as HTMLElement;
                  if (target) {
                    target.click();
                  }
                }}
              />
            </>
          )}

          {/* Content overlay */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
