import PayrollRun from '../../models/PayrollRun.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';

export class SalarySlipsService {
  static async list(queryParams: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const { month } = queryParams;
    
    const filter: Record<string, unknown> = {};
    if (month) filter.month = month;

    const runs = await PayrollRun.find(filter).sort({ createdAt: -1 }).lean();
    
    return runs.map((r: any) => ({
      id: String(r._id),
      month: r.month,
      status: r.status,
      totalEmployees: r.totalEmployees,
      totalNetPay: r.totalNetPay,
      generatedAt: r.createdAt,
    }));
  }

  static async generatePdf(runId: string, _userId: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(runId).lean();
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status !== 'finalized') throw new AppError('Cannot generate slip for draft payroll', 400);

    const settings = await CompanySettings.findOne();
    const companyName = settings?.companyInfo?.name || 'Company';
    const companyAddress = settings?.companyInfo?.address || '';

    const employees = await Employee.find({ status: 'active' }).lean();

    const monthDate = new Date(run.month + '-01');
    const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const slipData = {
      companyName,
      companyAddress,
      month: monthName,
      runId: run._id,
      generatedDate: new Date().toISOString(),
      employees: employees.map((emp: any) => ({
        name: emp.fullName,
        employeeCode: emp.employeeCode,
        department: emp.department?.name || 'N/A',
        designation: emp.designation?.name || 'N/A',
        basicSalary: emp.baseSalary || 0,
        totalEarnings: Math.round((emp.baseSalary || 0) * 0.8),
        totalDeductions: Math.round((emp.baseSalary || 0) * 0.1),
        netPay: Math.round((emp.baseSalary || 0) * 0.7),
      })),
    };

    return slipData;
  }
}