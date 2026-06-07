import { Response } from 'express';
import ExcelJS from 'exceljs';
import PayrollItem from '../../models/PayrollItem.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import Employee from '../../models/Employee.model.js';
import mongoose from 'mongoose';
import { AuditService } from '../../core/audit/AuditService.js';

async function getUniqueComponentCodes(items: any[]): Promise<string[]> {
  const codes = new Set<string>();
  for (const item of items) {
    for (const c of item.componentWiseEarnings || []) {
      if (c.component?.code) codes.add(c.component.code);
    }
    for (const c of item.componentWiseDeductions || []) {
      if (c.component?.code) codes.add(c.component.code);
    }
  }
  return Array.from(codes).sort();
}

export async function generateSalaryRegister(
  runId: string,
  res: Response,
  userId?: string,
  filters?: { department?: string },
  _format: 'excel' | 'csv' = 'excel',
): Promise<void> {

  const run = await PayrollRun.findById(runId).lean();
  if (!run) {
    res.status(404).json({ success: false, message: 'Payroll run not found' });
    return;
  }

  let query: Record<string, unknown> = { payrollRun: new mongoose.Types.ObjectId(runId) };
  if (filters?.department) {
    const empIds = await Employee.find({ department: filters.department }).select('_id').lean();
    query.employee = { $in: empIds.map(e => e._id) };
  }

  const items = await PayrollItem.find(query)
    .populate('employee', 'fullName employeeCode department designation')
    .sort({ 'employee.employeeCode': 1 })
    .lean();

  const componentCodes = await getUniqueComponentCodes(items);
  const earningCodes = componentCodes.filter(c => {
    for (const item of items) {
      const match = (item.componentWiseEarnings || []).find((e: any) => e.component?.code === c);
      if (match) return true;
    }
    return false;
  });
  const deductionCodes = componentCodes.filter(c => !earningCodes.includes(c));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Salary Register', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  });

  // Header row
  const headerRow = [
    'Sr.No',
    'Employee Code',
    'Employee Name',
    'Department',
    'Designation',
    'Total Days',
    'Working Days',
    ...earningCodes,
    'Gross Total',
    ...deductionCodes,
    'Total Deductions',
    'Net Pay',
  ];

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
    border: {
      top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' },
    },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  };

  const header = sheet.addRow(headerRow);
  header.eachCell((cell) => { cell.style = headerStyle; });

  // Data rows
  let srNo = 0;
  let totals: Record<string, number> = {};
  const numberFormat = '#,##0.00';

  for (const item of items) {
    srNo++;
    const emp = item.employee as any;

    const earningsMap: Record<string, number> = {};
    for (const c of (item.componentWiseEarnings || []) as any[]) {
      if (c.component?.code) earningsMap[c.component.code] = c.computedAmount;
    }
    for (const a of item.allowances || []) {
      earningsMap[a.name.toUpperCase().replace(/\s+/g, '_')] = (earningsMap[a.name.toUpperCase().replace(/\s+/g, '_')] || 0) + a.calculatedValue;
    }

    const deductionsMap: Record<string, number> = {};
    for (const c of (item.componentWiseDeductions || []) as any[]) {
      if (c.component?.code) deductionsMap[c.component.code] = c.computedAmount;
    }
    for (const d of item.deductions || []) {
      deductionsMap[d.name.toUpperCase().replace(/\s+/g, '_')] = (deductionsMap[d.name.toUpperCase().replace(/\s+/g, '_')] || 0) + d.calculatedValue;
    }

    const grossComponents = earningCodes.reduce((s, code) => s + (earningsMap[code] || 0), 0);
    const grossTotal = item.grossEarnings || grossComponents;
    const deductionComponents = deductionCodes.reduce((s, code) => s + (deductionsMap[code] || 0), 0);
    const deductionTotal = item.totalDeductions || deductionComponents;

    const rowData = [
      srNo,
      emp?.employeeCode || '',
      emp?.fullName || '',
      emp?.department || '',
      emp?.designation || '',
      item.totalDays || 0,
      item.effectiveWorkingDays || 0,
      ...earningCodes.map(code => earningsMap[code] || 0),
      grossTotal,
      ...deductionCodes.map(code => deductionsMap[code] || 0),
      deductionTotal,
      item.netPay || 0,
    ];

    const dataRow = sheet.addRow(rowData);

    // Apply number format to currency columns
    for (let col = 8; col <= rowData.length; col++) {
      const cell = dataRow.getCell(col);
      if (typeof cell.value === 'number') {
        cell.numFmt = numberFormat;
      }
    }

    // Track totals
    if (!totals.totalEmployees) {
      earningCodes.forEach(code => { totals[`earn_${code}`] = 0; });
      deductionCodes.forEach(code => { totals[`ded_${code}`] = 0; });
      totals.grossTotal = 0;
      totals.deductionTotal = 0;
      totals.netPayTotal = 0;
    }
    totals.totalEmployees = (totals.totalEmployees || 0) + 1;
    earningCodes.forEach(code => { totals[`earn_${code}`] = (totals[`earn_${code}`] || 0) + (earningsMap[code] || 0); });
    deductionCodes.forEach(code => { totals[`ded_${code}`] = (totals[`ded_${code}`] || 0) + (deductionsMap[code] || 0); });
    totals.grossTotal = (totals.grossTotal || 0) + grossTotal;
    totals.deductionTotal = (totals.deductionTotal || 0) + deductionTotal;
    totals.netPayTotal = (totals.netPayTotal || 0) + (item.netPay || 0);
  }

  // Summary row
  const summaryStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 9 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } },
    border: {
      top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' },
    },
  };

  const summaryRow = sheet.addRow([
    '',
    '',
    `Total (${srNo} employees)`,
    '', '', '', '',
    ...earningCodes.map(code => totals[`earn_${code}`] || 0),
    totals.grossTotal || 0,
    ...deductionCodes.map(code => totals[`ded_${code}`] || 0),
    totals.deductionTotal || 0,
    totals.netPayTotal || 0,
  ]);
  summaryRow.eachCell((cell, col) => {
    cell.style = summaryStyle as any;
    if (col >= 8) cell.numFmt = numberFormat;
  });

  // Column widths
  const colWidths = [6, 14, 22, 14, 14, 10, 12];
  earningCodes.forEach(() => colWidths.push(12));
  colWidths.push(12);
  deductionCodes.forEach(() => colWidths.push(12));
  colWidths.push(14, 12);

  sheet.columns.forEach((col, i) => { if (colWidths[i]) col.width = colWidths[i]; });

  // Freeze panes
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=salary_register_${run.month}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();

  if (userId) {
    await AuditService.log({
      action: 'export',
      module: 'payroll',
      userId,
      targetId: runId,
      details: { type: 'salary-register', month: run.month, employees: srNo },
    });
  }
}

export async function generateStatutoryReportDownload(
  runId: string,
  reportType: 'pf-ecr' | 'esi-return' | 'pt-return',
  res: Response,
  userId?: string,
): Promise<void> {
  const run = await PayrollRun.findById(runId).lean();
  if (!run) {
    res.status(404).json({ success: false, message: 'Payroll run not found' });
    return;
  }

  const items = await PayrollItem.find({ payrollRun: new mongoose.Types.ObjectId(runId) })
    .populate('employee', 'fullName employeeCode uan pfNumber esiNumber pan ptState department')
    .lean();

  const workbook = new ExcelJS.Workbook();

  if (reportType === 'pf-ecr') {
    const sheet = workbook.addWorksheet('PF ECR', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });
    sheet.columns = [
      { header: 'Sr.No', width: 6 },
      { header: 'UAN', width: 16 },
      { header: 'Employee Name', width: 22 },
      { header: 'PF Number', width: 16 },
      { header: 'Gross Wages', width: 14 },
      { header: 'PF Wages', width: 14 },
      { header: 'Employee PF', width: 14 },
      { header: 'Employer PF', width: 14 },
      { header: 'EPS', width: 14 },
      { header: 'EDLI', width: 12 },
      { header: 'Month', width: 10 },
    ];
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
    };
    sheet.getRow(1).eachCell(c => { c.style = headerStyle as any; });

    let srNo = 0;
    for (const item of items) {
      srNo++;
      const emp = item.employee as any;
      const pfWages = (item as any).statutoryDetails?.pfApplicableWages ?? Math.min(item.grossEarnings || 0, 15000);
      const pfDeduction = (item.deductions || []).find((d: any) => d.name === 'PF');
      const empPf = pfDeduction?.calculatedValue || 0;
      const employerPfEntry = (item.employerContributions || []).find((e: any) => e.name === 'Employer PF' || e.name === 'Employer PF Contribution');
      const epsEntry = (item.employerContributions || []).find((e: any) => e.name === 'EPS');
      const edliEntry = (item.employerContributions || []).find((e: any) => e.name === 'EDLI');

      sheet.addRow([
        srNo, emp?.uan || '', emp?.fullName || '', emp?.pfNumber || '',
        (item.grossEarnings || 0).toFixed(2), pfWages.toFixed(2),
        empPf.toFixed(2), (employerPfEntry?.calculatedValue || 0).toFixed(2),
        (epsEntry?.calculatedValue || 0).toFixed(2), (edliEntry?.calculatedValue || 0).toFixed(2),
        run.month,
      ]);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=pf_ecr_${run.month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } else if (reportType === 'esi-return') {
    const sheet = workbook.addWorksheet('ESI Return');
    sheet.columns = [
      { header: 'Sr.No', width: 6 },
      { header: 'ESI Number', width: 18 },
      { header: 'Employee Name', width: 22 },
      { header: 'Employee Code', width: 14 },
      { header: 'Gross Wages', width: 14 },
      { header: 'Employee ESI', width: 14 },
      { header: 'Employer ESI', width: 14 },
      { header: 'Month', width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };

    let srNo = 0;
    for (const item of items) {
      srNo++;
      const emp = item.employee as any;
      const esiDeduction = (item.deductions || []).find((d: any) => d.name === 'ESI');
      const esiEmployer = (item.employerContributions || []).find((e: any) => e.name === 'Employer ESI' || e.name === 'ESI Employer');

      if (!esiDeduction) continue;

      sheet.addRow([
        srNo, emp?.esiNumber || '', emp?.fullName || '', emp?.employeeCode || '',
        (item.grossEarnings || 0).toFixed(2),
        (esiDeduction.calculatedValue || 0).toFixed(2),
        (esiEmployer?.calculatedValue || 0).toFixed(2),
        run.month,
      ]);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=esi_return_${run.month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } else if (reportType === 'pt-return') {
    const sheet = workbook.addWorksheet('PT Return');
    sheet.columns = [
      { header: 'Sr.No', width: 6 },
      { header: 'Employee Name', width: 22 },
      { header: 'Employee Code', width: 14 },
      { header: 'State', width: 14 },
      { header: 'Gross Wages', width: 14 },
      { header: 'PT Deducted', width: 14 },
      { header: 'Frequency', width: 12 },
      { header: 'Month', width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };

    let srNo = 0;
    for (const item of items) {
      srNo++;
      const emp = item.employee as any;
      const ptDeduction = (item.deductions || []).find((d: any) => d.name === 'Professional Tax');

      sheet.addRow([
        srNo, emp?.fullName || '', emp?.employeeCode || '',
        emp?.ptState || 'Karnataka',
        (item.grossEarnings || 0).toFixed(2),
        (ptDeduction?.calculatedValue || 0).toFixed(2),
        'Monthly',
        run.month,
      ]);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=pt_return_${run.month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  }

  if (userId) {
    await AuditService.log({
      action: 'export',
      module: 'payroll',
      userId,
      targetId: runId,
      details: { type: `statutory-${reportType}`, month: run.month },
    });
  }
}
