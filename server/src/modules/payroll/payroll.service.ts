import PayrollRun, { IPayrollRun } from '../../models/PayrollRun.model.js';
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
import LoanRepayment from '../../models/LoanRepayment.model.js';
import User from '../../models/User.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { NotificationService } from '../../core/notification/NotificationService.js';
import dayjs from 'dayjs';

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
};

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
  employee: { id: string; name: string; code: string };
  _loanRepaymentId?: string;
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

function getPayrollLockDays(config: PayrollConfig): number {
  const value = config.payrollLockDays ?? config.unfinalizeWindowDays ?? 7;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 7;
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

async function calculatePayrollForEmployee(
  emp: LeanEmployee, _month: number, _year: number, config: PayrollConfig, allowances: AllowanceConfig[], deductions: DeductionConfig[],
  startDate: Date, endDate: Date, totalDays: number, workingDays: number, standardHours: number,
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
  const paidHolidays = config.paidHolidays ? holidaysCount : 0;

  const effectiveWorkingDays = presentDays + (halfDays * (1 - (config.halfDayDeductionPercent || 50) / 100)) + paidWeeklyOffs + paidHolidays;

  const basicEarnings = isMonthly
    ? Math.round(baseSalary * (effectiveWorkingDays / workingDays))
    : dailyWage * presentDays;

  const appliedAllowances = calculateAllowances(basicEarnings, category, employmentType, allowances);
  const allowancesTotal = appliedAllowances.reduce((sum, a) => sum + a.calculatedValue, 0);

  let overtimeRate: number;
  if (config.otTricksEnabled && config.otMultiplierBasicOnly) {
    overtimeRate = isMonthly
      ? (baseSalary / workingDays / standardHours)
      : dailyWage / standardHours;
  } else {
    overtimeRate = isMonthly
      ? (config.overtimeBase === 'basicPlusAllowances' ? (baseSalary + allowancesTotal) : baseSalary) / workingDays / standardHours
      : dailyWage / standardHours;
  }

  const otMultiplier = overtimeRule?.multiplier || config.overtimeMultiplier || 2;
  const overtimeAmount = allowedOvertimeHours > 0
    ? Math.round(overtimeRate * otMultiplier * allowedOvertimeHours)
    : 0;

  const halfDayDeduction = halfDays > 0
    ? Math.round((isMonthly ? baseSalary / workingDays : dailyWage) * (config.halfDayDeductionPercent || 50) / 100 * halfDays)
    : 0;
  const lateDeduction = absentDays > 0 ? (config.lateDeductionPerDay || 0) * absentDays : 0;

  let unpaidLeaveDeduction = 0;
  if (unpaidLeaveDays > 0) {
    const dailyRate = isMonthly ? baseSalary / workingDays : dailyWage;
    const unpaidLeaveType = leaveApplications.find((app) => {
      const lt = app.leaveType as unknown as { isPaid: boolean } | null;
      return lt && !lt.isPaid;
    });
    const deductionMethod = (unpaidLeaveType?.leaveType as unknown as { deductionMethod?: string })?.deductionMethod || 'basic-only';
    switch (deductionMethod) {
      case 'none': unpaidLeaveDeduction = 0; break;
      case 'basic-only': unpaidLeaveDeduction = Math.round(dailyRate * unpaidLeaveDays); break;
      case 'basic-plus-allowances':
      case 'gross':
        unpaidLeaveDeduction = Math.round((dailyRate + (allowancesTotal / Math.max(1, workingDays))) * unpaidLeaveDays);
        break;
    }
  }

  const grossEarnings = basicEarnings + allowancesTotal + overtimeAmount;
  const appliedDeductions = calculateDeductions(basicEarnings, grossEarnings, category, employmentType, deductions);
  let totalDeductionsValue = appliedDeductions.reduce((sum, d) => sum + d.calculatedValue, 0) + halfDayDeduction + lateDeduction + unpaidLeaveDeduction;

  const monthStr = `${_year}-${String(_month).padStart(2, '0')}`;
  let employerContributions: { name: string; calculatedValue: number }[] = [];
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
    throw new AppError(`Statutory calculation failed for ${emp.employeeCode || emp.fullName || emp._id}: ${reason}`, 500);
  }

  let netPay = grossEarnings - totalDeductionsValue;

  const loanRepayment = await LoanRepayment.findOne({
    employee: emp._id,
    month: monthStr,
    status: 'pending',
  }).populate('loan', 'amount').lean();

  let loanEmiDeduction = 0;
  if (loanRepayment) {
    loanEmiDeduction = Math.round(loanRepayment.amount * 100) / 100;
    appliedDeductions.push({
      name: 'Loan EMI',
      type: 'fixed' as const,
      value: loanEmiDeduction,
      calculatedValue: loanEmiDeduction,
    });
    totalDeductionsValue += loanEmiDeduction;
    netPay = grossEarnings - totalDeductionsValue;
  }

  return {
    totalDays, presentDays, absentDays, halfDays, paidLeaveDays, unpaidLeaveDays,
    weeklyOffs: paidWeeklyOffs, holidays: paidHolidays,
    effectiveWorkingDays: Math.round(effectiveWorkingDays * 100) / 100,
    overtimeHours: totalOvertimeHours, overtimeHoursAllowed: allowedOvertimeHours,
    overtimeRuleApplied: overtimeRule ? { name: overtimeRule.name, multiplier: overtimeRule.multiplier } : null,
    overtimeAmount, basicEarnings, allowances: appliedAllowances, allowancesTotal,
    grossEarnings, deductions: appliedDeductions, totalDeductions: totalDeductionsValue, employerContributions, loanEmiDeduction, netPay,
    employee: { id: String(emp._id), name: emp.fullName, code: emp.employeeCode },
    _loanRepaymentId: loanRepayment?._id?.toString(),
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
    
    // Start a MongoDB transaction to guarantee atomicity of the entire payroll run
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const existingRun = await PayrollRun.findOne({ month: monthStr }).session(session);
      if (existingRun) {
        throw new AppError(`Payroll for ${monthStr} already exists`, 400);
      }
      
      const settings = await CompanySettings.findOne().lean().session(session);
      const config = (settings?.payrollConfig as PayrollConfig) || {} as PayrollConfig;
      const allowances = (settings?.allowanceConfig as AllowanceConfig[]) || [];
      const deductions = (settings?.deductionConfig as DeductionConfig[]) || [];
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const totalDays = getDaysInMonth(year, month);
      const workingDays = config.defaultWorkingDays || 26;
      const standardHours = config.standardHoursPerDay || 8;
      
      const employees = await Employee.find({ status: 'active' }).lean().session(session);
      
      let totalNetPay = 0;
      const payrollItems = [];
      
      for (const emp of employees) {
        const result = await calculatePayrollForEmployee(emp, month, year, config, allowances, deductions, startDate, endDate, totalDays, workingDays, standardHours);
        totalNetPay += result.netPay;
        payrollItems.push(result);
      }
      
      const [run] = await PayrollRun.create(
        [{
          month: monthStr,
          status: 'draft',
          totalEmployees: employees.length,
          totalNetPay,
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
        items: payrollItems,
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      // Preserve original error handling semantics
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(err instanceof Error ? err.message : 'Payroll run failed', 500);
    }
  }

  static async previewRun(month: number, year: number): Promise<Record<string, unknown>> {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.payrollConfig as PayrollConfig) || {} as PayrollConfig;
    const allowances = (settings?.allowanceConfig as AllowanceConfig[]) || [];
    const deductions = (settings?.deductionConfig as DeductionConfig[]) || [];

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = getDaysInMonth(year, month);
    const workingDays = config.defaultWorkingDays || 26;
    const standardHours = config.standardHoursPerDay || 8;

    const employees = await Employee.find({ status: 'active' }).lean();

    let totalNetPay = 0;
    const payrollItems = [];

    for (const emp of employees) {
      const result = await calculatePayrollForEmployee(emp, month, year, config, allowances, deductions, startDate, endDate, totalDays, workingDays, standardHours);
      totalNetPay += result.netPay;
      payrollItems.push(result);
    }

    return {
      month: monthStr,
      totalEmployees: employees.length,
      totalNetPay,
      items: payrollItems,
    };
  }

  static async submitRun(id: string, userId: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id);
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status !== 'draft') throw new AppError('Only draft payroll can be submitted', 400);

    run.status = 'submitted';
    run.submittedBy = new mongoose.Types.ObjectId(userId);
    run.submittedAt = new Date();
    await addRevision(run, 'Submitted for approval', userId);
    await run.save();

    await PayrollItem.updateMany({ payrollRun: id }, { status: 'submitted' });
    await AuditService.log({ action: 'update', module: 'payroll', userId, targetId: id, details: { status: 'submitted' } });

    return { id: String(run._id), status: run.status };
  }

  static async approveRun(id: string, userId: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id);
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status !== 'submitted') throw new AppError('Only submitted payroll can be approved', 400);

    run.status = 'approved';
    run.approvedBy = new mongoose.Types.ObjectId(userId);
    run.approvedAt = new Date();
    await addRevision(run, 'Approved', userId);
    await run.save();

    await PayrollItem.updateMany({ payrollRun: id }, { status: 'approved' });
    await AuditService.log({ action: 'approve', module: 'payroll', userId, targetId: id, details: { status: 'approved' } });

    return { id: String(run._id), status: run.status };
  }

  static async rejectRun(id: string, userId: string, reason?: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id);
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status !== 'submitted') throw new AppError('Only submitted payroll can be rejected', 400);

    run.status = 'draft';
    run.submittedBy = undefined;
    run.submittedAt = undefined;
    if (reason) run.remarks = `Rejected: ${reason}`;
    await addRevision(run, 'Rejected, returned to draft', userId, { reason });
    await run.save();

    await PayrollItem.updateMany({ payrollRun: id }, { status: 'draft' });
    await AuditService.log({ action: 'reject', module: 'payroll', userId, targetId: id, details: { reason } });

    return { id: String(run._id), status: run.status };
  }

  static async finalizeRun(id: string, userId: string, remarks?: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id);
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status === 'finalized') throw new AppError('Already finalized', 400);
    if (run.status !== 'approved') throw new AppError('Only approved payroll can be finalized', 400);

    run.status = 'finalized';
    run.finalizedBy = new mongoose.Types.ObjectId(userId);
    run.finalizedAt = new Date();
    if (remarks) run.remarks = remarks;
    await addRevision(run, 'Finalized', userId);
    await run.save();

    await PayrollItem.updateMany(
      { payrollRun: id },
      { status: 'finalized' }
    );

    const loanLinkedItems = await PayrollItem.find({
      payrollRun: id,
      loanRepayment: { $exists: true, $ne: null },
    }).select('loanRepayment').lean();
    const loanRepaymentIds = loanLinkedItems.map((item) => item.loanRepayment).filter(Boolean);
    if (loanRepaymentIds.length > 0) {
      await LoanRepayment.updateMany(
        { _id: { $in: loanRepaymentIds }, status: 'pending' },
        { status: 'deducted', payrollRun: run._id, repaidAt: new Date() },
      );
    }

    await AuditService.log({
      action: 'finalize',
      module: 'payroll',
      userId,
      targetId: id,
      details: { month: run.month },
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
  }

  static async unfinalizeRun(id: string, userId: string, reason?: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id);
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

    run.status = 'draft';
    run.finalizedBy = undefined;
    run.finalizedAt = undefined;
    if (reason) run.remarks = `Unfinalized: ${reason}`;
    await addRevision(run, 'Unfinalized (returned to draft)', userId, { reason });
    await run.save();

    await PayrollItem.updateMany(
      { payrollRun: id },
      { status: 'draft' }
    );

    await LoanRepayment.updateMany(
      { payrollRun: run._id, status: 'deducted' },
      { $set: { status: 'pending' }, $unset: { payrollRun: '', repaidAt: '' } },
    );

    await AuditService.log({
      action: 'unfinalize',
      module: 'payroll',
      userId,
      targetId: id,
      details: { month: run.month, reason },
    });

    return { id: String(run._id), status: run.status };
  }

  static async getRunDetails(id: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id).lean();
    if (!run) throw new AppError('Payroll run not found', 404);

    const settings = await CompanySettings.findOne().lean();
    const config = (settings?.payrollConfig as PayrollConfig) || {} as PayrollConfig;
    const unfinalizeWindowDays = getPayrollLockDays(config);
    const unfinalizeLocked = !!(run.finalizedAt && (unfinalizeWindowDays <= 0 || dayjs().diff(dayjs(run.finalizedAt), 'day') >= unfinalizeWindowDays));

    const items = await PayrollItem.find({ payrollRun: new mongoose.Types.ObjectId(id) })
      .populate('employee', 'fullName employeeCode')
      .lean();

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
        allowancesTotal: item.allowances?.reduce((sum, a) => sum + a.calculatedValue, 0) || 0,
        overtimeAmount: item.overtimeAmount,
        grossEarnings: item.grossEarnings,
        deductions: item.deductions,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
        status: item.status,
      };
    });

    return { ...run, id: String(run._id), _id: undefined, items: itemsData, unfinalizeWindowDays, unfinalizeLocked };
  }

  static async updatePayrollItem(runId: string, id: string, data: Record<string, unknown>, userId: string): Promise<Record<string, unknown>> {
    const item = await PayrollItem.findOne({ _id: id, payrollRun: runId });
    if (!item) throw new AppError('Payroll item not found', 404);

    const run = await PayrollRun.findById(runId);
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

    await item.save();

    if (Object.keys(changes).length > 0) {
      await addRevision(run, 'Payroll item updated', userId, { itemId: id, employee: item.employee.toString(), changes });

      await PayrollRun.findByIdAndUpdate(run._id, {
        totalNetPay: await PayrollItem.aggregate([
          { $match: { payrollRun: run._id } },
          { $group: { _id: null, total: { $sum: '$netPay' } } }
        ]).then(result => result[0]?.total || 0)
      });
    }

    await AuditService.log({
      action: 'update',
      module: 'payroll',
      userId,
      targetId: id,
      details: { field: 'payroll_item', changes },
    });

    const { _id, ...rest } = item.toObject();
    return { ...rest, id: String(_id), _id: undefined };
  }

  static async batchUpdateItems(id: string, items: Array<{ itemId: string; data: Record<string, unknown> }>, userId: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id);
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status !== 'draft') throw new AppError('Can only edit draft payroll', 400);

    const results = [];
    for (const entry of items) {
      try {
        const item = await PayrollItem.findOne({ _id: entry.itemId, payrollRun: id });
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
        await item.save();
        results.push({ itemId: entry.itemId, status: 'updated' });
      } catch (error) {
        results.push({ itemId: entry.itemId, status: 'failed', error: (error as Error).message });
      }
    }

    await PayrollRun.findByIdAndUpdate(run._id, {
      totalNetPay: await PayrollItem.aggregate([
        { $match: { payrollRun: run._id } },
        { $group: { _id: null, total: { $sum: '$netPay' } } }
      ]).then(result => result[0]?.total || 0)
    });

    await addRevision(run, 'Batch update items', userId, { itemsCount: items.length });
    await run.save();

    await AuditService.log({
      action: 'bulk-update', module: 'payroll', userId,
      targetId: id, details: { items: items.length, results },
    });

    return { updated: results.filter((r) => r.status === 'updated').length, failed: results.filter((r) => r.status === 'failed').length, results };
  }

  static async deleteRun(id: string, userId: string): Promise<void> {
    const run = await PayrollRun.findById(id);
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status === 'finalized') throw new AppError('Cannot delete finalized payroll', 400);

    await LoanRepayment.updateMany(
      { payrollRun: run._id, status: 'deducted' },
      { $set: { status: 'pending' }, $unset: { payrollRun: '', repaidAt: '' } },
    );
    await PayrollItem.deleteMany({ payrollRun: id });
    await PayrollRun.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'payroll',
      userId,
      targetId: id,
      details: { month: run.month },
    });
  }

  static async getByEmployee(employeeId: string): Promise<unknown[]> {
    const items = await PayrollItem.find({ employee: employeeId })
      .populate('payrollRun', 'month status finalizedBy')
      .sort({ month: -1 })
      .lean();

    return items.map((item) => {
      const pr = item.payrollRun as unknown as { _id: mongoose.Types.ObjectId; month: string; status: string } | null;
      return {
        id: String(item._id),
        month: item.month,
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
        allowancesTotal: item.allowances?.reduce((sum, a) => sum + a.calculatedValue, 0) || 0,
        overtimeAmount: item.overtimeAmount,
        grossEarnings: item.grossEarnings,
        deductions: item.deductions,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
        status: item.status,
      };
    });
  }
}
