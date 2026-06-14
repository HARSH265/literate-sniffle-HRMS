import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  fatherName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  email?: string;
  emergencyContact?: string;
  permanentAddress?: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
  department: { id: string; name: string; head?: { id: string; fullName: string; employeeCode: string } | null } | null;
  designation: { id: string; name: string } | null;
  shift: { id: string; name: string } | null;
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  dailyWage: number;
  overtimeEligible: boolean;
  status: 'active' | 'inactive' | 'terminated' | 'archived';
  contactNumber?: string;
  address?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
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
  pfUAN?: string;
  esiNumber?: string;
  pfJoiningDate?: string;
  pfExempted?: boolean;
  esiExempted?: boolean;
  ptExempted?: boolean;
  ptState?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployee {
  employeeCode?: string;
  fullName: string;
  fatherName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
  department: string;
  designation: string;
  shift: string;
  reportingTo?: string;
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  dailyWage?: number;
  overtimeEligible?: boolean;
  contactNumber?: string;
  email?: string;
  emergencyContact?: string;
  address?: string;
  permanentAddress?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    accountType?: 'savings' | 'current';
  };
  pfUAN?: string;
  esiNumber?: string;
  pfJoiningDate?: string;
  pfExempted?: boolean;
  esiExempted?: boolean;
  ptExempted?: boolean;
  ptState?: string;
}

export const employeeService = {
  async getNextCode(): Promise<string> {
    const { data } = await apiClient.get(API_ENDPOINTS.employees.nextCode);
    return data.data.employeeCode;
  },

  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Employee>> {
    const { data } = await apiClient.get<PaginatedResponse<Employee>>(API_ENDPOINTS.employees.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Employee }> {
    const { data } = await apiClient.get(API_ENDPOINTS.employees.get(id));
    return data;
  },

  async create(payload: CreateEmployee): Promise<{ success: boolean; data: Employee }> {
    const { data } = await apiClient.post(API_ENDPOINTS.employees.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateEmployee>): Promise<{ success: boolean; data: Employee }> {
    const { data } = await apiClient.put(API_ENDPOINTS.employees.update(id), payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.employees.delete(id));
  },

  async restore(id: string): Promise<{ success: boolean; data: Employee }> {
    const { data } = await apiClient.post(API_ENDPOINTS.employees.restore(id));
    return data;
  },

  async export(): Promise<Blob> {
    const response = await apiClient.get(API_ENDPOINTS.employees.export, { responseType: 'blob' });
    return response.data;
  },

  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get(API_ENDPOINTS.employees.template, { responseType: 'blob' });
    return response.data;
  },

  async import(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(API_ENDPOINTS.employees.import, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Unwrap the nested response: { success: true, data: { success, failed, errors } }
    const result = data.data || data;
    return {
      success: typeof result.success === 'number' ? result.success : 0,
      failed: typeof result.failed === 'number' ? result.failed : 0,
      errors: Array.isArray(result.errors) ? result.errors : [],
    };
  },

  async uploadDocument(employeeId: string, file: File, documentType: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    const { data } = await apiClient.post(API_ENDPOINTS.employees.uploadDocument(employeeId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteDocument(employeeId: string, docId: string): Promise<any> {
    const { data } = await apiClient.delete(API_ENDPOINTS.employees.removeDocument(employeeId, docId));
    return data;
  },

  getDocumentUrl(employeeId: string, docId: string): string {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseURL}${API_ENDPOINTS.employees.downloadDocument(employeeId, docId)}`;
  },
};