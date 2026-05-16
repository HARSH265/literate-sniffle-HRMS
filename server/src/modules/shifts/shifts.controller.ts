import { Request, Response } from 'express';
import { ShiftsService } from './shifts.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await ShiftsService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Shifts fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await ShiftsService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Shift fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await ShiftsService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Shift created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await ShiftsService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Shift updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await ShiftsService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const shiftsController = { list, getById, create, update, remove };