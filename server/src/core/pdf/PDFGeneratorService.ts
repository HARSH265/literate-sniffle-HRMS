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
  presentDays?: number;
  workingDays?: number;
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
  month: string;
  generatedDate: string;
  employees: EmployeeData[];
}

export class PDFGeneratorService {
  static async generateFromData(
    data: SalarySlipPdfData,
    res: Response,
    filename: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
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

function renderSalarySlip(doc: PDFKit.PDFDocument, data: SalarySlipPdfData): void {
  if (data.employees.length === 1) {
    renderSingleEmployeeSlip(doc, data);
    return;
  }
  const pageWidth = 595;
  const leftMargin = 40;
  const rightMargin = pageWidth - leftMargin;
  
  doc.fontSize(18).text(data.companyName || 'Company', leftMargin, 40, { align: 'center' });
  if (data.companyAddress) {
    doc.fontSize(10).text(data.companyAddress, leftMargin, 58, { align: 'center' });
  }
  
  doc.fontSize(14).text(`Salary Slip - ${data.month}`, leftMargin, 85, { align: 'center' });
  
  const headerBoxY = 120;
  const boxWidth = rightMargin - leftMargin;
  const boxHeight = 90;
  
  doc.rect(leftMargin, headerBoxY, boxWidth, boxHeight).stroke('#999999');
  
  const rowHeight = 22;
  doc.moveTo(leftMargin + 120, headerBoxY).lineTo(leftMargin + 120, headerBoxY + boxHeight).stroke('#999999');
  
  const headerRows = [
    { label: 'Company', value: data.companyName || 'N/A' },
    { label: 'Address', value: data.companyAddress || 'N/A' },
    { label: 'Month', value: data.month },
    { label: 'Generated Date', value: new Date(data.generatedDate).toLocaleDateString() },
  ];
  
  headerRows.forEach((row, i) => {
    const y = headerBoxY + (i * rowHeight);
    doc.moveTo(leftMargin, y).lineTo(leftMargin + boxWidth, y).stroke('#cccccc');
    
    doc.fontSize(10).fillColor('#333333');
    doc.text(row.label, leftMargin + 8, y + 6);
    doc.text(row.value, leftMargin + 125, y + 6);
  });
  
  const tableY = headerBoxY + boxHeight + 10;
  const tableWidth = rightMargin - leftMargin;
  const colWidths = [120, 50, 50, 70, 70, 70, 70];
  const headers = ['Employee', 'Code', 'Dept', 'Basic', 'Earnings', 'Deductions', 'Net Pay'];
  
  doc.rect(leftMargin, tableY, tableWidth, 22).fill('#333333');
  doc.fillColor('#ffffff').fontSize(9);
  
  let xPos = leftMargin + 5;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableY + 6);
    xPos += colWidths[i];
  });
  
  doc.fillColor('#000000').fontSize(8);
  
  let yPos = tableY + 26;
  let isAlternate = false;
  
  data.employees.forEach((emp) => {
    if (yPos > 750) {
      doc.addPage();
      yPos = 40;
    }
    
    if (isAlternate) {
      doc.rect(leftMargin, yPos - 4, tableWidth, 18).fill('#f9f9f9');
    }
    
    doc.fillColor('#000000');
    xPos = leftMargin + 5;
    doc.text(emp.name.substring(0, 18), xPos, yPos);
    xPos += colWidths[0];
    doc.text(emp.employeeCode || '', xPos, yPos);
    xPos += colWidths[1];
    doc.text(emp.department || '-', xPos, yPos);
    xPos += colWidths[2];
    doc.text(`Rs.${(emp.basicSalary || 0).toLocaleString()}`, xPos, yPos);
    xPos += colWidths[3];
    doc.text(`Rs.${(emp.totalEarnings || 0).toLocaleString()}`, xPos, yPos);
    xPos += colWidths[4];
    doc.text(`Rs.${(emp.totalDeductions || 0).toLocaleString()}`, xPos, yPos);
    xPos += colWidths[5];
    doc.fontSize(9);
    doc.text(`Rs.${(emp.netPay || 0).toLocaleString()}`, xPos, yPos - 1);
    doc.fontSize(8);
    
    yPos += 18;
    isAlternate = !isAlternate;
  });
  
  const totalY = yPos + 5;
  doc.rect(leftMargin, totalY, tableWidth, 20).fill('#e8e8e8');
  doc.fontSize(10).fillColor('#000000');
  doc.text('Total', leftMargin + 10, totalY + 5);
  
  const totals = data.employees.reduce((acc, emp) => ({
    basic: acc.basic + (emp.basicSalary || 0),
    earnings: acc.earnings + (emp.totalEarnings || 0),
    deductions: acc.deductions + (emp.totalDeductions || 0),
    net: acc.net + (emp.netPay || 0),
  }), { basic: 0, earnings: 0, deductions: 0, net: 0 });
  
  xPos = leftMargin + 5 + colWidths[0] + colWidths[1] + colWidths[2];
  doc.text(`Rs.${totals.basic.toLocaleString()}`, xPos, totalY + 5);
  xPos += colWidths[3];
  doc.text(`Rs.${totals.earnings.toLocaleString()}`, xPos, totalY + 5);
  xPos += colWidths[4];
  doc.text(`Rs.${totals.deductions.toLocaleString()}`, xPos, totalY + 5);
  xPos += colWidths[5];
  doc.fontSize(11);
  doc.text(`Rs.${totals.net.toLocaleString()}`, xPos, totalY + 4);
  
  const footerY = totalY + 35;
  doc.fontSize(9).fillColor('#666666');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, leftMargin, footerY, { align: 'center' });
}

function renderSingleEmployeeSlip(doc: PDFKit.PDFDocument, data: SalarySlipPdfData): void {
  const emp = data.employees[0];
  const pageWidth = 595;
  const leftMargin = 40;
  const rightMargin = pageWidth - leftMargin;
  
  doc.fontSize(18).text(data.companyName || 'Company', leftMargin, 40, { align: 'center' });
  if (data.companyAddress) {
    doc.fontSize(10).text(data.companyAddress, leftMargin, 58, { align: 'center' });
  }
  
  doc.fontSize(14).text(`Salary Slip - ${data.month}`, leftMargin, 85, { align: 'center' });
  
  const headerBoxY = 120;
  const boxWidth = rightMargin - leftMargin;
  const boxHeight = 90;
  
  doc.rect(leftMargin, headerBoxY, boxWidth, boxHeight).stroke('#999999');
  
  const rowHeight = 22;
  doc.moveTo(leftMargin + 120, headerBoxY).lineTo(leftMargin + 120, headerBoxY + boxHeight).stroke('#999999');
  
  const headerRows = [
    { label: 'Company', value: data.companyName || 'N/A' },
    { label: 'Address', value: data.companyAddress || 'N/A' },
    { label: 'Month', value: data.month },
    { label: 'Generated Date', value: new Date(data.generatedDate).toLocaleDateString() },
  ];
  
  headerRows.forEach((row, i) => {
    const y = headerBoxY + (i * rowHeight);
    doc.moveTo(leftMargin, y).lineTo(leftMargin + boxWidth, y).stroke('#cccccc');
    doc.fontSize(10).fillColor('#333333');
    doc.text(row.label, leftMargin + 8, y + 6);
    doc.text(row.value, leftMargin + 125, y + 6);
  });
  
  const empInfoY = headerBoxY + boxHeight + 20;
  doc.fontSize(12).text('Employee Details', leftMargin, empInfoY, { underline: true });
  
  const empBoxY = empInfoY + 15;
  const empBoxHeight = 80;
  doc.rect(leftMargin, empBoxY, boxWidth, empBoxHeight).stroke('#999999');
  
  doc.fontSize(10).fillColor('#333333');
  const empRows = [
    { label: 'Employee Name', value: emp.name },
    { label: 'Employee Code', value: emp.employeeCode },
    { label: 'Department', value: emp.department || 'N/A' },
    { label: 'Present Days', value: `${emp.presentDays || 0} / ${emp.workingDays || 0}` },
  ];
  
  const empRowHeight = 20;
  empRows.forEach((row, i) => {
    const y = empBoxY + (i * empRowHeight);
    doc.moveTo(leftMargin, y).lineTo(leftMargin + boxWidth, y).stroke('#cccccc');
    doc.text(row.label, leftMargin + 8, y + 4);
    doc.text(row.value, leftMargin + 125, y + 4);
  });
  
  const earningsY = empBoxY + empBoxHeight + 20;
  doc.fontSize(11).text('Earnings', leftMargin, earningsY, { underline: true });
  
  const earnBoxY = earningsY + 12;
  const earnBoxHeight = 30 + (emp.allowances?.length || 0) * 18;
  doc.rect(leftMargin, earnBoxY, boxWidth, earnBoxHeight).stroke('#999999');
  
  doc.fontSize(10).fillColor('#333333');
  doc.text('Description', leftMargin + 10, earnBoxY + 8);
  doc.text('Amount', leftMargin + 350, earnBoxY + 8);
  doc.moveTo(leftMargin, earnBoxY + 22).lineTo(rightMargin, earnBoxY + 22).stroke('#cccccc');
  
  let earnY = earnBoxY + 28;
  doc.text('Basic Salary', leftMargin + 10, earnY);
  doc.text(`Rs.${(emp.basicSalary || 0).toLocaleString()}`, leftMargin + 350, earnY);
  
  if (emp.allowances && emp.allowances.length > 0) {
    emp.allowances.forEach((a) => {
      earnY += 18;
      doc.text(a.name, leftMargin + 10, earnY);
      doc.text(`Rs.${a.calculatedValue.toLocaleString()}`, leftMargin + 350, earnY);
    });
  }
  
  earnY += 25;
  doc.moveTo(leftMargin, earnY).lineTo(rightMargin, earnY).stroke('#cccccc');
  doc.fontSize(10).text('Total Earnings', leftMargin + 10, earnY + 6);
  doc.text(`Rs.${(emp.totalEarnings || 0).toLocaleString()}`, leftMargin + 350, earnY + 6);
  
  const deducY = earnBoxY + earnBoxHeight + 15;
  doc.fontSize(11).text('Deductions', leftMargin, deducY, { underline: true });
  
  const deducBoxY = deducY + 12;
  const deducBoxHeight = 30 + (emp.deductions?.length || 0) * 18;
  doc.rect(leftMargin, deducBoxY, boxWidth, deducBoxHeight).stroke('#999999');
  
  doc.fontSize(10).fillColor('#333333');
  doc.text('Description', leftMargin + 10, deducBoxY + 8);
  doc.text('Amount', leftMargin + 350, deducBoxY + 8);
  doc.moveTo(leftMargin, deducBoxY + 22).lineTo(rightMargin, deducBoxY + 22).stroke('#cccccc');
  
  let deducYPos = deducBoxY + 28;
  
  if (emp.deductions && emp.deductions.length > 0) {
    emp.deductions.forEach((d) => {
      doc.text(d.name, leftMargin + 10, deducYPos);
      doc.text(`Rs.${d.calculatedValue.toLocaleString()}`, leftMargin + 350, deducYPos);
      deducYPos += 18;
    });
  } else {
    doc.text('No deductions', leftMargin + 10, deducYPos);
    deducYPos += 18;
  }
  
  deducYPos += 18;
  doc.moveTo(leftMargin, deducYPos).lineTo(rightMargin, deducYPos).stroke('#cccccc');
  doc.fontSize(10).text('Total Deductions', leftMargin + 10, deducYPos + 6);
  doc.text(`Rs.${(emp.totalDeductions || 0).toLocaleString()}`, leftMargin + 350, deducYPos + 6);
  
  const netY = deducBoxY + deducBoxHeight + 20;
  doc.rect(leftMargin, netY, boxWidth, 35).fill('#333333');
  doc.fillColor('#ffffff').fontSize(14);
  doc.text('Net Pay', leftMargin + 10, netY + 10);
  doc.text(`Rs.${(emp.netPay || 0).toLocaleString()}`, leftMargin + 350, netY + 10);
  
  const footerY = netY + 50;
  doc.fontSize(9).fillColor('#666666');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, leftMargin, footerY, { align: 'center' });
}