import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

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
    const { data } = await apiClient.get(API_ENDPOINTS.notifications.list, { params });
    return data;
  },

  async getUnreadCount(): Promise<{ data: { count: number } }> {
    const { data } = await apiClient.get(API_ENDPOINTS.notifications.unreadCount);
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.notifications.markRead(id));
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.notifications.markAllRead);
  },
};