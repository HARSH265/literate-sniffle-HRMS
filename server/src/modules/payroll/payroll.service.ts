import PayrollRun from '../../models/PayrollRun.model.js';
import Employee from '../../models/Employee.model.js';
import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export class PayrollService {
  static async listRuns(): Promise<Record<string, unknown>[]> {
    const runs = await PayrollRun.find().sort({ createdAt: -1 }).lean();
    return runs.map((r: any) => ({ ...r, id: String(r._id), _id: undefined }));
  }

  static async runPayroll(month: number, year: number, userId: string): Promise<Record<string, unknown>> {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    const existingRun = await PayrollRun.findOne({ month: monthStr });
    if (existingRun) {
      throw new AppError(`Payroll for ${monthStr} already exists`, 400);
    }

    const settings = await CompanySettings.findOne();
    const config = (settings?.payrollConfig as any) || {};
    const allowances = (settings?.allowanceConfig as any[]) || [];

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = getDaysInMonth(year, month);
    const workingDays = config.defaultWorkingDays || 26;

    const employees = await Employee.find({ status: 'active' }).lean();

    let totalNetPay = 0;
    const results = [];

    for (const emp of employees) {
      const attendances = await AttendanceEntry.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      }).lean();

      const overtimes = await OvertimeEntry.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      }).lean();

      let presentDays = 0, absentDays = 0, halfDays = 0, leaveDays = 0, weeklyOffs = 0, holidays = 0;
      let totalOvertimeHours = 0;

      for (const att of attendances) {
        switch (att.status) {
          case 'present': presentDays++; break;
          case 'absent': absentDays++; break;
          case 'half-day': halfDays++; break;
          case 'leave': leaveDays++; break;
          case 'weekly-off': weeklyOffs++; break;
          case 'holiday': holidays++; break;
        }
      }

      for (const ot of overtimes) totalOvertimeHours += ot.hours || 0;

      const baseSalary = (emp as any).baseSalary || 0;
      const dailyWage = (emp as any).dailyWage || 0;
      const isMonthly = (emp as any).salaryType === 'monthly';

      const effectiveWorkingDays = presentDays + halfDays * 0.5 + (config.paidWeeklyOff ? weeklyOffs : 0) + (config.paidHolidays ? holidays : 0);
      
      const basicEarnings = isMonthly 
        ? Math.round(baseSalary * (effectiveWorkingDays / workingDays))
        : dailyWage * presentDays;

      let allowancesTotal = 0;
      for (const al of allowances) {
        if (al.isActive) {
          if (al.type === 'percentage') allowancesTotal += Math.round(basicEarnings * (al.value / 100));
          else allowancesTotal += al.value;
        }
      }

      const overtimeAmount = totalOvertimeHours > 0 
        ? Math.round((isMonthly ? (baseSalary / workingDays / 8) : dailyWage / 8) * (config.overtimeMultiplier || 2) * totalOvertimeHours)
        : 0;

      const halfDayDeduction = halfDays > 0 ? Math.round((baseSalary / workingDays) * (config.halfDayDeductionPercent || 50) / 100 * halfDays) : 0;
      const lateDeduction = absentDays > 0 ? (config.lateDeductionPerDay || 0) * absentDays : 0;
      const totalDeductions = halfDayDeduction + lateDeduction;

      const grossEarnings = basicEarnings + allowancesTotal + overtimeAmount;
      const netPay = grossEarnings - totalDeductions;
      totalNetPay += netPay;

      results.push({
        employee: { id: String(emp._id), name: (emp as any).fullName, code: (emp as any).employeeCode },
        totalDays,
        presentDays,
        absentDays,
        halfDays,
        weeklyOffs,
        holidays,
        effectiveWorkingDays,
        overtimeHours: totalOvertimeHours,
        basicEarnings,
        allowancesTotal,
        overtimeAmount,
        grossEarnings,
        totalDeductions,
        netPay,
      });
    }

    const run = await PayrollRun.create({
      month: monthStr,
      status: 'draft',
      totalEmployees: employees.length,
      totalNetPay,
      processedBy: userId as any,
    });

    await AuditService.log({
      action: 'create',
      module: 'payroll',
      userId,
      targetId: run._id.toString(),
      details: { month: monthStr, employees: employees.length },
    });

    return { 
      id: String(run._id), 
      month: monthStr, 
      status: 'draft',
      totalEmployees: employees.length,
      totalNetPay,
      items: results,
    };
  }

  static async finalizeRun(id: string, userId: string, remarks?: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id);
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status === 'finalized') throw new AppError('Already finalized', 400);

    run.status = 'finalized';
    run.finalizedBy = userId as any;
    if (remarks) run.remarks = remarks;
    await run.save();

    await AuditService.log({
      action: 'finalize',
      module: 'payroll',
      userId,
      targetId: id,
      details: { month: run.month },
    });

    return { id: String(run._id), status: run.status };
  }

  static async getRunDetails(id: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(id).lean();
    if (!run) throw new AppError('Payroll run not found', 404);
    return { ...run, id: String(run._id), _id: undefined };
  }
}