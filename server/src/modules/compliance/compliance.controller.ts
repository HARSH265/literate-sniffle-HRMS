import { Request, Response, NextFunction } from 'express';
import * as complianceService from './compliance.service.js';

export const runComplianceCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const report = await complianceService.runComplianceCheck(runId);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const getComplianceSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const summary = await complianceService.getComplianceSummary(runId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

export const getAllComplianceSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await complianceService.getComplianceSummary();
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

export const getConfigAuditLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { module, action, userId, from, to, page, limit } = req.query;
    const result = await complianceService.getConfigAuditLog({
      module: module as string,
      action: action as string,
      userId: userId as string,
      from: from as string,
      to: to as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.status(200).json({ success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (error) {
    next(error);
  }
};

export const getGapReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { runId } = req.params;
    const report = await complianceService.runComplianceCheck(runId);
    res.status(200).json({ success: true, data: report.gapReport });
  } catch (error) {
    next(error);
  }
};
