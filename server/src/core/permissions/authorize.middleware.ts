import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { permissions as defaultPermissions, type Permission } from './permissions.config.js';
import { ROLES } from '../../config/constants.js';
import RolePermission from '../../models/RolePermission.model.js';

export type { Permission };

// In-memory cache for role permissions (invalidated on permission update)
const rolePermissionsCache = new Map<string, { permissions: string[]; expiry: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

async function getRolePermissions(role: string): Promise<string[]> {
  const now = Date.now();
  const cached = rolePermissionsCache.get(role);
  if (cached && cached.expiry > now) {
    return cached.permissions;
  }

  // Check DB for custom permissions
  const custom = await RolePermission.findOne({ role }).lean();
  const perms = custom
    ? (custom.permissions as string[])
    : ((defaultPermissions[role as keyof typeof defaultPermissions] || []) as string[]);

  rolePermissionsCache.set(role, { permissions: perms, expiry: now + CACHE_TTL_MS });
  return perms;
}

/** Invalidate cache for a role (called when permissions are updated) */
export function invalidatePermissionCache(role?: string) {
  if (role) {
    rolePermissionsCache.delete(role);
  } else {
    rolePermissionsCache.clear();
  }
}

export function authorize(...allowedPermissions: Permission[]) {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
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

      const rolePerms = await getRolePermissions(user.role);

      if (!rolePerms || rolePerms.length === 0) {
        throw new AppError('Access denied — unknown role', 403);
      }

      const hasPermission = allowedPermissions.some((perm) =>
        rolePerms.includes(perm),
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
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = _req.user;

      if (!user) {
        throw new AppError('Not authenticated', 401);
      }

      if (user.role === ROLES.SUPER_ADMIN) {
        next();
        return;
      }

      const rolePerms = await getRolePermissions(user.role);

      if (!rolePerms || rolePerms.length === 0) {
        throw new AppError('Access denied — unknown role', 403);
      }

      const hasAll = requiredPermissions.every((perm) =>
        rolePerms.includes(perm),
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
