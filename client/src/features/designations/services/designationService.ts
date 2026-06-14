import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

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

export const designationService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Designation>> {
    const { data } = await apiClient.get<PaginatedResponse<Designation>>(API_ENDPOINTS.designations.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Designation }> {
    const { data } = await apiClient.get(API_ENDPOINTS.designations.get(id));
    return data;
  },

  async create(payload: CreateDesignation): Promise<{ success: boolean; data: Designation }> {
    const { data } = await apiClient.post(API_ENDPOINTS.designations.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateDesignation> & { isActive?: boolean }): Promise<{ success: boolean; data: Designation }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.designations.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.designations.delete(id));
  },
};