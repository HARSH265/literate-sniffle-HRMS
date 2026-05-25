import apiClient from '../../../core/api/apiClient';

export interface Designation {
  id: string;
  name: string;
  department: { id: string; name: string; code: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignation {
  name: string;
  department: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const designationService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Designation>> {
    const { data } = await apiClient.get<PaginatedResponse<Designation>>('/designations', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Designation }> {
    const { data } = await apiClient.get(`/designations/${id}`);
    return data;
  },

  async create(payload: CreateDesignation): Promise<{ success: boolean; data: Designation }> {
    const { data } = await apiClient.post('/designations', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateDesignation> & { isActive?: boolean }): Promise<{ success: boolean; data: Designation }> {
    const { data } = await apiClient.patch(`/designations/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/designations/${id}`);
  },
};