import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';

const mockPayrollItemFindById = vi.fn();
const mockPayrollRunFindById = vi.fn();
const mockCompanySettingsFindOne = vi.fn();

vi.mock('../../../models/PayrollItem.model.js', () => ({
  default: { findById: (...args: any[]) => mockPayrollItemFindById(...args) },
}));
vi.mock('../../../models/PayrollRun.model.js', () => ({
  default: { findById: (...args: any[]) => mockPayrollRunFindById(...args) },
}));
vi.mock('../../../models/CompanySettings.model.js', () => ({
  default: { findOne: (...args: any[]) => mockCompanySettingsFindOne(...args) },
}));
vi.mock('../../../core/audit/AuditService.js', () => ({
  AuditService: { log: vi.fn() },
}));
vi.mock('pdfkit', () => {
  const mockDoc = {
    page: { width: 595.28, height: 841.89 },
    pipe: vi.fn(),
    end: vi.fn(),
    fontSize: vi.fn().mockReturnThis(),
    font: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
  };
  return { default: vi.fn(() => mockDoc) };
});

import { generatePayslipPdf } from '../payslip.service.js';

function mockRes(): Response {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  } as unknown as Response;
  return res;
}

describe('Payslip Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when payroll item not found', async () => {
    mockPayrollItemFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });

    const res = mockRes();
    await generatePayslipPdf('item1', res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('generates PDF for valid payroll item', async () => {
    mockPayrollItemFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'item1',
          month: '2024-01',
          basicEarnings: 30000,
          grossEarnings: 38000,
          totalDeductions: 6000,
          netPay: 32000,
          effectiveWorkingDays: 26,
          totalDays: 31,
          allowances: [{ name: 'HRA', calculatedValue: 8000 }],
          deductions: [{ name: 'PF', calculatedValue: 3600 }, { name: 'ESI', calculatedValue: 2400 }],
          employerContributions: [{ name: 'Employer PF', calculatedValue: 3600 }],
          componentWiseEarnings: [],
          componentWiseDeductions: [],
          employee: { fullName: 'Test Emp', employeeCode: 'EMP001', pan: 'ABCDE1234F', pfNumber: 'PF123', uan: '1000000001' },
          payrollRun: 'run1',
        }),
      }),
    });

    mockPayrollRunFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ finalizedAt: new Date('2024-02-01') }),
    });
    mockCompanySettingsFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ companyInfo: { companyName: 'Test Corp' } }),
    });

    const res = mockRes();
    await generatePayslipPdf('item1', res, 'user1');

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('payslip_EMP001'));
  });
});
