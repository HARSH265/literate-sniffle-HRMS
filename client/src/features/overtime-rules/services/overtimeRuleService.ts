import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface OvertimeRule {
  id: string;
  name: string;
  applicableTo: 'all' | 'worker' | 'office-staff';
  multiplier: number;
  maxHoursPerDay: number;
  maxHoursPerMonth: number;
  isActive: boolean;
}

export interface CreateOvertimeRule {
  name: string;
  applicableTo?: 'all' | 'worker' | 'office-staff';
  multiplier: number;
  maxHoursPerDay: number;
  maxHoursPerMonth: number;
  isActive?: boolean;
}

export const overtimeRuleService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<OvertimeRule>> {
    const { data } = await apiClient.get<PaginatedResponse<OvertimeRule>>(API_ENDPOINTS.overtimeRules.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: OvertimeRule }> {
    const { data } = await apiClient.get(API_ENDPOINTS.overtimeRules.get(id));
    return data;
  },

  async create(payload: CreateOvertimeRule): Promise<{ success: boolean; data: OvertimeRule }> {
    const { data } = await apiClient.post(API_ENDPOINTS.overtimeRules.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateOvertimeRule>): Promise<{ success: boolean; data: OvertimeRule }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.overtimeRules.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.overtimeRules.delete(id));
  },
};