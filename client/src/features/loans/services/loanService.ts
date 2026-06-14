import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface LoanType {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxAmount: number;
  minAmount: number;
  interestRate: number;
  maxTenure: number;
  minTenure: number;
  applicableTo: string;
  applicableEmploymentTypes: string[];
  maxActiveLoans: number;
  coolingOffPeriodDays: number;
  isActive: boolean;
}

export interface Loan {
  id: string;
  employee: any;
  loanType: any;
  applicationDate: string;
  amount: number;
  interestRate: number;
  tenure: number;
  emiAmount: number;
  totalPayable: number;
  totalInterest: number;
  purpose?: string;
  status: string;
  approvalLevels: any[];
  disbursedDate?: string;
  closedDate?: string;
  remarks?: string;
  repayments?: LoanRepayment[];
  createdAt: string;
}

export interface LoanRepayment {
  id: string;
  loan: string;
  employee: string;
  month: string;
  amount: number;
  principal: number;
  interest: number;
  outstandingBefore: number;
  outstandingAfter: number;
  status: string;
  payrollRun?: string;
  repaidAt?: string;
}

export const loanService = {
  async getLoanTypes(): Promise<{ success: boolean; data: { loanTypes: LoanType[]; total: number } }> {
    const { data } = await apiClient.get(API_ENDPOINTS.loans.types.list);
    return data;
  },

  async getLoanType(id: string): Promise<{ success: boolean; data: LoanType }> {
    const { data } = await apiClient.get(API_ENDPOINTS.loans.types.get(id));
    return data;
  },

  async createLoanType(payload: Partial<LoanType>): Promise<{ success: boolean; data: LoanType }> {
    const { data } = await apiClient.post(API_ENDPOINTS.loans.types.create, payload);
    return data;
  },

  async updateLoanType(id: string, payload: Partial<LoanType>): Promise<{ success: boolean; data: LoanType }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.loans.types.update(id), payload);
    return data;
  },

  async deleteLoanType(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(API_ENDPOINTS.loans.types.delete(id));
    return data;
  },

  async applyLoan(payload: { employee: string; loanType: string; amount: number; tenure: number; purpose?: string }): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post(API_ENDPOINTS.loans.apply, payload);
    return data;
  },

  async listLoans(params?: Record<string, any>): Promise<{ success: boolean; data: { loans: Loan[]; total: number; pagination: any } }> {
    const { data } = await apiClient.get(API_ENDPOINTS.loans.list, { params });
    return data;
  },

  async getLoan(id: string): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.get(API_ENDPOINTS.loans.get(id));
    return data;
  },

  async approveLoan(id: string, payload: { approve: boolean; remarks?: string; level?: number }): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.loans.approve(id), payload);
    return data;
  },

  async disburseLoan(id: string, remarks?: string): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.loans.disburse(id), { remarks });
    return data;
  },

  async cancelLoan(id: string): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.loans.cancel(id));
    return data;
  },

  async getEmployeeLoanSummary(employeeId: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.loans.employeeSummary(employeeId));
    return data;
  },
};
