import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export const payrollReportsService = {
  async downloadPayslip(itemId: string): Promise<Blob> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.payslipPdf(itemId), { responseType: 'blob' });
    return data;
  },

  async downloadBankFile(runId: string): Promise<Blob> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.bankFile(runId), { responseType: 'blob' });
    return data;
  },

  async downloadSalaryRegister(runId: string): Promise<Blob> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.salaryRegister(runId), { responseType: 'blob' });
    return data;
  },

  async getHeadcountCost(params?: Record<string, unknown>): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.headcountCost, { params });
    return data;
  },

  async getMoMVariance(params?: Record<string, unknown>): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.momVariance, { params });
    return data;
  },

  async getYtdCost(params?: Record<string, unknown>): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.ytdCost, { params });
    return data;
  },

  async getOtLop(runId: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.otLop(runId));
    return data;
  },

  async getLoanOutstanding(params?: Record<string, unknown>): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.loanOutstanding, { params });
    return data;
  },

  async getBudgetVsActual(runId: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.payrollReports.budgetVsActual(runId));
    return data;
  },
};
