import { Request, Response } from 'express';
import { SalaryStructureTemplateService } from './salaryStructureTemplate.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureTemplateService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Templates fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureTemplateService.getById(req.params.id);
  ResponseHandler.success(res, result, 'Template fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureTemplateService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Template created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await SalaryStructureTemplateService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Template updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await SalaryStructureTemplateService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const salaryStructureTemplateController = { list, getById, create, update, remove };
