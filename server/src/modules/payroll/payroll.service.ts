import PayrollRun, { IPayrollRun, ApprovalHistoryEntry } from '../../models/PayrollRun.model.js';
import mongoose from 'mongoose';
import PayrollItem, { IPayrollItem } from '../../models/PayrollItem.model.js';
import Employee from '../../models/Employee.model.js';
import type { LeanEmployee } from '../../types/domain.js';
import { calculateStatutoryForEmployee } from '../statutory/statutory.service.js';
import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import OvertimeRule from '../../models/OvertimeRule.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import type { AllowanceConfig, DeductionConfig } from '../../models/CompanySettings.model.js';
import LeaveApplication from '../../models/LeaveApplication.model.js';
import ComponentMaster, { IComponentMaster } from '../../models/ComponentMaster.model.js';
import SalaryStructure from '../../models/SalaryStructure.model.js';
import LoanRepayment from '../../models/LoanRepayment.model.js';
import User from '../../models/User.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { NotificationService } from '../../core/notification/NotificationService.js';
import dayjs from 'dayjs';
import { computeTax, TaxInput, TaxResult } from '../tax/tax.service.js';
import { runComplianceCheck } from '../compliance/compliance.service.js';

type PayrollConfig = {
  overtimeBase: 'basic' | 'basicPlusAllowances';
  overtimeMultiplier: number;
  halfDayDeductionPercent: number;
  lateDeductionPerDay: number;
  paidWeeklyOff: boolean;
  paidHolidays: boolean;
  defaultWorkingDays: number;
  standardHoursPerDay: number;
  payrollLockDays: number;
  unfinalizeWindowDays: number;
  otTricksEnabled: boolean;
  otRoundingMinutes: number;
  otRoundingMethod: 'floor' | 'ceil' | 'round';
  otMultiplierBasicOnly: boolean;
  perDayCalcMethod: '30' | 'actual' | '26';
  lopCalcMethod: '30' | 'actual' | '26';
  roundingFinalSalary: 'floor' | 'ceil' | 'nearest';
  roundingPrecision: number;
  negativeNetPayAllow: boolean;
  arrearsAutoCalculate: boolean;
  lopPerDayBase: '30' | 'actual' | '26';
  lopComponentsAffected: string[];
  lopImpactsPf: boolean;
  lopImpactsEsi: boolean;
  makerCheckerEnabled: boolean;
};

interface PayrollItemComponentDetail {
  component: { code: string; name: string; id: string };
  type: 'earning' | 'deduction' | 'employer-cost';
  subType: 'fixed' | 'variable' | 'reimbursement';
  calcType: string;
  calcValue: number;
  monthlyAmount: number;
  computedAmount: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  lopApplicable: boolean;
  arrearsApplicable: boolean;
}

interface PayrollCalcResult {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  weeklyOffs: number;
  holidays: number;
  effectiveWorkingDays: number;
  overtimeHours: number;
  overtimeHoursAllowed: number;
  overtimeRuleApplied: { name: string; multiplier: number } | null;
  overtimeAmount: number;
  basicEarnings: number;
  allowances: { name: string; type: string; value: number; calculatedValue: number }[];
  allowancesTotal: number;
  grossEarnings: number;
  deductions: { name: string; type: string; value: number; calculatedValue: number }[];
  totalDeductions: number;
  employerContributions: { name: string; calculatedValue: number }[];
  loanEmiDeduction: number;
  netPay: number;
  bankSplitPercent?: number;
  primaryBankAmount?: number;
  secondaryBankAmount?: number;
  employee: { id: string; name: string; code: string };
  _loanRepaymentId?: string;
  paidDaysBreakdown: {
    calendarDays: number;
    payableDaysBase: number;
    paidDays: number;
    lopDays: number;
    calculationMethod: '30' | 'actual' | '26';
    proRataFactor: number;
  };
  lopDetails: {
    lopDays: number;
    lopAmount: number;
    calculationMethod: '30' | 'actual' | '26';
    perDayRate: number;
    componentsAffected: string[];
  };
  proRataDetails: {
    isJoiner: boolean;
    isLeaver: boolean;
    joinDate?: Date;
    leaveDate?: Date;
    daysWorked: number;
    totalDays: number;
    proRataFactor: number;
  };
  complianceFlags: { check: string; status: 'pass' | 'warning' | 'fail'; actualValue: number; requiredValue: number; gap: number; notes?: string }[];
  taxComputation?: {
    regime: 'old' | 'new';
    projectedAnnualGross: number;
    projectedAnnualExemptions: number;
    projectedTaxableIncome: number;
    annualTaxAmount: number;
    surcharge: number;
    educationCess: number;
    totalTaxLiability: number;
    monthlyTds: number;
    rebate87a: number;
  };
  componentWiseEarnings: PayrollItemComponentDetail[];
  componentWiseDeductions: PayrollItemComponentDetail[];
  arrears: ArrearItem[];
}

interface PayrollResultRow {
  id: string;
  [key: string]: unknown;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function populatePayrollItem(query: mongoose.Query<any, any>) {
  return query
    .populate('employee', 'fullName employeeCode')
    .populate('payrollRun', 'month status finalizedBy');
}

function getPayrollLockDays(config: PayrollConfig): number {
  const value = config.payrollLockDays ?? config.unfinalizeWindowDays ?? 7;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 7;
}

function getPayableDaysBase(method: '30' | 'actual' | '26', calendarDays: number): number {
  if (method === '30') return 30;
  if (method === 'actual') return calendarDays;
  return 26;
}

function roundSalary(value: number, method: 'floor' | 'ceil' | 'nearest', precision: number): number {
  const factor = Math.pow(10, precision);
  const rounded = method === 'floor'
    ? Math.floor(value * factor) / factor
    : method === 'ceil'
      ? Math.ceil(value * factor) / factor
      : Math.round(value * factor) / factor;
  return rounded;
}

interface LeanOvertimeRule {
  name: string;
  applicableTo: string;
  multiplier: number;
  maxHoursPerDay: number;
  maxHoursPerMonth: number;
  isActive: boolean;
}

async function getApplicableOvertimeRule(category: string): Promise<LeanOvertimeRule | null> {
  const applicableTo = category === 'worker' ? 'worker' : 'office-staff';
  let rule = await OvertimeRule.findOne({ isActive: true, applicableTo }).lean();
  if (!rule) {
    rule = await OvertimeRule.findOne({ isActive: true, applicableTo: 'all' }).lean();
  }
  return rule;
}

function applyOvertimeRules(hours: number, rule: LeanOvertimeRule | null): number {
  if (!rule) return hours;
  let allowedHours = hours;
  if (rule.maxHoursPerDay && allowedHours > rule.maxHoursPerDay) {
    allowedHours = rule.maxHoursPerDay;
  }
  return allowedHours;
}

interface ArrearItem {
  component: { code: string; name: string; id: string };
  month: string;
  previousAmount: number;
  currentAmount: number;
  difference: number;
  isPositive: boolean;
  applicableArrearDays: number;
  effectiveArrearAmount: number;
}

async function calculateArrears(
  empId: string, _month: number, year: number, _basicEarnings: number,
  _payableDaysBase: number, totalDays: number, arrearsAutoCalculate: boolean,
): Promise<ArrearItem[]> {
  if (!arrearsAutoCalculate) return [];

  // Find current month structure
  const monthStart = new Date(year, _month - 1, 1);
  const monthEnd = new Date(year, _month, 0, 23, 59, 59);

  const currentStructure = await SalaryStructure.findOne({
    employee: empId,
    isCurrent: true,
    effectiveFrom: { $lte: monthEnd },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: monthStart } }],
  }).lean();

  if (!currentStructure) return [];

  // Find previous structure
  const prevStructure = await SalaryStructure.findOne({
    employee: empId,
    _id: { $ne: currentStructure._id },
    effectiveFrom: { $lt: monthStart },
    $or: [{ effectiveTo: null }, { effectiveTo: { $lt: monthStart } }],
  }).sort({ effectiveFrom: -1 }).lean();

  if (!prevStructure) return [];

  // Build component maps
  const allComponentIds = [...currentStructure.components.map(c => c.component), ...prevStructure.components.map(c => c.component)];
  const components = await ComponentMaster.find({ _id: { $in: allComponentIds }, isActive: true }).lean();
  const compMap = new Map(components.map(c => [String(c._id), c]));

  const currentMap = new Map<string, number>();
  for (const c of currentStructure.components) {
    if (c.isActive) currentMap.set(String(c.component), c.monthlyAmount);
  }

  const prevMap = new Map<string, number>();
  for (const c of prevStructure.components) {
    if (c.isActive) prevMap.set(String(c.component), c.monthlyAmount);
  }

  const arrears: ArrearItem[] = [];

  for (const [compId, prevAmount] of prevMap) {
    const currentAmount = currentMap.get(compId) ?? 0;
    const difference = currentAmount - prevAmount;
    if (Math.abs(difference) < 1) continue;

    const master = compMap.get(compId);
    if (!master || !master.arrearsApplicable) continue;

    // Calculate how many days of arrears apply
    const effectiveDate = currentStructure.effectiveFrom;
    const arrearsStartDate = new Date(Math.max(effectiveDate.getTime(), monthStart.getTime()));
    const arrearsEndDate = monthEnd;
    const applicableArrearDays = Math.max(1, Math.ceil((arrearsEndDate.getTime() - arrearsStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const dailyDifference = difference / Math.max(1, totalDays);
    const effectiveArrearAmount = Math.round(dailyDifference * Math.min(applicableArrearDays, totalDays));

    if (Math.abs(effectiveArrearAmount) < 1) continue;

    arrears.push({
      component: { code: master.code, name: master.name, id: compId },
      month: `${year}-${String(_month).padStart(2, '0')}`,
      previousAmount: prevAmount,
      currentAmount,
      difference,
      isPositive: difference > 0,
      applicableArrearDays,
      effectiveArrearAmount,
    });
  }

  return arrears;
}

function calculateAllowances(baseEarnings: number, employeeCategory: string, employeeType: string, allowances: AllowanceConfig[]): { name: string; type: string; value: number; calculatedValue: number }[] {
  const appliedAllowances = [];
  
  for (const allowance of allowances) {
    if (!allowance.isActive) continue;
    
    const applicableTo = allowance.applicableTo || 'all';
    const isApplicable = 
      applicableTo === 'all' ||
      applicableTo === employeeCategory ||
      applicableTo === employeeType;
    
    if (!isApplicable) continue;
    
    let calculatedValue = 0;
    if (allowance.type === 'percentage') {
      calculatedValue = Math.round(baseEarnings * (allowance.value / 100));
    } else {
      calculatedValue = allowance.value;
    }
    
    appliedAllowances.push({
      name: allowance.name,
      type: allowance.type,
      value: allowance.value,
      calculatedValue,
    });
  }
  
  return appliedAllowances;
}

function calculateDeductions(baseEarnings: number, _grossEarnings: number, employeeCategory: string, employeeType: string, deductions: DeductionConfig[]): { name: string; type: string; value: number; calculatedValue: number }[] {
  const appliedDeductions = [];
  
  for (const deduction of deductions) {
    if (!deduction.isActive) continue;
    
    const name = deduction.name.toUpperCase();
    if (['PF', 'ESI', 'PT', 'PROFESSIONAL TAX'].includes(name)) continue;
    
    const applicableTo = deduction.applicableTo || 'all';
    const isApplicable = 
      applicableTo === 'all' ||
      applicableTo === employeeCategory ||
      applicableTo === employeeType;
    
    if (!isApplicable) continue;
    
    let calculatedValue = 0;
    let amount = baseEarnings;
    
    if (deduction.type === 'percentage') {
      calculatedValue = Math.round(amount * (deduction.value / 100));
    } else {
      calculatedValue = deduction.value;
    }
    
    appliedDeductions.push({
      name: deduction.name,
      type: deduction.type,
      value: deduction.value,
      calculatedValue,
    });
  }
  
  return appliedDeductions;
}

async function addRevision(run: IPayrollRun, action: string, userId: string, changes?: Record<string, unknown>): Promise<void> {
  const user = await User.findById(userId).select('name').lean();
  run.revisions.push({
    action,
    userId: new mongoose.Types.ObjectId(userId),
    userName: user?.name || 'Unknown',
    changes,
    timestamp: new Date(),
  });
}

async function addApprovalHistory(
  run: IPayrollRun, action: ApprovalHistoryEntry['action'], userId: string, comments?: string, ipAddress?: string,
): Promise<void> {
  const user = await User.findById(userId).select('name role').lean();
  run.approvalHistory.push({
    action,
    userId: new mongoose.Types.ObjectId(userId),
    userName: user?.name || 'Unknown',
    role: user?.role || 'unknown',
    comments,
    ipAddress,
    timestamp: new Date(),
  });
}

interface ComponentCalcItem {
  componentId: string;
  code: string;
  name: string;
  type: 'earning' | 'deduction' | 'employer-cost';
  subType: 'fixed' | 'variable' | 'reimbursement';
  calcType: string;
  calcValue: number;
  monthlyAmount: number;
  computedAmount: number;
  isProrated: boolean;
  proRataFactor: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  lopApplicable: boolean;
  arrearsApplicable: boolean;
}

async function calculateFromSalaryStructure(
  empId: string,
  month: number,
  year: number,
  basicEarnings: number,
  grossEarnings: number,
  proRataFactor: number,
): Promise<{
  componentWiseEarnings: ComponentCalcItem[];
  componentWiseDeductions: ComponentCalcItem[];
  employerCosts: ComponentCalcItem[];
  totalComponentEarnings: number;
  totalComponentDeductions: number;
}> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const structure = await SalaryStructure.findOne({
    employee: empId,
    isCurrent: true,
    effectiveFrom: { $lte: monthEnd },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: monthStart } }],
  }).lean();

  if (!structure || !structure.components?.length) {
    return { componentWiseEarnings: [], componentWiseDeductions: [], employerCosts: [], totalComponentEarnings: 0, totalComponentDeductions: 0 };
  }

  const componentIds = structure.components.map(c => c.component);
  const components = await ComponentMaster.find({ _id: { $in: componentIds }, isActive: true }).lean();
  const compMap = new Map<string, IComponentMaster>();
  for (const c of components) {
    compMap.set(String(c._id), c as unknown as IComponentMaster);
  }

  const calcItems: ComponentCalcItem[] = [];
  const sortedComponents = structure.components
    .filter(sc => sc.isActive)
    .sort((a, b) => {
      const ca = compMap.get(String(a.component));
      const cb = compMap.get(String(b.component));
      return (ca?.sortOrder || 0) - (cb?.sortOrder || 0);
    });

  for (const sc of sortedComponents) {
    const master = compMap.get(String(sc.component));
    if (!master) continue;

    const effectiveCalcType = sc.calcType || master.calcType;
    const effectiveCalcValue = sc.calcValue ?? master.calcValue;

    let computedAmount = sc.monthlyAmount;

    switch (effectiveCalcType) {
      case 'fixed':
        computedAmount = sc.monthlyAmount;
        break;
      case 'percentage-of-basic':
        computedAmount = basicEarnings * (effectiveCalcValue / 100);
        break;
      case 'percentage-of-gross':
        computedAmount = grossEarnings * (effectiveCalcValue / 100);
        break;
      case 'percentage-of-ctc':
        computedAmount = (structure.totalCtc / 12) * (effectiveCalcValue / 100);
        break;
      default:
        computedAmount = sc.monthlyAmount;
    }

    const frequencyMultiplier = master.frequency === 'annual' ? 1 / 12 : master.frequency === 'quarterly' ? 1 / 3 : 1;
    computedAmount = computedAmount * frequencyMultiplier;

    if (proRataFactor < 1 && master.proRataOnJoin) {
      computedAmount = computedAmount * proRataFactor;
    }

    computedAmount = Math.round(computedAmount * 100) / 100;

    calcItems.push({
      componentId: String(sc.component),
      code: master.code,
      name: master.name,
      type: master.type,
      subType: master.subType,
      calcType: effectiveCalcType,
      calcValue: effectiveCalcValue,
      monthlyAmount: sc.monthlyAmount,
      computedAmount,
      isProrated: proRataFactor < 1 && master.proRataOnJoin,
      proRataFactor,
      pfApplicable: master.pfApplicable,
      esiApplicable: master.esiApplicable,
      ptApplicable: master.ptApplicable,
      lopApplicable: master.lopApplicable,
      arrearsApplicable: master.arrearsApplicable,
    });
  }

  const earnings = calcItems.filter(c => c.type === 'earning');
  const deductions = calcItems.filter(c => c.type === 'deduction');
  const employerCosts = calcItems.filter(c => c.type === 'employer-cost');

  return {
    componentWiseEarnings: earnings,
    componentWiseDeductions: deductions,
    employerCosts,
    totalComponentEarnings: earnings.reduce((s, c) => s + c.computedAmount, 0),
    totalComponentDeductions: deductions.reduce((s, c) => s + c.computedAmount, 0),
  };
}

async function calculatePayrollForEmployee(
  emp: LeanEmployee, _month: number, _year: number, config: PayrollConfig, allowances: AllowanceConfig[], deductions: DeductionConfig[],
  startDate: Date, endDate: Date, totalDays: number, _workingDays: number, standardHours: number,
  minimumWageThreshold: number,
): Promise<PayrollCalcResult> {
  const category = emp.category || 'worker';
  const employmentType = emp.employmentType || 'permanent';

  const attendances = await AttendanceEntry.find({
    employee: emp._id,
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  const overtimes = await OvertimeEntry.find({
    employee: emp._id,
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  const leaveApplications = await LeaveApplication.find({
    employee: emp._id,
    status: 'approved',
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  }).populate('leaveType', 'isPaid deductionMethod name').lean();

  let presentDays = 0, absentDays = 0, halfDays = 0, leaveDays = 0, weeklyOffs = 0, holidaysCount = 0;
  void leaveDays;
  let paidLeaveDays = 0, unpaidLeaveDays = 0;
  let totalOvertimeHours = 0;

  const leaveDayMap: Record<string, { isPaid: boolean; deductionMethod: string }> = {};
  for (const app of leaveApplications) {
    const appStart = new Date(Math.max(startDate.getTime(), new Date(app.startDate).getTime()));
    const appEnd = new Date(Math.min(endDate.getTime(), new Date(app.endDate).getTime()));
    const lt = app.leaveType as unknown as { isPaid: boolean; deductionMethod?: string } | null;
    if (!lt) continue;
    for (let d = new Date(appStart); d <= appEnd; d.setDate(d.getDate() + 1)) {
      const key = formatDate(d);
      leaveDayMap[key] = { isPaid: lt.isPaid, deductionMethod: lt.deductionMethod || 'none' };
    }
  }

  for (const att of attendances) {
    switch (att.status) {
      case 'present': {
        if (att.isLatePresent) {
          absentDays++;
        } else {
          presentDays++;
        }
        break;
      }
      case 'absent': absentDays++; break;
      case 'half-day': halfDays++; break;
      case 'leave': {
        leaveDays++;
        const dateKey = formatDate(new Date(att.date));
        const ld = leaveDayMap[dateKey];
        if (ld && ld.isPaid) paidLeaveDays++;
        else unpaidLeaveDays++;
        break;
      }
      case 'weekly-off': weeklyOffs++; break;
      case 'holiday': holidaysCount++; break;
    }
  }

  for (const ot of overtimes) totalOvertimeHours += ot.hours || 0;

  if (config.otTricksEnabled && config.otRoundingMinutes) {
    const rm = config.otRoundingMinutes;
    if (config.otRoundingMethod === 'floor') {
      totalOvertimeHours = Math.floor(totalOvertimeHours * 60 / rm) * (rm / 60);
    } else if (config.otRoundingMethod === 'ceil') {
      totalOvertimeHours = Math.ceil(totalOvertimeHours * 60 / rm) * (rm / 60);
    } else {
      totalOvertimeHours = Math.round(totalOvertimeHours * 60 / rm) * (rm / 60);
    }
  }

  const overtimeRule = await getApplicableOvertimeRule(category);
  const allowedOvertimeHours = applyOvertimeRules(totalOvertimeHours, overtimeRule);

  const baseSalary = emp.baseSalary || 0;
  const dailyWage = emp.dailyWage || 0;
  const isMonthly = emp.salaryType === 'monthly';

  const paidWeeklyOffs = config.paidWeeklyOff ? weeklyOffs : 0;
  const paidHolidaysCount = config.paidHolidays ? holidaysCount : 0;

  const effectiveWorkingDays = presentDays + (halfDays * (1 - (config.halfDayDeductionPercent || 50) / 100)) + paidWeeklyOffs + paidHolidaysCount;

  // Per-day calculation method (2A)
  const dayCalcMethod = config.perDayCalcMethod || '30';
  const payableDaysBase = getPayableDaysBase(dayCalcMethod, totalDays);

  // Pro-rata detection for mid-month joiners/leavers using working days
  let isJoiner = false;
  let isLeaver = false;
  let proRataFactor = 1;
  let daysWorked = effectiveWorkingDays;
  let joinDate: Date | undefined;
  let leaveDate: Date | undefined;

  // Count working days in the month (excluding weekly offs and holidays - simplified)
  const getWorkingDaysInMonth = (s: Date, e: Date) => {
    let wd = 0;
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0) wd++; // exclude Sundays (simplified; can be enhanced for company holidays)
    }
    return wd;
  };
  const monthWorkingDays = getWorkingDaysInMonth(startDate, endDate);

  if (emp.joiningDate) {
    const doj = new Date(emp.joiningDate);
    if (doj > startDate && doj <= endDate) {
      isJoiner = true;
      const workingDaysFromDoj = getWorkingDaysInMonth(doj, endDate);
      joinDate = doj;
      proRataFactor = workingDaysFromDoj / monthWorkingDays;
      daysWorked = effectiveWorkingDays;
    }
  }

  if (emp.leavingDate) {
    const lod = new Date(emp.leavingDate as string | number);
    if (lod >= startDate && lod < endDate) {
      isLeaver = true;
      const workingDaysUntilLod = getWorkingDaysInMonth(startDate, lod);
      leaveDate = lod;
      proRataFactor = workingDaysUntilLod / monthWorkingDays;
      daysWorked = effectiveWorkingDays;
    }
  }

  const basicEarnings = isMonthly
    ? Math.round(baseSalary * (effectiveWorkingDays / payableDaysBase))
    : dailyWage * presentDays;

  const appliedAllowances = calculateAllowances(basicEarnings, category, employmentType, allowances);
  const allowancesTotal = appliedAllowances.reduce((sum, a) => sum + a.calculatedValue, 0);

  let overtimeRate: number;
  if (config.otTricksEnabled && config.otMultiplierBasicOnly) {
    overtimeRate = isMonthly
      ? (baseSalary / payableDaysBase / standardHours)
      : dailyWage / standardHours;
  } else {
    overtimeRate = isMonthly
      ? (config.overtimeBase === 'basicPlusAllowances' ? (baseSalary + allowancesTotal) : baseSalary) / payableDaysBase / standardHours
      : dailyWage / standardHours;
  }

  const otMultiplier = overtimeRule?.multiplier || config.overtimeMultiplier || 2;
  const overtimeAmount = allowedOvertimeHours > 0
    ? Math.round(overtimeRate * otMultiplier * allowedOvertimeHours)
    : 0;

  // Use payableDaysBase for half-day and LOP calc
  const halfDayDeduction = halfDays > 0
    ? Math.round((isMonthly ? baseSalary / payableDaysBase : dailyWage) * (config.halfDayDeductionPercent || 50) / 100 * halfDays)
    : 0;
  const lateDeduction = absentDays > 0 ? (config.lateDeductionPerDay || 0) * absentDays : 0;

  // LOP calculation using lopCalcMethod (2A) - handles multiple unpaid leave types
  const lopCalcMethod = config.lopCalcMethod || '30';
  const lopBase = getPayableDaysBase(lopCalcMethod, totalDays);
  let unpaidLeaveDeduction = 0;
  let lopPerDayRate = 0;
  if (unpaidLeaveDays > 0) {
    const dailyRate = isMonthly ? baseSalary / lopBase : dailyWage;
    lopPerDayRate = dailyRate;

    // Aggregate all unique unpaid leave types and apply the most severe deduction method
    const unpaidLeaveMethods = new Set<string>();
    for (const app of leaveApplications) {
      const lt = app.leaveType as unknown as { isPaid: boolean; deductionMethod?: string } | null;
      if (lt && !lt.isPaid) {
        unpaidLeaveMethods.add(lt.deductionMethod || 'basic-only');
      }
    }

    // Determine deduction method priority: gross > basic-plus-allowances > basic-only > none
    let deductionMethod = 'none';
    if (unpaidLeaveMethods.has('gross')) {
      deductionMethod = 'gross';
    } else if (unpaidLeaveMethods.has('basic-plus-allowances')) {
      deductionMethod = 'basic-plus-allowances';
    } else if (unpaidLeaveMethods.has('basic-only')) {
      deductionMethod = 'basic-only';
    }

    switch (deductionMethod) {
      case 'none': unpaidLeaveDeduction = 0; break;
      case 'basic-only': unpaidLeaveDeduction = Math.round(dailyRate * unpaidLeaveDays); break;
      case 'basic-plus-allowances':
      case 'gross':
        unpaidLeaveDeduction = Math.round((dailyRate + (allowancesTotal / Math.max(1, lopBase))) * unpaidLeaveDays);
        break;
    }
  }

  let grossEarnings = basicEarnings + allowancesTotal + overtimeAmount;
  const appliedDeductions = calculateDeductions(basicEarnings, grossEarnings, category, employmentType, deductions);
  let totalDeductionsValue = appliedDeductions.reduce((sum, d) => sum + d.calculatedValue, 0) + halfDayDeduction + lateDeduction + unpaidLeaveDeduction;

  // ComponentMaster-based calculation (2F)
  const componentCalc = await calculateFromSalaryStructure(
    String(emp._id), _month, _year, basicEarnings, grossEarnings, proRataFactor,
  );
  const componentWiseEarnings = componentCalc.componentWiseEarnings.map(c => ({
    component: { code: c.code, name: c.name, id: c.componentId },
    type: c.type,
    subType: c.subType,
    calcType: c.calcType,
    calcValue: c.calcValue,
    monthlyAmount: c.monthlyAmount,
    computedAmount: c.computedAmount,
    pfApplicable: c.pfApplicable,
    esiApplicable: c.esiApplicable,
    ptApplicable: c.ptApplicable,
    lopApplicable: c.lopApplicable,
    arrearsApplicable: c.arrearsApplicable,
  }));
  const componentWiseDeductions = componentCalc.componentWiseDeductions.map(c => ({
    component: { code: c.code, name: c.name, id: c.componentId },
    type: c.type,
    subType: c.subType,
    calcType: c.calcType,
    calcValue: c.calcValue,
    monthlyAmount: c.monthlyAmount,
    computedAmount: c.computedAmount,
    pfApplicable: c.pfApplicable,
    esiApplicable: c.esiApplicable,
    ptApplicable: c.ptApplicable,
    lopApplicable: c.lopApplicable,
    arrearsApplicable: c.arrearsApplicable,
  }));

  const monthStr = `${_year}-${String(_month).padStart(2, '0')}`;
  let employerContributions: { name: string; calculatedValue: number }[] = [];
  const complianceFlags: PayrollCalcResult['complianceFlags'] = [];
  try {
    const statutory = await calculateStatutoryForEmployee(String(emp._id), grossEarnings, monthStr);
    if (statutory.employeePf > 0) {
      appliedDeductions.push({ name: 'PF', type: 'percentage', value: 0, calculatedValue: statutory.employeePf });
      totalDeductionsValue += statutory.employeePf;
    }
    if (statutory.esiEmployee > 0) {
      appliedDeductions.push({ name: 'ESI', type: 'percentage', value: 0, calculatedValue: statutory.esiEmployee });
      totalDeductionsValue += statutory.esiEmployee;
    }
    if (statutory.professionalTax > 0) {
      appliedDeductions.push({ name: 'Professional Tax', type: 'fixed', value: 0, calculatedValue: statutory.professionalTax });
      totalDeductionsValue += statutory.professionalTax;
    }
    employerContributions = [
      { name: 'Employer PF', calculatedValue: statutory.employerPf },
      { name: 'EPS', calculatedValue: statutory.eps },
      { name: 'EDLI', calculatedValue: statutory.edli },
      { name: 'Employer ESI', calculatedValue: statutory.esiEmployer },
    ].filter((c) => c.calculatedValue > 0);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown statutory error';
    complianceFlags.push({
      check: 'statutory-calculation',
      status: 'fail',
      actualValue: 0,
      requiredValue: 1,
      gap: 1,
      notes: reason,
    });
  }

  let netPay = grossEarnings - totalDeductionsValue;

  // TDS / Income Tax computation (2C)
  let taxComputation: TaxResult | undefined;
  try {
    const taxRegime = (emp as any)?.taxRegime || 'new';
    const financialYearStart = _month >= 4 ? _year : _year - 1;
    const ytdItems = await PayrollItem.find({
      employee: emp._id,
      month: { $gte: `${financialYearStart}-04`, $lte: `${_year}-${String(_month).padStart(2, '0')}` },
    }).lean();
    const ytdGross = ytdItems.reduce((s, i) => s + i.grossEarnings, 0);
    const ytdTdsFromItems = ytdItems.reduce((s, i) => s + ((i as any)?.taxComputation?.monthlyTds || 0), 0);
    const monthsRemaining = _month <= 3 ? (3 - _month) + (12 - 3) : 12 - _month;

    const taxInput: TaxInput = {
      grossMonthly: grossEarnings,
      ytdGross: ytdGross,
      ytdTdsDeducted: ytdTdsFromItems,
      monthsRemaining,
      regime: taxRegime,
      declaration: {
        section80C: 0, section80CCD1B: 0, section80D: 0, section80E: 0, section24b: 0,
        hraExemption: 0, ltaExemption: 0, otherExemptions: 0,
        standardDeduction: taxRegime === 'new' ? 75000 : 50000,
      },
    };
    taxComputation = computeTax(taxInput);

    if (taxComputation.monthlyTds > 0) {
      appliedDeductions.push({
        name: 'TDS',
        type: 'fixed' as const,
        value: taxComputation.monthlyTds,
        calculatedValue: taxComputation.monthlyTds,
      });
      totalDeductionsValue += taxComputation.monthlyTds;
      netPay = grossEarnings - totalDeductionsValue;
    }
  } catch (_error) {
    complianceFlags.push({
      check: 'tax-computation',
      status: 'warning',
      actualValue: 0,
      requiredValue: 1,
      gap: 1,
      notes: 'Tax computation could not be completed',
    });
  }

  // Handle multiple pending loan repayments for the employee in this month
  const loanRepayments = await LoanRepayment.find({
    employee: emp._id,
    month: monthStr,
    status: 'pending',
  })
    .populate('loan', 'amount')
    .lean();

  let loanEmiDeduction = 0;
  if (loanRepayments && loanRepayments.length) {
    // Sum all pending loan amounts
    loanEmiDeduction = loanRepayments.reduce((sum, lr) => sum + (lr.amount || 0), 0);
    loanEmiDeduction = Math.round(loanEmiDeduction * 100) / 100;
    appliedDeductions.push({
      name: 'Loan EMI',
      type: 'fixed' as const,
      value: loanEmiDeduction,
      calculatedValue: loanEmiDeduction,
    });
    totalDeductionsValue += loanEmiDeduction;
    netPay = grossEarnings - totalDeductionsValue;
  }

  // Preserve loan repayment reference for the first pending loan (if any) for linking
  const _loanRepaymentId = loanRepayments && loanRepayments.length ? loanRepayments[0]._id?.toString() : undefined;

  // Rounding and negative net pay (2B)
  const roundMethod = config.roundingFinalSalary || 'nearest';
  const roundPrecision = config.roundingPrecision ?? 0;
  netPay = roundSalary(netPay, roundMethod, roundPrecision);

  if (netPay < 0 && !config.negativeNetPayAllow) {
    const negativeAmount = netPay;
    netPay = 0;
    grossEarnings = totalDeductionsValue; // Adjust gross to match deductions so net is 0
    complianceFlags.push({
      check: 'negative-net-pay',
      status: 'fail',
      actualValue: negativeAmount,
      requiredValue: 0,
      gap: Math.abs(negativeAmount),
      notes: 'Negative net pay is not allowed per policy. Net pay set to 0.',
    });
  }

  // Minimum wage compliance flag (configurable)
  if (basicEarnings < minimumWageThreshold) {
    complianceFlags.push({
      check: 'minimum-wage',
      status: 'warning',
      actualValue: basicEarnings,
      requiredValue: minimumWageThreshold,
      gap: minimumWageThreshold - basicEarnings,
      notes: 'Basic earnings below recommended minimum wage threshold',
    });
  }

  // Arrears auto-calculation (2E)
  let arrears: ArrearItem[] = [];
  try {
    arrears = await calculateArrears(
      String(emp._id), _month, _year, basicEarnings, payableDaysBase, totalDays,
      config.arrearsAutoCalculate ?? true,
    );
    if (arrears.length > 0) {
      for (const arrear of arrears) {
        if (arrear.effectiveArrearAmount > 0) {
          // Positive arrears = additional earning
          appliedAllowances.push({
            name: `Arrear - ${arrear.component.name}`,
            type: 'variable' as const,
            value: arrear.effectiveArrearAmount,
            calculatedValue: arrear.effectiveArrearAmount,
          });
          grossEarnings += arrear.effectiveArrearAmount;
        } else {
          // Negative arrears = additional deduction
          appliedDeductions.push({
            name: `Arrear - ${arrear.component.name}`,
            type: 'fixed' as const,
            value: Math.abs(arrear.effectiveArrearAmount),
            calculatedValue: Math.abs(arrear.effectiveArrearAmount),
          });
          totalDeductionsValue += Math.abs(arrear.effectiveArrearAmount);
        }
      }
      netPay = roundSalary(grossEarnings - totalDeductionsValue, roundMethod, roundPrecision);
    }
  } catch (_error) {
    complianceFlags.push({
      check: 'arrears-calculation',
      status: 'warning',
      actualValue: 0,
      requiredValue: 1,
      gap: 1,
      notes: 'Arrears calculation could not be completed',
    });
  }

  const totalPaidDays = effectiveWorkingDays;
  const totalLopDays = unpaidLeaveDays;

  const bankSplitPercent = (emp as any).bankSplitPercent ?? 0;
  let primaryBankAmount: number | undefined;
  let secondaryBankAmount: number | undefined;
  if (bankSplitPercent > 0 && bankSplitPercent < 100) {
    primaryBankAmount = Math.round(netPay * (bankSplitPercent / 100) * 100) / 100;
    secondaryBankAmount = Math.round((netPay - primaryBankAmount) * 100) / 100;
  }

  return {
    totalDays, presentDays, absentDays, halfDays, paidLeaveDays, unpaidLeaveDays,
    weeklyOffs: paidWeeklyOffs, holidays: paidHolidaysCount,
    effectiveWorkingDays: Math.round(effectiveWorkingDays * 100) / 100,
    overtimeHours: totalOvertimeHours, overtimeHoursAllowed: allowedOvertimeHours,
    overtimeRuleApplied: overtimeRule ? { name: overtimeRule.name, multiplier: overtimeRule.multiplier } : null,
    overtimeAmount, basicEarnings, allowances: appliedAllowances, allowancesTotal,
    grossEarnings, deductions: appliedDeductions, totalDeductions: totalDeductionsValue, employerContributions, loanEmiDeduction, netPay, bankSplitPercent, primaryBankAmount, secondaryBankAmount,
    employee: { id: String(emp._id), name: emp.fullName, code: emp.employeeCode },
    _loanRepaymentId: _loanRepaymentId,
    paidDaysBreakdown: {
      calendarDays: totalDays,
      payableDaysBase,
      paidDays: totalPaidDays,
      lopDays: totalLopDays,
      calculationMethod: dayCalcMethod,
      proRataFactor,
    },
    lopDetails: {
      lopDays: unpaidLeaveDays,
      lopAmount: unpaidLeaveDeduction,
      calculationMethod: lopCalcMethod,
      perDayRate: lopPerDayRate,
      componentsAffected: config.lopComponentsAffected || ['basic', 'hra', 'da', 'special'],
    },
    proRataDetails: {
      isJoiner, isLeaver,
      joinDate, leaveDate,
      daysWorked: Math.round(daysWorked),
      totalDays,
      proRataFactor,
    },
    componentWiseEarnings,
    componentWiseDeductions,
    arrears,
    complianceFlags,
    taxComputation: taxComputation ? {
      regime: taxComputation.regime,
      projectedAnnualGross: taxComputation.projectedAnnualGross,
      projectedAnnualExemptions: taxComputation.projectedAnnualExemptions,
      projectedTaxableIncome: taxComputation.projectedTaxableIncome,
      annualTaxAmount: taxComputation.annualTaxAmount,
      surcharge: taxComputation.surcharge,
      educationCess: taxComputation.educationCess,
      totalTaxLiability: taxComputation.totalTaxLiability,
      monthlyTds: taxComputation.monthlyTds,
      rebate87a: taxComputation.rebate87a,
    } : undefined,
  };
}

export class PayrollService {
  static async listRuns(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);
    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };
    const filter: Record<string, unknown> = {};

    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.year && queryParams.month) {
      filter.month = `${queryParams.year}-${String(queryParams.month).padStart(2, '0')}`;
    } else if (queryParams.year) {
      filter.month = { $regex: `^${queryParams.year}-` };
    } else if (queryParams.month) {
      filter.month = { $regex: `-${String(queryParams.month).padStart(2, '0')}$` };
    }

    const [runs, total] = await Promise.all([
      PayrollRun.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      PayrollRun.countDocuments(filter),
    ]);

    const data = runs.map((r) => ({ ...r, id: String(r._id), _id: undefined })) as PayrollResultRow[];
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async runPayroll(month: number, year: number, userId: string): Promise<Record<string, unknown>> {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const existingRun = await PayrollRun.findOne({ month: monthStr }).session(session);
      if (existingRun) {
        throw new AppError(`Payroll for ${monthStr} already exists`, 400);
      }
      
      const settings = await CompanySettings.findOne().lean().session(session);
      const config: PayrollConfig = {
        ...(settings?.payrollConfig as Partial<PayrollConfig>),
        perDayCalcMethod: (settings?.payrollConfig as any)?.perDayCalcMethod || '30',
        lopCalcMethod: (settings?.payrollConfig as any)?.lopCalcMethod || '30',
        roundingFinalSalary: (settings?.payrollConfig as any)?.roundingFinalSalary || 'nearest',
        roundingPrecision: (settings?.payrollConfig as any)?.roundingPrecision ?? 0,
        negativeNetPayAllow: (settings?.payrollConfig as any)?.negativeNetPayAllow ?? false,
        arrearsAutoCalculate: (settings?.payrollConfig as any)?.arrearsAutoCalculate ?? true,
        lopPerDayBase: (settings?.payrollConfig as any)?.lopPerDayBase || '30',
        lopComponentsAffected: (settings?.payrollConfig as any)?.lopComponentsAffected || ['basic', 'hra', 'da', 'special'],
        lopImpactsPf: (settings?.payrollConfig as any)?.lopImpactsPf ?? true,
        lopImpactsEsi: (settings?.payrollConfig as any)?.lopImpactsEsi ?? true,
        makerCheckerEnabled: (settings?.payrollConfig as any)?.makerCheckerEnabled ?? false,
      } as PayrollConfig;
      const allowances = (settings?.allowanceConfig as AllowanceConfig[]) || [];
      const deductions = (settings?.deductionConfig as DeductionConfig[]) || [];
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const totalDays = getDaysInMonth(year, month);
      const standardHours = config.standardHoursPerDay || 8;
      
      const employees = await Employee.find({ status: 'active' }).lean().session(session);
      
      const minimumWageThreshold = settings?.payrollConfig?.minimumWage || 10000;
      
      let totalNetPay = 0, totalGrossPay = 0, totalDeductions = 0;
      const payrollItems = [];
      
      // Process in batches of 50 for large payrolls (2G)
      const BATCH_SIZE = 50;
      for (let i = 0; i < employees.length; i += BATCH_SIZE) {
        const batch = employees.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(emp =>
            calculatePayrollForEmployee(emp, month, year, config, allowances, deductions, startDate, endDate, totalDays, totalDays, standardHours, minimumWageThreshold)
              .catch(err => {
                throw new AppError(
                  `Payroll calculation failed for ${emp.employeeCode || emp.fullName || emp._id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
                  500,
                );
              })
          ),
        );
        for (const result of batchResults) {
          totalNetPay += result.netPay;
          totalGrossPay += result.grossEarnings;
          totalDeductions += result.totalDeductions;
          payrollItems.push(result);
        }
      }
      
      const totalEmployerContributions = payrollItems.reduce(
        (sum, item) => sum + item.employerContributions.reduce((s, c) => s + c.calculatedValue, 0), 0,
      );
      
      const [run] = await PayrollRun.create(
        [{
          month: monthStr,
          status: 'draft',
          totalEmployees: employees.length,
          totalNetPay,
          totalGrossPay,
          totalDeductions,
          totalEmployerContributions,
          processedBy: new mongoose.Types.ObjectId(userId),
        }],
        { session },
      );
      
      const payrollItemDocs = payrollItems.map(item => ({
        payrollRun: run._id,
        employee: item.employee.id,
        month: monthStr,
        totalDays: item.totalDays,
        presentDays: item.presentDays,
        absentDays: item.absentDays,
        halfDays: item.halfDays,
        paidLeaveDays: item.paidLeaveDays,
        unpaidLeaveDays: item.unpaidLeaveDays,
        weeklyOffs: item.weeklyOffs,
        holidays: item.holidays,
        effectiveWorkingDays: item.effectiveWorkingDays,
        overtimeHours: item.overtimeHours,
        overtimeHoursAllowed: item.overtimeHoursAllowed,
        overtimeRuleApplied: item.overtimeRuleApplied,
        overtimeAmount: item.overtimeAmount,
        basicEarnings: item.basicEarnings,
        allowances: item.allowances,
        grossEarnings: item.grossEarnings,
        deductions: item.deductions,
        totalDeductions: item.totalDeductions,
        employerContributions: item.employerContributions || [],
        loanEmiDeduction: item.loanEmiDeduction || 0,
        loanRepayment: item._loanRepaymentId || undefined,
        netPay: item.netPay,
        status: 'draft',
        paidDaysBreakdown: item.paidDaysBreakdown,
        lopDetails: item.lopDetails,
        proRataDetails: item.proRataDetails,
        complianceFlags: item.complianceFlags,
        taxComputation: item.taxComputation,
        componentWiseEarnings: item.componentWiseEarnings,
        componentWiseDeductions: item.componentWiseDeductions,
          arrears: item.arrears,
          bankSplitPercent: item.bankSplitPercent,
          primaryBankAmount: item.primaryBankAmount,
          secondaryBankAmount: item.secondaryBankAmount,
      }));
      
      await PayrollItem.insertMany(payrollItemDocs, { session });
      
      await AuditService.log({
        action: 'create',
        module: 'payroll',
        userId,
        targetId: run._id.toString(),
        details: { month: monthStr, employees: employees.length },
      });
      
      await session.commitTransaction();
      session.endSession();
      
      return { 
        id: String(run._id), 
        month: monthStr, 
        status: 'draft',
        totalEmployees: employees.length,
        totalNetPay,
        totalGrossPay,
        totalDeductions,
        totalEmployerContributions,
        items: payrollItems,
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(err instanceof Error ? err.message : 'Payroll run failed', 500);
    }
  }

  static async previewRun(month: number, year: number): Promise<Record<string, unknown>> {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const settings = await CompanySettings.findOne().lean();
    const config: PayrollConfig = {
      ...(settings?.payrollConfig as Partial<PayrollConfig>),
      perDayCalcMethod: (settings?.payrollConfig as any)?.perDayCalcMethod || '30',
      lopCalcMethod: (settings?.payrollConfig as any)?.lopCalcMethod || '30',
      roundingFinalSalary: (settings?.payrollConfig as any)?.roundingFinalSalary || 'nearest',
      roundingPrecision: (settings?.payrollConfig as any)?.roundingPrecision ?? 0,
      negativeNetPayAllow: (settings?.payrollConfig as any)?.negativeNetPayAllow ?? false,
      arrearsAutoCalculate: (settings?.payrollConfig as any)?.arrearsAutoCalculate ?? true,
      lopPerDayBase: (settings?.payrollConfig as any)?.lopPerDayBase || '30',
      lopComponentsAffected: (settings?.payrollConfig as any)?.lopComponentsAffected || ['basic', 'hra', 'da', 'special'],
      lopImpactsPf: (settings?.payrollConfig as any)?.lopImpactsPf ?? true,
      lopImpactsEsi: (settings?.payrollConfig as any)?.lopImpactsEsi ?? true,
      makerCheckerEnabled: (settings?.payrollConfig as any)?.makerCheckerEnabled ?? false,
    } as PayrollConfig;
    const allowances = (settings?.allowanceConfig as AllowanceConfig[]) || [];
    const deductions = (settings?.deductionConfig as DeductionConfig[]) || [];

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = getDaysInMonth(year, month);
    const standardHours = config.standardHoursPerDay || 8;

    const employees = await Employee.find({ status: 'active' }).lean();

    const minimumWageThreshold = settings?.payrollConfig?.minimumWage || 10000;

    let totalNetPay = 0, totalGrossPay = 0, totalDeductions = 0;
    const payrollItems = [];

    const BATCH_SIZE = 50;
    for (let i = 0; i < employees.length; i += BATCH_SIZE) {
      const batch = employees.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(emp =>
          calculatePayrollForEmployee(emp, month, year, config, allowances, deductions, startDate, endDate, totalDays, totalDays, standardHours, minimumWageThreshold)
        ),
      );
      for (const result of batchResults) {
        totalNetPay += result.netPay;
        totalGrossPay += result.grossEarnings;
        totalDeductions += result.totalDeductions;
        payrollItems.push(result);
      }
    }

    return {
      month: monthStr,
      totalEmployees: employees.length,
      totalNetPay,
      totalGrossPay,
      totalDeductions,
      items: payrollItems,
    };
  }

  static async submitRun(id: string, userId: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.findById(id).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status !== 'draft') throw new AppError('Only draft payroll can be submitted', 400);

      run.status = 'submitted';
      run.submittedBy = new mongoose.Types.ObjectId(userId);
      run.submittedAt = new Date();
      await addRevision(run, 'Submitted for approval', userId);
      await addApprovalHistory(run, 'submitted', userId);
      await run.save();

      await PayrollItem.updateMany({ payrollRun: id }, { status: 'submitted' }).session(session);

      await session.commitTransaction();

      await AuditService.log({ action: 'update', module: 'payroll', userId, targetId: id, details: { status: 'submitted' } });

      return { id: String(run._id), status: run.status };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async approveRun(id: string, userId: string, comments?: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.findById(id).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status !== 'submitted') throw new AppError('Only submitted payroll can be approved', 400);

      // Maker-checker enforcement (5A)
      const settings = await CompanySettings.findOne().lean();
      const makerCheckerEnabled = (settings?.payrollConfig as any)?.makerCheckerEnabled ?? false;
      if (makerCheckerEnabled && run.submittedBy?.toString() === userId) {
        throw new AppError('Cannot approve your own submission (maker-checker)', 400);
      }

      run.status = 'approved';
      run.approvedBy = new mongoose.Types.ObjectId(userId);
      run.approvedAt = new Date();
      run.remarks = comments || run.remarks;
      await addRevision(run, 'Approved', userId);
      await addApprovalHistory(run, 'approved', userId, comments);
      await run.save();

      await PayrollItem.updateMany({ payrollRun: id }, { status: 'approved' }).session(session);

      await session.commitTransaction();

      await AuditService.log({ action: 'approve', module: 'payroll', userId, targetId: id, details: { status: 'approved' } });

      return { id: String(run._id), status: run.status };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async rejectRun(id: string, userId: string, reason?: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.findById(id).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status !== 'submitted') throw new AppError('Only submitted payroll can be rejected', 400);

      // Maker-checker enforcement (5A)
      const settings = await CompanySettings.findOne().lean();
      const makerCheckerEnabled = (settings?.payrollConfig as any)?.makerCheckerEnabled ?? false;
      if (makerCheckerEnabled && run.submittedBy?.toString() === userId) {
        throw new AppError('Cannot reject your own submission (maker-checker)', 400);
      }

      run.status = 'draft';
      run.submittedBy = undefined;
      run.submittedAt = undefined;
      if (reason) run.remarks = `Rejected: ${reason}`;
      await addRevision(run, 'Rejected, returned to draft', userId, { reason });
      await addApprovalHistory(run, 'rejected', userId, reason);
      await run.save();

      await PayrollItem.updateMany({ payrollRun: id }, { status: 'draft' }).session(session);

      await session.commitTransaction();

      await AuditService.log({ action: 'reject', module: 'payroll', userId, targetId: id, details: { reason } });

      return { id: String(run._id), status: run.status };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async finalizeRun(id: string, userId: string, remarks?: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.findById(id).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status === 'finalized') throw new AppError('Already finalized', 400);
      if (run.status !== 'approved') throw new AppError('Only approved payroll can be finalized', 400);

      // Maker-checker: finalizer cannot be the submitter or approver
      const settings = await CompanySettings.findOne().lean();
      const makerCheckerEnabled = (settings?.payrollConfig as any)?.makerCheckerEnabled ?? false;
      if (makerCheckerEnabled) {
        if (run.submittedBy?.toString() === userId) {
          throw new AppError('Cannot finalize your own submission (maker-checker)', 400);
        }
        if (run.approvedBy?.toString() === userId) {
          throw new AppError('Cannot finalize your own approval (maker-checker)', 400);
        }
      }

      run.status = 'finalized';
      run.finalizedBy = new mongoose.Types.ObjectId(userId);
      run.finalizedAt = new Date();
      if (remarks) run.remarks = remarks;
      await addRevision(run, 'Finalized', userId);
      await addApprovalHistory(run, 'finalized', userId, remarks);
      await run.save();

      await PayrollItem.updateMany(
        { payrollRun: id },
        { status: 'finalized' },
      ).session(session);

      const loanLinkedItems = await PayrollItem.find({
        payrollRun: id,
        loanRepayment: { $exists: true, $ne: null },
      }).select('loanRepayment').lean().session(session);
      const loanRepaymentIds = loanLinkedItems.map((item) => item.loanRepayment).filter(Boolean);
      if (loanRepaymentIds.length > 0) {
        await LoanRepayment.updateMany(
          { _id: { $in: loanRepaymentIds }, status: 'pending' },
          { status: 'deducted', payrollRun: run._id, repaidAt: new Date() },
        ).session(session);
      }

      await session.commitTransaction();

      await AuditService.log({
        action: 'finalize',
        module: 'payroll',
        userId,
        targetId: id,
        details: { month: run.month },
      });

      // Run compliance check asynchronously after finalization
      runComplianceCheck(id).catch((err) => {
        console.error(`Compliance check failed for run ${id}:`, err);
      });

      const hrAdmins = await User.find({ role: { $in: ['super-admin', 'hr-admin', 'accounts'] } }).lean();
      for (const admin of hrAdmins) {
        await NotificationService.send({
          title: 'Payroll Finalized',
          message: `Payroll for ${run.month} has been finalized.`,
          type: 'success',
          recipient: admin._id.toString(),
          module: 'payroll',
          link: `/payroll/${id}`,
        });
      }

      return { id: String(run._id), status: run.status };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async unfinalizeRun(id: string, userId: string, reason?: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.findById(id).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status !== 'finalized') throw new AppError('Can only unfinalize finalized payroll', 400);

      const settings = await CompanySettings.findOne().lean();
      const config = (settings?.payrollConfig as PayrollConfig) || {} as PayrollConfig;
      const windowDays = getPayrollLockDays(config);
      if (windowDays <= 0) {
        throw new AppError('Cannot unfinalize: payroll is locked immediately by payroll settings', 400);
      }
      if (run.finalizedAt) {
        const elapsed = dayjs().diff(dayjs(run.finalizedAt), 'day');
        if (elapsed >= windowDays) {
          throw new AppError(
            `Cannot unfinalize: the ${windowDays}-day payroll lock window has expired (finalized on ${dayjs(run.finalizedAt).format('DD-MMM-YYYY')})`,
            400,
          );
        }
      }

      const loanRepaymentsReversed = await LoanRepayment.find(
        { payrollRun: run._id, status: 'deducted' },
      ).session(session).lean();

      run.status = 'draft';
      run.finalizedBy = undefined;
      run.finalizedAt = undefined;
      if (reason) run.remarks = `Unfinalized: ${reason}`;
      await addRevision(run, 'Unfinalized (returned to draft)', userId, { reason });
      await addApprovalHistory(run, 'unfinalized', userId, reason);
      await run.save({ session });

      await PayrollItem.updateMany(
        { payrollRun: id },
        { status: 'draft' }
      ).session(session);

      await LoanRepayment.updateMany(
        { payrollRun: run._id, status: 'deducted' },
        { $set: { status: 'pending' }, $unset: { payrollRun: '', repaidAt: '' } },
      ).session(session);

      if (loanRepaymentsReversed.length > 0) {
        await AuditService.log({
          action: 'update',
          module: 'payroll',
          userId,
          targetId: id,
          details: {
            month: run.month,
            reason,
            loanRepaymentsReversed: loanRepaymentsReversed.map((lr) => ({
              id: String(lr._id),
              employee: String(lr.employee),
              amount: lr.amount,
              month: lr.month,
            })),
          },
          session,
        });
      }

      await AuditService.log({
        action: 'unfinalize',
        module: 'payroll',
        userId,
        targetId: id,
        details: { month: run.month, reason, loanRepaymentsReversedCount: loanRepaymentsReversed.length },
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return { id: String(run._id), status: run.status };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      if (err instanceof AppError) throw err;
      throw new AppError(err instanceof Error ? err.message : 'Unfinalize failed', 500);
    }
  }

  static async supplementaryRun(
    month: number, year: number, userId: string, employeeIds: string[], reason: string,
  ): Promise<Record<string, unknown>> {
    const settings = await CompanySettings.findOne().lean();
    const config: PayrollConfig = {
      ...(settings?.payrollConfig as Partial<PayrollConfig>),
      perDayCalcMethod: (settings?.payrollConfig as any)?.perDayCalcMethod || '30',
      lopCalcMethod: (settings?.payrollConfig as any)?.lopCalcMethod || '30',
      roundingFinalSalary: (settings?.payrollConfig as any)?.roundingFinalSalary || 'nearest',
      roundingPrecision: (settings?.payrollConfig as any)?.roundingPrecision ?? 0,
      negativeNetPayAllow: (settings?.payrollConfig as any)?.negativeNetPayAllow ?? false,
      arrearsAutoCalculate: (settings?.payrollConfig as any)?.arrearsAutoCalculate ?? true,
      lopPerDayBase: (settings?.payrollConfig as any)?.lopPerDayBase || '30',
      lopComponentsAffected: (settings?.payrollConfig as any)?.lopComponentsAffected || ['basic', 'hra', 'da', 'special'],
      lopImpactsPf: (settings?.payrollConfig as any)?.lopImpactsPf ?? true,
      lopImpactsEsi: (settings?.payrollConfig as any)?.lopImpactsEsi ?? true,
      makerCheckerEnabled: (settings?.payrollConfig as any)?.makerCheckerEnabled ?? false,
    } as PayrollConfig;
    const allowances = (settings?.allowanceConfig as AllowanceConfig[]) || [];
    const deductions = (settings?.deductionConfig as DeductionConfig[]) || [];

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = getDaysInMonth(year, month);
    const standardHours = config.standardHoursPerDay || 8;

    const employees = await Employee.find({ _id: { $in: employeeIds }, status: 'active' }).lean();
    if (employees.length === 0) throw new AppError('No active employees found for the given IDs', 404);

    const minimumWageThreshold = settings?.payrollConfig?.minimumWage || 10000;

    const payrollItemDocs = [];
    let totalNetPay = 0, totalGrossPay = 0, totalDeductions = 0;

    for (const emp of employees) {
      const result = await calculatePayrollForEmployee(
        emp, month, year, config, allowances, deductions, startDate, endDate, totalDays, totalDays, standardHours, minimumWageThreshold,
      );
      totalNetPay += result.netPay;
      totalGrossPay += result.grossEarnings;
      totalDeductions += result.totalDeductions;

      payrollItemDocs.push({
        employee: emp._id,
        month: monthStr,
        totalDays: result.totalDays,
        presentDays: result.presentDays,
        absentDays: result.absentDays,
        halfDays: result.halfDays,
        paidLeaveDays: result.paidLeaveDays,
        unpaidLeaveDays: result.unpaidLeaveDays,
        weeklyOffs: result.weeklyOffs,
        holidays: result.holidays,
        effectiveWorkingDays: result.effectiveWorkingDays,
        overtimeHours: result.overtimeHours,
        overtimeHoursAllowed: result.overtimeHoursAllowed,
        overtimeRuleApplied: result.overtimeRuleApplied,
        overtimeAmount: result.overtimeAmount,
        basicEarnings: result.basicEarnings,
        allowances: result.allowances,
        grossEarnings: result.grossEarnings,
        deductions: result.deductions,
        totalDeductions: result.totalDeductions,
        netPay: result.netPay,
        status: 'draft',
        paidDaysBreakdown: result.paidDaysBreakdown,
        lopDetails: result.lopDetails,
        proRataDetails: result.proRataDetails,
        complianceFlags: result.complianceFlags,
        componentWiseEarnings: result.componentWiseEarnings,
        componentWiseDeductions: result.componentWiseDeductions,
          arrears: result.arrears,
          bankSplitPercent: result.bankSplitPercent,
          primaryBankAmount: result.primaryBankAmount,
          secondaryBankAmount: result.secondaryBankAmount,
        taxComputation: result.taxComputation,
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.create([{
        month: monthStr,
        status: 'draft',
        totalEmployees: employees.length,
        totalNetPay,
        totalGrossPay,
        totalDeductions,
        processedBy: new mongoose.Types.ObjectId(userId),
        isSupplementary: true,
        remarks: `Supplementary: ${reason}`,
      }], { session });

      await PayrollItem.insertMany(payrollItemDocs.map(doc => ({ ...doc, payrollRun: run[0]._id })), { session });

      await session.commitTransaction();

      await AuditService.log({
        action: 'create',
        module: 'payroll',
        userId,
        targetId: run[0]._id.toString(),
        details: { month: monthStr, type: 'supplementary', employees: employees.length, reason },
      });

      return {
        id: String(run[0]._id),
        month: monthStr,
        type: 'supplementary',
        reason,
        status: 'draft',
        totalEmployees: employees.length,
        totalNetPay,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async getRunDetails(id: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id).lean();
    if (!run) throw new AppError('Payroll run not found', 404);

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.payrollConfig as PayrollConfig) || {} as PayrollConfig;
    const unfinalizeWindowDays = getPayrollLockDays(config);
    const unfinalizeLocked = !!(run.finalizedAt && (unfinalizeWindowDays <= 0 || dayjs().diff(dayjs(run.finalizedAt), 'day') >= unfinalizeWindowDays));

    const items = await populatePayrollItem(PayrollItem.find({ payrollRun: new mongoose.Types.ObjectId(id) })).lean() as any[];

    const itemsData = items.map((item) => {
      const emp = item.employee as unknown as { _id: mongoose.Types.ObjectId; fullName: string; employeeCode: string };
      return {
        id: String(item._id),
        employee: {
          id: String(emp._id),
          name: emp.fullName,
          code: emp.employeeCode,
        },
        totalDays: item.totalDays,
        presentDays: item.presentDays,
        absentDays: item.absentDays,
        halfDays: item.halfDays,
        paidLeaveDays: item.paidLeaveDays,
        unpaidLeaveDays: item.unpaidLeaveDays,
        weeklyOffs: item.weeklyOffs,
        holidays: item.holidays,
        effectiveWorkingDays: item.effectiveWorkingDays,
        overtimeHours: item.overtimeHours,
        basicEarnings: item.basicEarnings,
        allowances: item.allowances,
        allowancesTotal: item.allowances?.reduce((sum: number, a: { calculatedValue: number }) => sum + a.calculatedValue, 0) || 0,
        overtimeAmount: item.overtimeAmount,
        grossEarnings: item.grossEarnings,
        deductions: item.deductions,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
        status: item.status,
        paidDaysBreakdown: item.paidDaysBreakdown,
        lopDetails: item.lopDetails,
        proRataDetails: item.proRataDetails,
        complianceFlags: item.complianceFlags,
        taxComputation: item.taxComputation,
          arrears: item.arrears,
          bankSplitPercent: item.bankSplitPercent,
          primaryBankAmount: item.primaryBankAmount,
          secondaryBankAmount: item.secondaryBankAmount,
        previousMonthComparison: item.previousMonthComparison,
      };
    });

    return { ...run, id: String(run._id), _id: undefined, items: itemsData, unfinalizeWindowDays, unfinalizeLocked };
  }

  static async updatePayrollItem(runId: string, id: string, data: Record<string, unknown>, userId: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await PayrollItem.findOne({ _id: id, payrollRun: runId }).session(session);
      if (!item) throw new AppError('Payroll item not found', 404);

      const run = await PayrollRun.findById(runId).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status !== 'draft') throw new AppError('Can only edit draft payroll', 400);

      const changes: Record<string, unknown> = {};
      if (data.basicEarnings !== undefined && item.basicEarnings !== data.basicEarnings) {
        changes.basicEarnings = { from: item.basicEarnings, to: data.basicEarnings };
        item.basicEarnings = data.basicEarnings as number;
      }
      if (data.allowances !== undefined) {
        changes.allowances = { updated: true };
        item.allowances = data.allowances as IPayrollItem['allowances'];
      }
      if (data.deductions !== undefined) {
        changes.deductions = { updated: true };
        item.deductions = data.deductions as IPayrollItem['deductions'];
      }
      if (data.netPay !== undefined && item.netPay !== data.netPay) {
        changes.netPay = { from: item.netPay, to: data.netPay };
        item.netPay = data.netPay as number;
      }

      await item.save({ session });

      if (Object.keys(changes).length > 0) {
        await addRevision(run, 'Payroll item updated', userId, { itemId: id, employee: item.employee.toString(), changes });

        const aggregates = await PayrollItem.aggregate([
          { $match: { payrollRun: run._id } },
          { $group: { _id: null, totalNetPay: { $sum: '$netPay' }, totalGrossPay: { $sum: '$grossEarnings' }, totalDeductions: { $sum: '$totalDeductions' } } }
        ]).session(session).then(result => result[0]);

        await PayrollRun.findByIdAndUpdate(run._id, {
          totalNetPay: aggregates?.totalNetPay || 0,
          totalGrossPay: aggregates?.totalGrossPay || 0,
          totalDeductions: aggregates?.totalDeductions || 0,
        }).session(session);
      }

      await session.commitTransaction();

      await AuditService.log({
        action: 'update',
        module: 'payroll',
        userId,
        targetId: id,
        details: { field: 'payroll_item', changes },
      });

      const { _id, ...rest } = item.toObject();
      return { ...rest, id: String(_id), _id: undefined };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async batchUpdateItems(id: string, items: Array<{ itemId: string; data: Record<string, unknown> }>, userId: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.findById(id).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status !== 'draft') throw new AppError('Can only edit draft payroll', 400);

      const results = [];
      for (const entry of items) {
        try {
          const item = await PayrollItem.findOne({ _id: entry.itemId, payrollRun: id }).session(session);
          if (!item) {
            results.push({ itemId: entry.itemId, status: 'failed', error: 'Item not found' });
            continue;
          }
          if (entry.data.basicEarnings !== undefined) item.basicEarnings = entry.data.basicEarnings as number;
          if (entry.data.netPay !== undefined) item.netPay = entry.data.netPay as number;
          if (entry.data.allowances !== undefined) item.allowances = entry.data.allowances as IPayrollItem['allowances'];
          if (entry.data.deductions !== undefined) item.deductions = entry.data.deductions as IPayrollItem['deductions'];
          if (entry.data.presentDays !== undefined) item.presentDays = entry.data.presentDays as number;
          if (entry.data.absentDays !== undefined) item.absentDays = entry.data.absentDays as number;
          if (entry.data.halfDays !== undefined) item.halfDays = entry.data.halfDays as number;
          if (entry.data.paidLeaveDays !== undefined) item.paidLeaveDays = entry.data.paidLeaveDays as number;
          if (entry.data.unpaidLeaveDays !== undefined) item.unpaidLeaveDays = entry.data.unpaidLeaveDays as number;
          if (entry.data.overtimeHours !== undefined) item.overtimeHours = entry.data.overtimeHours as number;
          if (entry.data.overtimeAmount !== undefined) item.overtimeAmount = entry.data.overtimeAmount as number;
          if (entry.data.totalDeductions !== undefined) item.totalDeductions = entry.data.totalDeductions as number;
          await item.save({ session });
          results.push({ itemId: entry.itemId, status: 'updated' });
        } catch (error) {
          results.push({ itemId: entry.itemId, status: 'failed', error: (error as Error).message });
        }
      }

      const aggregates = await PayrollItem.aggregate([
        { $match: { payrollRun: run._id } },
        { $group: { _id: null, totalNetPay: { $sum: '$netPay' }, totalGrossPay: { $sum: '$grossEarnings' }, totalDeductions: { $sum: '$totalDeductions' } } }
      ]).session(session).then(result => result[0]);

      await PayrollRun.findByIdAndUpdate(run._id, {
        totalNetPay: aggregates?.totalNetPay || 0,
        totalGrossPay: aggregates?.totalGrossPay || 0,
        totalDeductions: aggregates?.totalDeductions || 0,
      }).session(session);

      await addRevision(run, 'Batch update items', userId, { itemsCount: items.length });
      await run.save({ session });

      await AuditService.log({
        action: 'bulk-update', module: 'payroll', userId,
        targetId: id, details: { items: items.length, results },
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return { updated: results.filter((r) => r.status === 'updated').length, failed: results.filter((r) => r.status === 'failed').length, results };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      if (err instanceof AppError) throw err;
      throw new AppError(err instanceof Error ? err.message : 'Batch update failed', 500);
    }
  }

  static async deleteRun(id: string, userId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const run = await PayrollRun.findById(id).session(session);
      if (!run) throw new AppError('Payroll run not found', 404);
      if (run.status === 'finalized') throw new AppError('Cannot delete finalized payroll', 400);

      await LoanRepayment.updateMany(
        { payrollRun: run._id, status: 'deducted' },
        { $set: { status: 'pending' }, $unset: { payrollRun: '', repaidAt: '' } },
      ).session(session);
      await PayrollItem.deleteMany({ payrollRun: id }).session(session);
      await PayrollRun.findByIdAndDelete(id).session(session);

      await session.commitTransaction();

      await AuditService.log({
        action: 'delete',
        module: 'payroll',
        userId,
        targetId: id,
        details: { month: run.month },
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async getByEmployee(employeeId: string): Promise<unknown[]> {
    const items = await populatePayrollItem(PayrollItem.find({ employee: employeeId })).lean() as any[];

    return items.map((item) => {
      const pr = item.payrollRun as unknown as { _id: mongoose.Types.ObjectId; month: string; status: string } | null;
      return {
        id: String(item._id),
        month: item.month,
          employee: item.employee ? {
            id: String((item.employee as any)._id),
            name: (item.employee as any).fullName,
            code: (item.employee as any).employeeCode,
          } : undefined,
        payrollRun: pr ? {
          id: String(pr._id),
          month: pr.month,
          status: pr.status,
        } : null,
        totalDays: item.totalDays,
        presentDays: item.presentDays,
        absentDays: item.absentDays,
        halfDays: item.halfDays,
        paidLeaveDays: item.paidLeaveDays,
        unpaidLeaveDays: item.unpaidLeaveDays,
        weeklyOffs: item.weeklyOffs,
        holidays: item.holidays,
        effectiveWorkingDays: item.effectiveWorkingDays,
        overtimeHours: item.overtimeHours,
        basicEarnings: item.basicEarnings,
        allowances: item.allowances,
        allowancesTotal: item.allowances?.reduce((sum: number, a: { calculatedValue: number }) => sum + a.calculatedValue, 0) || 0,
        overtimeAmount: item.overtimeAmount,
        grossEarnings: item.grossEarnings,
        deductions: item.deductions,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
        status: item.status,
        paidDaysBreakdown: item.paidDaysBreakdown,
        lopDetails: item.lopDetails,
        proRataDetails: item.proRataDetails,
        complianceFlags: item.complianceFlags,
      };
    });
  }
}
