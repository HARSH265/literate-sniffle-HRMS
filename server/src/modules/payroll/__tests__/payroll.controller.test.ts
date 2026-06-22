import { describe, it, expect, vi, beforeEach } from 'vitest';
import { payrollController } from '../payroll.controller.js';
import { PayrollService } from '../payroll.service.js';

vi.mock('../payroll.service.js', () => ({
  PayrollService: {
    listRuns: vi.fn(),
    runPayroll: vi.fn(),
    previewRun: vi.fn(),
    submitRun: vi.fn(),
    approveRun: vi.fn(),
    rejectRun: vi.fn(),
    supplementaryRun: vi.fn(),
    finalizeRun: vi.fn(),
    getRunDetails: vi.fn(),
    unfinalizeRun: vi.fn(),
    updatePayrollItem: vi.fn(),
    batchUpdateItems: vi.fn(),
    deleteRun: vi.fn(),
    getByEmployee: vi.fn(),
  },
}));

function mockReq(overrides: Record<string, any> = {}): any {
  return { body: {}, params: {}, query: {}, user: { id: 'u1', role: 'super-admin', employeeId: 'emp1' }, ip: '127.0.0.1', ...overrides };
}

function mockRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('payroll.controller', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('validateMonthYear via runPayroll', () => {
    it('rejects month < 1', async () => {
      const req = mockReq({ body: { month: 0, year: 2025 } });
      const res = mockRes();
      const next = vi.fn();
      // asyncHandler catches the error and calls next
      const handler = (payrollController as any).runPayroll;
      handler(req, res, next);
      // Give the promise chain a tick to settle
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Month') }));
    });

    it('rejects month > 12', async () => {
      const req = mockReq({ body: { month: 13, year: 2025 } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).runPayroll(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Month') }));
    });

    it('rejects year < 2000', async () => {
      const req = mockReq({ body: { month: 6, year: 1999 } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).runPayroll(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Year') }));
    });

    it('rejects year > 2100', async () => {
      const req = mockReq({ body: { month: 6, year: 2101 } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).runPayroll(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Year') }));
    });

    it('rejects missing month', async () => {
      const req = mockReq({ body: { year: 2025 } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).runPayroll(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Month and year are required' }));
    });

    it('rejects missing year', async () => {
      const req = mockReq({ body: { month: 6 } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).runPayroll(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Month and year are required' }));
    });

    it('accepts valid month/year', async () => {
      vi.mocked(PayrollService.runPayroll).mockResolvedValue({ id: 'r1', status: 'draft' });
      const req = mockReq({ body: { month: 6, year: 2025 } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).runPayroll(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(PayrollService.runPayroll).toHaveBeenCalledWith(6, 2025, 'u1');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getByEmployee authorization', () => {
    it('allows admin to view any employee', async () => {
      vi.mocked(PayrollService.getByEmployee).mockResolvedValue([]);
      const req = mockReq({ params: { employeeId: 'emp-other' }, user: { id: 'u1', role: 'super-admin', employeeId: 'emp1' } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).getByEmployee(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(PayrollService.getByEmployee).toHaveBeenCalledWith('emp-other');
    });

    it('allows employee to view own data', async () => {
      vi.mocked(PayrollService.getByEmployee).mockResolvedValue([]);
      const req = mockReq({ params: { employeeId: 'emp1' }, user: { id: 'u1', role: 'employee', employeeId: 'emp1' } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).getByEmployee(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(PayrollService.getByEmployee).toHaveBeenCalledWith('emp1');
    });

    it('rejects employee viewing other employee data', async () => {
      const req = mockReq({ params: { employeeId: 'emp-other' }, user: { id: 'u1', role: 'employee', employeeId: 'emp1' } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).getByEmployee(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized', statusCode: 403 }));
    });

    it('rejects worker role viewing other employee data', async () => {
      const req = mockReq({ params: { employeeId: 'emp-other' }, user: { id: 'u1', role: 'worker', employeeId: 'emp1' } });
      const res = mockRes();
      const next = vi.fn();
      (payrollController as any).getByEmployee(req, res, next);
      await new Promise(r => setTimeout(r, 10));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized', statusCode: 403 }));
    });
  });
});
