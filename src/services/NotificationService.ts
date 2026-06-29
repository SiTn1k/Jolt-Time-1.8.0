/**
 * NotificationService - Handles push notifications for the game
 * 
 * Supports:
 * - Browser Notifications API (default)
 * - OneSignal (optional, requires setup)
 * - Firebase Cloud Messaging (optional, requires setup)
 * 
 * NOTE: Academy notifications removed - Academy system disabled
 */

import { supabase } from '../lib/supabase';

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  tag?: string;
}

export interface NotificationPayload {
  type: 'expedition_complete' | 'restoration_ready' | 'quest_available' | 'reward_claimed' | 'daily_reminder' | 'artifact_found';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private permissionGranted = false;
  private oneSignalAppId: string | null = null;
  private fcmToken: string | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Check browser support
    if (!('Notification' in window)) {
      return;
    }

    // Check if permission already granted
    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (this.permissionGranted) {
        // Subscribe to OneSignal if configured
        await this.subscribeToOneSignal();
      }
      
      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.permissionGranted;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Send a local notification (browser native)
   */
  async sendLocalNotification(notification: PushNotification): Promise<void> {
    if (!this.permissionGranted) {
      return;
    }

    try {
      const options: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        badge: notification.badge || '/badge-72.png',
        tag: notification.tag || 'default',
        data: notification.data,
        requireInteraction: false,
        silent: false,
      };

      new Notification(notification.title, options);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send notification via server (for cross-device sync)
   */
  async sendServerNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data,
        },
      });

      if (error) {
        console.error('Error sending server notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending server notification:', error);
      return false;
    }
  }

  /**
   * Notify when expedition is complete
   */
  async notifyExpeditionComplete(regionName: string, artifactName: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Експедиція завершена! 🏛️',
      body: `Ви дослідили ${regionName} та знайшли ${artifactName}!`,
      tag: 'expedition-complete',
      data: { type: 'expedition_complete', region: regionName, artifact: artifactName },
    });
  }

  /**
   * Notify when artifact restoration is ready
   */
  async notifyRestorationReady(artifactName: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Реставрація завершена! ✨',
      body: `Артефакт "${artifactName}" готовий до музею!`,
      tag: 'restoration-ready',
      data: { type: 'restoration_ready', artifact: artifactName },
    });
  }

  /**
   * Notify when new quest is available
   */
  async notifyQuestAvailable(questTitle: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Новий квест! 📜',
      body: `"${questTitle}" - нове завдання доступне`,
      tag: 'quest-available',
      data: { type: 'quest_available', quest: questTitle },
    });
  }

  /**
   * Notify when reward is claimed
   */
  async notifyRewardClaimed(rewardType: string, amount: number): Promise<void> {
    await this.sendLocalNotification({
      title: 'Нагорода отримана! 🎁',
      body: `+${amount} ${rewardType}`,
      tag: 'reward-claimed',
      data: { type: 'reward_claimed', rewardType, amount },
    });
  }

  /**
   * Daily reminder notification
   */
  async sendDailyReminder(): Promise<void> {
    await this.sendLocalNotification({
      title: 'Повертайся до гри! 🎮',
      body: 'Твій музей чекає на тебе. Не забудь про щоденні нагороди!',
      tag: 'daily-reminder',
      data: { type: 'daily_reminder' },
    });
  }

  /**
   * Schedule a notification for later
   */
  scheduleNotification(notification: PushNotification, delayMs: number): number {
    return window.setTimeout(() => {
      this.sendLocalNotification(notification);
    }, delayMs);
  }

  /**
   * Cancel a scheduled notification
   */
  cancelScheduledNotification(timerId: number): void {
    window.clearTimeout(timerId);
  }

  /**
   * Setup OneSignal integration (requires OneSignal App ID)
   */
  async setupOneSignal(appId: string): Promise<void> {
    this.oneSignalAppId = appId;
    
    // OneSignal SDK would be loaded dynamically here
    // For now, we'll use the browser notifications API
    // To enable OneSignal:
    // 1. Add OneSignal SDK script to index.html
    // 2. Initialize: OneSignal.init({ appId })
    // 3. Request permission: await OneSignal.requestPermission()
    
  }

  /**
   * Subscribe to OneSignal push notifications
   */
  private async subscribeToOneSignal(): Promise<void> {
    // This would be implemented with full OneSignal SDK
    // For now, this is a placeholder
  }

  /**
   * Setup Firebase Cloud Messaging (requires configuration)
   */
  async setupFirebase(config: {
    apiKey: string;
    projectId: string;
    messagingSenderId: string;
  }): Promise<void> {
    void config;
    // TODO: Initialize Firebase SDK with config
  }

  /**
   * Log notification event for analytics
   */
  private async logNotificationEvent(event: string, data: Record<string, unknown>): Promise<void> {
    if (!supabase) return;

    try {
      await supabase.from('notification_events').insert({
        event,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for testing or custom instances
export { NotificationService };
