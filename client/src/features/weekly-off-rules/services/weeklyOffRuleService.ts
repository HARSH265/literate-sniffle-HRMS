import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface WeeklyOffRule {
  id: string;
  name: string;
  category: 'all' | 'worker' | 'office-staff';
  offDays: number[];
  isActive: boolean;
}

export interface CreateWeeklyOffRule {
  name: string;
  category?: 'all' | 'worker' | 'office-staff';
  offDays: number[];
  isActive?: boolean;
}

export const weeklyOffRuleService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<WeeklyOffRule>> {
    const { data } = await apiClient.get<PaginatedResponse<WeeklyOffRule>>(API_ENDPOINTS.weeklyOffRules.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: WeeklyOffRule }> {
    const { data } = await apiClient.get(API_ENDPOINTS.weeklyOffRules.get(id));
    return data;
  },

  async create(payload: CreateWeeklyOffRule): Promise<{ success: boolean; data: WeeklyOffRule }> {
    const { data } = await apiClient.post(API_ENDPOINTS.weeklyOffRules.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateWeeklyOffRule>): Promise<{ success: boolean; data: WeeklyOffRule }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.weeklyOffRules.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.weeklyOffRules.delete(id));
  },
};