import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface OvertimeEntry {
  id: string;
  employee: { id: string; fullName: string; employeeCode: string } | null;
  overtimeRule: { id: string; name: string; multiplier: number } | null;
  date: string;
  hours: number;
  remarks?: string;
  enteredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOvertimeEntry {
  employee: string;
  date: string;
  hours: number;
  overtimeRule?: string;
  remarks?: string;
}

export interface UpdateOvertimeEntry {
  hours?: number;
  overtimeRule?: string;
  remarks?: string;
}

export const overtimeEntryService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<OvertimeEntry>> {
    const { data } = await apiClient.get<PaginatedResponse<OvertimeEntry>>(API_ENDPOINTS.overtimeEntries.list, { params });
    return data;
  },

  async get(id: string): Promise<{ success: boolean; data: OvertimeEntry }> {
    const { data } = await apiClient.get(API_ENDPOINTS.overtimeEntries.get(id));
    return data;
  },

  async create(payload: CreateOvertimeEntry): Promise<{ success: boolean; data: OvertimeEntry }> {
    const { data } = await apiClient.post(API_ENDPOINTS.overtimeEntries.create, payload);
    return data;
  },

  async update(id: string, payload: UpdateOvertimeEntry): Promise<{ success: boolean; data: OvertimeEntry }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.overtimeEntries.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.overtimeEntries.delete(id));
  },
};