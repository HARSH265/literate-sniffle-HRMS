import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  description: string;
  category: 'it' | 'hr' | 'facilities' | 'payroll' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  requestedBy: { _id: string; name: string; email: string };
  assignedTo?: { _id: string; name: string; email: string };
  comments: {
    _id: string;
    user: { _id: string; name: string; email: string };
    message: string;
    attachments?: { url: string; name: string; size: number }[];
    createdAt: string;
  }[];
  attachments?: { url: string; name: string; size: number }[];
  resolvedAt?: string;
  closedAt?: string;
  slaDeadline?: string;
  slaBreached?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sort?: string;
  userId?: string;
  assignedTo?: string;
}

export const helpdeskService = {
  async list(params?: ListParams): Promise<{ success: boolean; data: Ticket[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.helpdesk.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Ticket }> {
    const { data } = await apiClient.get(API_ENDPOINTS.helpdesk.get(id));
    return data;
  },

  async create(payload: { subject: string; description: string; category?: string; priority?: string; attachments?: { url: string; name: string; size: number }[] }): Promise<{ success: boolean; data: Ticket; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.helpdesk.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<{ subject: string; description: string; category: string; priority: string; status: string; assignedTo: string; attachments: { url: string; name: string; size: number }[] }>): Promise<{ success: boolean; data: Ticket; message: string }> {
    const { data } = await apiClient.put(API_ENDPOINTS.helpdesk.update(id), payload);
    return data;
  },

  async addComment(id: string, payload: { message: string; attachments?: { url: string; name: string; size: number }[] }): Promise<{ success: boolean; data: Ticket; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.helpdesk.addComment(id), payload);
    return data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete(API_ENDPOINTS.helpdesk.delete(id));
    return data;
  },
};
