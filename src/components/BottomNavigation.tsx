/**
 * BottomNavigation - Modern bottom navigation bar for Telegram Mini App
 * 
 * 5 main tabs: Game, Artifacts, Expedition, Profile, Settings
 * Fixed at bottom, safe-area aware
 */

import { memo, useCallback } from 'react';
import { Gamepad2, Gem, Sword, User, Settings } from 'lucide-react';
import { useTranslation } from '../i18n';

export type NavigationTab = 'game' | 'artifacts' | 'expedition' | 'profile' | 'settings';

interface NavButtonProps {
  tab: NavigationTab;
  active: boolean;
  onClick: () => void;
  badge?: number;
  locked?: boolean;
}

const NavButton = memo(function NavButton({
  tab,
  active,
  onClick,
  badge,
  locked = false,
}: NavButtonProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (tab) {
      case 'game':
        return <Gamepad2 size={20} />;
      case 'artifacts':
        return <Gem size={20} />;
      case 'expedition':
        return <Sword size={20} />;
      case 'profile':
        return <User size={20} />;
      case 'settings':
        return <Settings size={20} />;
    }
  };

  const getLabel = () => {
    switch (tab) {
      case 'game':
        return t('nav.game', 'Гра');
      case 'artifacts':
        return t('nav.artifacts', 'Артефакти');
      case 'expedition':
        return t('nav.expedition', 'Експедиції');
      case 'profile':
        return t('nav.profile', 'Профіль');
      case 'settings':
        return '';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`
        flex flex-col items-center justify-center gap-0.5 px-3 py-1
        transition-all duration-200 relative
        ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${active 
          ? 'text-yellow-400' 
          : 'text-gray-400 hover:text-gray-200'
        }
      `}
    >
      {/* Icon */}
      <div className="relative">
        {getIcon()}
        
        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className={`
            absolute -top-1 -right-1 min-w-[16px] h-4 px-1
            flex items-center justify-center
            text-[10px] font-bold rounded-full
            ${active ? 'bg-yellow-400 text-gray-900' : 'bg-red-500 text-white'}
          `}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {/* Lock indicator */}
        {locked && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-[6px]">🔒</span>
          </span>
        )}
      </div>

      {/* Label */}
      {getLabel() && (
        <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
          {getLabel()}
        </span>
      )}

      {/* Active indicator */}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-yellow-400 rounded-full" />
      )}
    </button>
  );
});

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  badges?: {
    artifacts?: number;
    expedition?: number;
    profile?: number;
  };
  lockedTabs?: NavigationTab[];
  expeditionUnlocked?: boolean;
  prestigeLevel?: number;
}

export const BottomNavigation = memo(function BottomNavigation({
  activeTab,
  onTabChange,
  badges = {},
  lockedTabs = [],
  expeditionUnlocked = false,
  prestigeLevel = 0,
}: BottomNavigationProps) {
  const tabs: NavigationTab[] = ['game', 'artifacts', 'expedition', 'profile', 'settings'];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 safe-area-bottom">
      <div className="flex items-stretch justify-around py-1">
        {tabs.map((tab) => {
          // Expedition is locked for prestige < 2
          const isExpeditionLocked = tab === 'expedition' && !expeditionUnlocked;
          
          return (
            <NavButton
              key={tab}
              tab={tab}
              active={activeTab === tab}
              onClick={() => !isExpeditionLocked && onTabChange(tab)}
              badge={badges[tab === 'artifacts' ? 'artifacts' : tab === 'expedition' ? 'expedition' : tab === 'profile' ? 'profile' : undefined]}
              locked={isExpeditionLocked}
            />
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNavigation;
