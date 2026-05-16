import apiClient from '../../../core/api/apiClient';

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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const overtimeRuleService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<OvertimeRule>> {
    const { data } = await apiClient.get<PaginatedResponse<OvertimeRule>>('/overtime-rules', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: OvertimeRule }> {
    const { data } = await apiClient.get(`/overtime-rules/${id}`);
    return data;
  },

  async create(payload: CreateOvertimeRule): Promise<{ success: boolean; data: OvertimeRule }> {
    const { data } = await apiClient.post('/overtime-rules', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateOvertimeRule>): Promise<{ success: boolean; data: OvertimeRule }> {
    const { data } = await apiClient.patch(`/overtime-rules/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/overtime-rules/${id}`);
  },
};