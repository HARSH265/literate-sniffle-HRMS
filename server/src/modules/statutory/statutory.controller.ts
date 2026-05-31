import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
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

export async function getDefaultsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getStatutoryDefaults();
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function calculateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, grossPay, month } = req.body;
    const data = await calculateStatutoryForEmployee(employeeId, grossPay, month);
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function generateChallanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { month } = req.params;
    const userId = (req as any).user?.id;
    const data = await generatePFChallan(month, userId);
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listChallansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, status, financialYear } = req.query as any;
    const data = await getChallans({ month, status, financialYear });
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getChallanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getChallanById(req.params.id);
    if (!data) { ResponseHandler.error(res, 'Challan not found', 404); return; }
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function patchChallanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await updateChallan(req.params.id, req.body, (req as any).user?.id);
    if (!data) { ResponseHandler.error(res, 'Challan not found', 404); return; }
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function generateReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { reportType, month } = req.body;
    const userId = (req as any).user?.id;
    const data = await generateStatutoryReport(reportType, month, userId);
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listReportsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { reportType, month, financialYear } = req.query as any;
    const data = await getReports({ reportType, month, financialYear });
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getReportById(req.params.id);
    if (!data) { ResponseHandler.error(res, 'Report not found', 404); return; }
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function patchReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await updateReport(req.params.id, req.body, (req as any).user?.id);
    if (!data) { ResponseHandler.error(res, 'Report not found', 404); return; }
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { month } = req.params;
    const data = await getStatutorySummary(month);
    ResponseHandler.success(res, data);
  } catch (err) {
    next(err);
  }
}
