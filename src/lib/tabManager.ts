/**
 * Tab Manager - Multi-Tab Protection System
 * 
 * Prevents reward duplication and data corruption from multiple tabs.
 * Uses BroadcastChannel API with fallback to localStorage.
 */

import { getTelegramUserId } from './telegram';

const TAB_CHANNEL = 'ukraine_tap_tab_channel';
const TAB_KEY = 'ukraine_tap_active_tab';
const HEARTBEAT_INTERVAL = 1000; // 1 second
const TAB_TIMEOUT = 3000; // 3 seconds - if no heartbeat, tab is dead

interface TabMessage {
  type: 'heartbeat' | 'lock' | 'unlock' | 'state_request' | 'state_response';
  tabId: string;
  timestamp: number;
  telegramId?: number;
  state?: Record<string, unknown>;
}

interface TabInfo {
  tabId: string;
  telegramId: number | null;
  lastHeartbeat: number;
  isActive: boolean;
}

class TabManagerClass {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private telegramId: number | null = null;
  private isLeader: boolean = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private activeTabInfo: TabInfo | null = null;
  private onDuplicateDetected: (() => void) | null = null;
  private onLeaderChanged: ((isLeader: boolean) => void) | null = null;
  private pendingStateRequests: Map<string, (state: Record<string, unknown> | null) => void> = new Map();

  constructor() {
    this.tabId = this.generateTabId();
    this.telegramId = getTelegramUserId();
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Initialize the tab manager
   */
  init(options?: {
    onDuplicateDetected?: () => void;
    onLeaderChanged?: (isLeader: boolean) => void;
  }): void {
    if (options?.onDuplicateDetected) {
      this.onDuplicateDetected = options.onDuplicateDetected;
    }
    if (options?.onLeaderChanged) {
      this.onLeaderChanged = options.onLeaderChanged;
    }

    // Try BroadcastChannel first (modern browsers)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(TAB_CHANNEL);
        this.setupChannelListeners();
        this.becomeLeader();
        this.startHeartbeat();
        return;
      } catch {
        console.warn('BroadcastChannel not supported, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    this.setupLocalStorageListeners();
    this.becomeLeader();
    this.startHeartbeat();
  }

  /**
   * Cleanup when component unmounts
   */
  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Release leadership
    this.sendMessage({ type: 'unlock', tabId: this.tabId, timestamp: Date.now() });

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    // Clear localStorage
    localStorage.removeItem(TAB_KEY);
  }

  /**
   * Check if this tab is the leader (active tab)
   */
  isActive(): boolean {
    return this.isLeader;
  }

  /**
   * Get the current tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Request state from the leader tab
   */
  async requestState(): Promise<Record<string, unknown> | null> {
    return new Promise((resolve) => {
      this.sendMessage({
        type: 'state_request',
        tabId: this.tabId,
        timestamp: Date.now(),
      });

      // Timeout after 2 seconds
      this.pendingStateRequests.set(this.tabId, resolve);
      setTimeout(() => {
        if (this.pendingStateRequests.has(this.tabId)) {
          this.pendingStateRequests.delete(this.tabId);
          resolve(null);
        }
      }, 2000);
    });
  }

  /**
   * Notify other tabs about state changes (leader only)
   */
  notifyStateChange(state: Record<string, unknown>): void {
    if (!this.isLeader) return;
    this.sendMessage({
      type: 'state_response',
      tabId: this.tabId,
      timestamp: Date.now(),
      state,
    });
  }

  private setupChannelListeners(): void {
    if (!this.channel) return;

    this.channel.onmessage = (event: MessageEvent<TabMessage>) => {
      this.handleMessage(event.data);
    };
  }

  private setupLocalStorageListeners(): void {
    window.addEventListener('storage', (event) => {
      if (event.key !== TAB_KEY) return;

      const data = event.newValue;
      if (!data) return;

      try {
        const message: TabMessage = JSON.parse(data);
        this.handleMessage(message);
      } catch (e) {
        console.error('Failed to parse tab message:', e);
      }
    });
  }

  private handleMessage(message: TabMessage): void {
    // Ignore own messages
    if (message.tabId === this.tabId) return;

    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      case 'lock':
        this.handleLock(message);
        break;
      case 'unlock':
        this.handleUnlock();
        break;
      case 'state_request':
        this.handleStateRequest();
        break;
      case 'state_response':
        this.handleStateResponse(message);
        break;
    }
  }

  private handleHeartbeat(message: TabMessage): void {
    // If we receive a heartbeat and we think we're leader, check if we should yield
    if (this.isLeader && message.timestamp < Date.now() - 1000) {
      // Another tab has a newer heartbeat, yield leadership
      this.yieldLeadership();
    }
  }

  private handleLock(message: TabMessage): void {
    // Another tab took leadership
    if (!this.isLeader) return;

    if (message.timestamp > (this.activeTabInfo?.lastHeartbeat || 0)) {
      this.yieldLeadership();
    }
  }

  private handleUnlock(): void {
    // Another tab released leadership - we can try to take it
    if (!this.isLeader) {
      this.tryBecomeLeader();
    }
  }

  private handleStateRequest(): void {
    if (!this.isLeader) return;

    // Send current state back to requester
    this.sendMessage({
      type: 'state_response',
      tabId: this.tabId,
      timestamp: Date.now(),
      state: this.getCurrentState(),
    });
  }

  private handleStateResponse(message: TabMessage): void {
    const resolver = this.pendingStateRequests.get(message.tabId);
    if (resolver) {
      this.pendingStateRequests.delete(message.tabId);
      resolver(message.state || null);
    }
  }

  private becomeLeader(): void {
    this.isLeader = true;
    this.activeTabInfo = {
      tabId: this.tabId,
      telegramId: this.telegramId,
      lastHeartbeat: Date.now(),
      isActive: true,
    };

    this.saveTabInfo();
    this.onLeaderChanged?.(true);
  }

  private yieldLeadership(): void {
    this.isLeader = false;
    this.activeTabInfo = null;
    this.onLeaderChanged?.(false);
  }

  private tryBecomeLeader(): void {
    const existing = this.getStoredTabInfo();
    
    if (existing && Date.now() - existing.lastHeartbeat < TAB_TIMEOUT) {
      // Another tab is still alive
      return;
    }

    // Take leadership
    this.becomeLeader();
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
      this.checkForDuplicates();
    }, HEARTBEAT_INTERVAL);
  }

  private sendHeartbeat(): void {
    if (this.isLeader && this.activeTabInfo) {
      this.activeTabInfo.lastHeartbeat = Date.now();
      this.saveTabInfo();
    }

    this.sendMessage({
      type: 'heartbeat',
      tabId: this.tabId,
      timestamp: Date.now(),
      telegramId: this.telegramId || undefined,
    });
  }

  private checkForDuplicates(): void {
    // Check if we should be leader
    const stored = this.getStoredTabInfo();
    
    if (!stored) {
      this.tryBecomeLeader();
      return;
    }

    if (stored.tabId === this.tabId) {
      // We're the stored tab, we're leader
      if (!this.isLeader) {
        this.becomeLeader();
      }
      return;
    }

    // Another tab is stored
    if (Date.now() - stored.lastHeartbeat < TAB_TIMEOUT) {
      // Another tab is alive
      if (this.isLeader) {
        this.yieldLeadership();
      }

      // Check if it's the same user (telegramId)
      if (stored.telegramId === this.telegramId) {
        // Same user, multiple tabs - trigger duplicate detection
        this.onDuplicateDetected?.();
      }
    } else {
      // Stored tab is dead, we can take over
      if (!this.isLeader) {
        this.becomeLeader();
      }
    }
  }

  private sendMessage(message: TabMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    } else {
      // LocalStorage fallback
      localStorage.setItem(TAB_KEY, JSON.stringify({
        ...message,
        _sender: this.tabId,
      }));
    }
  }

  private getStoredTabInfo(): TabInfo | null {
    const stored = localStorage.getItem(TAB_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      if (parsed._sender) {
        return {
          tabId: parsed.tabId || parsed._sender,
          telegramId: parsed.telegramId || null,
          lastHeartbeat: parsed.timestamp || parsed.lastHeartbeat || 0,
          isActive: true,
        };
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private saveTabInfo(): void {
    if (!this.activeTabInfo) return;

    localStorage.setItem(TAB_KEY, JSON.stringify({
      ...this.activeTabInfo,
      _sender: this.tabId,
    }));
  }

  private getCurrentState(): Record<string, unknown> {
    // Return current game state for syncing
    const state = localStorage.getItem('ukraine_tap_game_state');
    if (state) {
      try {
        return JSON.parse(state);
      } catch {
        return {};
      }
    }
    return {};
  }
}

// Singleton instance
export const TabManager = new TabManagerClass();

// React hook for tab state
import { useState, useEffect } from 'react';

export function useTabManager(options?: {
  onDuplicateDetected?: () => void;
  onLeaderChanged?: (isLeader: boolean) => void;
}) {
  const [isActive, setIsActive] = useState(true);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    TabManager.init({
      onLeaderChanged: (isLeader) => {
        setIsActive(isLeader);
        options?.onLeaderChanged?.(isLeader);
      },
      onDuplicateDetected: () => {
        setShowDuplicateWarning(true);
        options?.onDuplicateDetected?.();
      },
    });

    return () => {
      TabManager.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissDuplicateWarning = () => {
    setShowDuplicateWarning(false);
  };

  return {
    isActive,
    showDuplicateWarning,
    dismissDuplicateWarning,
    tabId: TabManager.getTabId(),
  };
}
