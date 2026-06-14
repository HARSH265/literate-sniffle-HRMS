import PayrollRun from '../../models/PayrollRun.model.js';
import PayrollItem from '../../models/PayrollItem.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    if (!['approved', 'finalized'].includes(run.status)) {
      throw new AppError('Payroll must be approved or finalized before generating slips', 400);
    }

    const settings = await CompanySettings.findOne();
    const companyName = settings?.companyInfo?.name || 'Company';
    const companyAddress = settings?.companyInfo?.address || '';
    const companyPhone = settings?.companyInfo?.phone || '';
    const companyEmail = settings?.companyInfo?.email || '';

    const query: any = { payrollRun: new mongoose.Types.ObjectId(runId) };
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
          ? allowances.map((a: any) => `<tr><td style="padding: 4px 8px;">${escapeHtml(a.name)}</td><td style="text-align: right; padding: 4px 8px;">₹${a.calculatedValue?.toLocaleString() || 0}</td></tr>`).join('')
          : '<tr><td colspan="2" style="padding: 4px 8px; color: #999;">No allowances</td></tr>';
        
        const deductionsHtml = deductions.length > 0
          ? deductions.map((d: any) => `<tr><td style="padding: 4px 8px;">${escapeHtml(d.name)}</td><td style="text-align: right; padding: 4px 8px;">₹${d.calculatedValue?.toLocaleString() || 0}</td></tr>`).join('')
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
          overtimeHours: item.overtimeHours || 0,
          overtimeAmount: item.overtimeAmount || 0,
          weeklyOffs: item.weeklyOffs || 0,
          holidays: item.holidays || 0,
        };
      }),
    };

    return slipData;
  }

  static async generateExcel(runId: string): Promise<Buffer> {
    const run = await PayrollRun.findById(runId).lean();
    if (!run) throw new AppError('Payroll run not found', 404);
    if (!['approved', 'finalized'].includes(run.status)) {
      throw new AppError('Payroll must be approved or finalized before generating slips', 400);
    }

    const settings = await CompanySettings.findOne();
    const companyName = settings?.companyInfo?.name || 'Company';

    const payrollItems = await PayrollItem.find({ payrollRun: new mongoose.Types.ObjectId(runId) })
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

    const wb = new ExcelJS.Workbook();
    wb.creator = companyName;
    wb.created = new Date();

    const ws = wb.addWorksheet('Salary Slips', {
      properties: { defaultColWidth: 16 },
    });

    // Header row
    ws.mergeCells('A1:R1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `${companyName} — Salary Slips — ${monthName}`;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF1A365D' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } };
    ws.getRow(1).height = 32;

    // Column headers
    const headers = [
      'S.No.', 'Employee Code', 'Employee Name', 'Department', 'Designation',
      'Working Days', 'Present', 'Absent', 'Half Days', 'Weekly Offs', 'Holidays',
      'Basic Salary', 'Gross Earnings', 'Total Deductions', 'OT Hours', 'OT Amount',
      'Net Pay', 'Status',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
      };
    });

    // Data rows
    let totalBasic = 0, totalEarnings = 0, totalDeductions = 0, totalOT = 0, totalNet = 0;
    payrollItems.forEach((item: any, idx: number) => {
      const emp = item.employee || {};
      const deptName = typeof emp.department === 'object' && emp.department?.name ? emp.department.name : 'N/A';
      const desigName = typeof emp.designation === 'object' && emp.designation?.name ? emp.designation.name : 'N/A';
      const basic = item.basicEarnings || 0;
      const gross = item.grossEarnings || 0;
      const ded = item.totalDeductions || 0;
      const otHrs = item.overtimeHours || 0;
      const otAmt = item.overtimeAmount || 0;
      const net = item.netPay || 0;

      totalBasic += basic;
      totalEarnings += gross;
      totalDeductions += ded;
      totalOT += otAmt;
      totalNet += net;

      const row = ws.addRow([
        idx + 1,
        emp.employeeCode || 'N/A',
        emp.fullName || 'N/A',
        deptName,
        desigName,
        item.effectiveWorkingDays || 0,
        item.presentDays || 0,
        item.absentDays || 0,
        item.halfDays || 0,
        item.weeklyOffs || 0,
        item.holidays || 0,
        basic,
        gross,
        ded,
        otHrs,
        otAmt,
        net,
        run.status.toUpperCase(),
      ]);

      const isEven = idx % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.alignment = { horizontal: colNum <= 5 ? 'left' : 'center', vertical: 'middle' };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        };
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
        }
      });

      // Currency format for money columns
      [12, 13, 14, 16, 17].forEach((col) => {
        const cell = row.getCell(col);
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });
    });

    // Totals row
    const totalsRow = ws.addRow([
      '', '', 'TOTAL', '', '',
      '', '', '', '', '', '',
      totalBasic, totalEarnings, totalDeductions, '', totalOT, totalNet, '',
    ]);
    totalsRow.height = 24;
    totalsRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.font = { bold: true, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF2F7' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF2D3748' } },
        bottom: { style: 'double', color: { argb: 'FF2D3748' } },
      };
      if (colNum >= 12 && colNum <= 17) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    // Column widths
    ws.getColumn(1).width = 6;   // S.No
    ws.getColumn(2).width = 15;  // Code
    ws.getColumn(3).width = 22;  // Name
    ws.getColumn(4).width = 18;  // Dept
    ws.getColumn(5).width = 18;  // Desig
    ws.getColumn(6).width = 12;  // Working
    ws.getColumn(7).width = 10;  // Present
    ws.getColumn(8).width = 10;  // Absent
    ws.getColumn(9).width = 10;  // Half
    ws.getColumn(10).width = 12; // WO
    ws.getColumn(11).width = 10; // Holidays
    ws.getColumn(12).width = 14; // Basic
    ws.getColumn(13).width = 14; // Gross
    ws.getColumn(14).width = 14; // Ded
    ws.getColumn(15).width = 10; // OT Hrs
    ws.getColumn(16).width = 12; // OT Amt
    ws.getColumn(17).width = 14; // Net
    ws.getColumn(18).width = 12; // Status

    // Auto filter
    ws.autoFilter = { from: 'A3', to: `R${payrollItems.length + 3}` };

    const buffer = await wb.xlsx.writeBuffer() as Buffer;
    return buffer;
  }
}