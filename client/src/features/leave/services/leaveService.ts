import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  color: string;
  isPaid: boolean;
  maxDaysPerApplication: number;
  maxDaysPerYear: number;
  carryForward: boolean;
  carryForwardLimit: number;
  encashable: boolean;
  encashmentRatePercent: number;
  requiresDocuments: boolean;
  requiresApproval: boolean;
  approvalLevels: number;
  autoApproveThreshold: number;
  applicableToGender: string;
  applicableCategories: string[];
  applicableEmploymentTypes: string[];
  deductionMethod: string;
  accrualMethod: string;
  proRataOnJoin: boolean;
  allowNegativeBalance: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface LeaveApplication {
  id: string;
  employee: { id: string; fullName: string; employeeCode: string; department?: string } | null;
  leaveType: { id: string; name: string; code: string; color: string; isPaid: boolean } | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentApprovalLevel: number;
  totalApprovalLevels: number;
  isPaid: boolean;
  deductionMethod: string;
  approvers?: Array<{
    level: number;
    approver: { id: string; name: string; email?: string } | null;
    status: string;
    remarks?: string;
    decidedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  leaveType: { id: string; name: string; code: string; color: string; isPaid: boolean };
  year: number;
  totalEntitled: number;
  totalUsed: number;
  totalPending: number;
  carryForward: number;
  balance: number;
}

export const leaveService = {
  async listLeaveTypes(): Promise<{ success: boolean; data: LeaveType[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.leave.types.list);
    return data;
  },

  async createLeaveType(payload: Partial<LeaveType>): Promise<{ success: boolean; data: LeaveType }> {
    const { data } = await apiClient.post(API_ENDPOINTS.leave.types.create, payload);
    return data;
  },

  async updateLeaveType(id: string, payload: Partial<LeaveType>): Promise<{ success: boolean; data: LeaveType }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.leave.types.update(id), payload);
    return data;
  },

  async deleteLeaveType(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.leave.types.delete(id));
  },

  async listApplications(params?: Record<string, unknown>): Promise<PaginatedResponse<LeaveApplication>> {
    const { data } = await apiClient.get<PaginatedResponse<LeaveApplication>>(API_ENDPOINTS.leave.applications.list, { params });
    return data;
  },

  async getMyApplications(params?: Record<string, unknown>): Promise<PaginatedResponse<LeaveApplication>> {
    const { data } = await apiClient.get(API_ENDPOINTS.leave.applications.my, { params });
    return data;
  },

  async createApplication(payload: {
    employee: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    documentUrl?: string;
  }): Promise<{ success: boolean; data: LeaveApplication }> {
    const { data } = await apiClient.post(API_ENDPOINTS.leave.applications.create, payload);
    return data;
  },

  async cancelApplication(id: string): Promise<{ success: boolean; data: LeaveApplication }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.leave.applications.cancel(id));
    return data;
  },

  async approveApplication(payload: {
    applicationId: string;
    status: 'approved' | 'rejected';
    remarks?: string;
  }): Promise<{ success: boolean; data: LeaveApplication }> {
    const { data } = await apiClient.post(API_ENDPOINTS.leave.applications.approve, payload);
    return data;
  },

  async getPendingApprovals(params?: Record<string, unknown>): Promise<PaginatedResponse<LeaveApplication>> {
    const { data } = await apiClient.get(API_ENDPOINTS.leave.approvals.pending, { params });
    return data;
  },

  async getBalances(employeeId: string, year?: number): Promise<{ success: boolean; data: LeaveBalance[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.leave.balances.get(employeeId), { params: { year } });
    return data;
  },

  async getMyBalances(year?: number): Promise<{ success: boolean; data: LeaveBalance[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.leave.balances.my, { params: { year } });
    return data;
  },

  async accrueLeave(payload: {
    leaveTypeId: string;
    year: number;
    employeeIds?: string[];
  }): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post(API_ENDPOINTS.leave.accrue, payload);
    return data;
  },

  async getCalendar(params?: Record<string, unknown>): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.leave.calendar, { params });
    return data;
  },

  async getSummary(params?: Record<string, unknown>): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.leave.summary, { params });
    return data;
  },
};
