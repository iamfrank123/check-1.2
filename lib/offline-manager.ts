'use client';

import React from 'react';

/**
 * Offline Handler
 * 
 * Utilities per gestire lo stato offline dell'app
 */

export interface OfflineState {
  isOnline: boolean;
  lastChecked: number;
}

class OfflineManager {
  private listeners: Set<(state: OfflineState) => void> = new Set();
  private state: OfflineState = {
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    lastChecked: Date.now(),
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  private handleOnline() {
    this.setState({ isOnline: true });
    console.log('[Offline] Back online');
    this.notifyListeners();
  }

  private handleOffline() {
    this.setState({ isOnline: false });
    console.log('[Offline] Went offline');
    this.notifyListeners();
  }

  private setState(newState: Partial<OfflineState>) {
    this.state = {
      ...this.state,
      ...newState,
      lastChecked: Date.now(),
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  getState(): OfflineState {
    return { ...this.state };
  }

  isOnline(): boolean {
    return this.state.isOnline;
  }

  subscribe(listener: (state: OfflineState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const offlineManager = new OfflineManager();

/**
 * useOfflineStatus Hook
 * 
 * Hook per tracciare lo stato online/offline
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsOnline(navigator.onLine);

    const unsubscribe = offlineManager.subscribe((state) => {
      setIsOnline(state.isOnline);
    });

    return () => { unsubscribe(); };
  }, []);

  return isOnline;
}

/**
 * Syncing utilities per dati offline
 */
export class OfflineSync {
  private static readonly STORAGE_KEY = 'pwa-offline-sync-queue';

  static queueAction(action: {
    type: string;
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE';
    payload: Record<string, any>;
  }) {
    const queue = this.getQueue();
    queue.push({
      ...action,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random()}`,
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    console.log('[OfflineSync] Action queued:', action.type);
  }

  static getQueue() {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async syncQueue() {
    if (!navigator.onLine) {
      console.log('[OfflineSync] Still offline, skipping sync');
      return;
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return;
    }

    console.log('[OfflineSync] Syncing', queue.length, 'actions');

    for (const action of queue) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Rimuovi l'azione completata
        this.removeAction(action.id);
        console.log('[OfflineSync] Action synced:', action.type);
      } catch (error) {
        console.error('[OfflineSync] Error syncing action:', action.type, error);
        // Continua con le prossime azioni, proverà di nuovo più tardi
      }
    }
  }

  private static removeAction(id: string) {
    const queue = this.getQueue();
    const filtered = queue.filter((action: any) => action.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  static clearQueue() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Setup auto-sync quando torna online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    OfflineSync.syncQueue();
  });
}

export default offlineManager;
