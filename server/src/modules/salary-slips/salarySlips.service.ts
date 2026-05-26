import PayrollRun from '../../models/PayrollRun.model.js';
import PayrollItem from '../../models/PayrollItem.model.js';
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

  static async generatePdf(runId: string, _userId?: string, employeeId?: string): Promise<Record<string, unknown>> {
    const run = await PayrollRun.findById(runId).lean();
    if (!run) throw new AppError('Payroll run not found', 404);
    if (run.status !== 'finalized') throw new AppError('Cannot generate slip for draft payroll', 400);

    const settings = await CompanySettings.findOne();
    const companyName = settings?.companyInfo?.name || 'Company';
    const companyAddress = settings?.companyInfo?.address || '';
    const companyPhone = settings?.companyInfo?.phone || '';
    const companyEmail = settings?.companyInfo?.email || '';

    const query: any = { payrollRun: runId };
    if (employeeId) {
      query.employee = employeeId;
    }

    const payrollItems = await PayrollItem.find(query)
      .populate({
        path: 'employee',
        select: 'fullName employeeCode department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'name' },
        ],
      })
      .lean();

    const monthDate = new Date(run.month + '-01');
    const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const slipData = {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      month: monthName,
      runId: run._id,
      generatedDate: new Date().toISOString(),
      employees: payrollItems.map((item: any) => {
        const allowances = item.allowances || [];
        const deductions = item.deductions || [];
        
        const allowancesHtml = allowances.length > 0 
          ? allowances.map((a: any) => `<tr><td style="padding: 4px 8px;">${a.name}</td><td style="text-align: right; padding: 4px 8px;">₹${a.calculatedValue?.toLocaleString() || 0}</td></tr>`).join('')
          : '<tr><td colspan="2" style="padding: 4px 8px; color: #999;">No allowances</td></tr>';
        
        const deductionsHtml = deductions.length > 0
          ? deductions.map((d: any) => `<tr><td style="padding: 4px 8px;">${d.name}</td><td style="text-align: right; padding: 4px 8px;">₹${d.calculatedValue?.toLocaleString() || 0}</td></tr>`).join('')
          : '<tr><td colspan="2" style="padding: 4px 8px; color: #999;">No deductions</td></tr>';

        const emp = item.employee || {};
        const deptName = typeof emp.department === 'object' && emp.department !== null
          ? (emp.department as any).name || 'N/A'
          : 'N/A';
        const desigName = typeof emp.designation === 'object' && emp.designation !== null
          ? (emp.designation as any).name || 'N/A'
          : 'N/A';

        return {
          id: String(item.employee?._id || item.employee),
          name: item.employee?.fullName || 'N/A',
          employeeCode: item.employee?.employeeCode || 'N/A',
          department: deptName,
          designation: desigName,
          basicSalary: item.basicEarnings || 0,
          totalEarnings: item.grossEarnings || 0,
          totalDeductions: item.totalDeductions || 0,
          netPay: item.netPay || 0,
          allowances,
          deductions,
          allowancesHtml,
          deductionsHtml,
          presentDays: item.presentDays || 0,
          absentDays: item.absentDays || 0,
          halfDays: item.halfDays || 0,
          workingDays: item.effectiveWorkingDays || 0,
        };
      }),
    };

    return slipData;
  }
}