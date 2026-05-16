import apiClient from '../../../core/api/apiClient';

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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const weeklyOffRuleService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<WeeklyOffRule>> {
    const { data } = await apiClient.get<PaginatedResponse<WeeklyOffRule>>('/weekly-off-rules', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: WeeklyOffRule }> {
    const { data } = await apiClient.get(`/weekly-off-rules/${id}`);
    return data;
  },

  async create(payload: CreateWeeklyOffRule): Promise<{ success: boolean; data: WeeklyOffRule }> {
    const { data } = await apiClient.post('/weekly-off-rules', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateWeeklyOffRule>): Promise<{ success: boolean; data: WeeklyOffRule }> {
    const { data } = await apiClient.patch(`/weekly-off-rules/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/weekly-off-rules/${id}`);
  },
};