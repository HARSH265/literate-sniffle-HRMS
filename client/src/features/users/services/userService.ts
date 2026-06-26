import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'hr-admin' | 'hr-staff' | 'accounts' | 'manager' | 'worker';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  employeeId?: string;
  mustChangePassword?: boolean;
}

export interface CreateUser {
  name: string;
  email: string;
  password?: string;
  role: 'super-admin' | 'hr-admin' | 'hr-staff' | 'accounts' | 'manager' | 'worker';
  employeeId?: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: User & {
    generatedPassword?: string;
    loginEmail?: string;
    mustChangePassword?: boolean;
  };
}

export const userService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<PaginatedResponse<User>>(API_ENDPOINTS.users.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: User }> {
    const { data } = await apiClient.get(API_ENDPOINTS.users.get(id));
    return data;
  },

  async create(payload: CreateUser): Promise<CreateUserResponse> {
    const { data } = await apiClient.post(API_ENDPOINTS.users.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateUser>): Promise<{ success: boolean; data: User }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.users.update(id), payload);
    return data;
  },

  async deactivate(id: string): Promise<{ success: boolean; data: { id: string; isActive: boolean } }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.users.deactivate(id));
    return data;
  },

  async activate(id: string): Promise<{ success: boolean; data: { id: string; isActive: boolean } }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.users.activate(id));
    return data;
  },

  async getUserActivity(id: string, page = 1, limit = 20): Promise<{ success: boolean; data: any[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.users.activity(id), { params: { page, limit } });
    return data;
  },

  async getUserStats(id: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.users.stats(id));
    return data;
  },

  async exportUsers(): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.users.export);
    return data;
  },

  async importUsers(users: CreateUser[]): Promise<{ success: boolean; data: { created: number; updated: number; errors: string[] } }> {
    const { data } = await apiClient.post(API_ENDPOINTS.users.import, { users });
    return data;
  },
};