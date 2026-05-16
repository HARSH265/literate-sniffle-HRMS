import { Request, Response } from 'express';
import { DesignationsService } from './designations.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await DesignationsService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Designations fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await DesignationsService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Designation fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await DesignationsService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Designation created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await DesignationsService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Designation updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await DesignationsService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const designationsController = { list, getById, create, update, remove };