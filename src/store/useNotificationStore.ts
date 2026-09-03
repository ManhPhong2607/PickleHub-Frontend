import { create } from 'zustand';
import { notificationApi } from '@/lib/api/notificationApi';
import { useAuthStore } from '@/store/useAuthStore';

export interface WebNotificationItem {
  id: string;
  title: string;
  content: string;
  action?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: WebNotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  setNotifications: (items: WebNotificationItem[], unreadCount?: number) => void;
  addNotification: (title: string, content: string, action?: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('picklehub_token') || useAuthStore.getState().token) : null;
    if (!token) return;
    
    set({ loading: true });
    try {
      const res = await notificationApi.getMyNotifications(1, 20);
      set({
        notifications: res.items || [],
        unreadCount: res.unreadCount ?? (res.items || []).filter((n) => !n.isRead).length,
      });
    } catch (err) {
      console.warn('[NotificationStore] Fetch notifications error:', err);
    } finally {
      set({ loading: false });
    }
  },

  setNotifications: (items, unreadCount) =>
    set({
      notifications: items,
      unreadCount: unreadCount ?? items.filter((n) => !n.isRead).length,
    }),

  addNotification: (title, content, action) => {
    const newItem: WebNotificationItem = {
      id: `noti-${Date.now()}`,
      title,
      content,
      action,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...get().notifications];
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });
  },

  markAsRead: async (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    set({
      notifications: updated,
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
    try {
      await notificationApi.markAsRead(id);
    } catch (err) {
      console.warn('[NotificationStore] Mark read error:', err);
    }
  },

  markAllRead: async () => {
    const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });
    try {
      await notificationApi.markAllRead();
    } catch (err) {
      console.warn('[NotificationStore] Mark all read error:', err);
    }
  },
}));
