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

const getCustomReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReportsService.getCustomReport(req.body);
  ResponseHandler.success(res, result, 'Custom report generated');
});

const getChartData = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReportsService.getChartData(req.query as Record<string, unknown> as any);
  ResponseHandler.success(res, result, 'Chart data fetched');
});

const getDrillDown = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReportsService.getDrillDown(req.query as Record<string, unknown> as any);
  ResponseHandler.success(res, result, 'Drill down data fetched');
});

const getScheduledExportConfig = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ReportsService.getScheduledExportConfig();
  ResponseHandler.success(res, result, 'Scheduled export config fetched');
});

const saveScheduledExportConfig = asyncHandler(async (req: Request, res: Response) => {
  const result = await ReportsService.saveScheduledExportConfig(req.body);
  ResponseHandler.success(res, result, 'Scheduled export config saved');
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
  getCustomReport,
  getChartData,
  getDrillDown,
  getScheduledExportConfig,
  saveScheduledExportConfig,
};