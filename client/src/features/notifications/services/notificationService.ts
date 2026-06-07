import apiClient from '../../../core/api/apiClient';

export interface Notification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  recipient: string;
  isRead: boolean;
  module: string;
  link?: string;
  createdAt: string;
}

export const notificationService = {
  async list(params?: Record<string, unknown>): Promise<{ data: { notifications: Notification[]; pagination: { page: number; limit: number; total: number; pages: number } } }> {
    const { data } = await apiClient.get('/notifications', { params });
    return data;
  },

  async getUnreadCount(): Promise<{ data: { count: number } }> {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/mark-all-read');
  },
};