import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface ComplianceSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  failures: number;
}

export interface ComplianceReport {
  runId: string;
  month: string;
  overallStatus: 'pass' | 'warning' | 'fail';
  summary: ComplianceSummary;
}

export const complianceService = {
  async getSummary(): Promise<{ success: boolean; data: ComplianceSummary }> {
    const { data } = await apiClient.get(API_ENDPOINTS.compliance.summary);
    return data;
  },

  async runCheck(runId: string): Promise<{ success: boolean; data: ComplianceReport }> {
    const { data } = await apiClient.get(API_ENDPOINTS.compliance.runCheck(runId));
    return data;
  },

  async getRunSummary(runId: string): Promise<{ success: boolean; data: ComplianceSummary }> {
    const { data } = await apiClient.get(API_ENDPOINTS.compliance.runSummary(runId));
    return data;
  },

  async getGapReport(runId: string): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.compliance.gapReport(runId));
    return data;
  },

  async getAuditLog(params?: Record<string, unknown>): Promise<{ success: boolean; data: any[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.compliance.auditLog, { params });
    return data;
  },
};
