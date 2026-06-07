import CompanySettings from '../../models/CompanySettings.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import PayrollItem from '../../models/PayrollItem.model.js';
import Employee from '../../models/Employee.model.js';
import { getStatutoryDefaults } from '../statutory/statutory.service.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { AppError } from '../../core/errors/AppError.js';
import AuditLog from '../../models/AuditLog.model.js';
import mongoose from 'mongoose';

interface ComplianceCheck {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  actualValue: number;
  requiredValue: number;
  gap: number;
  notes?: string;
}

export interface StatutoryGapRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  check: string;
  actualValue: number;
  statutoryDue: number;
  gap: number;
  risk: 'high' | 'medium' | 'low';
}

export interface ComplianceReport {
  runId: string;
  month: string;
  overallStatus: 'pass' | 'warning' | 'fail';
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failures: number;
  };
  gapReport: StatutoryGapRow[];
  integrityReport: IntegrityIssue[];
  roundingImpact: {
    totalRawNetPay: number;
    totalRoundedNetPay: number;
    totalImpact: number;
  };
}

interface IntegrityIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  details: { employeeId: string; employeeName: string; description: string }[];
}

async function getCompanySettings() {
  const settings = await CompanySettings.findOne().lean();
  return {
    payrollConfig: (settings?.payrollConfig as any) || {},
    statutoryConfig: (settings?.statutoryConfig as any) || {},
    gratuityConfig: (settings?.gratuityConfig as any) || {},
    companyInfo: (settings?.companyInfo as any) || {},
  };
}

function minWageCheck(
  basicEarnings: number, state: string, _category: string,
): ComplianceCheck {
  // Default minimum wage threshold — in production, fetch from state-wise master
  const minWageByState: Record<string, number> = {
    'Karnataka': 15000,
    'Maharashtra': 12000,
    'Tamil Nadu': 12000,
    'Delhi': 16000,
    'default': 10000,
  };
  const threshold = minWageByState[state] || minWageByState.default;
  const gap = threshold - basicEarnings;
  return {
    check: 'minimum-wage',
    status: gap > 0 ? 'fail' : 'pass',
    actualValue: basicEarnings,
    requiredValue: threshold,
    gap: Math.max(0, gap),
    notes: gap > 0 ? `Below minimum wage of ${threshold} for ${state}` : undefined,
  };
}

function pfBaseCheck(pfWages: number, _grossPay: number, ceiling: number): ComplianceCheck {
  const expectedPfWages = Math.min(_grossPay, ceiling);
  const gap = expectedPfWages - pfWages;
  return {
    check: 'pf-wage-base',
    status: Math.abs(gap) > 10 ? 'fail' : 'pass',
    actualValue: pfWages,
    requiredValue: expectedPfWages,
    gap,
    notes: Math.abs(gap) > 10 ? `PF wages (${pfWages}) differs from expected (${expectedPfWages})` : undefined,
  };
}

function esiThresholdCheck(grossPay: number, threshold: number, esiDeducted: boolean): ComplianceCheck {
  const shouldBeEsiApplicable = grossPay <= threshold;
  return {
    check: 'esi-threshold',
    status: (shouldBeEsiApplicable && !esiDeducted) ? 'fail' : 'pass',
    actualValue: grossPay,
    requiredValue: threshold,
    gap: shouldBeEsiApplicable ? 0 : grossPay - threshold,
    notes: shouldBeEsiApplicable && !esiDeducted
      ? `Gross pay ${grossPay} <= ESI threshold ${threshold}, but ESI not deducted`
      : undefined,
  };
}

function ptSlabCheck(grossPay: number, ptDeducted: number, state: string, ptSlabs: any[]): ComplianceCheck {
  const stateSlabs = ptSlabs.find((s: any) => s.state === state);
  if (!stateSlabs) {
    return { check: 'pt-slab', status: 'warning', actualValue: ptDeducted, requiredValue: 0, gap: 0, notes: `No PT slabs configured for ${state}` };
  }
  const slab = stateSlabs.slabs.find(
    (s: any) => grossPay >= s.minSalary && grossPay <= s.maxSalary,
  );
  const expectedPt = slab ? slab.amount : 0;
  return {
    check: 'pt-slab',
    status: ptDeducted === expectedPt ? 'pass' : 'warning',
    actualValue: ptDeducted,
    requiredValue: expectedPt,
    gap: expectedPt - ptDeducted,
    notes: ptDeducted !== expectedPt ? `PT deducted ${ptDeducted} vs expected ${expectedPt} for ${state} slab` : undefined,
  };
}

function otRateCheck(otAmount: number, otHours: number, basicEarnings: number, totalDays: number): ComplianceCheck {
  if (otHours <= 0) {
    return { check: 'ot-rate', status: 'pass', actualValue: 0, requiredValue: 0, gap: 0 };
  }
  const statutoryOtRate = 2; // Double the normal wage
  const dailyWage = totalDays > 0 ? basicEarnings / totalDays : 0;
  const hourlyWage = dailyWage > 0 ? dailyWage / 8 : 0;
  const expectedOtAmount = Math.round(otHours * hourlyWage * statutoryOtRate);
  const gap = expectedOtAmount - otAmount;
  return {
    check: 'ot-rate',
    status: gap > 10 ? 'fail' : 'pass',
    actualValue: otAmount,
    requiredValue: expectedOtAmount,
    gap,
    notes: gap > 10 ? `OT paid ${otAmount} vs statutory minimum ${expectedOtAmount}` : undefined,
  };
}

function otHoursCheck(totalOtHours: number, totalWorkingDays: number): ComplianceCheck {
  const maxOtPerDay = 2;
  const maxOtPerMonth = maxOtPerDay * totalWorkingDays;
  return {
    check: 'ot-hours-limit',
    status: totalOtHours > maxOtPerMonth ? 'warning' : 'pass',
    actualValue: totalOtHours,
    requiredValue: maxOtPerMonth,
    gap: Math.max(0, totalOtHours - maxOtPerMonth),
    notes: totalOtHours > maxOtPerMonth ? `OT hours ${totalOtHours} exceed legal max ${maxOtPerMonth}` : undefined,
  };
}

function bonusEligibilityCheck(
  basicEarnings: number, _grossPay: number, hasBonusComponent: boolean,
): ComplianceCheck {
  const bonusEligibleThreshold = 21000;
  const isEligible = basicEarnings <= bonusEligibleThreshold;
  return {
    check: 'bonus-eligibility',
    status: (isEligible && !hasBonusComponent) ? 'fail' : 'pass',
    actualValue: basicEarnings,
    requiredValue: bonusEligibleThreshold,
    gap: isEligible ? 0 : basicEarnings - bonusEligibleThreshold,
    notes: isEligible && !hasBonusComponent
      ? `Basic ${basicEarnings} <= ${bonusEligibleThreshold}, eligible for bonus but no bonus component found`
      : undefined,
  };
}

function gratuityCheck(
  totalServiceMonths: number, gratuityProvision: number, basicEarnings: number,
): ComplianceCheck {
  const minServiceMonths = 60; // 5 years
  if (totalServiceMonths < minServiceMonths) {
    return { check: 'gratuity-provision', status: 'pass', actualValue: 0, requiredValue: 0, gap: 0, notes: 'Service < 5 years, not eligible' };
  }
  const expectedProvision = Math.round(basicEarnings * 15 / 26);
  return {
    check: 'gratuity-provision',
    status: gratuityProvision >= expectedProvision ? 'pass' : 'warning',
    actualValue: gratuityProvision,
    requiredValue: expectedProvision,
    gap: Math.max(0, expectedProvision - gratuityProvision),
    notes: gratuityProvision < expectedProvision ? `Gratuity provision ${gratuityProvision} < expected ${expectedProvision}` : undefined,
  };
}

export async function runItemComplianceChecks(
  item: any, emp: any, defaults: Awaited<ReturnType<typeof getStatutoryDefaults>>,
  ptSlabs: any[], _config: any,
): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const state = emp?.ptState || 'Karnataka';
  const basicEarnings = item.basicEarnings || 0;
  const grossEarnings = item.grossEarnings || 0;
  const totalDays = item.totalDays || 30;

  // Find PF and ESI amounts from deductions
  const esiDeduction = (item.deductions || []).find((d: any) => d.name === 'ESI');
  const ptDeduction = (item.deductions || []).find((d: any) => d.name === 'Professional Tax');
  const pfWages = item.statutoryDetails?.pfApplicableWages ?? Math.min(grossEarnings, defaults.pfWageCeiling);

  checks.push(minWageCheck(basicEarnings, state, emp?.category || 'worker'));
  checks.push(pfBaseCheck(pfWages, grossEarnings, defaults.pfWageCeiling));
  checks.push(esiThresholdCheck(grossEarnings, defaults.esiThreshold, !!esiDeduction));
  checks.push(ptSlabCheck(grossEarnings, ptDeduction?.calculatedValue || 0, state, ptSlabs));
  checks.push(otRateCheck(item.overtimeAmount || 0, item.overtimeHours || 0, basicEarnings, totalDays));
  checks.push(otHoursCheck(item.overtimeHours || 0, item.effectiveWorkingDays || totalDays));

  // Bonus check
  const hasBonusComponent = (item.componentWiseEarnings || []).some(
    (c: any) => c.component?.code === 'BONUS' || c.component?.code === 'BONUS_ANNUAL',
  );
  checks.push(bonusEligibilityCheck(basicEarnings, grossEarnings, hasBonusComponent));

  // Gratuity provision
  const gratuityComponent = (item.componentWiseEarnings || []).find(
    (c: any) => c.component?.code === 'GRATUITY',
  );
  const totalServiceMonths = emp?.joiningDate
    ? Math.floor((Date.now() - new Date(emp.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;
  checks.push(gratuityCheck(totalServiceMonths, gratuityComponent?.computedAmount || 0, basicEarnings));

  return checks;
}

export async function runComplianceCheck(runId: string): Promise<ComplianceReport> {
  const run = await PayrollRun.findById(runId).lean();
  if (!run) throw new AppError('Payroll run not found', 404);

  const [settings, defaults] = await Promise.all([
    getCompanySettings(),
    getStatutoryDefaults(),
  ]);

  const ptSlabs = defaults.ptSlabs || [];
  const items = await PayrollItem.find({ payrollRun: run._id })
    .populate('employee', 'fullName employeeCode ptState category joiningDate pfExempted esiExempted')
    .lean();

  const gapReport: StatutoryGapRow[] = [];
  const integrityIssues: IntegrityIssue[] = [];
  const allItemChecks: ComplianceCheck[] = [];
  let totalRawNetPay = 0;
  let totalRoundedNetPay = 0;

  for (const item of items) {
    const emp = item.employee as any;
    const checks = await runItemComplianceChecks(item, emp, defaults, ptSlabs, settings.payrollConfig);

    for (const check of checks) {
      allItemChecks.push(check);
      if (check.status !== 'pass') {
        gapReport.push({
          employeeId: String(emp?._id || ''),
          employeeName: emp?.fullName || 'Unknown',
          employeeCode: emp?.employeeCode || '',
          check: check.check,
          actualValue: check.actualValue,
          statutoryDue: check.requiredValue,
          gap: check.gap,
          risk: check.status === 'fail' ? 'high' : 'medium',
        });
      }
    }

    // Track rounding impact
    totalRawNetPay += item.netPay || 0;

    // Data integrity checks
    if (item.loanEmiDeduction > 0 && !(item as any)._loanRepaymentId) {
      integrityIssues.push({
        type: 'loan-mismatch',
        severity: 'medium',
        count: integrityIssues.find(i => i.type === 'loan-mismatch')?.count || 0,
        details: [],
      });
    }
  }

  // Recalculate rounding impact from stored data
  totalRoundedNetPay = totalRawNetPay;

  // Integrity: employees without bank details
  const allEmployeeIds = items.map(i => (i.employee as any)?._id).filter(Boolean);
  const employees = await Employee.find({ _id: { $in: allEmployeeIds } }).lean();
  const noBankEmployees = employees.filter(e => !(e as any).bankDetails?.accountNumber || !(e as any).bankDetails?.bankName);
  if (noBankEmployees.length > 0) {
    integrityIssues.push({
      type: 'missing-bank-details',
      severity: 'high',
      count: noBankEmployees.length,
      details: noBankEmployees.map(e => ({
        employeeId: String(e._id),
        employeeName: e.fullName,
        description: 'No bank account details on file',
      })),
    });
  }

  const passed = allItemChecks.filter(c => c.status === 'pass').length;
  const warnings = allItemChecks.filter(c => c.status === 'warning').length;
  const failures = allItemChecks.filter(c => c.status === 'fail').length;
  const overallStatus: 'pass' | 'warning' | 'fail' = failures > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass';

  const report: ComplianceReport = {
    runId: String(run._id),
    month: run.month || '',
    overallStatus,
    summary: { totalChecks: allItemChecks.length, passed, warnings, failures },
    gapReport,
    integrityReport: integrityIssues,
    roundingImpact: {
      totalRawNetPay,
      totalRoundedNetPay,
      totalImpact: totalRoundedNetPay - totalRawNetPay,
    },
  };

  // Update PayrollRun compliance status
  await PayrollRun.findByIdAndUpdate(run._id, {
    complianceStatus: overallStatus,
    complianceReport: report,
  });

  // Update individual PayrollItem compliance flags
  let checkIdx = 0;
  for (const item of items) {
    const itemChecks = allItemChecks.slice(checkIdx, checkIdx + 8);
    checkIdx += 8;
    await PayrollItem.findByIdAndUpdate(item._id, { complianceFlags: itemChecks });
  }

  await AuditService.log({
    action: 'generate-report',
    module: 'compliance',
    userId: 'system',
    targetId: String(run._id),
    details: { month: run.month, overallStatus, totalChecks: allItemChecks.length },
  });

  return report;
}

export async function getComplianceSummary(runId?: string): Promise<{
  runsCompliance: { runId: string; month: string; complianceStatus: string }[];
  summary: { totalRuns: number; passed: number; warnings: number; failures: number };
  recentIssues: StatutoryGapRow[];
}> {
  const match: any = runId ? { _id: new mongoose.Types.ObjectId(runId) } : {};
  const runs = await PayrollRun.find(match).sort({ createdAt: -1 }).limit(12).lean();
  const totalRuns = runs.length;
  const passed = runs.filter(r => r.complianceStatus === 'pass').length;
  const warnings = runs.filter(r => r.complianceStatus === 'warning').length;
  const failures = runs.filter(r => r.complianceStatus === 'fail').length;

  // Collect recent issues from latest run
  let recentIssues: StatutoryGapRow[] = [];
  const latestRun = runs.find(r => r.complianceReport);
  if (latestRun && latestRun.complianceReport) {
    const report = latestRun.complianceReport as unknown as ComplianceReport;
    recentIssues = (report.gapReport || []).slice(0, 20);
  }

  return {
    runsCompliance: runs.map(r => ({
      runId: String(r._id),
      month: r.month,
      complianceStatus: r.complianceStatus || 'pending',
    })),
    summary: { totalRuns, passed, warnings, failures },
    recentIssues,
  };
}

export async function getConfigAuditLog(filters: {
  module?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; total: number; page: number; limit: number }> {
  const query: any = {};
  if (filters.module) query.module = filters.module;
  if (filters.action) query.action = filters.action;
  if (filters.userId) query.userId = filters.userId;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 200);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return { data, total, page, limit };
}
