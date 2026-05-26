import apiClient from '../../../core/api/apiClient';

export interface KioskDevice {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  lastSeenAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKioskDevice {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateKioskDevice {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
}

export const kioskService = {
  async list(params?: Record<string, unknown>) {
    const { data } = await apiClient.get('/kiosk/devices', { params });
    return data;
  },

  async create(payload: CreateKioskDevice) {
    const { data } = await apiClient.post('/kiosk/devices', payload);
    return data;
  },

  async update(id: string, payload: UpdateKioskDevice) {
    const { data } = await apiClient.patch(`/kiosk/devices/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    await apiClient.delete(`/kiosk/devices/${id}`);
  },

  async getQR(kioskId: string) {
    const { data } = await apiClient.get(`/kiosk/${kioskId}/qr`);
    return data;
  },

  async broadcast(kioskId: string) {
    const { data } = await apiClient.post(`/kiosk/${kioskId}/broadcast`);
    return data;
  },
};
