import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

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
  code?: string;
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
  async getNextCode(): Promise<string> {
    const { data } = await apiClient.get(API_ENDPOINTS.departments.nextCode);
    return data.data.code;
  },

  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Department>> {
    const { data } = await apiClient.get<PaginatedResponse<Department>>(API_ENDPOINTS.departments.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Department }> {
    const { data } = await apiClient.get(API_ENDPOINTS.departments.get(id));
    return data;
  },

  async create(payload: CreateDepartment): Promise<{ success: boolean; data: Department }> {
    const { data } = await apiClient.post(API_ENDPOINTS.departments.create, payload);
    return data;
  },

  async update(id: string, payload: UpdateDepartment): Promise<{ success: boolean; data: Department }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.departments.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.departments.delete(id));
  },
};