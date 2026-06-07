import PayrollItem from '../../models/PayrollItem.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import Employee from '../../models/Employee.model.js';
import mongoose from 'mongoose';

export async function getHeadcountCostReport(year: number): Promise<Record<string, unknown>> {
  const employees = await Employee.find({ status: 'active' })
    .populate('department', 'name')
    .lean();

  const byDept: Record<string, {
    department: string; headcount: number; workers: number; officeStaff: number;
    permanent: number; contract: number; totalMonthlySalary: number;
  }> = {};

  for (const emp of employees) {
    const deptName = (emp.department as any)?.name || 'Unassigned';
    if (!byDept[deptName]) {
      byDept[deptName] = { department: deptName, headcount: 0, workers: 0, officeStaff: 0, permanent: 0, contract: 0, totalMonthlySalary: 0 };
    }
    byDept[deptName].headcount++;
    if (emp.category === 'worker') byDept[deptName].workers++;
    else byDept[deptName].officeStaff++;
    if (emp.employmentType === 'contract') byDept[deptName].contract++;
    else byDept[deptName].permanent++;
    byDept[deptName].totalMonthlySalary += (emp.baseSalary || emp.dailyWage || 0) * (emp.salaryType === 'monthly' ? 1 : 26);
  }

  return {
    year,
    totalEmployees: employees.length,
    departments: Object.values(byDept),
    totalMonthlySalary: Object.values(byDept).reduce((s, d) => s + d.totalMonthlySalary, 0),
  };
}

export async function getMoMVarianceReport(): Promise<Record<string, unknown>> {
  const runs = await PayrollRun.find({ status: 'finalized' })
    .sort({ createdAt: -1 })
    .limit(13)
    .lean();

  const monthlyData: { month: string; gross: number; net: number; employees: number; variance: number | null }[] = [];

  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i];
    const items = await PayrollItem.find({ payrollRun: run._id }).lean();
    const gross = items.reduce((s, it) => s + (it.grossEarnings || 0), 0);
    const net = items.reduce((s, it) => s + (it.netPay || 0), 0);

    const prev = monthlyData[monthlyData.length - 1];
    const variance = prev ? ((gross - prev.gross) / prev.gross) * 100 : null;

    monthlyData.push({
      month: run.month,
      gross,
      net,
      employees: items.length,
      variance: variance !== null ? Math.round(variance * 100) / 100 : null,
    });
  }

  return {
    months: monthlyData,
    averageMonthOverMonth: monthlyData
      .filter(d => d.variance !== null)
      .reduce((s, d) => s + (d.variance || 0), 0) / Math.max(1, monthlyData.filter(d => d.variance !== null).length),
  };
}

export async function getYtdCostAnalysis(year: number): Promise<Record<string, unknown>> {
  const startStr = `${year}-04`;
  const endStr = `${year + 1}-03`;

  const runs = await PayrollRun.find({
    status: 'finalized',
    month: { $gte: startStr, $lte: endStr },
  }).sort({ month: 1 }).lean();

  let cumulativeGross = 0;
  let cumulativeNet = 0;
  let cumulativeDeductions = 0;

  const months: { month: string; gross: number; net: number; deductions: number; cumulativeGross: number; cumulativeNet: number }[] = [];

  for (const run of runs) {
    const items = await PayrollItem.find({ payrollRun: run._id }).lean();
    const gross = items.reduce((s, it) => s + (it.grossEarnings || 0), 0);
    const net = items.reduce((s, it) => s + (it.netPay || 0), 0);
    const deductions = items.reduce((s, it) => s + (it.totalDeductions || 0), 0);

    cumulativeGross += gross;
    cumulativeNet += net;
    cumulativeDeductions += deductions;

    months.push({ month: run.month, gross, net, deductions, cumulativeGross, cumulativeNet });
  }

  return {
    financialYear: `${year}-${year + 1}`,
    months,
    totals: { gross: cumulativeGross, net: cumulativeNet, deductions: cumulativeDeductions },
  };
}

export async function getOtLopAnalysis(
  runId: string,
): Promise<Record<string, unknown>> {
  const items = await PayrollItem.find({ payrollRun: new mongoose.Types.ObjectId(runId) })
    .populate('employee', 'fullName employeeCode department')
    .lean();

  let totalOtHours = 0;
  let totalOtAmount = 0;
  let totalLopDays = 0;
  let totalLopAmount = 0;
  const byDept: Record<string, { otHours: number; otAmount: number; lopDays: number; lopAmount: number }> = {};

  for (const item of items) {
    const emp = item.employee as any;
    const deptName = emp?.department || 'Unknown';
    const otHours = item.overtimeHours || 0;
    const otAmount = item.overtimeAmount || 0;
    const lopDays = item.unpaidLeaveDays || 0;
    const lopAmount = (item.lopDetails as any)?.lopAmount || 0;

    totalOtHours += otHours;
    totalOtAmount += otAmount;
    totalLopDays += lopDays;
    totalLopAmount += lopAmount;

    if (!byDept[deptName]) byDept[deptName] = { otHours: 0, otAmount: 0, lopDays: 0, lopAmount: 0 };
    byDept[deptName].otHours += otHours;
    byDept[deptName].otAmount += otAmount;
    byDept[deptName].lopDays += lopDays;
    byDept[deptName].lopAmount += lopAmount;
  }

  return {
    totalOtHours: Math.round(totalOtHours * 100) / 100,
    totalOtAmount: Math.round(totalOtAmount * 100) / 100,
    totalLopDays,
    totalLopAmount: Math.round(totalLopAmount * 100) / 100,
    byDepartment: Object.entries(byDept).map(([name, data]) => ({ department: name, ...data })),
  };
}

export async function getLoanOutstandingReport(): Promise<Record<string, unknown>> {
  const loans = await (await import('../../models/Loan.model.js')).default.find({ status: 'approved' })
    .populate('employee', 'fullName employeeCode')
    .lean();

  let totalOutstanding = 0;
  const details = loans.map((loan: any) => {
    const totalPaid = 0; // Would need LoanRepayment aggregation
    const outstanding = (loan.amount || 0) - totalPaid;
    totalOutstanding += outstanding;
    return {
      employee: (loan.employee as any)?.fullName || 'Unknown',
      employeeCode: (loan.employee as any)?.employeeCode || '',
      loanType: loan.loanType || '',
      amount: loan.amount || 0,
      paid: totalPaid,
      outstanding,
      emi: loan.emi || 0,
      startDate: loan.startDate,
      endDate: loan.endDate,
    };
  });

  return { totalOutstanding, totalLoans: loans.length, details };
}

export async function getBudgetVsActual(runId: string): Promise<Record<string, unknown>> {
  const run = await PayrollRun.findById(runId).lean();
  if (!run) return { error: 'Run not found' };

  const items = await PayrollItem.find({ payrollRun: new mongoose.Types.ObjectId(runId) })
    .populate('employee', 'department')
    .lean();

  const byDept: Record<string, { budgeted: number; actual: number; variance: number; variancePct: number }> = {};
  const employees = await Employee.find().populate('department', 'name').lean();
  const deptBudget: Record<string, number> = {};
  for (const emp of employees) {
    const deptName = (emp.department as any)?.name || 'Unassigned';
    deptBudget[deptName] = (deptBudget[deptName] || 0) + (emp.baseSalary || emp.dailyWage || 0);
  }

  for (const item of items) {
    const emp = item.employee as any;
    const deptName = (typeof emp === 'object' && emp?.department) || 'Unknown';
    if (!byDept[deptName]) {
      byDept[deptName] = { budgeted: deptBudget[deptName] || 0, actual: 0, variance: 0, variancePct: 0 };
    }
    byDept[deptName].actual += item.netPay || 0;
  }

  for (const [, data] of Object.entries(byDept)) {
    data.variance = data.budgeted - data.actual;
    data.variancePct = data.budgeted > 0 ? Math.round((data.variance / data.budgeted) * 10000) / 100 : 0;
  }

  return {
    runMonth: run.month,
    departments: byDept,
    totalBudgeted: Object.values(byDept).reduce((s, d) => s + d.budgeted, 0),
    totalActual: Object.values(byDept).reduce((s, d) => s + d.actual, 0),
    totalVariance: Object.values(byDept).reduce((s, d) => s + d.variance, 0),
  };
}
