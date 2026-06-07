import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../core/api/apiClient';
import { attendanceService } from '../attendanceService';

vi.mock('../../../../core/api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('attendanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('calls GET /attendance with params', async () => {
      const response = { success: true, message: '', data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      mockApiClient.get.mockResolvedValue({ data: response });
      const result = await attendanceService.list({ page: 1 });
      expect(result).toEqual(response);
      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance', { params: { page: 1 } });
    });

    it('works without params', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, message: '', data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
      await attendanceService.list();
      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance', { params: undefined });
    });
  });

  describe('monthlyView', () => {
    it('calls GET /attendance/monthly-view with month, year, department', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: [] } });
      const result = await attendanceService.monthlyView({ month: 3, year: 2025, department: 'dept1' });
      expect(result).toEqual([]);
      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/monthly-view', { params: { month: 3, year: 2025, department: 'dept1' } });
    });

    it('works without department', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: [] } });
      await attendanceService.monthlyView({ month: 3, year: 2025 });
      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/monthly-view', { params: { month: 3, year: 2025, department: undefined } });
    });
  });

  describe('create', () => {
    it('calls POST /attendance with payload', async () => {
      const payload = { employee: 'emp1', date: '2025-03-15', status: 'present' as const };
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { id: 'att1', ...payload } } });
      const result = await attendanceService.create(payload);
      expect(result.data.id).toBe('att1');
      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance', payload);
    });
  });

  describe('bulkCreate', () => {
    it('calls POST /attendance/bulk with payload', async () => {
      const payload = { date: '2025-03-15', entries: [{ employee: 'emp1', status: 'present' as const }] };
      mockApiClient.post.mockResolvedValue({ data: { success: true } });
      const result = await attendanceService.bulkCreate(payload);
      expect(result).toEqual({ success: true });
      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/bulk', payload);
    });
  });

  describe('bulkUpdate', () => {
    it('calls PATCH /attendance/bulk-update with entries', async () => {
      const entries = [{ id: 'att1', status: 'present' }];
      mockApiClient.patch.mockResolvedValue({ data: { success: true } });
      const result = await attendanceService.bulkUpdate(entries);
      expect(result).toEqual({ success: true });
      expect(mockApiClient.patch).toHaveBeenCalledWith('/attendance/bulk-update', { entries });
    });
  });

  describe('update', () => {
    it('calls PATCH /attendance/:id with payload', async () => {
      mockApiClient.patch.mockResolvedValue({ data: { success: true, data: { id: 'att1', status: 'half-day' } } });
      const result = await attendanceService.update('att1', { status: 'half-day' });
      expect(result.data.status).toBe('half-day');
      expect(mockApiClient.patch).toHaveBeenCalledWith('/attendance/att1', { status: 'half-day' });
    });
  });

  describe('delete', () => {
    it('calls DELETE /attendance/:id', async () => {
      mockApiClient.delete.mockResolvedValue({});
      await attendanceService.delete('att1');
      expect(mockApiClient.delete).toHaveBeenCalledWith('/attendance/att1');
    });
  });

  describe('getByEmployee', () => {
    it('calls GET /attendance/employee/:employeeId', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: [{ id: 'att1' }] } });
      const result = await attendanceService.getByEmployee('emp1');
      expect(result).toEqual([{ id: 'att1' }]);
      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/employee/emp1', { params: {} });
    });

    it('passes date range params', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: [] } });
      await attendanceService.getByEmployee('emp1', '2025-03-01', '2025-03-31');
      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/employee/emp1', { params: { startDate: '2025-03-01', endDate: '2025-03-31' } });
    });
  });
});
