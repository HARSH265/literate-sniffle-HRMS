import { Request, Response } from 'express';
import { DepartmentsService } from './departments.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await DepartmentsService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Departments fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await DepartmentsService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Department fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await DepartmentsService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Department created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await DepartmentsService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Department updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await DepartmentsService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const departmentsController = { list, getById, create, update, remove };