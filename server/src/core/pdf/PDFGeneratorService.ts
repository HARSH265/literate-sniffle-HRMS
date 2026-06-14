import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { logger } from '../logger/logger.js';

interface Allowance {
  name: string;
  calculatedValue: number;
}

interface Deduction {
  name: string;
  calculatedValue: number;
}

interface EmployeeData {
  id?: string;
  name: string;
  employeeCode: string;
  department?: string;
  designation?: string;
  presentDays?: number;
  absentDays?: number;
  halfDays?: number;
  workingDays?: number;
  weeklyOffs?: number;
  holidays?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  basicSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
}

export interface SalarySlipPdfData {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  month: string;
  generatedDate: string;
  employees: EmployeeData[];
}

// Colors
const C = {
  primary: '#1a1a2e',
  text: '#2d2d2d',
  muted: '#6b7280',
  border: '#d1d5db',
  lightBg: '#f9fafb',
  white: '#ffffff',
  green: '#059669',
};

const fmt = (v: number) => `Rs.${(v || 0).toLocaleString('en-IN')}`;

export class PDFGeneratorService {
  static async generateFromData(
    data: SalarySlipPdfData,
    res: Response,
    filename: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: `Salary Slip - ${data.month}`,
            Author: data.companyName,
          },
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        renderSalarySlip(doc, data);

        doc.end();
        resolve();
      } catch (error) {
        logger.error('PDF generation failed:', error);
        reject(new Error('Failed to generate PDF'));
      }
    });
  }
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y: number, x2: number, color = C.border) {
  doc.moveTo(x1, y).lineTo(x2, y).lineWidth(0.5).stroke(color);
}

function renderSalarySlip(doc: PDFKit.PDFDocument, data: SalarySlipPdfData): void {
  if (data.employees.length === 1) {
    renderSingleEmployeeSlip(doc, data);
    return;
  }
  renderMultiEmployeeSummary(doc, data);
}

// ─── MULTI-EMPLOYEE SUMMARY TABLE ───
function renderMultiEmployeeSummary(doc: PDFKit.PDFDocument, data: SalarySlipPdfData): void {
  const pageW = 595;
  const LM = 40;
  const RM = pageW - LM;
  const W = RM - LM;

  // Header
  doc.fontSize(16).font('Helvetica-Bold').fillColor(C.primary).text(data.companyName, LM, 40, { align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor(C.muted).text(data.companyAddress || '', LM, 60, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.text).text(`Salary Summary — ${data.month}`, LM, 85, { align: 'center' });

  // Table
  const colW = [130, 55, 60, 70, 75, 75, 75];
  const headers = ['Employee', 'Code', 'Dept', 'Basic', 'Earnings', 'Deductions', 'Net Pay'];
  const tableY = 115;

  // Header row
  doc.rect(LM, tableY, W, 22).fill(C.primary);
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
  let x = LM + 6;
  headers.forEach((h, i) => {
    doc.text(h, x, tableY + 7, { width: colW[i] - 4 });
    x += colW[i];
  });

  // Data rows
  let y = tableY + 26;
  doc.font('Helvetica').fontSize(8).fillColor(C.text);
  data.employees.forEach((emp, idx) => {
    if (y > 760) { doc.addPage(); y = 40; }

    if (idx % 2 === 1) doc.rect(LM, y - 3, W, 16).fill(C.lightBg);
    doc.fillColor(C.text);

    x = LM + 6;
    const row = [
      emp.name.substring(0, 20),
      emp.employeeCode,
      emp.department || '-',
      fmt(emp.basicSalary),
      fmt(emp.totalEarnings),
      fmt(emp.totalDeductions),
    ];
    row.forEach((val, i) => {
      doc.text(val, x, y, { width: colW[i] - 4 });
      x += colW[i];
    });
    doc.font('Helvetica-Bold').text(fmt(emp.netPay), x, y, { width: colW[6] - 4 });
    doc.font('Helvetica');
    y += 16;
  });

  // Totals
  const totals = data.employees.reduce((a, e) => ({
    basic: a.basic + (e.basicSalary || 0),
    earnings: a.earnings + (e.totalEarnings || 0),
    deductions: a.deductions + (e.totalDeductions || 0),
    net: a.net + (e.netPay || 0),
  }), { basic: 0, earnings: 0, deductions: 0, net: 0 });

  y += 4;
  doc.rect(LM, y, W, 22).fill('#e5e7eb');
  doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9);
  x = LM + 6;
  doc.text('Total', x, y + 6, { width: colW[0] + colW[1] + colW[2] - 4 });
  x += colW[0] + colW[1] + colW[2];
  doc.text(fmt(totals.basic), x, y + 6, { width: colW[3] - 4 }); x += colW[3];
  doc.text(fmt(totals.earnings), x, y + 6, { width: colW[4] - 4 }); x += colW[4];
  doc.text(fmt(totals.deductions), x, y + 6, { width: colW[5] - 4 }); x += colW[5];
  doc.text(fmt(totals.net), x, y + 6, { width: colW[6] - 4 });

  // Footer
  doc.font('Helvetica').fontSize(8).fillColor(C.muted)
    .text(`Generated on ${new Date(data.generatedDate).toLocaleDateString('en-IN')}`, LM, y + 35, { align: 'center' });
}

// ─── SINGLE EMPLOYEE SLIP ───
function renderSingleEmployeeSlip(doc: PDFKit.PDFDocument, data: SalarySlipPdfData): void {
  const emp = data.employees[0];
  const pageW = 595;
  const LM = 40;
  const RM = pageW - LM;
  const W = RM - LM;

  let y = 36;

  // ── Company Header ──
  doc.fontSize(18).font('Helvetica-Bold').fillColor(C.primary).text(data.companyName, LM, y, { align: 'center', width: W });
  y += 26;
  doc.fontSize(9).font('Helvetica').fillColor(C.muted);
  const addrParts = [data.companyAddress, data.companyPhone, data.companyEmail].filter(Boolean);
  doc.text(addrParts.join(' | '), LM, y, { align: 'center', width: W });
  y += 18;

  // Divider
  drawLine(doc, LM, y, RM, C.primary);
  y += 14;

  // ── Title ──
  doc.fontSize(13).font('Helvetica-Bold').fillColor(C.text).text(`Salary Slip — ${data.month}`, LM, y, { align: 'center', width: W });
  y += 28;

  // ── Employee Info (2-column layout) ──
  const infoBoxH = 48;
  doc.roundedRect(LM, y, W, infoBoxH, 4).lineWidth(0.5).stroke(C.border);

  const col1X = LM + 12;
  const col2X = LM + W / 2 + 12;
  const labelW = 80;
  let iy = y + 10;

  // Left column
  doc.fontSize(9).font('Helvetica').fillColor(C.muted);
  doc.text('Name', col1X, iy);
  doc.text('Code', col1X, iy + 14);
  doc.text('Department', col1X, iy + 28);

  doc.font('Helvetica-Bold').fillColor(C.text);
  doc.text(emp.name, col1X + labelW, iy, { width: W / 2 - labelW - 20 });
  doc.font('Helvetica').text(emp.employeeCode, col1X + labelW, iy + 14);
  doc.text(emp.department || 'N/A', col1X + labelW, iy + 28);

  // Right column
  doc.font('Helvetica').fillColor(C.muted);
  doc.text('Designation', col2X, iy);
  doc.text('Present / Effective', col2X, iy + 14);
  doc.text('Absent / Half Days', col2X, iy + 28);

  doc.font('Helvetica-Bold').fillColor(C.text);
  doc.text(emp.designation || 'N/A', col2X + labelW, iy, { width: W / 2 - labelW - 20 });
  doc.font('Helvetica').text(`${emp.presentDays || 0} / ${emp.workingDays || 0}`, col2X + labelW, iy + 14);
  doc.text(`${emp.absentDays || 0} / ${emp.halfDays || 0}`, col2X + labelW, iy + 28);

  y += infoBoxH + 22;

  // ── Earnings ──
  doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary).text('Earnings', LM, y);
  y += 14;

  const earnRows: Array<[string, number]> = [['Basic Salary', emp.basicSalary]];
  if (emp.allowances) emp.allowances.forEach(a => earnRows.push([a.name, a.calculatedValue]));
  if ((emp.overtimeAmount ?? 0) > 0) earnRows.push([`Overtime (${emp.overtimeHours} hrs)`, emp.overtimeAmount!]);

  const earnRowH = 18;
  const earnHeaderH = 22;
  const earnTotalH = 24;
  const earnBoxH = earnHeaderH + earnRows.length * earnRowH + earnTotalH;

  doc.roundedRect(LM, y, W, earnBoxH, 4).lineWidth(0.5).stroke(C.border);

  // Table header
  doc.rect(LM + 1, y + 1, W - 2, earnHeaderH).fill(C.lightBg);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
  doc.text('Description', LM + 12, y + 7, { width: 300 });
  doc.text('Amount', RM - 120, y + 7, { width: 100, align: 'right' });

  let ey = y + earnHeaderH;
  doc.font('Helvetica').fillColor(C.text).fontSize(9);
  earnRows.forEach(([label, val]) => {
    doc.text(label, LM + 12, ey + 3, { width: 300 });
    doc.text(fmt(val), RM - 120, ey + 3, { width: 100, align: 'right' });
    ey += earnRowH;
  });

  // Total line
  drawLine(doc, LM + 8, ey, RM - 8, C.border);
  ey += 4;
  doc.font('Helvetica-Bold').fillColor(C.text).fontSize(10);
  doc.text('Total Earnings', LM + 12, ey + 2, { width: 300 });
  doc.text(fmt(emp.totalEarnings), RM - 120, ey + 2, { width: 100, align: 'right' });

  y += earnBoxH + 20;

  // ── Deductions ──
  doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary).text('Deductions', LM, y);
  y += 14;

  const dedRows: Array<[string, number]> = emp.deductions?.length
    ? emp.deductions.map(d => [d.name, d.calculatedValue])
    : [['No deductions', 0]];

  const dedBoxH = earnHeaderH + dedRows.length * earnRowH + earnTotalH;
  doc.roundedRect(LM, y, W, dedBoxH, 4).lineWidth(0.5).stroke(C.border);

  doc.rect(LM + 1, y + 1, W - 2, earnHeaderH).fill(C.lightBg);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.muted);
  doc.text('Description', LM + 12, y + 7, { width: 300 });
  doc.text('Amount', RM - 120, y + 7, { width: 100, align: 'right' });

  let dy = y + earnHeaderH;
  doc.font('Helvetica').fillColor(C.text).fontSize(9);
  dedRows.forEach(([label, val]) => {
    doc.text(label, LM + 12, dy + 3, { width: 300 });
    if (val > 0) doc.text(fmt(val), RM - 120, dy + 3, { width: 100, align: 'right' });
    dy += earnRowH;
  });

  drawLine(doc, LM + 8, dy, RM - 8, C.border);
  dy += 4;
  doc.font('Helvetica-Bold').fillColor(C.text).fontSize(10);
  doc.text('Total Deductions', LM + 12, dy + 2, { width: 300 });
  doc.text(fmt(emp.totalDeductions), RM - 120, dy + 2, { width: 100, align: 'right' });

  y += dedBoxH + 22;

  // ── Net Pay ──
  doc.roundedRect(LM, y, W, 40, 4).fill(C.primary);
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(13);
  doc.text('Net Pay', LM + 16, y + 12, { width: 200 });
  doc.text(fmt(emp.netPay), RM - 140, y + 12, { width: 120, align: 'right' });

  y += 58;

  // ── Footer ──
  drawLine(doc, LM, y, RM, C.border);
  y += 8;
  doc.fontSize(8).font('Helvetica').fillColor(C.muted)
    .text(`Generated on ${new Date(data.generatedDate).toLocaleDateString('en-IN')} • This is a system-generated salary slip.`, LM, y, { align: 'center', width: W });
}
