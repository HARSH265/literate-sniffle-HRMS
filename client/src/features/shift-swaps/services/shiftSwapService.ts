import apiClient from '../../../core/api/apiClient';
import type {
  RequestSwapPayload,
  SetPreferencePayload,
  SwapListParams,
  ShiftSwapPaginatedResponse,
  ShiftSwapSingleResponse,
  SwapEligibility,
  ShiftPreferencePopulated,
} from '../types/shiftSwapTypes';

export const shiftSwapService = {
  async list(params?: SwapListParams): Promise<ShiftSwapPaginatedResponse> {
    const { data } = await apiClient.get('/shift-swaps', { params });
    return data;
  },

  async getMySwaps(params?: SwapListParams): Promise<ShiftSwapPaginatedResponse> {
    const { data } = await apiClient.get('/shift-swaps/my', { params });
    return data;
  },

  async getPendingApprovals(): Promise<ShiftSwapPaginatedResponse> {
    const { data } = await apiClient.get('/shift-swaps/pending');
    return data;
  },

  async checkEligibility(): Promise<{ success: boolean; data: SwapEligibility }> {
    const { data } = await apiClient.get('/shift-swaps/eligibility');
    return data;
  },

  async getById(id: string): Promise<ShiftSwapSingleResponse> {
    const { data } = await apiClient.get(`/shift-swaps/${id}`);
    return data;
  },

  async requestSwap(payload: RequestSwapPayload): Promise<ShiftSwapSingleResponse> {
    const { data } = await apiClient.post('/shift-swaps', payload);
    return data;
  },

  async approveSwap(id: string): Promise<ShiftSwapSingleResponse> {
    const { data } = await apiClient.post(`/shift-swaps/${id}/approve`);
    return data;
  },

  async rejectSwap(id: string, rejectionReason?: string): Promise<ShiftSwapSingleResponse> {
    const { data } = await apiClient.post(`/shift-swaps/${id}/reject`, { rejectionReason });
    return data;
  },

  async cancelSwap(id: string): Promise<ShiftSwapSingleResponse> {
    const { data } = await apiClient.post(`/shift-swaps/${id}/cancel`);
    return data;
  },

  async getPreference(): Promise<{ success: boolean; data: ShiftPreferencePopulated }> {
    const { data } = await apiClient.get('/shift-swaps/preferences');
    return data;
  },

  async setPreference(payload: SetPreferencePayload): Promise<{ success: boolean; data: ShiftPreferencePopulated }> {
    const { data } = await apiClient.put('/shift-swaps/preferences', payload);
    return data;
  },
};
