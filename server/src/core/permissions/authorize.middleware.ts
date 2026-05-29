import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { permissions } from './permissions.config.js';
import { ROLES } from '../../config/constants.js';

export type Permission =
  | 'manage-employees'
  | 'view-employees'
  | 'manage-departments'
  | 'view-departments'
  | 'manage-attendance'
  | 'manage-overtime'
  | 'process-payroll'
  | 'manage-settings'
  | 'manage-users'
  | 'view-reports'
  | 'view-audit'
  | 'manage-leave-types'
  | 'manage-leave-applications'
  | 'approve-leave'
  | 'view-leave'
  | 'manage-loans'
  | 'view-loans'
  | 'apply-loan'
  | 'manage-statutory'
  | 'view-statutory'
  | 'manage-audit'
  | 'view-own-profile'
  | 'update-own-profile'
  | 'manage-ess'
  | 'view-announcements'
  | 'manage-announcements'
  | 'view-tickets'
  | 'manage-tickets'
  | 'view-shift-swaps'
  | 'manage-shift-swaps'
  | 'request-shift-swap'
  | 'view-own-shifts'
  | 'view-assets'
  | 'manage-assets'
  | 'view-documents'
  | 'manage-documents';

export function authorize(...allowedPermissions: Permission[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = _req.user;

      if (!user) {
        throw new AppError('Not authenticated', 401);
      }

      if (user.role === ROLES.SUPER_ADMIN) {
        next();
        return;
      }

      const rolePermissions = permissions[user.role as keyof typeof permissions];

      if (!rolePermissions) {
        throw new AppError('Access denied', 403);
      }

      const hasPermission = allowedPermissions.some((perm) =>
        rolePermissions.includes(perm),
      );

      if (!hasPermission) {
        throw new AppError('Permission denied', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}