import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface ComponentMaster {
  id: string;
  code: string;
  name: string;
  type: 'earning' | 'deduction' | 'employer-cost';
  subType: 'fixed' | 'variable' | 'reimbursement';
  taxable: boolean;
  partOfGross: boolean;
  partOfCtc: boolean;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  bonusApplicable: boolean;
  otBase: boolean;
  lopApplicable: boolean;
  arrearsApplicable: boolean;
  proRataOnJoin: boolean;
  showOnPayslip: boolean;
  calcType: 'fixed' | 'percentage-of-basic' | 'percentage-of-gross' | 'percentage-of-ctc' | 'formula' | 'slab';
  calcValue: number;
  calcReferenceComponent?: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateComponentMaster {
  code: string;
  name: string;
  type: 'earning' | 'deduction' | 'employer-cost';
  subType?: 'fixed' | 'variable' | 'reimbursement';
  calcType: 'fixed' | 'percentage-of-basic' | 'percentage-of-gross' | 'percentage-of-ctc' | 'formula' | 'slab';
  calcValue: number;
  frequency?: 'monthly' | 'quarterly' | 'annual';
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export interface UpdateComponentMaster {
  name?: string;
  type?: 'earning' | 'deduction' | 'employer-cost';
  subType?: 'fixed' | 'variable' | 'reimbursement';
  calcType?: 'fixed' | 'percentage-of-basic' | 'percentage-of-gross' | 'percentage-of-ctc' | 'formula' | 'slab';
  calcValue?: number;
  frequency?: 'monthly' | 'quarterly' | 'annual';
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export const componentMasterService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<ComponentMaster>> {
    const { data } = await apiClient.get<PaginatedResponse<ComponentMaster>>(API_ENDPOINTS.componentMaster.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: ComponentMaster }> {
    const { data } = await apiClient.get(API_ENDPOINTS.componentMaster.get(id));
    return data;
  },

  async create(payload: CreateComponentMaster): Promise<{ success: boolean; data: ComponentMaster }> {
    const { data } = await apiClient.post(API_ENDPOINTS.componentMaster.create, payload);
    return data;
  },

  async update(id: string, payload: UpdateComponentMaster): Promise<{ success: boolean; data: ComponentMaster }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.componentMaster.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.componentMaster.delete(id));
  },
};