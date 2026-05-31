import apiClient from '../../../core/api/apiClient';
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
    const { data } = await apiClient.get<PaginatedResponse<Shift>>('/shifts', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Shift }> {
    const { data } = await apiClient.get(`/shifts/${id}`);
    return data;
  },

  async create(payload: Omit<Shift, 'id'>): Promise<{ success: boolean; data: Shift }> {
    const { data } = await apiClient.post('/shifts', payload);
    return data;
  },

  async update(id: string, payload: Partial<Shift>): Promise<{ success: boolean; data: Shift }> {
    const { data } = await apiClient.patch(`/shifts/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/shifts/${id}`);
  },

  async bulkAssignShift(employeeIds: string[], shiftId: string): Promise<{ success: boolean; data: { modifiedCount: number }; message: string }> {
    const { data } = await apiClient.patch('/employees/bulk/shift', { employeeIds, shiftId });
    return data;
  },
};