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
  status: 'active' | 'inactive' | 'terminated' | 'archived';
  contactNumber?: string;
  email?: string;
  address?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: 'savings' | 'current';
  };
  photo?: string;
  documents?: Array<{
    type: 'aadhar' | 'pan' | 'voter' | 'driver_license' | 'passport' | 'other';
    fileName: string;
    filePath: string;
    uploadedAt: string;
    _id: string;
  }>;
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

  async export(): Promise<Blob> {
    const response = await apiClient.get('/employees/export', { responseType: 'blob' });
    return response.data;
  },

  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/employees/template', { responseType: 'blob' });
    return response.data;
  },

  async import(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/employees/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async uploadDocument(employeeId: string, file: File, documentType: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    const { data } = await apiClient.post(`/employees/${employeeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteDocument(employeeId: string, docId: string): Promise<any> {
    const { data } = await apiClient.delete(`/employees/${employeeId}/documents/${docId}`);
    return data;
  },

  getDocumentUrl(employeeId: string, docId: string): string {
    return `/employees/${employeeId}/documents/${docId}`;
  },
};