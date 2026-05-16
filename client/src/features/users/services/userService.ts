import apiClient from '../../../core/api/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'hr-admin' | 'hr-staff' | 'accounts' | 'manager';
  isActive: boolean;
  createdAt: string;
}

export interface CreateUser {
  name: string;
  email: string;
  password: string;
  role: 'super-admin' | 'hr-admin' | 'hr-staff' | 'accounts' | 'manager';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const userService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: User }> {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  async create(payload: CreateUser): Promise<{ success: boolean; data: User }> {
    const { data } = await apiClient.post('/users', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateUser>): Promise<{ success: boolean; data: User }> {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};