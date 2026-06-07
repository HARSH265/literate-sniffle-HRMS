import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';

const mockPayrollRunFindById = vi.fn();
const mockPayrollItemFind = vi.fn();

vi.mock('../../../models/PayrollRun.model.js', () => ({
  default: { findById: (...args: any[]) => mockPayrollRunFindById(...args) },
}));
vi.mock('../../../models/PayrollItem.model.js', () => ({
  default: { find: (...args: any[]) => mockPayrollItemFind(...args) },
}));
vi.mock('../../../core/audit/AuditService.js', () => ({
  AuditService: { log: vi.fn() },
}));

import { generateBankFile } from '../bankfile.service.js';

function mockRes(): Response {
  const res = {
    setHeader: vi.fn(),
    send: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return res;
}

function chainReturn(value: any) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

function populateChain(items: any[]) {
  return {
    populate: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(items),
    }),
  };
}

describe('BankFile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when payroll run not found', async () => {
    mockPayrollRunFindById.mockReturnValue(chainReturn(null));
    const res = mockRes();
    await generateBankFile('run1', 'neft', res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('generates NEFT file with correct format', async () => {
    mockPayrollRunFindById.mockReturnValue(chainReturn({ _id: 'run1', month: '2024-01' }));
    mockPayrollItemFind.mockReturnValue(populateChain([
      {
        netPay: 25000,
        bankSplitPercent: 0,
        employee: {
          fullName: 'John Doe',
          employeeCode: 'EMP001',
          bankDetails: { accountNumber: '1234567890', ifscCode: 'SBIN0001234', bankName: 'SBI' },
        },
      },
    ]));

    const res = mockRes();
    await generateBankFile('run1', 'neft', res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('neft'));
    expect(res.send).toHaveBeenCalled();
    const content = (res.send as any).mock.calls[0][0] as string;
    expect(content).toContain('John Doe');
    expect(content).toContain('1234567890');
    expect(content).toContain('25000.00');
  });

  it('skips employees without bank account', async () => {
    mockPayrollRunFindById.mockReturnValue(chainReturn({ _id: 'run1', month: '2024-01' }));
    mockPayrollItemFind.mockReturnValue(populateChain([
      {
        netPay: 25000,
        employee: { fullName: 'No Bank', employeeCode: 'EMP002', bankDetails: {} },
      },
    ]));

    const res = mockRes();
    await generateBankFile('run1', 'neft', res);
    const content = (res.send as any).mock.calls[0][0] as string;
    expect(content).not.toContain('No Bank');
  });

  it('handles bank split correctly', async () => {
    mockPayrollRunFindById.mockReturnValue(chainReturn({ _id: 'run1', month: '2024-01' }));
    mockPayrollItemFind.mockReturnValue(populateChain([
      {
        netPay: 20000,
        bankSplitPercent: 60,
        primaryBankAmount: 12000,
        secondaryBankAmount: 8000,
        employee: {
          fullName: 'Split Employee',
          employeeCode: 'EMP003',
          bankDetails: { accountNumber: '1111111111', ifscCode: 'HDFC0001111', bankName: 'HDFC' },
          secondaryBank: { accountNumber: '2222222222', ifscCode: 'ICIC0002222', bankName: 'ICICI' },
        },
      },
    ]));

    const res = mockRes();
    await generateBankFile('run1', 'neft', res);
    const content = (res.send as any).mock.calls[0][0] as string;
    expect(content).toContain('1111111111');
    expect(content).toContain('2222222222');
  });

  it('generates NACH CSV format', async () => {
    mockPayrollRunFindById.mockReturnValue(chainReturn({ _id: 'run1', month: '2024-01' }));
    mockPayrollItemFind.mockReturnValue(populateChain([
      {
        netPay: 25000,
        employee: {
          fullName: 'CSV Employee',
          employeeCode: 'EMP004',
          bankDetails: { accountNumber: '3333333333', ifscCode: 'SBIN0003333', bankName: 'SBI' },
        },
      },
    ]));

    const res = mockRes();
    await generateBankFile('run1', 'nach', res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    const content = (res.send as any).mock.calls[0][0] as string;
    expect(content).toContain('Employee Name,Account Number');
  });
});
