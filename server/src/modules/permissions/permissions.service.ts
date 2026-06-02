import RolePermission from '../../models/RolePermission.model.js';
import { permissions as defaultPermissions, ALL_PERMISSIONS, PERMISSION_GROUPS, type Permission } from '../../core/permissions/permissions.config.js';
import { ROLES } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';

// All system roles (excluding 'api' which is for API keys only)
const SYSTEM_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_ADMIN,
  ROLES.HR_STAFF,
  ROLES.ACCOUNTS,
  ROLES.MANAGER,
] as const;

export class PermissionManagementService {
  /**
   * Get all available permissions grouped by module
   */
  static async getPermissionGroups() {
    return {
      groups: PERMISSION_GROUPS,
      allPermissions: ALL_PERMISSIONS,
      totalPermissions: ALL_PERMISSIONS.length,
    };
  }

  /**
   * Get current permissions for all roles (merges DB overrides with defaults)
   */
  static async getRolePermissions() {
    const customRoles = await RolePermission.find({}).lean();
    const customMap = new Map(customRoles.map(r => [r.role, { permissions: r.permissions, isCustom: r.isCustom }]));

    const result: Record<string, { permissions: string[]; isCustom: boolean }> = {};

    for (const role of SYSTEM_ROLES) {
      const custom = customMap.get(role);
      if (custom) {
        result[role] = { permissions: custom.permissions as string[], isCustom: custom.isCustom };
      } else {
        result[role] = {
          permissions: (defaultPermissions[role] || []) as string[],
          isCustom: false,
        };
      }
    }

    return result;
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermission(role: string) {
    if (!SYSTEM_ROLES.includes(role as any)) {
      throw new AppError('Invalid role', 400);
    }

    const custom = await RolePermission.findOne({ role }).lean();
    if (custom) {
      return { role, permissions: custom.permissions, isCustom: custom.isCustom };
    }

    return {
      role,
      permissions: (defaultPermissions[role] || []) as string[],
      isCustom: false,
    };
  }

  /**
   * Update permissions for a role
   * Super admin permissions cannot be modified
   */
  static async updateRolePermissions(
    role: string,
    permissionsList: string[],
    updatedBy: string,
  ) {
    if (!SYSTEM_ROLES.includes(role as any)) {
      throw new AppError('Invalid role', 400);
    }

    if (role === ROLES.SUPER_ADMIN) {
      throw new AppError('Super admin permissions cannot be modified', 400);
    }

    // Validate all permissions exist
    const validPermissions = new Set(ALL_PERMISSIONS);
    const invalid = permissionsList.filter(p => !validPermissions.has(p as Permission));
    if (invalid.length > 0) {
      throw new AppError(`Invalid permissions: ${invalid.join(', ')}`, 400);
    }

    // Check if this matches the default
    const defaultPerms = (defaultPermissions[role] || []) as string[];
    const isCustom =
      permissionsList.length !== defaultPerms.length ||
      !permissionsList.every(p => defaultPerms.includes(p));

    if (isCustom) {
      await RolePermission.findOneAndUpdate(
        { role },
        { permissions: permissionsList, isCustom: true, updatedBy },
        { upsert: true, new: true },
      );
    } else {
      // Remove custom override if it matches default
      await RolePermission.deleteOne({ role });
    }

    await AuditService.log({
      action: 'update',
      module: 'permissions',
      userId: updatedBy,
      targetId: role,
      details: { role, permissionCount: permissionsList.length, isCustom },
    });

    return { role, permissions: permissionsList, isCustom };
  }

  /**
   * Reset a role's permissions to defaults
   */
  static async resetRolePermissions(role: string, updatedBy: string) {
    if (!SYSTEM_ROLES.includes(role as any)) {
      throw new AppError('Invalid role', 400);
    }

    if (role === ROLES.SUPER_ADMIN) {
      throw new AppError('Super admin permissions cannot be modified', 400);
    }

    await RolePermission.deleteOne({ role });

    await AuditService.log({
      action: 'update',
      module: 'permissions',
      userId: updatedBy,
      targetId: role,
      details: { role, action: 'reset to defaults' },
    });

    return {
      role,
      permissions: (defaultPermissions[role] || []) as string[],
      isCustom: false,
    };
  }

  /**
   * Get the effective permissions for a role (used by authorize middleware)
   * Checks DB first, falls back to static config
   */
  static async getEffectivePermissions(role: string): Promise<string[]> {
    const custom = await RolePermission.findOne({ role }).lean();
    if (custom) {
      return custom.permissions;
    }
    return (defaultPermissions[role] || []) as string[];
  }
}
