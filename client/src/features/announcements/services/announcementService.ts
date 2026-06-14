import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'department' | 'designation' | 'specificEmployees';
  targetIds?: string[];
  attachments?: { url: string; name: string; size: number }[];
  scheduledAt?: string;
  expiresAt?: string;
  createdBy: { _id: string; name: string; email: string };
  readBy: { user: { _id: string; name: string; email: string }; readAt: string }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  priority?: string;
  status?: string;
  search?: string;
  sort?: string;
}

export const announcementService = {
  async list(params?: ListParams): Promise<{ success: boolean; data: Announcement[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.announcements.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Announcement }> {
    const { data } = await apiClient.get(API_ENDPOINTS.announcements.get(id));
    return data;
  },

  async create(payload: {
    title: string;
    content: string;
    priority?: string;
    targetAudience?: string;
    targetIds?: string[];
    attachments?: { url: string; name: string; size: number }[];
    scheduledAt?: string;
    expiresAt?: string;
  }): Promise<{ success: boolean; data: Announcement; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.announcements.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<{
    title: string;
    content: string;
    priority: string;
    targetAudience: string;
    targetIds: string[];
    attachments: { url: string; name: string; size: number }[];
    scheduledAt: string;
    expiresAt: string;
    isActive: boolean;
  }>): Promise<{ success: boolean; data: Announcement; message: string }> {
    const { data } = await apiClient.put(API_ENDPOINTS.announcements.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete(API_ENDPOINTS.announcements.delete(id));
    return data;
  },

  async markAsRead(id: string): Promise<{ success: boolean; data: Announcement; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.announcements.markRead(id));
    return data;
  },

  async getUnreadCount(): Promise<{ success: boolean; data: { count: number } }> {
    const { data } = await apiClient.get(API_ENDPOINTS.announcements.unreadCount);
    return data;
  },
};
