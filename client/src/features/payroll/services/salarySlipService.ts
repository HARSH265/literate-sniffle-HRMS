import apiClient from '../../../core/api/apiClient';

export interface SalarySlip {
  id: string;
  month: string;
  status: string;
  totalEmployees: number;
  totalNetPay: number;
  generatedAt: string;
}

export const salarySlipService = {
  async list(params?: Record<string, unknown>): Promise<{ success: boolean; data: SalarySlip[] }> {
    const { data } = await apiClient.get('/salary-slips', { params });
    return data;
  },

  async generatePdf(runId: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(`/salary-slips/${runId}/pdf`);
    return data;
  },
};