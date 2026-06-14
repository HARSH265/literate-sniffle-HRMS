import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface Asset {
  _id: string;
  assetCode: string;
  name: string;
  category: string;
  description?: string;
  serialNumber?: string;
  brand?: string;
  assetModel?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition: string;
  status: 'available' | 'allocated' | 'maintenance' | 'retired';
  location?: string;
  assignedTo?: { _id: string; fullName: string; employeeCode: string };
  assignedAt?: string;
  returnedAt?: string;
  notes?: string;
  history: {
    employee?: { _id: string; fullName: string; employeeCode: string };
    action: 'allocated' | 'returned' | 'maintenance' | 'retired';
    date: string;
    notes?: string;
  }[];
  createdBy: { _id: string; name: string; email: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  assignedTo?: string;
  search?: string;
  sort?: string;
}

export const assetService = {
  async list(params?: ListParams): Promise<{ success: boolean; data: Asset[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.assets.list, { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Asset }> {
    const { data } = await apiClient.get(API_ENDPOINTS.assets.get(id));
    return data;
  },

  async create(payload: {
    name: string;
    category: string;
    description?: string;
    serialNumber?: string;
    brand?: string;
    assetModel?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    condition?: string;
    location?: string;
    notes?: string;
  }): Promise<{ success: boolean; data: Asset; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.assets.create, payload);
    return data;
  },

  async update(id: string, payload: Partial<{
    name: string;
    category: string;
    description: string;
    serialNumber: string;
    brand: string;
    assetModel: string;
    purchaseDate: string;
    purchasePrice: number;
    condition: string;
    location: string;
    notes: string;
  }>): Promise<{ success: boolean; data: Asset; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.assets.update(id), payload);
    return data;
  },

  async allocate(assetId: string, employeeId: string, notes?: string): Promise<{ success: boolean; data: Asset; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.assets.allocate(assetId), { employeeId, notes });
    return data;
  },

  async returnAsset(assetId: string, condition?: string, notes?: string): Promise<{ success: boolean; data: Asset; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.assets.returnAsset(assetId), { condition, notes });
    return data;
  },

  async markMaintenance(assetId: string, notes?: string): Promise<{ success: boolean; data: Asset; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.assets.maintenance(assetId), { notes });
    return data;
  },

  async retire(assetId: string, notes?: string): Promise<{ success: boolean; data: Asset; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.assets.retire(assetId), { notes });
    return data;
  },

  async getEmployeeAssets(employeeId: string): Promise<{ success: boolean; data: Asset[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.assets.employeeAssets(employeeId));
    return data;
  },

  async getStats(): Promise<{ success: boolean; data: { total: number; byStatus: Record<string, number>; byCategory: Record<string, number> } }> {
    const { data } = await apiClient.get(API_ENDPOINTS.assets.stats);
    return data;
  },

  async getHistory(id: string): Promise<{ success: boolean; data: Asset['history'] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.assets.history(id));
    return data;
  },
};
