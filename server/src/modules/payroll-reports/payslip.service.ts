import PDFDocument from 'pdfkit';
import { Response } from 'express';
import PayrollItem from '../../models/PayrollItem.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AuditService } from '../../core/audit/AuditService.js';

export async function generatePayslipPdf(
  payrollItemId: string,
  res: Response,
  userId?: string,
): Promise<void> {
  const item = await PayrollItem.findById(payrollItemId)
    .populate('employee', 'fullName employeeCode pan pfNumber uan department designation')
    .lean();

  if (!item) {
    res.status(404).json({ success: false, message: 'Payroll item not found' });
    return;
  }

  const emp = item.employee as any;
  const settings = await CompanySettings.findOne().lean();
  const companyInfo = (settings as any)?.companyInfo || {};
  const run = await PayrollRun.findById(item.payrollRun).lean();

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Payslip - ${emp?.fullName || ''} - ${item.month}`,
      Author: companyInfo.companyName || 'HRMS',
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=payslip_${emp?.employeeCode || 'unknown'}_${item.month}.pdf`);
  doc.pipe(res);

  const pageWidth = doc.page.width - 80;
  const leftMargin = 40;
  let y = 30;

  // Company header
  doc.fontSize(16).font('Helvetica-Bold').text(companyInfo.companyName || 'Company Name', leftMargin, y);
  y += 20;
  doc.fontSize(8).font('Helvetica').text(
    [
      companyInfo.address || '',
      companyInfo.city || '', companyInfo.state || '', companyInfo.pincode || '',
    ].filter(Boolean).join(', '),
    leftMargin, y,
  );
  y += 12;
  if (companyInfo.gstin) doc.text(`GSTIN: ${companyInfo.gstin}`, leftMargin, y);
  y += 12;
  doc.text(`CIN: ${companyInfo.cin || 'N/A'} | PAN: ${companyInfo.pan || 'N/A'}`, leftMargin, y);
  y += 20;

  // Payslip title bar
  doc.rect(leftMargin, y, pageWidth, 22).fill('#2563eb');
  doc.fill('#ffffff').fontSize(12).font('Helvetica-Bold').text('SALARY SLIP', leftMargin + 10, y + 5);
  y += 30;

  // Employee info section
  doc.fill('#000000').fontSize(9).font('Helvetica');
  const leftCol = [
    `Employee: ${emp?.fullName || ''}`,
    `Code: ${emp?.employeeCode || ''}`,
    `PAN: ${emp?.pan || 'N/A'}`,
    `PF No: ${emp?.pfNumber || 'N/A'}`,
    `UAN: ${emp?.uan || 'N/A'}`,
  ];
  const rightCol = [
    `Month: ${item.month || ''}`,
    `Department: ${emp?.department || 'N/A'}`,
    `Designation: ${emp?.designation || 'N/A'}`,
    `Pay Date: ${run?.finalizedAt ? new Date(run.finalizedAt).toLocaleDateString() : 'N/A'}`,
    `Days Paid: ${item.effectiveWorkingDays || 0} / ${item.totalDays || 0}`,
  ];

  let colY = y;
  doc.font('Helvetica-Bold').text('Employee Details', leftMargin, colY);
  colY += 16;
  doc.font('Helvetica');
  for (const line of leftCol) {
    doc.text(line, leftMargin, colY);
    colY += 13;
  }
  colY = y + 16;
  for (const line of rightCol) {
    doc.text(line, leftMargin + 260, colY);
    colY += 13;
  }
  y = Math.max(colY, y + 100);

  // Earnings table
  y += 10;
  doc.rect(leftMargin, y, pageWidth, 18).fill('#f3f4f6');
  doc.fill('#000000').fontSize(9).font('Helvetica-Bold');
  doc.text('Earnings', leftMargin + 5, y + 4);
  doc.text('Amount', leftMargin + pageWidth - 60, y + 4, { width: 50, align: 'right' });
  y += 20;

  const earnings = [
    { name: 'Basic', amount: item.basicEarnings || 0 },
    ...(item.componentWiseEarnings || []).filter((c: any) => c.component?.code !== 'BASIC').map((c: any) => ({
      name: c.component?.name || c.component?.code || 'Unknown',
      amount: c.computedAmount,
    })),
    ...(item.allowances || []).map(a => ({ name: a.name, amount: a.calculatedValue })),
    { name: 'Overtime', amount: item.overtimeAmount || 0 },
  ];

  doc.font('Helvetica');
  let earningsTotal = 0;
  for (const e of earnings) {
    if (e.amount <= 0) continue;
    doc.text(e.name, leftMargin + 5, y);
    doc.text(e.amount.toFixed(2), leftMargin + pageWidth - 60, y, { width: 50, align: 'right' });
    earningsTotal += e.amount;
    y += 13;
  }

  doc.rect(leftMargin, y, pageWidth, 18).fill('#f3f4f6');
  doc.fill('#000000').fontSize(9).font('Helvetica-Bold');
  doc.text('Gross Earnings', leftMargin + 5, y + 4);
  doc.text(earningsTotal.toFixed(2), leftMargin + pageWidth - 60, y + 4, { width: 50, align: 'right' });
  y += 25;

  // Deductions table
  doc.rect(leftMargin, y, pageWidth, 18).fill('#fef2f2');
  doc.fill('#000000').fontSize(9).font('Helvetica-Bold');
  doc.text('Deductions', leftMargin + 5, y + 4);
  doc.text('Amount', leftMargin + pageWidth - 60, y + 4, { width: 50, align: 'right' });
  y += 20;

  const deductions = [
    ...(item.componentWiseDeductions || []).map((c: any) => ({
      name: c.component?.name || c.component?.code || 'Unknown',
      amount: c.computedAmount,
    })),
    ...(item.deductions || []).map(d => ({ name: d.name, amount: d.calculatedValue })),
  ];

  doc.font('Helvetica');
  let deductionsTotal = 0;
  for (const d of deductions) {
    if (d.amount <= 0) continue;
    doc.text(d.name, leftMargin + 5, y);
    doc.text(d.amount.toFixed(2), leftMargin + pageWidth - 60, y, { width: 50, align: 'right' });
    deductionsTotal += d.amount;
    y += 13;
  }

  doc.rect(leftMargin, y, pageWidth, 18).fill('#fef2f2');
  doc.fill('#000000').fontSize(9).font('Helvetica-Bold');
  doc.text('Total Deductions', leftMargin + 5, y + 4);
  doc.text(deductionsTotal.toFixed(2), leftMargin + pageWidth - 60, y + 4, { width: 50, align: 'right' });
  y += 25;

  // Net Pay
  doc.rect(leftMargin, y, pageWidth, 28).fill('#2563eb');
  doc.fill('#ffffff').fontSize(14).font('Helvetica-Bold');
  const netPay = item.netPay || 0;
  doc.text('NET PAY', leftMargin + 10, y + 6);
  doc.text(`₹ ${netPay.toFixed(2)}`, leftMargin + pageWidth - 80, y + 6, { width: 70, align: 'right' });
  y += 40;

  // Amount in words
  doc.fill('#000000').fontSize(8).font('Helvetica');
  doc.text(`Amount in words: ${numberToWords(netPay)}`, leftMargin, y);
  y += 20;

  // Footer
  doc.fontSize(7).fill('#6b7280');
  doc.text('This is a computer-generated payslip and does not require a signature.', leftMargin, y);

  // Employer contributions section
  if (item.employerContributions?.length > 0) {
    y += 20;
    doc.rect(leftMargin, y, pageWidth, 18).fill('#f0fdf4');
    doc.fill('#000000').fontSize(9).font('Helvetica-Bold');
    doc.text('Employer Contributions', leftMargin + 5, y + 4);
    doc.text('Amount', leftMargin + pageWidth - 60, y + 4, { width: 50, align: 'right' });
    y += 20;
    doc.font('Helvetica');
    for (const ec of item.employerContributions) {
      doc.text(ec.name, leftMargin + 5, y);
      doc.text((ec.calculatedValue || 0).toFixed(2), leftMargin + pageWidth - 60, y, { width: 50, align: 'right' });
      y += 13;
    }
  }

  doc.end();

  if (userId) {
    await AuditService.log({
      action: 'export',
      module: 'payroll',
      userId,
      targetId: payrollItemId,
      details: { type: 'payslip-pdf', employee: emp?.employeeCode, month: item.month },
    });
  }
}

function numberToWords(n: number): string {
  if (n <= 0) return 'Zero';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThan1000(num: number): string {
    if (num === 0) return '';
    const parts: string[] = [];
    const h = Math.floor(num / 100);
    if (h > 0) parts.push(`${units[h]} Hundred`);
    const r = num % 100;
    if (r > 0) {
      if (r < 10) parts.push(units[r]);
      else if (r < 20) parts.push(teens[r - 10]);
      else parts.push(`${tens[Math.floor(r / 10)]} ${units[r % 10]}`.trim());
    }
    return parts.join(' ');
  }

  let num = Math.round(n);
  const result: string[] = [];
  const crores = Math.floor(num / 10000000);
  if (crores > 0) { result.push(`${convertLessThan1000(crores)} Crore`); num %= 10000000; }
  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) { result.push(`${convertLessThan1000(lakhs)} Lakh`); num %= 100000; }
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) { result.push(`${convertLessThan1000(thousands)} Thousand`); num %= 1000; }
  const hundreds = Math.floor(num / 100);
  if (hundreds > 0) { result.push(`${convertLessThan1000(hundreds)} Hundred`); num %= 100; }
  if (num > 0) result.push(convertLessThan1000(num));
  return result.join(' ') + ' Rupees Only';
}
