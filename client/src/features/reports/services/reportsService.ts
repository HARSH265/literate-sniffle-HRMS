import apiClient from '../../../core/api/apiClient';

export const reportsService = {
  async getScheduledConfig(): Promise<any> {
    const { data } = await apiClient.get('/reports/scheduled-export-config');
    return data;
  },

  async saveScheduledConfig(payload: { reportsConfig: any }): Promise<any> {
    const { data } = await apiClient.patch('/reports/scheduled-export-config', payload);
    return data;
  },
};
