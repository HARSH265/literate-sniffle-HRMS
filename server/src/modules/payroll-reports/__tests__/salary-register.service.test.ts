import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import type { Response } from 'express';

const mockPayrollRunFindById = vi.fn();
const mockPayrollItemFind = vi.fn();
const mockEmployeeFind = vi.fn();

vi.mock('../../../models/PayrollRun.model.js', () => ({
  default: { findById: (...args: any[]) => mockPayrollRunFindById(...args) },
}));
vi.mock('../../../models/PayrollItem.model.js', () => ({
  default: { find: (...args: any[]) => mockPayrollItemFind(...args) },
}));
vi.mock('../../../models/Employee.model.js', () => ({
  default: { find: (...args: any[]) => mockEmployeeFind(...args) },
}));
vi.mock('../../../core/audit/AuditService.js', () => ({
  AuditService: { log: vi.fn() },
}));

const mockAddRow = vi.fn().mockReturnValue({
  eachCell: vi.fn(),
  getCell: vi.fn().mockReturnValue({ numFmt: '' }),
});
const mockSummaryAddRow = vi.fn().mockReturnValue({
  eachCell: vi.fn(),
  getCell: vi.fn().mockReturnValue({ numFmt: '' }),
});
let addRowCallCount = 0;
const mockSheet = {
  addRow: vi.fn().mockImplementation(() => {
    addRowCallCount++;
    if (addRowCallCount === 1) return { eachCell: vi.fn(), getCell: vi.fn().mockReturnValue({ numFmt: '' }) };
    return { eachCell: vi.fn(), getCell: vi.fn().mockReturnValue({ numFmt: '' }) };
  }),
  columns: [] as any[],
  views: [] as any[],
  eachCell: vi.fn(),
};
const mockWorkbook = {
  addWorksheet: vi.fn().mockReturnValue(mockSheet),
  xlsx: { write: vi.fn().mockResolvedValue(undefined) },
};

vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn(() => mockWorkbook),
  },
}));

import { generateSalaryRegister } from '../salary-register.service.js';

function mockRes(): Response {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    end: vi.fn(),
  } as unknown as Response;
  return res;
}

function chainReturn(value: any) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

function findChain(items: any[]) {
  return {
    populate: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(items),
      }),
    }),
  };
}

const VALID_RUN_ID = new mongoose.Types.ObjectId().toString();

describe('Salary Register Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addRowCallCount = 0;
  });

  it('returns 404 when payroll run not found', async () => {
    mockPayrollRunFindById.mockReturnValue(chainReturn(null));
    const res = mockRes();
    await generateSalaryRegister(VALID_RUN_ID, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('generates Excel for valid payroll run', async () => {
    mockPayrollRunFindById.mockReturnValue(chainReturn({ _id: VALID_RUN_ID, month: '2024-01' }));
    mockPayrollItemFind.mockReturnValue(findChain([
      {
        basicEarnings: 30000,
        grossEarnings: 38000,
        totalDeductions: 6000,
        netPay: 32000,
        totalDays: 31,
        effectiveWorkingDays: 26,
        allowances: [{ name: 'HRA', calculatedValue: 8000 }],
        deductions: [{ name: 'PF', calculatedValue: 3600 }, { name: 'ESI', calculatedValue: 2400 }],
        componentWiseEarnings: [{ component: { code: 'BASIC' }, computedAmount: 30000 }],
        componentWiseDeductions: [{ component: { code: 'PF_DED' }, computedAmount: 3600 }],
        employee: { employeeCode: 'EMP001', fullName: 'Test Emp', department: 'Engineering', designation: 'SDE' },
      },
    ]));

    const res = mockRes();
    await generateSalaryRegister(VALID_RUN_ID, res, 'user1');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheet'));
    expect(res.end).toHaveBeenCalled();
  });
});
