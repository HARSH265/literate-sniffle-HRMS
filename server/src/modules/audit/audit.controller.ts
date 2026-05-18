import { Request, Response } from 'express';
import { AuditService } from './audit.service.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';

export const auditController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    await AuditService.list(req.query as Record<string, unknown>, res);
  }),

  getModules: asyncHandler(async (_req: Request, res: Response) => {
    const modules = await AuditService.getModules();
    ResponseHandler.success(res, modules, 'Modules fetched successfully');
  }),

  getActions: asyncHandler(async (_req: Request, res: Response) => {
    const actions = await AuditService.getActions();
    ResponseHandler.success(res, actions, 'Actions fetched successfully');
  }),

  exportLogs: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuditService.exportLogs(req.query as Record<string, unknown>);
    ResponseHandler.success(res, data, 'Audit logs exported successfully');
  }),

  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await AuditService.getStats();
    ResponseHandler.success(res, stats, 'Stats fetched successfully');
  }),

  getRetentionInfo: asyncHandler(async (_req: Request, res: Response) => {
    const info = await AuditService.getRetentionInfo();
    ResponseHandler.success(res, info, 'Retention info fetched successfully');
  }),

  deleteOldLogs: asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.body;
    const retentionDays = Math.max(30, Math.min(365, Number(days) || 90));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await AuditService.deleteOldLogs(cutoffDate);
    ResponseHandler.success(res, result, `Deleted ${result.deletedCount} old audit logs`);
  }),
};