import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../core/api/apiClient';
import { salarySlipService } from '../salarySlipService';

vi.mock('../../../../core/api/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe('salarySlipService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('calls GET /salary-slips with params', async () => {
      const response = { success: true, data: [{ id: 'slip1', month: '2025-03', status: 'finalized', totalEmployees: 5, totalNetPay: 250000, generatedAt: '2025-04-01' }] };
      mockApiClient.get.mockResolvedValue({ data: response });
      const result = await salarySlipService.list({ month: '2025-03' });
      expect(result).toEqual(response);
      expect(mockApiClient.get).toHaveBeenCalledWith('/salary-slips', { params: { month: '2025-03' } });
    });
  });

  describe('generatePdf', () => {
    it('calls GET /salary-slips/:runId/pdf', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: { url: 'pdf-url' } } });
      const result = await salarySlipService.generatePdf('run1');
      expect(result.data.url).toBe('pdf-url');
      expect(mockApiClient.get).toHaveBeenCalledWith('/salary-slips/run1/pdf', { params: undefined });
    });

    it('passes employeeId param when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: {} } });
      await salarySlipService.generatePdf('run1', 'emp1');
      expect(mockApiClient.get).toHaveBeenCalledWith('/salary-slips/run1/pdf', { params: { employeeId: 'emp1' } });
    });
  });

  describe('preview', () => {
    it('calls GET /salary-slips/:runId/preview', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: { summary: {} } } });
      const result = await salarySlipService.preview('run1');
      expect(result.data.summary).toEqual({});
      expect(mockApiClient.get).toHaveBeenCalledWith('/salary-slips/run1/preview', { params: undefined });
    });

    it('passes employeeId param when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: {} } });
      await salarySlipService.preview('run1', 'emp1');
      expect(mockApiClient.get).toHaveBeenCalledWith('/salary-slips/run1/preview', { params: { employeeId: 'emp1' } });
    });
  });
});
