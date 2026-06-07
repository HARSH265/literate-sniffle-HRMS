import apiClient from '../../../core/api/apiClient';

export interface StatutoryDefaults {
  pfEnabled: boolean;
  pfWageCeiling: number;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  epsRate: number;
  edliRate: number;
  pfAdminCharges: number;
  edliAdminCharges: number;
  esiEnabled: boolean;
  esiThreshold: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  ptEnabled: boolean;
  ptSlabs: { state: string; slabs: { minSalary: number; maxSalary: number; amount: number; frequency: string }[] }[];
}

export interface StatutoryCalculation {
  employeePf: number;
  employerPf: number;
  eps: number;
  edli: number;
  pfAdminCharges: number;
  edliAdminCharges: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  pfApplicableWages: number;
  esiApplicable: boolean;
}

export interface PFChallan {
  id: string;
  month: string;
  financialYear: string;
  status: string;
  totalWages: number;
  employeeCount: number;
  employeePfContribution: number;
  employerPfContribution: number;
  epsContribution: number;
  edliContribution: number;
  pfAdminCharges: number;
  edliAdminCharges: number;
  totalAmount: number;
  paymentDate?: string;
  transactionRef?: string;
  challanId?: string;
  remarks?: string;
}

export interface StatutoryReport {
  id: string;
  reportType: string;
  month: string;
  financialYear: string;
  status: string;
  data: any;
  fileName?: string;
}

export interface StatutorySummary {
  month: string;
  pf: {
    enabled: boolean;
    applicableEmployees: number;
    totalWages: number;
    employeeContribution: number;
    employerContribution: number;
    eps: number;
    edli: number;
    totalPfDue: number;
  };
  esi: {
    enabled: boolean;
    applicableEmployees: number;
    totalWages: number;
    employeeContribution: number;
    employerContribution: number;
    totalEsiDue: number;
  };
  pt: {
    enabled: boolean;
    applicableEmployees: number;
    totalAmount: number;
  };
}

export const statutoryService = {
  getDefaults: async (): Promise<StatutoryDefaults> => {
    const res = await apiClient.get('/statutory/defaults');
    return res.data.data;
  },

  calculate: async (employeeId: string, grossPay: number, month: string): Promise<StatutoryCalculation> => {
    const res = await apiClient.post('/statutory/calculate', { employeeId, grossPay, month });
    return res.data.data;
  },

  getSummary: async (month: string): Promise<StatutorySummary> => {
    const res = await apiClient.get(`/statutory/summary/${month}`);
    return res.data.data;
  },

  generateChallan: async (month: string): Promise<PFChallan> => {
    const res = await apiClient.post(`/statutory/challans/generate/${month}`);
    return res.data.data;
  },

  listChallans: async (params?: { month?: string; status?: string; financialYear?: string }): Promise<PFChallan[]> => {
    const res = await apiClient.get('/statutory/challans', { params });
    return res.data.data;
  },

  getChallan: async (id: string): Promise<PFChallan> => {
    const res = await apiClient.get(`/statutory/challans/${id}`);
    return res.data.data;
  },

  updateChallan: async (id: string, data: Partial<PFChallan>): Promise<PFChallan> => {
    const res = await apiClient.patch(`/statutory/challans/${id}`, data);
    return res.data.data;
  },

  generateReport: async (reportType: string, month: string): Promise<StatutoryReport> => {
    const res = await apiClient.post('/statutory/reports/generate', { reportType, month });
    return res.data.data;
  },

  listReports: async (params?: { reportType?: string; month?: string; financialYear?: string }): Promise<StatutoryReport[]> => {
    const res = await apiClient.get('/statutory/reports', { params });
    return res.data.data;
  },

  getReport: async (id: string): Promise<StatutoryReport> => {
    const res = await apiClient.get(`/statutory/reports/${id}`);
    return res.data.data;
  },

  updateReport: async (id: string, data: Partial<StatutoryReport>): Promise<StatutoryReport> => {
    const res = await apiClient.patch(`/statutory/reports/${id}`, data);
    return res.data.data;
  },
};
