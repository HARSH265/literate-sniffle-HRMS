import { Request, Response } from 'express';
import { OvertimeEntriesService } from './overtimeEntries.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeEntriesService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Overtime entries fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeEntriesService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Overtime entry fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeEntriesService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Overtime entry created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await OvertimeEntriesService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Overtime entry updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await OvertimeEntriesService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const overtimeEntriesController = { list, getById, create, update, remove };