import apiClient from '../../../core/api/apiClient';

export interface PayrollRun {
  id: string;
  month: string;
  status: 'draft' | 'finalized';
  totalEmployees: number;
  totalNetPay: number;
  createdAt: string;
  remarks?: string;
}

export interface PayrollItem {
  id: string;
  employee: { id: string; name: string; code: string };
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
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
  status: 'draft' | 'finalized';
}

export const payrollService = {
  async listRuns(params?: Record<string, unknown>): Promise<{ success: boolean; data: PayrollRun[]; meta: any }> {
    const { data } = await apiClient.get('/payroll/runs', { params });
    return data;
  },

  async runPayroll(month: number, year: number): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post('/payroll/run', { month, year });
    return data;
  },

  async getRunDetails(id: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(`/payroll/run/${id}`);
    return data;
  },

  async updatePayrollItem(runId: string, itemId: string, payload: Partial<PayrollItem>): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.patch(`/payroll/run/${runId}/item/${itemId}`, payload);
    return data;
  },

  async finalizeRun(id: string, remarks?: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post(`/payroll/run/${id}/finalize`, { remarks });
    return data;
  },

  async unfinalizeRun(id: string, reason?: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post(`/payroll/run/${id}/unfinalize`, { reason });
    return data;
  },

  async deleteRun(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`/payroll/run/${id}`);
    return data;
  },

  async getByEmployee(employeeId: string): Promise<PayrollItem[]> {
    const { data } = await apiClient.get(`/payroll/runs/employee/${employeeId}`);
    return data.data;
  },
};