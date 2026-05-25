import apiClient from '../../../core/api/apiClient';

export interface QRCheckInResponse {
  success: boolean;
  data: {
    id: string;
    status: string;
    inTime: string;
    isLate: boolean;
    message: string;
  };
}

export interface QRCheckOutResponse {
  success: boolean;
  data: {
    id: string;
    outTime: string;
    message: string;
  };
}

export const attendanceQRService = {
  async checkIn(payload: { token: string; totpCode: string; employeeId: string; deviceId?: string; latitude?: number; longitude?: number; gpsAccuracy?: number }): Promise<QRCheckInResponse> {
    const { data } = await apiClient.post('/attendance/qr/check-in', payload);
    return data;
  },

  async checkOut(payload: { token: string; totpCode: string; employeeId: string; deviceId?: string; latitude?: number; longitude?: number; gpsAccuracy?: number }): Promise<QRCheckOutResponse> {
    const { data } = await apiClient.post('/attendance/qr/check-out', payload);
    return data;
  },
};

export const totpService = {
  async enroll(employeeId: string): Promise<{ success: boolean; data: { qrUrl: string; secret: string } }> {
    const { data } = await apiClient.post('/totp/enroll', { employeeId });
    return data;
  },

  async verify(employeeId: string, token: string): Promise<{ success: boolean; data: { valid: boolean } }> {
    const { data } = await apiClient.post('/totp/verify', { employeeId, token });
    return data;
  },

  async disable(employeeId: string): Promise<void> {
    await apiClient.post('/totp/disable', { employeeId });
  },
};
