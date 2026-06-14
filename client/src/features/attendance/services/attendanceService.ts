import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface AttendanceEntry {
  id: string;
  employee: { id: string; fullName: string; employeeCode: string; department?: string } | null;
  shift: { id: string; name: string; startTime?: string; endTime?: string } | null;
  date: string;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'weekly-off' | 'holiday';
  inTime?: string;
  outTime?: string;
  totalHours?: number;
  isLate?: boolean;
  remarks?: string;
  autoCheckout?: boolean;
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

export const attendanceService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<AttendanceEntry>> {
    const { data } = await apiClient.get<PaginatedResponse<AttendanceEntry>>(API_ENDPOINTS.attendance.list, { params });
    return data;
  },

  async monthlyView(params: { month: number; year: number; department?: string }): Promise<MonthlyAttendanceView[]> {
    const { data } = await apiClient.get(API_ENDPOINTS.attendance.monthlyView, { params });
    return data.data;
  },

  async create(payload: CreateAttendanceEntry): Promise<{ success: boolean; data: AttendanceEntry }> {
    const { data } = await apiClient.post(API_ENDPOINTS.attendance.create, payload);
    return data;
  },

  async bulkCreate(payload: BulkAttendanceEntry): Promise<any> {
    const { data } = await apiClient.post(API_ENDPOINTS.attendance.bulk, payload);
    return data;
  },

  async bulkUpdate(entries: Array<{ id: string; status?: string; inTime?: string; outTime?: string; remarks?: string }>): Promise<any> {
    const { data } = await apiClient.patch(API_ENDPOINTS.attendance.bulkUpdate, { entries });
    return data;
  },

  async update(id: string, payload: Partial<CreateAttendanceEntry>): Promise<{ success: boolean; data: AttendanceEntry }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.attendance.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.attendance.delete(id));
  },

  async adminCheckout(employeeId: string, reason: string): Promise<{
    id: string;
    outTime: string;
    totalHours: number;
    otHours: number;
    message: string;
  }> {
    const { data } = await apiClient.post(API_ENDPOINTS.attendance.adminCheckout(employeeId), { reason });
    return data.data;
  },

  async getByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<AttendanceEntry[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(API_ENDPOINTS.attendance.getByEmployee(employeeId), { params });
    return data.data;
  },
};