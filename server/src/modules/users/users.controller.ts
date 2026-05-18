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

const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.deactivate(req.params.id, req.user!.id);
  ResponseHandler.success(res, result, 'User deactivated successfully');
});

const activate = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.activate(req.params.id, req.user!.id);
  ResponseHandler.success(res, result, 'User activated successfully');
});

const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const result = await UsersService.getUserActivity(req.params.id, page, limit);
  ResponseHandler.paginated(res, result.data, result.meta, 'Activity fetched successfully');
});

const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.getUserStats(req.params.id);
  ResponseHandler.success(res, result, 'Stats fetched successfully');
});

const exportUsers = asyncHandler(async (_req: Request, res: Response) => {
  const result = await UsersService.exportUsers();
  ResponseHandler.success(res, result, 'Users exported successfully');
});

const importUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.importUsers(req.body.users, req.user!.id);
  ResponseHandler.success(res, result, 'Users imported successfully');
});

export const usersController = {
  list,
  getById,
  create,
  update,
  deactivate,
  activate,
  getUserActivity,
  getUserStats,
  exportUsers,
  importUsers,
};