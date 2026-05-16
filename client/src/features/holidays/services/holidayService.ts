import apiClient from '../../../core/api/apiClient';

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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const holidayService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Holiday>> {
    const { data } = await apiClient.get<PaginatedResponse<Holiday>>('/holidays', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Holiday }> {
    const { data } = await apiClient.get(`/holidays/${id}`);
    return data;
  },

  async create(payload: CreateHoliday): Promise<{ success: boolean; data: Holiday }> {
    const { data } = await apiClient.post('/holidays', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateHoliday>): Promise<{ success: boolean; data: Holiday }> {
    const { data } = await apiClient.patch(`/holidays/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/holidays/${id}`);
  },
};