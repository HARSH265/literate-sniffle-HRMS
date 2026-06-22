import apiClient from '../../../core/api/apiClient';

export interface SalarySlip {
  id: string;
  month: string;
  status: string;
  totalEmployees: number;
  totalNetPay: number;
  generatedAt: string;
}

export interface SalarySlipPreview {
  month: string;
  companyName: string;
  companyAddress?: string;
  generatedDate: string;
  employees: Array<{
    id: string;
    employeeCode: string;
    name: string;
    department: string;
    designation: string;
    basicSalary: number;
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
    presentDays: number;
    workingDays: number;
    allowances: Array<{ name: string; type: string; value: number; calculatedValue: number }>;
    deductions: Array<{ name: string; type: string; value: number; calculatedValue: number }>;
  }>;
}

function validateResponse<T>(data: unknown): T {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response format');
  }
  return data as T;
}

export const salarySlipService = {
  async list(params?: Record<string, unknown>): Promise<{ success: boolean; data: SalarySlip[] }> {
    const { data } = await apiClient.get('/salary-slips', { params });
    return validateResponse(data);
  },

  async generatePdf(runId: string, employeeId?: string): Promise<{ success: boolean; data: SalarySlipPreview }> {
    const { data } = await apiClient.get(`/salary-slips/${runId}/pdf`, { params: employeeId ? { employeeId } : undefined });
    return validateResponse(data);
  },

  async preview(runId: string, employeeId?: string): Promise<{ success: boolean; data: SalarySlipPreview }> {
    const { data } = await apiClient.get(`/salary-slips/${runId}/preview`, { params: employeeId ? { employeeId } : undefined });
    return validateResponse(data);
  },
};