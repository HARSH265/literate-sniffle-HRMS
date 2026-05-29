import apiClient from '../../../core/api/apiClient';

export interface EssProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  fatherName: string;
  department: { id: string; name: string } | null;
  designation: { id: string; name: string } | null;
  shift: { id: string; name: string } | null;
  joiningDate: string;
  contactNumber?: string;
  address?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: 'savings' | 'current';
  };
  editableFields: string[];
  photo?: string;
}

export interface ChangeRequest {
  id: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: { id: string; name: string };
  rejectionReason?: string;
}

export const essService = {
  async getProfile(): Promise<{ success: boolean; data: EssProfile }> {
    const { data } = await apiClient.get('/ess/profile');
    return data;
  },

  async updateProfile(payload: Record<string, unknown>): Promise<{ success: boolean; data: { message: string } }> {
    const { data } = await apiClient.put('/ess/profile', payload);
    return data;
  },

  async getChangeRequests(params?: Record<string, unknown>): Promise<{ success: boolean; data: ChangeRequest[]; meta: any }> {
    const { data } = await apiClient.get('/ess/change-requests', { params });
    return data;
  },

  async getAllChangeRequests(params?: Record<string, unknown>): Promise<{ success: boolean; data: ChangeRequest[]; meta: any }> {
    const { data } = await apiClient.get('/ess/change-requests/all', { params });
    return data;
  },

  async createChangeRequest(payload: { field: string; newValue: unknown; notes?: string }): Promise<{ success: boolean; data: { message: string; requestId: string } }> {
    const { data } = await apiClient.post('/ess/change-requests', payload);
    return data;
  },

  async approveChangeRequest(id: string, notes?: string): Promise<{ success: boolean; data: { message: string } }> {
    const { data } = await apiClient.patch(`/ess/change-requests/${id}/approve`, { notes });
    return data;
  },

  async rejectChangeRequest(id: string, reason: string): Promise<{ success: boolean; data: { message: string } }> {
    const { data } = await apiClient.patch(`/ess/change-requests/${id}/reject`, { reason });
    return data;
  },

  async getStats(): Promise<{ success: boolean; data: { pending: number; approved: number; rejected: number; total: number } }> {
    const { data } = await apiClient.get('/ess/stats');
    return data;
  },

  async getAttendance(month: string): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get('/ess/attendance', {
      params: { month },
    });
    return data;
  },

  async getLeaveBalances(): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get('/ess/leave/balances');
    return data;
  },

  async getLeaveApplications(): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get('/ess/leave/applications');
    return data;
  },

  async getDocuments(): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get('/ess/documents');
    return data;
  },

  async getAssets(): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get('/ess/assets');
    return data;
  },

  async getMyTraining(): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get('/training/enrollments/my');
    return data;
  },

  async getPayslips(): Promise<{ success: boolean; data: any[] }> {
    const { data } = await apiClient.get('/ess/payslips');
    return data;
  },

  async getMySwaps(params?: any): Promise<{ success: boolean; data: any[]; meta: any }> {
    const { data } = await apiClient.get('/shift-swaps/my', { params });
    return data;
  },

  async requestSwap(payload: any): Promise<{ success: boolean; data: any; message: string }> {
    const { data } = await apiClient.post('/shift-swaps', payload);
    return data;
  },

  async cancelSwap(id: string): Promise<{ success: boolean; data: any; message: string }> {
    const { data } = await apiClient.post(`/shift-swaps/${id}/cancel`);
    return data;
  },

  async getSwapEligibility(): Promise<{ success: boolean; data: { maxSwaps: number; usedSwaps: number; remainingSwaps: number; shiftSwapEnabled: boolean } }> {
    const { data } = await apiClient.get('/shift-swaps/eligibility');
    return data;
  },

  async getSwapPreference(): Promise<{ success: boolean; data: any }> {
    const { data } = await apiClient.get('/shift-swaps/preferences');
    return data;
  },

  async setSwapPreference(payload: any): Promise<{ success: boolean; data: any; message: string }> {
    const { data } = await apiClient.put('/shift-swaps/preferences', payload);
    return data;
  },
};
