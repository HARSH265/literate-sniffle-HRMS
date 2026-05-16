import { Request, Response } from 'express';
import { ReportsService } from './reports.service.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const exportEmployees = asyncHandler(async (req: Request, res: Response) => {
  await ReportsService.exportEmployees(req.query as Record<string, unknown>, res);
});

const exportAttendance = asyncHandler(async (req: Request, res: Response) => {
  await ReportsService.exportAttendance(req.query as Record<string, unknown>, res);
});

const exportPayroll = asyncHandler(async (req: Request, res: Response) => {
  await ReportsService.exportPayroll(req.query as Record<string, unknown>, res);
});

export const reportsController = { exportEmployees, exportAttendance, exportPayroll };