import apiClient from '../../../core/api/apiClient';

export const shiftSwapService = {
  async list(params?: any) {
    const { data } = await apiClient.get('/shift-swaps', { params });
    return data;
  },

  async getMySwaps(params?: any) {
    const { data } = await apiClient.get('/shift-swaps/my', { params });
    return data;
  },

  async getPendingApprovals() {
    const { data } = await apiClient.get('/shift-swaps/pending');
    return data;
  },

  async checkEligibility() {
    const { data } = await apiClient.get('/shift-swaps/eligibility');
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/shift-swaps/${id}`);
    return data;
  },

  async requestSwap(payload: any) {
    const { data } = await apiClient.post('/shift-swaps', payload);
    return data;
  },

  async approveSwap(id: string) {
    const { data } = await apiClient.post(`/shift-swaps/${id}/approve`);
    return data;
  },

  async rejectSwap(id: string, rejectionReason?: string) {
    const { data } = await apiClient.post(`/shift-swaps/${id}/reject`, { rejectionReason });
    return data;
  },

  async cancelSwap(id: string) {
    const { data } = await apiClient.post(`/shift-swaps/${id}/cancel`);
    return data;
  },

  async getPreference() {
    const { data } = await apiClient.get('/shift-swaps/preferences');
    return data;
  },

  async setPreference(payload: any) {
    const { data } = await apiClient.put('/shift-swaps/preferences', payload);
    return data;
  },
};
