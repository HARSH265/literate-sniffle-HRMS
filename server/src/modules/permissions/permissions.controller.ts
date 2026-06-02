import { Request, Response } from 'express';
import { PermissionManagementService } from './permissions.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const getPermissionGroups = asyncHandler(async (_req: Request, res: Response) => {
  const result = await PermissionManagementService.getPermissionGroups();
  ResponseHandler.success(res, result);
});

const getRolePermissions = asyncHandler(async (_req: Request, res: Response) => {
  const result = await PermissionManagementService.getRolePermissions();
  ResponseHandler.success(res, result);
});

const getRolePermission = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;
  const result = await PermissionManagementService.getRolePermission(role);
  ResponseHandler.success(res, result);
});

const updateRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;
  const { permissions } = req.body;
  const userId = req.user!.id;

  const result = await PermissionManagementService.updateRolePermissions(role, permissions, userId);
  ResponseHandler.success(res, result, 'Role permissions updated');
});

const resetRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;
  const userId = req.user!.id;

  const result = await PermissionManagementService.resetRolePermissions(role, userId);
  ResponseHandler.success(res, result, 'Role permissions reset to defaults');
});

export const permissionsController = {
  getPermissionGroups,
  getRolePermissions,
  getRolePermission,
  updateRolePermissions,
  resetRolePermissions,
};
