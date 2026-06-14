import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import type { Meta } from '../../../types/shared';

export interface PayrollRevision {
  action: string;
  userId: string;
  userName: string;
  changes?: Record<string, unknown>;
  timestamp: string;
}

export interface ApprovalHistoryEntry {
  action: 'submitted' | 'approved' | 'rejected' | 'finalized' | 'unfinalized';
  userId: string;
  userName: string;
  role: string;
  comments?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PayrollRun {
  id: string;
  month: string;
  status: 'draft' | 'submitted' | 'approved' | 'finalized';
  totalEmployees: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  processedBy?: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  isSupplementary?: boolean;
  complianceStatus?: 'pass' | 'warning' | 'fail' | 'pending';
  remarks?: string;
  revisions?: PayrollRevision[];
  approvalHistory?: ApprovalHistoryEntry[];
  unfinalizeWindowDays?: number;
  unfinalizeLocked?: boolean;
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  employee: { id: string; name: string; code: string };
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  weeklyOffs: number;
  holidays: number;
  effectiveWorkingDays: number;
  overtimeHours: number;
  basicEarnings: number;
  allowances: { name: string; type: string; value: number; calculatedValue: number }[];
  allowancesTotal: number;
  overtimeAmount: number;
  grossEarnings: number;
  deductions: { name: string; type: string; value: number; calculatedValue: number }[];
  totalDeductions: number;
  netPay: number;
  status: string;
}

function validateResponse<T>(data: unknown, _requiredKeys: string[] = []): T {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response format');
  }
  return data as T;
}

export const payrollService = {
  async listRuns(params?: Record<string, unknown>): Promise<{ success: boolean; data: PayrollRun[]; meta: Meta }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payroll.runs.list, { params });
    return validateResponse(data);
  },

  async runPayroll(month: number, year: number): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.post(API_ENDPOINTS.payroll.runs.create, { month, year });
    return validateResponse(data);
  },

  async previewRun(month: number, year: number): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.post(API_ENDPOINTS.payroll.runs.preview, { month, year });
    return validateResponse(data);
  },

  async getRunDetails(id: string): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payroll.runs.get(id));
    return validateResponse(data);
  },

  async submitRun(id: string): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.post(API_ENDPOINTS.payroll.runs.submit(id));
    return validateResponse(data);
  },

  async approveRun(id: string): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.post(API_ENDPOINTS.payroll.runs.approve(id));
    return validateResponse(data);
  },

  async rejectRun(id: string, reason?: string): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.post(API_ENDPOINTS.payroll.runs.reject(id), { reason });
    return validateResponse(data);
  },

  async updatePayrollItem(runId: string, itemId: string, payload: Partial<PayrollItem>): Promise<{ success: boolean; data: PayrollItem }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.payroll.items.updateInRun(runId, itemId), payload);
    return validateResponse(data);
  },

  async batchUpdateItems(runId: string, items: Array<{ itemId: string; data: Record<string, unknown> }>): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.payroll.items.batch(runId), { items });
    return validateResponse(data);
  },

  async finalizeRun(id: string, remarks?: string): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.post(API_ENDPOINTS.payroll.runs.finalize(id), { remarks });
    return validateResponse(data);
  },

  async unfinalizeRun(id: string, reason: string): Promise<{ success: boolean; data: PayrollRun }> {
    const { data } = await apiClient.post(API_ENDPOINTS.payroll.runs.unfinalize(id), { reason });
    return validateResponse(data);
  },

  async deleteRun(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(API_ENDPOINTS.payroll.runs.delete(id));
    return validateResponse(data);
  },

  async getByEmployee(employeeId: string): Promise<PayrollItem[]> {
    const { data } = await apiClient.get(API_ENDPOINTS.payroll.employee(employeeId));
    const response = validateResponse(data, ['success', 'data']) as { success: boolean; data: PayrollItem[] };
    return response.data;
  },
};
