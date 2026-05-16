import { ROLES } from '../../config/constants.js';
import type { Permission } from './authorize.middleware.js';

export const permissions: Record<string, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    'manage-employees',
    'view-employees',
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
    'manage-attendance',
    'manage-overtime',
    'view-reports',
  ],
  [ROLES.ACCOUNTS]: [
    'process-payroll',
    'view-reports',
  ],
  [ROLES.MANAGER]: [
    'view-reports',
  ],
};