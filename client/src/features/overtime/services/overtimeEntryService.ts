import apiClient from '../../../core/api/apiClient';

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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const overtimeEntryService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<OvertimeEntry>> {
    const { data } = await apiClient.get<PaginatedResponse<OvertimeEntry>>('/overtime-entries', { params });
    return data;
  },

  async get(id: string): Promise<{ success: boolean; data: OvertimeEntry }> {
    const { data } = await apiClient.get(`/overtime-entries/${id}`);
    return data;
  },

  async create(payload: CreateOvertimeEntry): Promise<{ success: boolean; data: OvertimeEntry }> {
    const { data } = await apiClient.post('/overtime-entries', payload);
    return data;
  },

  async update(id: string, payload: UpdateOvertimeEntry): Promise<{ success: boolean; data: OvertimeEntry }> {
    const { data } = await apiClient.patch(`/overtime-entries/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/overtime-entries/${id}`);
  },
};