import { Request, Response } from 'express';
import { PayrollService } from './payroll.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const listRuns = asyncHandler(async (_req: Request, res: Response) => {
  const result = await PayrollService.listRuns();
  ResponseHandler.success(res, result, 'Payroll runs fetched successfully');
});

const runPayroll = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) {
    throw new Error('Month and year are required');
  }
  const result = await PayrollService.runPayroll(month, year, req.user!.id);
  ResponseHandler.created(res, result, 'Payroll processed successfully');
});

const finalizeRun = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.finalizeRun(req.params.id, req.user!.id, req.body.remarks);
  ResponseHandler.success(res, result, 'Payroll finalized successfully');
});

const getRunDetails = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.getRunDetails(req.params.id);
  ResponseHandler.success(res, result, 'Payroll details fetched successfully');
});

export const payrollController = { listRuns, runPayroll, finalizeRun, getRunDetails };