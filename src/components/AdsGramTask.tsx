/**
 * AdsGram Task Component
 * 
 * New task-based ad integration using <adsgram-task> web component.
 * This provides a reward for completing an ad task at the start of the game.
 * 
 * Task ID: task-35858
 */

import { useEffect, useRef, useState } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { hapticNotification } from '../lib/telegram';
import { useTranslation } from '../i18n';

// Task configuration
const TASK_BLOCK_ID = 'task-35858';

interface AdsGramTaskProps {
  onRewardClaimed?: () => void;
}

export function AdsGramTask({ onRewardClaimed }: AdsGramTaskProps) {
  const { t } = useTranslation();
  const taskRef = useRef<HTMLElement | null>(null);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [showTask, setShowTask] = useState(false);

  // Check if task was already completed this session
  useEffect(() => {
    const taskSeen = localStorage.getItem('adsgram_task_seen');
    const taskCompleted_ = localStorage.getItem('adsgram_task_completed');
    
    if (taskSeen && taskCompleted_) {
      setTaskCompleted(true);
      setRewardClaimed(true);
      setShowTask(false);
    } else {
      setShowTask(true);
    }
  }, []);

  // Initialize the adsgram-task web component
  useEffect(() => {
    if (!showTask) return;

    // Wait for custom element to be defined
    const initTask = async () => {
      // Check if custom element is already defined
      if (customElements.get('adsgram-task')) {
        setTaskLoading(false);
        return;
      }

      // Wait for custom element to be defined (loaded via sad.min.js)
      let attempts = 0;
      const maxAttempts = 50;
      
      const waitForElement = () => {
        return new Promise<void>((resolve) => {
          const check = () => {
            attempts++;
            if (customElements.get('adsgram-task')) {
              setTaskLoading(false);
              resolve();
              return;
            }
            if (attempts >= maxAttempts) {
              setTaskLoading(false);
              setTaskError('Рекламний сервіс недоступний');
              resolve();
              return;
            }
            setTimeout(check, 100);
          };
          check();
        });
      };

      await waitForElement();
    };

    initTask();
  }, [showTask]);

  // Set up event listeners on the task element
  useEffect(() => {
    if (!taskRef.current || taskLoading) return;

    const taskElement = taskRef.current;

    const handleReward = async () => {
      console.log('[AdsGramTask] Task completed - reward earned!');
      setTaskCompleted(true);
      
      // Claim reward via server
      try {
        const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (telegramId) {
          const response = await fetch(
            `https://iyxhzisfwcdfhuxuqxso.supabase.co/functions/v1/adsgram-reward?userid=${telegramId}&secret=e73dc047768d42dba4d64432274c05c1`
          );
          const data = await response.json();
          console.log('[AdsGramTask] Reward claim response:', data);
          
          if (data.success || data.already_claimed) {
            setRewardClaimed(true);
            localStorage.setItem('adsgram_task_completed', 'true');
            hapticNotification('success');
            onRewardClaimed?.();
          } else {
            hapticNotification('warning');
          }
        }
      } catch (err) {
        console.error('[AdsGramTask] Failed to claim reward:', err);
        hapticNotification('warning');
      }
    };

    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      console.error('[AdsGramTask] Task error:', customEvent.detail);
      setTaskError(customEvent.detail?.message || 'Помилка завантаження реклами');
    };

    const handleBannerNotFound = () => {
      console.log('[AdsGramTask] No task available');
      setShowTask(false);
    };

    const handleTooLongSession = () => {
      console.log('[AdsGramTask] Session too long');
      setTaskError('Сесія занадто довга. Перезапустіть додаток.');
    };

    // Add event listeners
    taskElement.addEventListener('reward', handleReward);
    taskElement.addEventListener('onError', handleError);
    taskElement.addEventListener('onBannerNotFound', handleBannerNotFound);
    taskElement.addEventListener('onTooLongSession', handleTooLongSession);

    return () => {
      taskElement.removeEventListener('reward', handleReward);
      taskElement.removeEventListener('onError', handleError);
      taskElement.removeEventListener('onBannerNotFound', handleBannerNotFound);
      taskElement.removeEventListener('onTooLongSession', handleTooLongSession);
    };
  }, [taskLoading, onRewardClaimed]);

  // Don't render if task was already completed
  if (!showTask) {
    return null;
  }

  // Show loading state
  if (taskLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-4 border border-purple-500/30 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Gift className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{t('task.reward_task', 'Нагорода за завдання')}</h3>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Завантаження...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (taskError) {
    return (
      <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700/50 rounded-xl">
            <Gift className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{t('task.reward_task', 'Нагорода за завдання')}</h3>
            <p className="text-gray-400 text-sm">{taskError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show completed state
  if (taskCompleted || rewardClaimed) {
    return (
      <div className="bg-green-900/20 rounded-2xl p-4 border border-green-500/30 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-xl">
            <Gift className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{t('task.reward_task', 'Нагорода за завдання')}</h3>
            <p className="text-green-400 text-sm">✓ {t('task.completed', 'Нагорода отримана!')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render the adsgram-task web component
  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-4 border border-purple-500/30 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-purple-500/20 rounded-xl">
          <Gift className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold">{t('task.reward_task', 'Нагорода за завдання')}</h3>
          <p className="text-purple-300 text-sm">{t('task.watch_ad', 'Подивіться рекламу та отримайте нагороду')}</p>
        </div>
      </div>
      
      {/* AdsGram Task Web Component */}
      <adsgram-task
        ref={taskRef as React.RefObject<HTMLElement>}
        data-block-id={TASK_BLOCK_ID}
        data-debug="false"
        data-debug-console="false"
        style={{
          display: 'block',
          '--adsgram-task-font-size': '14px',
          '--adsgram-task-icon-size': '32px',
          '--adsgram-task-icon-title-gap': '8px',
          '--adsgram-task-icon-border-radius': '8px',
          '--adsgram-task-button-width': '100%',
        } as React.CSSProperties}
      />
    </div>
  );
}
