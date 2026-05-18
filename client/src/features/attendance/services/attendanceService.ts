import apiClient from '../../../core/api/apiClient';

export interface AttendanceEntry {
  id: string;
  employee: { id: string; fullName: string; employeeCode: string; department?: string } | null;
  shift: { id: string; name: string; startTime?: string; endTime?: string } | null;
  date: string;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off' | 'holiday';
  inTime?: string;
  outTime?: string;
  isLate?: boolean;
  remarks?: string;
}

export interface MonthlyAttendanceView {
  employee: {
    id: string;
    fullName: string;
    employeeCode: string;
    department?: string;
  };
  days: Record<string, {
    id: string;
    status: string;
    inTime?: string;
    outTime?: string;
  } | null>;
}

export interface CreateAttendanceEntry {
  employee: string;
  date: string;
  shift?: string;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off' | 'holiday';
  inTime?: string;
  outTime?: string;
  remarks?: string;
}

export interface BulkAttendanceEntry {
  date: string;
  entries: Array<{
    employee: string;
    status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off' | 'holiday';
    inTime?: string;
    outTime?: string;
    remarks?: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const attendanceService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<AttendanceEntry>> {
    const { data } = await apiClient.get<PaginatedResponse<AttendanceEntry>>('/attendance', { params });
    return data;
  },

  async monthlyView(params: { month: number; year: number; department?: string }): Promise<MonthlyAttendanceView[]> {
    const { data } = await apiClient.get('/attendance/monthly-view', { params });
    return data.data;
  },

  async create(payload: CreateAttendanceEntry): Promise<{ success: boolean; data: AttendanceEntry }> {
    const { data } = await apiClient.post('/attendance', payload);
    return data;
  },

  async bulkCreate(payload: BulkAttendanceEntry): Promise<any> {
    const { data } = await apiClient.post('/attendance/bulk', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateAttendanceEntry>): Promise<{ success: boolean; data: AttendanceEntry }> {
    const { data } = await apiClient.patch(`/attendance/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/attendance/${id}`);
  },

  async getByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<AttendanceEntry[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(`/attendance/employee/${employeeId}`, { params });
    return data.data;
  },
};