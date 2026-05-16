import { Request, Response } from 'express';
import { OvertimeRulesService } from './overtimeRules.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeRulesService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Overtime rules fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeRulesService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Overtime rule fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeRulesService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Overtime rule created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeRulesService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Overtime rule updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await OvertimeRulesService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const overtimeRulesController = { list, getById, create, update, remove };