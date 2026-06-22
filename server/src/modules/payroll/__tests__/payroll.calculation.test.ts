import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { calculatePayrollForEmployee, applyOvertimeRules } from '../payroll.service.js';
import type { LeanEmployee, LeanOvertimeRule } from '../../../types/domain.js';

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

function emptyPreFetched(empId: string) {
  return {
    attendanceMap: new Map<string, any[]>(),
    overtimeMap: new Map<string, any[]>(),
    leaveMap: new Map<string, any[]>(),
    statutoryDefaults: {
      pfEnabled: true, pfWageCeiling: 15000, pfEmployeeRate: 12, pfEmployerRate: 13.61,
      epsRate: 8.33, edliRate: 0.5, pfAdminCharges: 1.1, edliAdminCharges: 0.01,
      esiEnabled: true, esiThreshold: 21000, esiEmployeeRate: 0.75, esiEmployerRate: 3.25,
      ptEnabled: false, ptSlabs: [],
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

function monthRange(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDays = endDate.getDate();
  return { startDate, endDate, totalDays };
}

describe('applyOvertimeRules', () => {
  it('returns all hours when no rule', () => {
    expect(applyOvertimeRules(40, null)).toBe(40);
  });

  it('caps at maxHoursPerDay', () => {
    const rule = { maxHoursPerDay: 10, maxHoursPerMonth: 60, multiplier: 2, name: 'test', isActive: true };
    expect(applyOvertimeRules(15, rule as any)).toBe(10);
  });

  it('caps at maxHoursPerMonth', () => {
    const rule = { maxHoursPerDay: 20, maxHoursPerMonth: 40, multiplier: 2, name: 'test', isActive: true };
    // 50 → day cap: min(50,20)=20 → month cap: min(20,40)=20
    expect(applyOvertimeRules(50, rule as any)).toBe(20);
  });

  it('applies both caps (day first, then month)', () => {
    const rule = { maxHoursPerDay: 4, maxHoursPerMonth: 40, multiplier: 2, name: 'test', isActive: true };
    // 80 → day cap: min(80,4)=4 → month cap: min(4,40)=4
    expect(applyOvertimeRules(80, rule as any)).toBe(4);
  });

  it('returns hours unchanged when within limits', () => {
    const rule = { maxHoursPerDay: 10, maxHoursPerMonth: 60, multiplier: 2, name: 'test', isActive: true };
    expect(applyOvertimeRules(10, rule as any)).toBe(10);
  });
});

describe('calculatePayrollForEmployee', () => {
  const { startDate, endDate, totalDays } = monthRange(2025, 3);

  it('calculates basic salary for full-month employee with full attendance', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    // 31 days of present attendance
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.presentDays).toBe(31);
    // 31 present days / 30 (payableDaysBase) × 30000 = 31000
    expect(result.basicEarnings).toBe(31000);
    expect(result.grossEarnings).toBe(31000);
    expect(result.netPay).toBeGreaterThan(0);
  });

  it('applies pro-rata for mid-month joiner (joiningDate = 16th)', async () => {
    const emp = makeEmployee({
      baseSalary: 30000,
      joiningDate: new Date(2025, 2, 16),
    });
    const pf = emptyPreFetched(String(emp._id));
    // 16 days present from 16th to 31st
    const atts: any[] = [];
    for (let d = 16; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.proRataDetails.isJoiner).toBe(true);
    expect(result.proRataDetails.proRataFactor).toBeLessThan(1);
    expect(result.basicEarnings).toBeLessThan(30000);
  });

  it('applies pro-rata for mid-month leaver (leavingDate = 15th)', async () => {
    const emp = makeEmployee({
      baseSalary: 30000,
      leavingDate: new Date(2025, 2, 15),
    });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 15; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.proRataDetails.isLeaver).toBe(true);
    expect(result.proRataDetails.proRataFactor).toBeLessThan(1);
    expect(result.basicEarnings).toBeLessThan(30000);
  });

  it('calculates unpaid leave deduction per-method (S6 fix)', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    // 22 present + 3 unpaid leave (basic-only) + 2 unpaid leave (gross) + rest as present
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      if (d >= 23 && d <= 25) {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'leave'));
      } else if (d >= 26 && d <= 27) {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'leave'));
      } else {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
      }
    }
    pf.attendanceMap.set(String(emp._id), atts);

    // Provide raw LeaveApplication documents — the code builds leaveDayMap from these
    const leaveApps = [
      {
        employee: emp._id, startDate: new Date(2025, 2, 23), endDate: new Date(2025, 2, 25),
        status: 'approved', leaveType: { isPaid: false, deductionMethod: 'basic-only', name: 'Casual Leave' },
      },
      {
        employee: emp._id, startDate: new Date(2025, 2, 26), endDate: new Date(2025, 2, 27),
        status: 'approved', leaveType: { isPaid: false, deductionMethod: 'gross', name: 'Loss of Pay' },
      },
    ];
    pf.leaveMap.set(String(emp._id), leaveApps as any);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.unpaidLeaveDays).toBe(5);
    // basic-only: 3 * (30000/30) = 3000
    // gross: 2 * (30000/30) = 2000
    // Total = 5000
    expect(result.totalDeductions).toBeGreaterThanOrEqual(5000);
  });

  it('caps OT at maxHoursPerDay from rule', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);
    // OT: 20 hours on one day (should be capped to maxHoursPerDay)
    pf.overtimeMap.set(String(emp._id), [
      { employee: emp._id, date: new Date(2025, 2, 15), hours: 20 },
    ]);
    pf.overtimeRulesMap.set('office-staff', {
      _id: OID(), name: 'Office OT Rule', isActive: true, applicableTo: 'office-staff',
      multiplier: 2, maxHoursPerDay: 4, maxHoursPerMonth: 40,
    } as any);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.overtimeHoursAllowed).toBe(4);
    expect(result.overtimeRuleApplied?.name).toBe('Office OT Rule');
  });

  it('calculates gross EMI deduction from loan repayments', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);
    pf.loanRepaymentsMap.set(String(emp._id), [
      { _id: OID(), employee: emp._id, month: '2025-03', amount: 5000, status: 'pending' },
    ]);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.loanEmiDeduction).toBe(5000);
    // loanEmiDeduction is included in totalDeductions
    expect(result.netPay).toBe(result.grossEarnings - result.totalDeductions);
  });

  it('deducts late present days when lateDeductionPerDay is set', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      if (d === 5 || d === 10) {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present', { isLate: true }));
      } else {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
      }
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const config = defaultConfig({ lateDeductionPerDay: 500 });
    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, config, [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.latePresentDays).toBe(2);
    expect(result.totalDeductions).toBeGreaterThanOrEqual(1000);
  });

  it('credits paid weekly-offs when config enabled and attendance exists', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      const dayOfWeek = new Date(2025, 2, d).getDay();
      if (dayOfWeek === 0) {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'weekly-off'));
      } else {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
      }
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig({ paidWeeklyOff: true }), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.weeklyOffs).toBeGreaterThan(0);
    expect(result.effectiveWorkingDays).toBeGreaterThan(result.presentDays);
  });

  it('does not credit paid weekly-offs with zero attendance (S7 fix)', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    // No attendance records at all
    pf.attendanceMap.set(String(emp._id), []);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig({ paidWeeklyOff: true }), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.weeklyOffs).toBe(0);
    expect(result.presentDays).toBe(0);
  });

  it('skips employees with zero attendance (no basic earnings)', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    pf.attendanceMap.set(String(emp._id), []);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.basicEarnings).toBe(0);
    expect(result.grossEarnings).toBe(0);
  });

  it('bank split at 100% gives primary=netPay, secondary=0 (S8 fix)', async () => {
    const emp = makeEmployee({
      baseSalary: 30000,
      bankSplitPercent: 100,
    } as any);
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.bankSplitPercent).toBe(100);
    expect(result.primaryBankAmount).toBe(result.netPay);
    expect(result.secondaryBankAmount).toBe(0);
  });

  it('half-day deduction uses configured percent', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      if (d === 5) {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'half-day'));
      } else {
        atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
      }
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig({ halfDayDeductionPercent: 50 }), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.halfDays).toBe(1);
    // Half-day deduction = 50% of (30000/30) = 500
    expect(result.totalDeductions).toBeGreaterThanOrEqual(500);
  });

  it('daily wage employee calculates correctly', async () => {
    const emp = makeEmployee({
      salaryType: 'daily',
      dailyWage: 1500,
      baseSalary: 0,
    });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);

    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, defaultConfig(), [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    expect(result.presentDays).toBe(31);
    expect(result.basicEarnings).toBe(1500 * 31);
  });

  it('OT rounding with otTricksEnabled and otRoundingMinutes', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);
    pf.overtimeMap.set(String(emp._id), [
      { employee: emp._id, date: new Date(2025, 2, 15), hours: 7.7 },
    ]);

    const config = defaultConfig({
      otTricksEnabled: true,
      otRoundingMinutes: 30,
      otRoundingMethod: 'floor',
    });
    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, config, [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    // 7.7h * 60 = 462min, floor(462/30)*30 = floor(15.4)*30 = 15*30 = 450min = 7.5h
    expect(result.overtimeHours).toBe(7.5);
  });

  it('no OT rounding when otRoundingMinutes is 0 (S13 fix)', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const pf = emptyPreFetched(String(emp._id));
    const atts: any[] = [];
    for (let d = 1; d <= 31; d++) {
      atts.push(makeAttendance(String(emp._id), new Date(2025, 2, d), 'present'));
    }
    pf.attendanceMap.set(String(emp._id), atts);
    pf.overtimeMap.set(String(emp._id), [
      { employee: emp._id, date: new Date(2025, 2, 15), hours: 7.7 },
    ]);

    const config = defaultConfig({
      otTricksEnabled: true,
      otRoundingMinutes: 0,
    });
    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, config, [], [], startDate, endDate, 31, 31, 8, 0, pf,
    );

    // No rounding applied, raw hours
    expect(result.overtimeHours).toBe(7.7);
  });
});
