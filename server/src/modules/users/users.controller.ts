import { Request, Response } from 'express';
import { UsersService } from './users.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta, 'Users fetched successfully');
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.getById(req.params.id);
  ResponseHandler.success(res, result, 'User fetched successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'User created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'User updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await UsersService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const usersController = { list, getById, create, update, remove };