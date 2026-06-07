import { Request, Response } from 'express';
import { SalaryStructureService } from './salaryStructure.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Salary structures fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Salary structure fetched successfully');
});

const getByEmployee = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureService.getByEmployee(req.params.employeeId);
  ResponseHandler.success(res, result, 'Salary structures fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Salary structure created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Salary structure updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await SalaryStructureService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const salaryStructureController = { list, getById, getByEmployee, create, update, remove };
