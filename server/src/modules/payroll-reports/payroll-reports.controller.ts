import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { generatePayslipPdf } from './payslip.service.js';
import { generateBankFile } from './bankfile.service.js';
import { generateSalaryRegister } from './salary-register.service.js';
import PayrollRun from '../../models/PayrollRun.model.js';
import PayrollItem from '../../models/PayrollItem.model.js';
import { AuditService } from '../../core/audit/AuditService.js';
import {
  getHeadcountCostReport, getMoMVarianceReport, getYtdCostAnalysis,
  getOtLopAnalysis, getLoanOutstandingReport, getBudgetVsActual,
} from './mis-reports.service.js';

export const downloadPayslip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.id;
    await generatePayslipPdf(itemId, res, userId);
  } catch (error) {
    next(error);
  }
};

export const downloadBankFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const format = (req.query.format as 'neft' | 'rtgs' | 'nach') || 'neft';
    const userId = req.user!.id;
    await generateBankFile(runId, format, res, userId);
  } catch (error) {
    next(error);
  }
};

export const downloadSalaryRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const department = req.query.department as string | undefined;
    const userId = req.user!.id;
    await generateSalaryRegister(runId, res, userId, { department });
  } catch (error) {
    next(error);
  }
};

export const downloadSalaryRegisterCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const department = req.query.department as string | undefined;
    const userId = req.user!.id;
    await generateSalaryRegister(runId, res, userId, { department }, 'csv');
  } catch (error) {
    next(error);
  }
};

export const downloadRunPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const run = await PayrollRun.findById(runId).lean();
    if (!run) {
      res.status(404).json({ success: false, message: 'Payroll run not found' });
      return;
    }
    const items = await PayrollItem.find({ payrollRun: new mongoose.Types.ObjectId(runId) })
      .populate('employee', 'fullName employeeCode department')
      .lean();
    const employees = items.map((item: any) => {
      const emp = item.employee as any;
      return {
        name: emp.fullName,
        employeeCode: emp.employeeCode,
        department: emp.department,
        presentDays: item.presentDays,
        workingDays: item.effectiveWorkingDays,
        basicSalary: item.basicEarnings,
        allowances: (item.allowances || []).map((a: any) => ({ name: a.name, calculatedValue: a.calculatedValue })),
        deductions: (item.deductions || []).map((d: any) => ({ name: d.name, calculatedValue: d.calculatedValue })),
        totalEarnings: item.grossEarnings,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
      } as any;
    });
    const pdfData = {
      companyName: process.env.COMPANY_NAME || 'Company',
      month: run.month,
      generatedDate: new Date().toISOString(),
      employees,
    } as any;
    res.status(200).json({ success: true, data: pdfData });

    if (req.user) {
      await AuditService.log({
        action: 'export',
        module: 'payroll',
        userId: req.user.id,
        targetId: runId,
        details: { type: 'run-data', month: run.month },
      });
    }
  } catch (error) {
    next(error);
  }
};


export const getHeadcountCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const data = await getHeadcountCostReport(year);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMoMVariance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await getMoMVarianceReport();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getYtdCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const data = await getYtdCostAnalysis(year);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getOtLop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const data = await getOtLopAnalysis(runId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getLoanOutstanding = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await getLoanOutstandingReport();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getBudgetVsActualReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const data = await getBudgetVsActual(runId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const exportTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename, columns, rows } = req.body;
    if (!filename || !columns || !rows) {
      res.status(400).json({ success: false, message: 'Missing required fields: filename, columns, rows' });
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Export');
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    const headerRow = sheet.addRow(columns);
    headerRow.eachCell((cell) => { cell.style = headerStyle; });
    for (const row of rows) {
      sheet.addRow(row);
    }
    sheet.columns.forEach((col, i) => { if (i < columns.length) col.width = 18; });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename=${safeName}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
