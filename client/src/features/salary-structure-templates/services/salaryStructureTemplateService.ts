import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface SalaryStructureTemplate {
  id: string;
  name: string;
  description?: string;
  components: Array<{
    componentId: string;
    name: string;
    type: 'earning' | 'deduction';
    defaultValue: number;
  }>;
  isActive: boolean;
}

export const salaryStructureTemplateService = {
  async list(params?: Record<string, unknown>): Promise<{ success: boolean; data: SalaryStructureTemplate[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.salaryStructureTemplates.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: SalaryStructureTemplate }> {
    const { data } = await apiClient.get(API_ENDPOINTS.salaryStructureTemplates.get(id));
    return data;
  },

  async create(payload: Partial<SalaryStructureTemplate>): Promise<{ success: boolean; data: SalaryStructureTemplate }> {
    const { data } = await apiClient.post(API_ENDPOINTS.salaryStructureTemplates.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<SalaryStructureTemplate>): Promise<{ success: boolean; data: SalaryStructureTemplate }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.salaryStructureTemplates.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(API_ENDPOINTS.salaryStructureTemplates.delete(id));
    return data;
  },
};
