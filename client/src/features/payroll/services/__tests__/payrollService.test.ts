import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../core/api/apiClient';
import { payrollService } from '../payrollService';

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

describe('payrollService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listRuns', () => {
    it('calls GET /payroll/runs with params', async () => {
      const response = { success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      mockApiClient.get.mockResolvedValue({ data: response });
      const result = await payrollService.listRuns({ page: 1 });
      expect(result).toEqual(response);
      expect(mockApiClient.get).toHaveBeenCalledWith('/payroll/runs', { params: { page: 1 } });
    });
  });

  describe('runPayroll', () => {
    it('calls POST /payroll/run with month and year', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { id: 'run1' } } });
      const result = await payrollService.runPayroll(3, 2025);
      expect(result.data.id).toBe('run1');
      expect(mockApiClient.post).toHaveBeenCalledWith('/payroll/run', { month: 3, year: 2025 });
    });
  });

  describe('previewRun', () => {
    it('calls POST /payroll/preview with month and year', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { summary: {} } } });
      const result = await payrollService.previewRun(3, 2025);
      expect(result.data.summary).toEqual({});
      expect(mockApiClient.post).toHaveBeenCalledWith('/payroll/preview', { month: 3, year: 2025 });
    });
  });

  describe('getRunDetails', () => {
    it('calls GET /payroll/run/:id', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: { id: 'run1' } } });
      const result = await payrollService.getRunDetails('run1');
      expect(result.data.id).toBe('run1');
      expect(mockApiClient.get).toHaveBeenCalledWith('/payroll/run/run1');
    });
  });

  describe('submitRun', () => {
    it('calls POST /payroll/run/:id/submit', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { status: 'submitted' } } });
      const result = await payrollService.submitRun('run1');
      expect(result.data.status).toBe('submitted');
      expect(mockApiClient.post).toHaveBeenCalledWith('/payroll/run/run1/submit');
    });
  });

  describe('approveRun', () => {
    it('calls POST /payroll/run/:id/approve', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { status: 'approved' } } });
      const result = await payrollService.approveRun('run1');
      expect(result.data.status).toBe('approved');
      expect(mockApiClient.post).toHaveBeenCalledWith('/payroll/run/run1/approve');
    });
  });

  describe('rejectRun', () => {
    it('calls POST /payroll/run/:id/reject with reason', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { status: 'draft' } } });
      const result = await payrollService.rejectRun('run1', 'Fix errors');
      expect(result.data.status).toBe('draft');
      expect(mockApiClient.post).toHaveBeenCalledWith('/payroll/run/run1/reject', { reason: 'Fix errors' });
    });
  });

  describe('updatePayrollItem', () => {
    it('calls PATCH /payroll/run/:runId/item/:itemId', async () => {
      mockApiClient.patch.mockResolvedValue({ data: { success: true, data: { netPay: 30000 } } });
      const result = await payrollService.updatePayrollItem('run1', 'item1', { netPay: 30000 });
      expect(result.data.netPay).toBe(30000);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/payroll/run/run1/item/item1', { netPay: 30000 });
    });
  });

  describe('batchUpdateItems', () => {
    it('calls PATCH /payroll/run/:runId/items/batch', async () => {
      const items = [{ itemId: 'item1', data: { netPay: 30000 } }];
      mockApiClient.patch.mockResolvedValue({ data: { success: true, data: {} } });
      const result = await payrollService.batchUpdateItems('run1', items);
      expect(result).toEqual({ success: true, data: {} });
      expect(mockApiClient.patch).toHaveBeenCalledWith('/payroll/run/run1/items/batch', { items });
    });
  });

  describe('finalizeRun', () => {
    it('calls POST /payroll/run/:id/finalize with remarks', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { status: 'finalized' } } });
      const result = await payrollService.finalizeRun('run1', 'All good');
      expect(result.data.status).toBe('finalized');
      expect(mockApiClient.post).toHaveBeenCalledWith('/payroll/run/run1/finalize', { remarks: 'All good' });
    });
  });

  describe('unfinalizeRun', () => {
    it('calls POST /payroll/run/:id/unfinalize with reason', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: { status: 'draft' } } });
      const result = await payrollService.unfinalizeRun('run1', 'Need changes');
      expect(result.data.status).toBe('draft');
      expect(mockApiClient.post).toHaveBeenCalledWith('/payroll/run/run1/unfinalize', { reason: 'Need changes' });
    });
  });

  describe('deleteRun', () => {
    it('calls DELETE /payroll/run/:id', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });
      const result = await payrollService.deleteRun('run1');
      expect(result).toEqual({ success: true });
      expect(mockApiClient.delete).toHaveBeenCalledWith('/payroll/run/run1');
    });
  });

  describe('getByEmployee', () => {
    it('calls GET /payroll/runs/employee/:employeeId', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: [{ id: 'item1', netPay: 25000 }] } });
      const result = await payrollService.getByEmployee('emp1');
      expect(result).toHaveLength(1);
      expect(result[0].netPay).toBe(25000);
      expect(mockApiClient.get).toHaveBeenCalledWith('/payroll/runs/employee/emp1');
    });
  });
});
