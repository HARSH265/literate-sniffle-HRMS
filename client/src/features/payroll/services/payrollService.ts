import apiClient from '../../../core/api/apiClient';

export interface PayrollRun {
  id: string;
  month: string;
  status: 'draft' | 'finalized';
  totalEmployees: number;
  totalNetPay: number;
  createdAt: string;
}

export interface PayrollItem {
  employee: { id: string; name: string; code: string };
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  overtimeHours: number;
  basicEarnings: number;
  allowancesTotal: number;
  overtimeAmount: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
}

export const payrollService = {
  async listRuns(): Promise<{ success: boolean; data: PayrollRun[] }> {
    const { data } = await apiClient.get('/payroll/runs');
    return data;
  },

  async runPayroll(month: number, year: number): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post('/payroll/run', { month, year });
    return data;
  },

  async finalizeRun(id: string, remarks?: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post(`/payroll/run/${id}/finalize`, { remarks });
    return data;
  },

  async getRunDetails(id: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(`/payroll/run/${id}`);
    return data;
  },
};