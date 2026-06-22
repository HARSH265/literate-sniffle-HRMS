import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { calculatePayrollForEmployee } from '../payroll.service.js';
import type { LeanEmployee, LeanOvertimeRule } from '../../../types/domain.js';

vi.mock('../../../models/OvertimeRule.model.js', () => ({
  default: { findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }) },
}));
vi.mock('../../../models/WeeklyOffRule.model.js', () => ({
  default: { findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }) },
}));

const OID = () => new mongoose.Types.ObjectId();

function defaultConfig(overrides: Record<string, unknown> = {}) {
  return {
    overtimeBase: 'basic' as const,
    overtimeMultiplier: 2,
    halfDayDeductionPercent: 50,
    lateDeductionPerDay: 0,
    paidWeeklyOff: true,
    paidHolidays: true,
    defaultWorkingDays: 30,
    standardHoursPerDay: 8,
    payrollLockDays: 3,
    unfinalizeWindowDays: 3,
    otTricksEnabled: false,
    otRoundingMinutes: 0,
    otRoundingMethod: 'round' as const,
    otMultiplierBasicOnly: false,
    perDayCalcMethod: '30' as const,
    lopCalcMethod: '30' as const,
    roundingFinalSalary: 'nearest' as const,
    roundingPrecision: 0,
    negativeNetPayAllow: true,
    arrearsAutoCalculate: false,
    lopComponentsAffected: [] as string[],
    lopImpactsPf: false,
    lopImpactsEsi: false,
    makerCheckerEnabled: false,
    ...overrides,
  };
}

function makeEmployee(overrides: Partial<LeanEmployee> = {}): LeanEmployee {
  return {
    _id: OID(),
    employeeCode: 'EMP001',
    fullName: 'Test Employee',
    category: 'office-staff',
    employmentType: 'permanent',
    department: OID(),
    designation: OID(),
    shift: OID(),
    joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly',
    baseSalary: 30000,
    status: 'active',
    ...overrides,
  } as LeanEmployee;
}

function preFetchedWithDefaults(empId: string, statutoryOverrides: Record<string, unknown> = {}) {
  return {
    attendanceMap: new Map<string, any[]>(),
    overtimeMap: new Map<string, any[]>(),
    leaveMap: new Map<string, any[]>(),
    statutoryDefaults: {
      pfEnabled: true, pfWageCeiling: 15000, pfEmployeeRate: 12, pfEmployerRate: 13.61,
      epsRate: 8.33, edliRate: 0.5, pfAdminCharges: 1.1, edliAdminCharges: 0.01,
      esiEnabled: true, esiThreshold: 21000, esiEmployeeRate: 0.75, esiEmployerRate: 3.25,
      ptEnabled: false, ptSlabs: [],
      ...statutoryOverrides,
    },
    overtimeRulesMap: new Map<string, LeanOvertimeRule | null>(),
    salaryStructuresMap: new Map<string, any>(),
    componentMasterMap: new Map<string, any>(),
    ytdItemsMap: new Map<string, any[]>(),
    loanRepaymentsMap: new Map<string, any[]>(),
    prevSalaryStructuresMap: new Map<string, any>(),
  };
}

function makeAttendance(empId: string, date: Date, status: string, overrides: Record<string, any> = {}) {
  return {
    employee: new mongoose.Types.ObjectId(empId),
    date,
    status,
    clockIn: '09:00',
    clockOut: '18:00',
    ...overrides,
  };
}

function fullAttendance(empId: string, year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const atts: any[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    atts.push(makeAttendance(empId, new Date(year, month - 1, d), 'present'));
  }
  return atts;
}

function monthRange(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDays = endDate.getDate();
  return { startDate, endDate, totalDays };
}

describe('PF/ESI statutory deductions', () => {
  const { startDate, endDate, totalDays } = monthRange(2025, 3);

  it('deducts PF when grossPay is within pfWageCeiling', async () => {
    const emp = makeEmployee({ baseSalary: 20000 });
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    // PF: min(20000, 15000) * 12% = 15000 * 0.12 = 1800
    const pfDeduction = result.deductions.find((d) => d.name === 'PF');
    expect(pfDeduction).toBeDefined();
    expect(pfDeduction!.calculatedValue).toBe(1800);
  });

  it('caps PF at pfWageCeiling for high earners', async () => {
    const emp = makeEmployee({ baseSalary: 50000 });
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    // Gross is ~51667 (31/30 * 50000), PF capped at 15000 * 12% = 1800
    const pfDeduction = result.deductions.find((d) => d.name === 'PF');
    expect(pfDeduction).toBeDefined();
    expect(pfDeduction!.calculatedValue).toBe(1800);
  });

  it('skips PF when pfEnabled is false', async () => {
    const emp = makeEmployee({ baseSalary: 20000 });
    const pf = preFetchedWithDefaults(String(emp._id), { pfEnabled: false });
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    const pfDeduction = result.deductions.find((d) => d.name === 'PF');
    expect(pfDeduction).toBeUndefined();
  });

  it('skips PF when employee is pfExempted', async () => {
    const emp = makeEmployee({ baseSalary: 20000, pfExempted: true } as any);
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    const pfDeduction = result.deductions.find((d) => d.name === 'PF');
    expect(pfDeduction).toBeUndefined();
  });

  it('deducts ESI when grossPay is below esiThreshold', async () => {
    const emp = makeEmployee({ baseSalary: 18000 });
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    // Gross ~18600, below 21000 threshold
    const esiDeduction = result.deductions.find((d) => d.name === 'ESI');
    expect(esiDeduction).toBeDefined();
    expect(esiDeduction!.calculatedValue).toBeGreaterThan(0);
  });

  it('skips ESI when grossPay exceeds esiThreshold', async () => {
    const emp = makeEmployee({ baseSalary: 25000 });
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    // Gross ~25833, above 21000 threshold
    const esiDeduction = result.deductions.find((d) => d.name === 'ESI');
    expect(esiDeduction).toBeUndefined();
  });

  it('skips ESI when esiEnabled is false', async () => {
    const emp = makeEmployee({ baseSalary: 18000 });
    const pf = preFetchedWithDefaults(String(emp._id), { esiEnabled: false });
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    const esiDeduction = result.deductions.find((d) => d.name === 'ESI');
    expect(esiDeduction).toBeUndefined();
  });

  it('skips ESI when employee is esiExempted', async () => {
    const emp = makeEmployee({ baseSalary: 18000, esiExempted: true } as any);
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    const esiDeduction = result.deductions.find((d) => d.name === 'ESI');
    expect(esiDeduction).toBeUndefined();
  });

  it('includes employer PF and EPS in employerContributions', async () => {
    const emp = makeEmployee({ baseSalary: 20000 });
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    const employerPf = result.employerContributions.find((c) => c.name === 'Employer PF');
    const eps = result.employerContributions.find((c) => c.name === 'EPS');
    expect(employerPf).toBeDefined();
    expect(employerPf!.calculatedValue).toBeGreaterThanOrEqual(0);
    expect(eps).toBeDefined();
    expect(eps!.calculatedValue).toBeGreaterThan(0);
  });

  it('includes employer ESI in employerContributions when applicable', async () => {
    const emp = makeEmployee({ baseSalary: 18000 });
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    const employerEsi = result.employerContributions.find((c) => c.name === 'Employer ESI');
    expect(employerEsi).toBeDefined();
    expect(employerEsi!.calculatedValue).toBeGreaterThan(0);
  });

  it('netPay = grossEarnings - totalDeductions (includes PF/ESI)', async () => {
    const emp = makeEmployee({ baseSalary: 20000 });
    const pf = preFetchedWithDefaults(String(emp._id));
    pf.attendanceMap.set(String(emp._id), fullAttendance(String(emp._id), 2025, 3));

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf,
    );

    expect(result.netPay).toBe(result.grossEarnings - result.totalDeductions);
  });
});
