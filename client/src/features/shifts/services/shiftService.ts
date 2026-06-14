import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  applicableTo: 'all' | 'worker' | 'office-staff';
  isActive: boolean;
}

export const shiftService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Shift>> {
    const { data } = await apiClient.get<PaginatedResponse<Shift>>(API_ENDPOINTS.shifts.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Shift }> {
    const { data } = await apiClient.get(API_ENDPOINTS.shifts.get(id));
    return data;
  },

  async create(payload: Omit<Shift, 'id'>): Promise<{ success: boolean; data: Shift }> {
    const { data } = await apiClient.post(API_ENDPOINTS.shifts.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<Shift>): Promise<{ success: boolean; data: Shift }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.shifts.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.shifts.delete(id));
  },

  async bulkAssignShift(employeeIds: string[], shiftId: string): Promise<{ success: boolean; data: { modifiedCount: number }; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.employees.bulkAssignShift, { employeeIds, shiftId });
    return data;
  },
};