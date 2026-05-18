import { Request, Response } from 'express';
import { ReportsService } from './reports.service.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';

const exportEmployees = asyncHandler(async (req: Request, res: Response) => {
  await ReportsService.exportEmployees(req.query as Record<string, unknown>, res);
});

const exportAttendance = asyncHandler(async (req: Request, res: Response) => {
  await ReportsService.exportAttendance(req.query as Record<string, unknown>, res);
});

const exportPayroll = asyncHandler(async (req: Request, res: Response) => {
  await ReportsService.exportPayroll(req.query as Record<string, unknown>, res);
});

const getAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReportsService.getAttendanceSummary(req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Attendance summary fetched');
});

const getPayrollSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReportsService.getPayrollSummary(req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Payroll summary fetched');
});

const getDepartmentSummary = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ReportsService.getDepartmentWiseSummary();
  ResponseHandler.success(res, result, 'Department summary fetched');
});

const exportOvertime = asyncHandler(async (req: Request, res: Response) => {
  await ReportsService.exportOvertime(req.query as Record<string, unknown>, res);
});

const getOvertimeSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReportsService.getOvertimeSummary(req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Overtime summary fetched');
});

export const reportsController = { 
  exportEmployees, 
  exportAttendance, 
  exportPayroll,
  getAttendanceSummary,
  getPayrollSummary,
  getDepartmentSummary,
  exportOvertime,
  getOvertimeSummary,
};