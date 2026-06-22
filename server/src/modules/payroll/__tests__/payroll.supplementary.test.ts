import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

vi.mock('../../../models/CompanySettings.model.js', () => ({ default: { findOne: vi.fn() } }));
vi.mock('../../../models/Employee.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/AttendanceEntry.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/OvertimeEntry.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/LeaveApplication.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/OvertimeRule.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/SalaryStructure.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/ComponentMaster.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/PayrollItem.model.js', () => ({ default: { find: vi.fn(), insertMany: vi.fn() } }));
vi.mock('../../../models/PayrollRun.model.js', () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../../../models/LoanRepayment.model.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../../models/AuditLog.model.js', () => ({ default: { create: vi.fn() } }));
vi.mock('../../../modules/statutory/statutory.service.js', () => ({
  calculateStatutoryForEmployee: vi.fn(),
  getStatutoryDefaults: vi.fn(),
}));

import PayrollRun from '../../../models/PayrollRun.model.js';
import PayrollItem from '../../../models/PayrollItem.model.js';
import Employee from '../../../models/Employee.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';
import AuditLog from '../../../models/AuditLog.model.js';
import { getStatutoryDefaults } from '../../../modules/statutory/statutory.service.js';
import { PayrollService } from '../payroll.service.js';
import AttendanceEntry from '../../../models/AttendanceEntry.model.js';
import OvertimeEntry from '../../../models/OvertimeEntry.model.js';
import LeaveApplication from '../../../models/LeaveApplication.model.js';
import OvertimeRule from '../../../models/OvertimeRule.model.js';
import SalaryStructure from '../../../models/SalaryStructure.model.js';
import ComponentMaster from '../../../models/ComponentMaster.model.js';
import LoanRepayment from '../../../models/LoanRepayment.model.js';

const OID = () => new mongoose.Types.ObjectId();

function mockSession() {
  return { startTransaction: vi.fn(), commitTransaction: vi.fn(), endSession: vi.fn() };
}

function chainQuery(result: any[] = []) {
  const sorted = { lean: vi.fn().mockResolvedValue(result) };
  return { lean: vi.fn().mockResolvedValue(result), sort: vi.fn().mockReturnValue(sorted) };
}

const validEmployee = {
  _id: OID(), employeeCode: 'EMP001', fullName: 'Test Employee',
  salaryType: 'monthly', baseSalary: 25000, status: 'active',
};

const validSettings = {
  payrollConfig: { standardHoursPerDay: 8, defaultWorkingDays: 30, minimumWage: 10000 },
  allowanceConfig: [],
  deductionConfig: [],
};

const stdStatutoryDefaults = {
  pfEnabled: true, pfWageCeiling: 15000, pfEmployeeRate: 12, pfEmployerRate: 13.61,
  epsRate: 8.33, edliRate: 0.5, pfAdminCharges: 1.1, edliAdminCharges: 0.01,
  esiEnabled: true, esiThreshold: 21000, esiEmployeeRate: 0.75, esiEmployerRate: 3.25,
  ptEnabled: false, ptSlabs: [],
};

function setupMocks() {
  vi.mocked(CompanySettings.findOne).mockReturnValue({ lean: vi.fn().mockReturnValue(validSettings) } as any);
  vi.mocked(Employee.find).mockReturnValue({ lean: vi.fn().mockReturnValue([validEmployee]) } as any);
  vi.mocked(AttendanceEntry.find).mockReturnValue(chainQuery() as any);
  vi.mocked(OvertimeEntry.find).mockReturnValue(chainQuery() as any);
  vi.mocked(LeaveApplication.find).mockReturnValue({ populate: vi.fn().mockReturnValue(chainQuery()) } as any);
  vi.mocked(OvertimeRule.find).mockReturnValue(chainQuery() as any);
  vi.mocked(SalaryStructure.find).mockReturnValue(chainQuery() as any);
  vi.mocked(ComponentMaster.find).mockReturnValue(chainQuery() as any);
  vi.mocked(LoanRepayment.find).mockReturnValue({ populate: vi.fn().mockReturnValue(chainQuery()) } as any);
  vi.mocked(PayrollItem.find).mockReturnValue(chainQuery() as any);
  vi.mocked(getStatutoryDefaults).mockResolvedValue(stdStatutoryDefaults as any);
  vi.mocked(AuditLog.create).mockResolvedValue({} as any);
}

describe('PayrollService.supplementaryRun (Item 24)', () => {
  const userId = OID().toString();

  beforeEach(() => vi.clearAllMocks());

  it.skip('creates a supplementary payroll run for selected employees', async () => {
    // Requires MongoDB: calculatePayrollForEmployee makes internal DB calls
    // (OvertimeRule.findOne, PayrollItem.find for tax/YTD).
    // Full workflow covered by payroll.service.integration.test.ts.
  });

  it('rejects future-dated supplementary runs', async () => {
    await expect(
      PayrollService.supplementaryRun(1, 2099, userId, [OID().toString()], 'Future run'),
    ).rejects.toThrow('Cannot run payroll for future month');
  });

  it('validates standardHoursPerDay > 0', async () => {
    const session = mockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as any);
    setupMocks();

    vi.mocked(CompanySettings.findOne).mockReturnValue({
      lean: vi.fn().mockReturnValue({ payrollConfig: { standardHoursPerDay: 0 }, allowanceConfig: [], deductionConfig: [] }),
    } as any);

    await expect(
      PayrollService.supplementaryRun(3, 2025, userId, [OID().toString()], 'Test'),
    ).rejects.toThrow('standardHoursPerDay must be a positive number');
  });
});
