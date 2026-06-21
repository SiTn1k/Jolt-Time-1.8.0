// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION CENTER COMPONENT
// Shows notification history and current alerts
// ═══════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Bell, CheckCheck, Trash2, Filter } from 'lucide-react';
import { Badge } from '../ui';
import { 
  type NotificationHistory,
  type NotificationFlag,
  NOTIFICATION_CONFIGS,
  MAX_NOTIFICATION_HISTORY,
} from '../playerGuidanceData';

interface NotificationCenterProps {
  notifications: NotificationHistory[];
  onDismiss?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClear?: () => void;
  onNotificationClick?: (notification: NotificationHistory) => void;
}

function NotificationItem({
  notification,
  onDismiss,
  onClick,
}: {
  notification: NotificationHistory;
  onDismiss?: () => void;
  onClick?: () => void;
}) {
  const config = NOTIFICATION_CONFIGS[notification.flag];
  const timeAgo = getTimeAgo(notification.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
        notification.read ? 'bg-[#161B22]/50' : 'bg-[#161B22]'
      } ${!notification.read ? 'border-l-2 border-[#FFD700]' : 'border-l-2 border-transparent'}`}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 shrink-0">
        <span className="text-xl">{config?.icon || '📢'}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`text-sm font-medium ${
            notification.read ? 'text-[#8B949E]' : 'text-[#E6EDF3]'
          }`}>
            {notification.titleKey.replace('notification.', '').replace(/_/g, ' ')}
          </h4>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
          )}
        </div>
        {notification.messageKey && (
          <p className="text-xs text-[#8B949E] line-clamp-2">
            {notification.messageKey.replace('notification.', '')}
          </p>
        )}
        <p className="text-[10px] text-[#6E7681] mt-1">
          {timeAgo}
        </p>
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4 text-[#8B949E]" />
        </button>
      )}
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Щойно';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} хв тому`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} год тому`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} днів тому`;
  return new Date(timestamp).toLocaleDateString('uk-UA');
}

export function NotificationCenter({
  notifications,
  onDismiss,
  onMarkAllRead,
  onClear,
  onNotificationClick,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<NotificationFlag | 'all' | 'unread'>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.flag === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-[#E6EDF3]" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B6B] flex items-center justify-center"
          >
            <span className="text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md max-h-[80vh] bg-[#161B22] rounded-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#FFD700]" />
                  <h2 className="text-lg font-bold text-[#E6EDF3]">
                    Сповіщення
                  </h2>
                  {unreadCount > 0 && (
                    <Badge className="bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
                      {unreadCount} нових
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B949E]" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-3 border-b border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filter === 'unread' 
                        ? 'bg-[#FFD700]/20 text-[#FFD700]' 
                        : 'bg-white/5 text-[#8B949E]'
                    }`}
                  >
                    <Filter className="w-3 h-3 inline mr-1" />
                    Непрочитані
                  </button>
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-[#FFD700]/20 text-[#FFD700]' 
                        : 'bg-white/5 text-[#8B949E]'
                    }`}
                  >
                    Всі
                  </button>
                </div>
                <div className="flex gap-1">
                  {onMarkAllRead && (
                    <button
                      onClick={onMarkAllRead}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Позначити всі прочитаними"
                    >
                      <CheckCheck className="w-4 h-4 text-[#10B981]" />
                    </button>
                  )}
                  {onClear && (
                    <button
                      onClick={onClear}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Очистити"
                    >
                      <Trash2 className="w-4 h-4 text-[#FF6B6B]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDismiss={() => onDismiss?.(notification.id)}
                      onClick={() => onNotificationClick?.(notification)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 mx-auto text-[#8B949E] mb-3 opacity-50" />
                    <p className="text-[#8B949E]">
                      {filter === 'unread' 
                        ? 'Немає непрочитаних сповіщень' 
                        : 'Сповіщень поки що немає'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/5 text-center">
                <p className="text-[10px] text-[#6E7681]">
                  Зберігається до {MAX_NOTIFICATION_HISTORY} останніх сповіщень
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
