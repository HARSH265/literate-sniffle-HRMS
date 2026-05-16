import { Request, Response } from 'express';
import { WeeklyOffRulesService } from './weeklyOffRules.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await WeeklyOffRulesService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Weekly off rules fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await WeeklyOffRulesService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Weekly off rule fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await WeeklyOffRulesService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Weekly off rule created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await WeeklyOffRulesService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Weekly off rule updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await WeeklyOffRulesService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const weeklyOffRulesController = { list, getById, create, update, remove };