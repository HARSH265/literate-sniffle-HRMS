import { ROLES } from '../../config/constants.js';
import type { Permission } from './authorize.middleware.js';

export const permissions: Record<string, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    'manage-employees',
    'view-employees',
    'manage-departments',
    'view-departments',
    'manage-attendance',
    'manage-overtime',
    'process-payroll',
    'manage-settings',
    'manage-users',
    'view-reports',
    'view-audit',
  ],
  [ROLES.HR_ADMIN]: [
    'manage-employees',
    'view-employees',
    'manage-departments',
    'view-departments',
    'manage-attendance',
    'manage-overtime',
    'process-payroll',
    'manage-settings',
    'manage-users',
    'view-reports',
    'view-audit',
  ],
  [ROLES.HR_STAFF]: [
    'view-employees',
    'view-departments',
    'manage-attendance',
    'manage-overtime',
    'view-reports',
  ],
  [ROLES.ACCOUNTS]: [
    'view-departments',
    'process-payroll',
    'view-reports',
  ],
  [ROLES.MANAGER]: [
    'view-departments',
    'view-reports',
  ],
};