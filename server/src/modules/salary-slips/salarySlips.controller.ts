import { Request, Response } from 'express';
import { SalarySlipsService } from './salarySlips.service.js';
import { PDFGeneratorService, SalarySlipPdfData } from '../../core/pdf/PDFGeneratorService.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalarySlipsService.list(req.query as Record<string, unknown>);
ResponseHandler.success(res, result, 'Salary slips list fetched successfully');
});

const preview = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.query.employeeId as string | undefined;
  const slipData = await SalarySlipsService.generatePdf(req.params.id, req.user!.id, employeeId);
  ResponseHandler.success(res, slipData, 'Salary slip preview');
});

const generatePdf = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.query.employeeId as string | undefined;
  const slipData = await SalarySlipsService.generatePdf(req.params.id, req.user!.id, employeeId);
  
  const data = slipData as unknown as SalarySlipPdfData;
  const filename = `SalarySlip-${data.month.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  
  await PDFGeneratorService.generateFromData(data, res, filename);
});

const generateExcel = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await SalarySlipsService.generateExcel(req.params.id);
  const run = await (await import('../../models/PayrollRun.model.js')).default.findById(req.params.id).lean();
  const month = run?.month?.replace(/[^a-zA-Z0-9]/g, '_') || 'all';
  const filename = `SalarySlips-${month}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const salarySlipsController = { list, preview, generatePdf, generateExcel };