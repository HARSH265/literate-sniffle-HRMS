import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface SalaryStructureComponent {
  component: string; // component master ID
  calcType?: string;
  calcValue?: number;
  monthlyAmount?: number;
  isActive?: boolean;
}

export interface SalaryStructure {
  id: string;
  employee: string;
  effectiveFrom: string;
  effectiveTo?: string;
  components: SalaryStructureComponent[];
  totalCtc?: number;
  grossMonthly?: number;
  totalMonthlyDeductions?: number;
  netMonthly?: number;
  approvedBy?: string;
  approvedAt?: string;
  isCurrent?: boolean;
}

export interface CreateSalaryStructure {
  employee: string;
  effectiveFrom: string;
  effectiveTo?: string;
  components: SalaryStructureComponent[];
  totalCtc?: number;
  grossMonthly?: number;
  totalMonthlyDeductions?: number;
  netMonthly?: number;
}

export interface UpdateSalaryStructure {
  effectiveFrom?: string;
  effectiveTo?: string;
  components?: SalaryStructureComponent[];
  totalCtc?: number;
  grossMonthly?: number;
  totalMonthlyDeductions?: number;
  netMonthly?: number;
  isCurrent?: boolean;
}

export const salaryStructureService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<SalaryStructure>> {
    const { data } = await apiClient.get<PaginatedResponse<SalaryStructure>>(API_ENDPOINTS.salaryStructures.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: SalaryStructure }> {
    const { data } = await apiClient.get(API_ENDPOINTS.salaryStructures.get(id));
    return data;
  },

  async create(payload: CreateSalaryStructure): Promise<{ success: boolean; data: SalaryStructure }> {
    const { data } = await apiClient.post(API_ENDPOINTS.salaryStructures.create, payload);
    return data;
  },

  async update(id: string, payload: UpdateSalaryStructure): Promise<{ success: boolean; data: SalaryStructure }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.salaryStructures.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.salaryStructures.delete(id));
  },
};