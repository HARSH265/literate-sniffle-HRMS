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
};