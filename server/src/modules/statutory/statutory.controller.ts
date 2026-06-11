import { Request, Response } from 'express';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import {
  getStatutoryDefaults,
  calculateStatutoryForEmployee,
  generatePFChallan,
  getChallans,
  getChallanById,
  updateChallan,
  generateStatutoryReport,
  getReports,
  getReportById,
  updateReport,
  getStatutorySummary,
} from './statutory.service.js';

export const getDefaultsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getStatutoryDefaults();
  ResponseHandler.success(res, data);
});

export const calculateHandler = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, grossPay, month } = req.body;
  const data = await calculateStatutoryForEmployee(employeeId, grossPay, month);
  ResponseHandler.success(res, data);
});

export const generateChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.params;
  const userId = req.user!.id;
  const data = await generatePFChallan(month, userId);
  ResponseHandler.success(res, data);
});

export const listChallansHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month, status, financialYear } = req.query as Record<string, string>;
  const data = await getChallans({ month, status, financialYear });
  ResponseHandler.success(res, data);
});

export const getChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getChallanById(req.params.id);
  if (!data) { ResponseHandler.error(res, 'Challan not found', 404); return; }
  ResponseHandler.success(res, data);
});

export const patchChallanHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateChallan(req.params.id, req.body, req.user!.id);
  if (!data) { ResponseHandler.error(res, 'Challan not found', 404); return; }
  ResponseHandler.success(res, data);
});

export const generateReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const { reportType, month } = req.body;
  const userId = req.user!.id;
  const data = await generateStatutoryReport(reportType, month, userId);
  ResponseHandler.success(res, data);
});

export const listReportsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { reportType, month, financialYear } = req.query as Record<string, string>;
  const data = await getReports({ reportType, month, financialYear });
  ResponseHandler.success(res, data);
});

export const getReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getReportById(req.params.id);
  if (!data) { ResponseHandler.error(res, 'Report not found', 404); return; }
  ResponseHandler.success(res, data);
});

export const patchReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateReport(req.params.id, req.body, req.user!.id);
  if (!data) { ResponseHandler.error(res, 'Report not found', 404); return; }
  ResponseHandler.success(res, data);
});

export const getSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.params;
  const data = await getStatutorySummary(month);
  ResponseHandler.success(res, data);
});
