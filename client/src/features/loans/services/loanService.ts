import apiClient from '../../../core/api/apiClient';

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
    const { data } = await apiClient.get('/loans/loan-types');
    return data;
  },

  async getLoanType(id: string): Promise<{ success: boolean; data: LoanType }> {
    const { data } = await apiClient.get(`/loans/loan-types/${id}`);
    return data;
  },

  async createLoanType(payload: Partial<LoanType>): Promise<{ success: boolean; data: LoanType }> {
    const { data } = await apiClient.post('/loans/loan-types', payload);
    return data;
  },

  async updateLoanType(id: string, payload: Partial<LoanType>): Promise<{ success: boolean; data: LoanType }> {
    const { data } = await apiClient.patch(`/loans/loan-types/${id}`, payload);
    return data;
  },

  async deleteLoanType(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`/loans/loan-types/${id}`);
    return data;
  },

  async applyLoan(payload: { employee: string; loanType: string; amount: number; tenure: number; purpose?: string }): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.post('/loans/apply', payload);
    return data;
  },

  async listLoans(params?: Record<string, any>): Promise<{ success: boolean; data: { loans: Loan[]; total: number; pagination: any } }> {
    const { data } = await apiClient.get('/loans', { params });
    return data;
  },

  async getLoan(id: string): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.get(`/loans/${id}`);
    return data;
  },

  async approveLoan(id: string, payload: { approve: boolean; remarks?: string; level?: number }): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.patch(`/loans/${id}/approve`, payload);
    return data;
  },

  async disburseLoan(id: string, remarks?: string): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.patch(`/loans/${id}/disburse`, { remarks });
    return data;
  },

  async cancelLoan(id: string): Promise<{ success: boolean; data: Loan }> {
    const { data } = await apiClient.patch(`/loans/${id}/cancel`);
    return data;
  },

  async getEmployeeLoanSummary(employeeId: string): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get(`/loans/employee/${employeeId}/summary`);
    return data;
  },
};
