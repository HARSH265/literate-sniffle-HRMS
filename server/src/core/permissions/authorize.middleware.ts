import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { permissions, type Permission } from './permissions.config.js';
import { ROLES } from '../../config/constants.js';

export type { Permission };

export function authorize(...allowedPermissions: Permission[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = _req.user;

      if (!user) {
        throw new AppError('Not authenticated', 401);
      }

      // Super admin bypasses all permission checks
      if (user.role === ROLES.SUPER_ADMIN) {
        next();
        return;
      }

      const rolePermissions = permissions[user.role as keyof typeof permissions];

      if (!rolePermissions) {
        throw new AppError('Access denied — unknown role', 403);
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

/**
 * Middleware: require ALL listed permissions (AND logic instead of OR)
 */
export function authorizeAll(...requiredPermissions: Permission[]) {
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
        throw new AppError('Access denied — unknown role', 403);
      }

      const hasAll = requiredPermissions.every((perm) =>
        rolePermissions.includes(perm),
      );

      if (!hasAll) {
        throw new AppError('Permission denied', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
