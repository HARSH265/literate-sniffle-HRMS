import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../core/api/apiClient';
import { leaveService } from '../leaveService';

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

describe('leaveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listLeaveTypes', () => {
    it('calls GET /leave/types', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: [{ id: 'lt1', name: 'Sick' }] } });
      const result = await leaveService.listLeaveTypes();
      expect(result.data).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/types');
    });
  });

  describe('createLeaveType', () => {
    it('calls POST /leave/types with payload', async () => {
      const payload = { name: 'Sick Leave', code: 'SL', color: '#ff0000', maxDaysPerApplication: 10, maxDaysPerYear: 30, isPaid: true, carryForward: false, carryForwardLimit: 0, encashable: false, encashmentRatePercent: 0, requiresDocuments: false, requiresApproval: true, approvalLevels: 1, autoApproveThreshold: 0, applicableToGender: 'all', applicableCategories: [], applicableEmploymentTypes: [], deductionMethod: 'no-pay', accrualMethod: 'monthly', proRataOnJoin: true, allowNegativeBalance: false, isActive: true, sortOrder: 1 } as any;
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { id: 'lt1', ...payload } } });
      const result = await leaveService.createLeaveType(payload);
      expect(result.data.id).toBe('lt1');
      expect(mockApiClient.post).toHaveBeenCalledWith('/leave/types', payload);
    });
  });

  describe('updateLeaveType', () => {
    it('calls PATCH /leave/types/:id with payload', async () => {
      mockApiClient.patch.mockResolvedValue({ data: { success: true, data: { id: 'lt1', name: 'Updated' } } });
      const result = await leaveService.updateLeaveType('lt1', { name: 'Updated' });
      expect(result.data.name).toBe('Updated');
      expect(mockApiClient.patch).toHaveBeenCalledWith('/leave/types/lt1', { name: 'Updated' });
    });
  });

  describe('deleteLeaveType', () => {
    it('calls DELETE /leave/types/:id', async () => {
      mockApiClient.delete.mockResolvedValue({});
      await leaveService.deleteLeaveType('lt1');
      expect(mockApiClient.delete).toHaveBeenCalledWith('/leave/types/lt1');
    });
  });

  describe('listApplications', () => {
    it('calls GET /leave/applications with params', async () => {
      const response = { success: true, message: '', data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      mockApiClient.get.mockResolvedValue({ data: response });
      const result = await leaveService.listApplications({ status: 'pending' });
      expect(result).toEqual(response);
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/applications', { params: { status: 'pending' } });
    });
  });

  describe('getMyApplications', () => {
    it('calls GET /leave/applications/my', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: [{ id: 'app1' }] } });
      const result = await leaveService.getMyApplications();
      expect(result.data).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/applications/my', { params: undefined });
    });
  });

  describe('createApplication', () => {
    it('calls POST /leave/applications with payload', async () => {
      const payload = { employee: 'emp1', leaveType: 'lt1', startDate: '2025-04-01', endDate: '2025-04-02', reason: 'Sick' };
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { id: 'app1', ...payload } } });
      const result = await leaveService.createApplication(payload);
      expect(result.data.id).toBe('app1');
      expect(mockApiClient.post).toHaveBeenCalledWith('/leave/applications', payload);
    });
  });

  describe('cancelApplication', () => {
    it('calls PATCH /leave/applications/:id/cancel', async () => {
      mockApiClient.patch.mockResolvedValue({ data: { success: true, data: { id: 'app1', status: 'cancelled' } } });
      const result = await leaveService.cancelApplication('app1');
      expect(result.data.status).toBe('cancelled');
      expect(mockApiClient.patch).toHaveBeenCalledWith('/leave/applications/app1/cancel');
    });
  });

  describe('approveApplication', () => {
    it('calls POST /leave/applications/approve', async () => {
      const payload = { applicationId: 'app1', status: 'approved' as const, remarks: 'OK' };
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { id: 'app1', status: 'approved' } } });
      const result = await leaveService.approveApplication(payload);
      expect(result.data.status).toBe('approved');
      expect(mockApiClient.post).toHaveBeenCalledWith('/leave/applications/approve', payload);
    });
  });

  describe('getPendingApprovals', () => {
    it('calls GET /leave/approvals/pending', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: [{ id: 'app1' }] } });
      const result = await leaveService.getPendingApprovals();
      expect(result.data).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/approvals/pending', { params: undefined });
    });
  });

  describe('getBalances', () => {
    it('calls GET /leave/balances/:employeeId', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: [{ leaveType: { id: 'lt1', name: 'Sick', code: 'SL', color: '#f00', isPaid: true }, year: 2025, totalEntitled: 12, totalUsed: 2, totalPending: 0, carryForward: 0, balance: 10 }] } });
      const result = await leaveService.getBalances('emp1', 2025);
      expect(result.data).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/balances/emp1', { params: { year: 2025 } });
    });
  });

  describe('getMyBalances', () => {
    it('calls GET /leave/balances/my', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: [] } });
      const result = await leaveService.getMyBalances(2025);
      expect(result.data).toEqual([]);
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/balances/my', { params: { year: 2025 } });
    });
  });

  describe('accrueLeave', () => {
    it('calls POST /leave/accrue', async () => {
      const payload = { leaveTypeId: 'lt1', year: 2025 };
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: {} } });
      const result = await leaveService.accrueLeave(payload);
      expect(result).toEqual({ success: true, data: {} });
      expect(mockApiClient.post).toHaveBeenCalledWith('/leave/accrue', payload);
    });
  });

  describe('getCalendar', () => {
    it('calls GET /leave/calendar', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: [] } });
      const result = await leaveService.getCalendar({ year: 2025 });
      expect(result.data).toEqual([]);
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/calendar', { params: { year: 2025 } });
    });
  });

  describe('getSummary', () => {
    it('calls GET /leave/summary', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: { total: 10 } } });
      const result = await leaveService.getSummary();
      expect(result.data).toEqual({ total: 10 });
      expect(mockApiClient.get).toHaveBeenCalledWith('/leave/summary', { params: undefined });
    });
  });
});
