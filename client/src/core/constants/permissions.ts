export const PERMISSIONS = {
  MANAGE_EMPLOYEES: 'manage-employees',
  VIEW_EMPLOYEES: 'view-employees',
  MANAGE_ATTENDANCE: 'manage-attendance',
  MANAGE_OVERTIME: 'manage-overtime',
  PROCESS_PAYROLL: 'process-payroll',
  MANAGE_SETTINGS: 'manage-settings',
  MANAGE_USERS: 'manage-users',
  VIEW_REPORTS: 'view-reports',
  VIEW_AUDIT: 'view-audit',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  HR_ADMIN: 'hr-admin',
  HR_STAFF: 'hr-staff',
  ACCOUNTS: 'accounts',
  MANAGER: 'manager',
} as const;