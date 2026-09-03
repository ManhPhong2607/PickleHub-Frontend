import { apiClient, fetchWithFallback } from './client';
import { WebNotificationDto } from '@/types';

export const notificationApi = {
  async getMyNotifications(page = 1, pageSize = 20): Promise<{ items: WebNotificationDto[]; unreadCount: number }> {
    return fetchWithFallback(async () => {
      const res = await apiClient.get('/notifications/me', {
        params: { page, pageSize }
      });
      const items = res.data?.items || res.data || [];
      const unreadCount = res.data?.unreadCount ?? items.filter((i: any) => !i.isRead).length;
      return { items, unreadCount };
    }, { items: [], unreadCount: 0 });
  },

  async markAsRead(notificationId: string): Promise<void> {
    await fetchWithFallback(async () => {
      await apiClient.put(`/notifications/${notificationId}/read`);
    }, undefined);
  },

  async markAllRead(): Promise<void> {
    await fetchWithFallback(async () => {
      await apiClient.put('/notifications/read-all');
    }, undefined);
  },
};
