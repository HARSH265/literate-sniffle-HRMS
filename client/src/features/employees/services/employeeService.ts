import apiClient from '../../../core/api/apiClient';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  fatherName: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
  department: { id: string; name: string } | null;
  designation: { id: string; name: string } | null;
  shift: { id: string; name: string } | null;
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  dailyWage: number;
  overtimeEligible: boolean;
  status: 'active' | 'inactive' | 'terminated';
  contactNumber?: string;
  address?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: 'savings' | 'current';
  };
  photo?: string;
}

export interface CreateEmployee {
  employeeCode: string;
  fullName: string;
  fatherName: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
  department: string;
  designation: string;
  shift: string;
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  dailyWage?: number;
  overtimeEligible?: boolean;
  contactNumber?: string;
  address?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: 'savings' | 'current';
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const employeeService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Employee>> {
    const { data } = await apiClient.get<PaginatedResponse<Employee>>('/employees', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Employee }> {
    const { data } = await apiClient.get(`/employees/${id}`);
    return data;
  },

  async create(payload: CreateEmployee): Promise<{ success: boolean; data: Employee }> {
    const { data } = await apiClient.post('/employees', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateEmployee>): Promise<{ success: boolean; data: Employee }> {
    const { data } = await apiClient.put(`/employees/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/employees/${id}`);
  },
};