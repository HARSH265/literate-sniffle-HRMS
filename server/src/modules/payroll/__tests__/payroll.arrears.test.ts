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

function fullAttendance(empId: string, year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const atts: any[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    atts.push({
      employee: new mongoose.Types.ObjectId(empId),
      date: new Date(year, month - 1, d),
      status: 'present',
      clockIn: '09:00',
      clockOut: '18:00',
    });
  }
  return atts;
}

function monthRange(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDays = endDate.getDate();
  return { startDate, endDate, totalDays };
}

function makeComponentMaster(id: string, code: string, name: string, arrearsApplicable: boolean) {
  return {
    _id: new mongoose.Types.ObjectId(id),
    code,
    name,
    isActive: true,
    arrearsApplicable,
    type: 'earning',
    subType: 'fixed',
  };
}

describe('Arrears calculation (Item 19)', () => {
  const { startDate, endDate, totalDays } = monthRange(2025, 3);
  const compId = OID();

  it('computes arrears when salary structure changes between months', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const empId = String(emp._id);
    const pf = {
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
    pf.attendanceMap.set(empId, fullAttendance(empId, 2025, 3));

    // Current structure: basic = 30000, effective from March 1
    pf.salaryStructuresMap.set(empId, {
      _id: OID(), employee: empId, isCurrent: true,
      effectiveFrom: new Date(2025, 2, 1),
      components: [{ component: compId, monthlyAmount: 30000, isActive: true }],
    });

    // Previous structure: basic = 25000
    pf.prevSalaryStructuresMap.set(empId, {
      _id: OID(), employee: empId, isCurrent: false,
      effectiveFrom: new Date(2025, 0, 1),
      effectiveTo: new Date(2025, 1, 28),
      components: [{ component: compId, monthlyAmount: 25000, isActive: true }],
    });

    // Component master: arrears applicable
    pf.componentMasterMap.set(String(compId), makeComponentMaster(String(compId), 'BASIC', 'Basic Salary', true));

    const config = defaultConfig({ arrearsAutoCalculate: true });
    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, config, [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf as any,
    );

    expect(result.arrears.length).toBeGreaterThan(0);
    const arrear = result.arrears[0];
    expect(arrear.component.code).toBe('BASIC');
    expect(arrear.previousAmount).toBe(25000);
    expect(arrear.currentAmount).toBe(30000);
    expect(arrear.difference).toBe(5000);
    expect(arrear.isPositive).toBe(true);
    expect(arrear.effectiveArrearAmount).toBeGreaterThan(0);
  });

  it('returns empty arrears when arrearsAutoCalculate is false', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const empId = String(emp._id);
    const pf = {
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
    pf.attendanceMap.set(empId, fullAttendance(empId, 2025, 3));

    const config = defaultConfig({ arrearsAutoCalculate: false });
    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, config, [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf as any,
    );

    expect(result.arrears).toEqual([]);
  });

  it('skips arrears for non-arrearsApplicable components', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const empId = String(emp._id);
    const pf = {
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
    pf.attendanceMap.set(empId, fullAttendance(empId, 2025, 3));

    pf.salaryStructuresMap.set(empId, {
      _id: OID(), employee: empId, isCurrent: true,
      effectiveFrom: new Date(2025, 2, 1),
      components: [{ component: compId, monthlyAmount: 30000, isActive: true }],
    });

    pf.prevSalaryStructuresMap.set(empId, {
      _id: OID(), employee: empId, isCurrent: false,
      effectiveFrom: new Date(2025, 0, 1),
      effectiveTo: new Date(2025, 1, 28),
      components: [{ component: compId, monthlyAmount: 25000, isActive: true }],
    });

    // Component NOT arrears applicable
    pf.componentMasterMap.set(String(compId), makeComponentMaster(String(compId), 'BASIC', 'Basic Salary', false));

    const config = defaultConfig({ arrearsAutoCalculate: true });
    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, config, [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf as any,
    );

    expect(result.arrears).toEqual([]);
  });

  it('returns empty arrears when no previous structure exists', async () => {
    const emp = makeEmployee({ baseSalary: 30000 });
    const empId = String(emp._id);
    const pf = {
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
    pf.attendanceMap.set(empId, fullAttendance(empId, 2025, 3));

    pf.salaryStructuresMap.set(empId, {
      _id: OID(), employee: empId, isCurrent: true,
      effectiveFrom: new Date(2025, 2, 1),
      components: [{ component: compId, monthlyAmount: 30000, isActive: true }],
    });

    // No previous structure set
    pf.componentMasterMap.set(String(compId), makeComponentMaster(String(compId), 'BASIC', 'Basic Salary', true));

    const config = defaultConfig({ arrearsAutoCalculate: true });
    const result = await calculatePayrollForEmployee(
      emp, 3, 2025, config, [], [], startDate, endDate, totalDays, totalDays, 8, 0, pf as any,
    );

    expect(result.arrears).toEqual([]);
  });
});
