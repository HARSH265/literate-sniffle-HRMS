import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'state' | 'company' | 'festival';
  applicableTo: 'all' | 'worker' | 'office-staff';
  year: number;
  isPaid: boolean;
}

export interface CreateHoliday {
  name: string;
  date: string;
  type?: 'national' | 'state' | 'company' | 'festival';
  applicableTo?: 'all' | 'worker' | 'office-staff';
  year?: number;
  isPaid?: boolean;
}

export const holidayService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Holiday>> {
    const { data } = await apiClient.get<PaginatedResponse<Holiday>>(API_ENDPOINTS.holidays.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Holiday }> {
    const { data } = await apiClient.get(API_ENDPOINTS.holidays.get(id));
    return data;
  },

  async create(payload: CreateHoliday): Promise<{ success: boolean; data: Holiday }> {
    const { data } = await apiClient.post(API_ENDPOINTS.holidays.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateHoliday>): Promise<{ success: boolean; data: Holiday }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.holidays.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.holidays.delete(id));
  },
};