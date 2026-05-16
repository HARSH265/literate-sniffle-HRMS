import { Request, Response } from 'express';
import { EmployeesService } from './employees.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await EmployeesService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Employees fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await EmployeesService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Employee fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await EmployeesService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Employee created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await EmployeesService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Employee updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await EmployeesService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const employeesController = { list, getById, create, update, remove };