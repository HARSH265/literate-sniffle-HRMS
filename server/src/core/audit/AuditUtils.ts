import { Request } from 'express';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips.trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

export function sanitizeDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'bankAccountNumber', 'ifscCode', 'accountNumber', 'secret', 'token', 'apiKey', 'authorization'];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    archive: 'Archived',
    finalize: 'Finalized',
    unfinalize: 'Unfinalized',
    login: 'Logged In',
    logout: 'Logged Out',
    'logout-all-devices': 'Logged Out All Devices',
    'upload-logo': 'Uploaded Logo',
    'test-email': 'Tested Email',
    import: 'Imported',
    export: 'Exported',
    'mark-read': 'Marked as Read',
    'bulk-create': 'Bulk Created',
    'bulk-update': 'Bulk Updated',
    'add-shift': 'Added Shift',
    'edit-shift': 'Edited Shift',
    'delete-shift': 'Deleted Shift',
    'add-designation': 'Added Designation',
    'edit-designation': 'Edited Designation',
    'delete-designation': 'Deleted Designation',
    'add-department': 'Added Department',
    'edit-department': 'Edited Department',
    'delete-department': 'Deleted Department',
    'add-holiday': 'Added Holiday',
    'edit-holiday': 'Edited Holiday',
    'delete-holiday': 'Deleted Holiday',
    'mark-all-read': 'Marked All Read',
    'change-password': 'Changed Password',
    'reset-password': 'Reset Password',
    'update-settings': 'Updated Settings',
  };
  return labels[action] || action;
}

export function getModuleLabel(module: string): string {
  const labels: Record<string, string> = {
    employees: 'Employee Management',
    payroll: 'Payroll',
    attendance: 'Attendance',
    reports: 'Reports',
    settings: 'Settings',
    auth: 'Authentication',
    users: 'User Management',
    shifts: 'Shift Management',
    designations: 'Designation Management',
    departments: 'Department Management',
    holidays: 'Holiday Management',
    notifications: 'Notifications',
    overtime: 'Overtime',
    'overtime-rules': 'Overtime Rules',
    'weekly-off': 'Weekly Off Rules',
    audit: 'Audit Logs',
    ess: 'Employee Self-Service',
    announcements: 'Announcements',
    helpdesk: 'Help Desk',
  };
  return labels[module] || module;
}