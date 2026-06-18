import { Response } from 'express';
import PayrollItem from '../../models/PayrollItem.model.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import { AuditService } from '../../core/audit/AuditService.js';

export interface BankFileRow {
  employeeName: string;
  employeeCode: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  netAmount: number;
  splitPercent?: number;
  secondaryAccount?: string;
  secondaryIfsc?: string;
  secondaryAmount?: number;
}

export async function generateBankFile(
  runId: string,
  format: 'neft' | 'rtgs' | 'nach',
  res: Response,
  userId?: string,
): Promise<void> {
  const run = await PayrollRun.findById(runId).lean();
  if (!run) {
    res.status(404).json({ success: false, message: 'Payroll run not found' });
    return;
  }

  const items = await PayrollItem.find({ payrollRun: runId })
    .populate('employee', 'fullName employeeCode bankDetails bankSplitPercent paymentMode')
    .lean();

  const rows: BankFileRow[] = [];
  let skipped = 0;

  for (const item of items) {
    const emp = item.employee as any;
    const primaryAcct = emp?.bankDetails?.accountNumber || '';
    const primaryIfsc = emp?.bankDetails?.ifscCode || '';
    const primaryBank = emp?.bankDetails?.bankName || '';
    const netAmount = item.netPay || 0;
    const splitPercent = item.bankSplitPercent ?? emp?.bankSplitPercent ?? 0;

    if (!primaryAcct) { skipped++; continue; }

    if (splitPercent > 0 && splitPercent < 100) {
      const primaryAmount = item.primaryBankAmount ?? Math.round(netAmount * (splitPercent / 100) * 100) / 100;
      const secondaryAmount = item.secondaryBankAmount ?? Math.round((netAmount - primaryAmount) * 100) / 100;
      const secondaryAcct = emp?.secondaryBank?.accountNumber || '';
      const secondaryIfsc = emp?.secondaryBank?.ifscCode || '';

      if (secondaryAcct) {
        rows.push({
          employeeName: emp?.fullName || '',
          employeeCode: emp?.employeeCode || '',
          accountNumber: primaryAcct,
          ifscCode: primaryIfsc,
          bankName: primaryBank,
          netAmount: primaryAmount,
          splitPercent,
          secondaryAccount: secondaryAcct,
          secondaryIfsc,
          secondaryAmount,
        });
        rows.push({
          employeeName: emp?.fullName || '',
          employeeCode: emp?.employeeCode || '',
          accountNumber: secondaryAcct,
          ifscCode: secondaryIfsc,
          bankName: emp?.secondaryBank?.bankName || '',
          netAmount: secondaryAmount,
        });
      } else {
        rows.push({
          employeeName: emp?.fullName || '',
          employeeCode: emp?.employeeCode || '',
          accountNumber: primaryAcct,
          ifscCode: primaryIfsc,
          bankName: primaryBank,
          netAmount,
        });
      }
    } else {
      rows.push({
        employeeName: emp?.fullName || '',
        employeeCode: emp?.employeeCode || '',
        accountNumber: primaryAcct,
        ifscCode: primaryIfsc,
        bankName: primaryBank,
        netAmount,
      });
    }
  }

  const content = formatBankContent(rows, format);
  const ext = format === 'nach' ? 'csv' : 'txt';
  const mime = format === 'nach' ? 'text/csv' : 'text/plain';

  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename=bank_${format}_${run.month}.${ext}`);
  res.send(content);

  if (userId) {
    await AuditService.log({
      action: 'export',
      module: 'payroll',
      userId,
      targetId: runId,
      details: { type: `bank-file-${format}`, month: run.month, employees: rows.length, skipped },
    });
  }
}

function sanitizeForCsv(value: string): string {
  if (!value) return '';
  const dangerous = /^[=+\-@\t\r]/;
  const sanitized = dangerous.test(value) ? `'${value}` : value;
  return sanitized.replace(/"/g, '""');
}

function formatBankContent(rows: BankFileRow[], format: string): string {
  const lines: string[] = [];

  if (format === 'nach') {
    lines.push('Employee Name,Account Number,IFSC Code,Amount');
    for (const row of rows) {
      lines.push(`"${sanitizeForCsv(row.employeeName)}",${row.accountNumber},${row.ifscCode},${row.netAmount.toFixed(2)}`);
    }
    // Control total
    const total = rows.reduce((s, r) => s + r.netAmount, 0);
    lines.push(`,,Total,${total.toFixed(2)}`);
  } else {
    // NEFT / RTGS format: name | acct | ifsc | amount | bank
    const header = format.toUpperCase() + ' Bank File';
    lines.push(header);
    lines.push('='.repeat(header.length));
    lines.push('');
    lines.push('Sr.No. | Employee Name | Account Number | IFSC Code | Bank Name | Amount');
    lines.push('---'.repeat(20));
    rows.forEach((row, i) => {
      lines.push(
        `${i + 1} | ${sanitizeForCsv(row.employeeName)} | ${row.accountNumber} | ${row.ifscCode} | ${row.bankName} | ${row.netAmount.toFixed(2)}`,
      );
    });
    lines.push('');
    const total = rows.reduce((s, r) => s + r.netAmount, 0);
    lines.push(`Total Employees: ${rows.length}`);
    lines.push(`Total Amount: ${total.toFixed(2)}`);
  }

  return lines.join('\r\n');
}
