import apiClient from '../../../core/api/apiClient';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartment {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDepartment {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const departmentService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Department>> {
    const { data } = await apiClient.get<PaginatedResponse<Department>>('/departments', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Department }> {
    const { data } = await apiClient.get(`/departments/${id}`);
    return data;
  },

  async create(payload: CreateDepartment): Promise<{ success: boolean; data: Department }> {
    const { data } = await apiClient.post('/departments', payload);
    return data;
  },

  async update(id: string, payload: UpdateDepartment): Promise<{ success: boolean; data: Department }> {
    const { data } = await apiClient.put(`/departments/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  },
};