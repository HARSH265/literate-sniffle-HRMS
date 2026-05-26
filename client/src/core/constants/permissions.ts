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

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'super-admin': [
    'manage-employees', 'view-employees', 'manage-departments', 'view-departments',
    'manage-attendance', 'manage-overtime', 'process-payroll', 'manage-settings',
    'manage-users', 'view-reports', 'view-audit', 'manage-leave-types',
    'manage-leave-applications', 'approve-leave', 'view-leave', 'manage-loans',
    'view-loans', 'apply-loan', 'manage-statutory', 'view-statutory', 'manage-audit',
  ],
  'hr-admin': [
    'manage-employees', 'view-employees', 'manage-departments', 'view-departments',
    'manage-attendance', 'manage-overtime', 'process-payroll', 'manage-settings',
    'manage-users', 'view-reports', 'view-audit', 'manage-leave-types',
    'manage-leave-applications', 'approve-leave', 'view-leave', 'manage-loans',
    'view-loans', 'apply-loan', 'manage-statutory', 'view-statutory',
  ],
  'hr-staff': [
    'view-employees', 'view-departments', 'manage-attendance', 'manage-overtime',
    'view-reports', 'manage-leave-applications', 'approve-leave', 'view-leave',
    'view-loans', 'apply-loan', 'view-statutory',
  ],
  'accounts': [
    'view-departments', 'process-payroll', 'view-reports', 'view-leave',
    'view-loans', 'manage-loans', 'manage-statutory', 'view-statutory',
  ],
  'manager': [
    'view-employees', 'view-departments', 'view-reports', 'approve-leave', 'view-leave',
  ],
};