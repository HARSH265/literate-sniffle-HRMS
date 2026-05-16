import { Request, Response } from 'express';
import { HolidaysService } from './holidays.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await HolidaysService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Holidays fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await HolidaysService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Holiday fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await HolidaysService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Holiday created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await HolidaysService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Holiday updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await HolidaysService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const holidaysController = { list, getById, create, update, remove };