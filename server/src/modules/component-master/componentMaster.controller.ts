import { Request, Response } from 'express';
import { ComponentMasterService } from './componentMaster.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await ComponentMasterService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Components fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await ComponentMasterService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Component fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await ComponentMasterService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Component created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await ComponentMasterService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Component updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await ComponentMasterService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const componentMasterController = { list, getById, create, update, remove };
