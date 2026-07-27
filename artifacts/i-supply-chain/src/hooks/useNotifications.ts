import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/lib/apiBase';

export interface AppNotification {
  id:        number;
  title:     string;
  body:      string;
  read:      boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount:   number;
  loading:       boolean;
}

interface UseNotificationsReturn extends NotificationsState {
  refresh:     () => Promise<void>;
  markOneRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(enabled: boolean): UseNotificationsReturn {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount:   0,
    loading:       false,
  });

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setState(s => ({ ...s, loading: true }));
    try {
      const res  = await fetch(`${API_BASE}/notifications`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        ok: boolean;
        notifications: AppNotification[];
        unreadCount:   number;
      };
      if (data.ok) {
        setState({ notifications: data.notifications, unreadCount: data.unreadCount, loading: false });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [enabled]);

  // Poll every 60 s while the hook is active.
  useEffect(() => {
    if (!enabled) return;
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [enabled, refresh]);

  const markOneRead = useCallback(async (id: number) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount:   Math.max(0, s.unreadCount - (s.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
    }));
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch {
      // optimistic update already applied; silent failure is acceptable
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    }));
    try {
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch {
      // optimistic update already applied; silent failure is acceptable
    }
  }, []);

  return { ...state, refresh, markOneRead, markAllRead };
}
