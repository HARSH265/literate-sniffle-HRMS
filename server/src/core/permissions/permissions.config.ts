import { ROLES } from '../../config/constants.js';

// ─── Permission Definitions ───────────────────────────────────────────────────
// Each permission follows the pattern: action-resource
//   view-*      = Read access
//   manage-*    = Create, Update, Delete
//   approve-*   = Approve/Reject workflows
//   request-*   = Employee-initiated requests
//   view-own-*  = Read access to own data only
//   manage-own-* = Write access to own data only

export const ALL_PERMISSIONS = [
  // ── Employee Management ──
  'view-employees',
  'manage-employees',

  // ── Organization Structure ──
  'view-departments',
  'manage-departments',

  // ── Shift Management ──
  'view-shifts',
  'manage-shifts',
  'view-own-shifts',
  'view-shift-swaps',
  'request-shift-swap',
  'manage-shift-swaps',

  // ── Attendance ──
  'view-attendance',
  'manage-attendance',
  'manage-overtime',
  'check-in-out',

  // ── Leave ──
  'view-leave',
  'manage-leave-types',
  'manage-leave-applications',
  'approve-leave',

  // ── Payroll ──
  'view-payroll',
  'process-payroll',

  // ── Loans ──
  'view-loans',
  'manage-loans',
  'apply-loan',

  // ── Statutory ──
  'view-statutory',
  'manage-statutory',

  // ── Performance ──
  'view-performance',
  'manage-performance',
  'view-own-performance',
  'manage-own-performance',
  'request-feedback',

  // ── Training ──
  'view-training',
  'manage-training',
  'view-own-training',
  'enroll-training',

  // ── Helpdesk ──
  'view-tickets',
  'manage-tickets',

  // ── Announcements ──
  'view-announcements',
  'manage-announcements',

  // ── Assets ──
  'view-assets',
  'manage-assets',

  // ── Documents ──
  'view-documents',
  'manage-documents',

  // ── Notifications ──
  'view-notifications',

  // ── Reports ──
  'view-reports',

  // ── Settings ──
  'view-settings',
  'manage-settings',

  // ── Audit ──
  'view-audit',
  'manage-audit',

  // ── Users ──
  'view-users',
  'manage-users',

  // ── ESS (Employee Self-Service) ──
  'view-own-profile',
  'update-own-profile',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// ─── Role Permission Matrix ───────────────────────────────────────────────────
// SUPER_ADMIN: Full system access — bypasses all permission checks in authorize()
// HR_ADMIN:    Manages all HR operations, employees, attendance, payroll
// HR_STAFF:    Daily operations — attendance entry, leave management, view reports
// ACCOUNTS:    Payroll processing, loans, statutory compliance, financial reports
// MANAGER:     Team management — approve leaves, manage performance, view employees

export const permissions: Record<string, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    // Gets ALL permissions via authorize() bypass — this list is for reference/audit
    'view-employees', 'manage-employees',
    'view-departments', 'manage-departments',
    'view-shifts', 'manage-shifts', 'view-own-shifts', 'view-shift-swaps', 'request-shift-swap', 'manage-shift-swaps',
    'view-attendance', 'manage-attendance', 'manage-overtime', 'check-in-out',
    'view-leave', 'manage-leave-types', 'manage-leave-applications', 'approve-leave',
    'view-payroll', 'process-payroll',
    'view-loans', 'manage-loans', 'apply-loan',
    'view-statutory', 'manage-statutory',
    'view-performance', 'manage-performance', 'view-own-performance', 'manage-own-performance', 'request-feedback',
    'view-training', 'manage-training', 'view-own-training', 'enroll-training',
    'view-tickets', 'manage-tickets',
    'view-announcements', 'manage-announcements',
    'view-assets', 'manage-assets',
    'view-documents', 'manage-documents',
    'view-notifications',
    'view-reports',
    'view-settings', 'manage-settings',
    'view-audit', 'manage-audit',
    'view-users', 'manage-users',
    'view-own-profile', 'update-own-profile',
  ],

  [ROLES.HR_ADMIN]: [
    // Employee & Organization
    'view-employees', 'manage-employees',
    'view-departments', 'manage-departments',

    // Shifts
    'view-shifts', 'manage-shifts', 'view-own-shifts', 'view-shift-swaps', 'request-shift-swap', 'manage-shift-swaps',

    // Attendance
    'view-attendance', 'manage-attendance', 'manage-overtime', 'check-in-out',

    // Leave
    'view-leave', 'manage-leave-types', 'manage-leave-applications', 'approve-leave',

    // Payroll
    'view-payroll', 'process-payroll',

    // Loans
    'view-loans', 'manage-loans', 'apply-loan',

    // Statutory
    'view-statutory', 'manage-statutory',

    // Performance
    'view-performance', 'manage-performance', 'view-own-performance', 'manage-own-performance', 'request-feedback',

    // Training
    'view-training', 'manage-training', 'view-own-training', 'enroll-training',

    // Helpdesk
    'view-tickets', 'manage-tickets',

    // Announcements
    'view-announcements', 'manage-announcements',

    // Assets & Documents
    'view-assets', 'manage-assets',
    'view-documents', 'manage-documents',

    // Notifications & Reports
    'view-notifications',
    'view-reports',

    // Settings (view only, no manage)
    'view-settings',

    // Users
    'view-users', 'manage-users',

    // Audit — view only
    'view-audit',

    // ESS
    'view-own-profile', 'update-own-profile',
  ],

  [ROLES.HR_STAFF]: [
    // Employees — view only
    'view-employees',

    // Organization — view only
    'view-departments',

    // Shifts
    'view-shifts', 'view-own-shifts', 'view-shift-swaps', 'request-shift-swap', 'manage-shift-swaps',

    // Attendance — can entry for others
    'view-attendance', 'manage-attendance', 'manage-overtime', 'check-in-out',

    // Leave — can create applications and approve
    'view-leave', 'manage-leave-applications', 'approve-leave',

    // Payroll — view only
    'view-payroll',

    // Loans — view only
    'view-loans',

    // Statutory — view only
    'view-statutory',

    // Performance — view only
    'view-performance', 'view-own-performance', 'manage-own-performance',

    // Training
    'view-training', 'view-own-training', 'enroll-training',

    // Helpdesk
    'view-tickets',

    // Announcements
    'view-announcements',

    // Assets & Documents — view only
    'view-assets',
    'view-documents',

    // Notifications & Reports
    'view-notifications',
    'view-reports',

    // ESS
    'view-own-profile', 'update-own-profile',
  ],

  [ROLES.ACCOUNTS]: [
    // Organization — view only
    'view-departments',

    // Attendance — view only
    'view-attendance',

    // Leave — view only
    'view-leave',

    // Payroll — full processing
    'view-payroll', 'process-payroll',

    // Loans — full management
    'view-loans', 'manage-loans',

    // Statutory — full management
    'view-statutory', 'manage-statutory',

    // Reports
    'view-reports',

    // Announcements
    'view-announcements',

    // Helpdesk
    'view-tickets',

    // Assets & Documents — view only
    'view-assets',
    'view-documents',

    // Notifications
    'view-notifications',

    // ESS
    'view-own-profile',
  ],

  [ROLES.MANAGER]: [
    // Employees — view only (team)
    'view-employees',

    // Organization — view only
    'view-departments',

    // Shifts
    'view-own-shifts', 'request-shift-swap',

    // Attendance — view only
    'view-attendance',

    // Leave — can approve
    'view-leave', 'approve-leave',

    // Payroll — view only
    'view-payroll',

    // Loans — view only
    'view-loans',

    // Statutory — view only
    'view-statutory',

    // Performance — can manage team performance
    'view-performance', 'manage-performance', 'view-own-performance', 'manage-own-performance', 'request-feedback',

    // Training
    'view-training', 'view-own-training', 'enroll-training',

    // Helpdesk
    'view-tickets',

    // Announcements
    'view-announcements',

    // Assets & Documents — view only
    'view-assets',
    'view-documents',

    // Notifications
    'view-notifications',

    // Reports — view only
    'view-reports',

    // ESS
    'view-own-profile',
  ],

  // API keys get read-only access to core data
  // Actual permissions are checked per-key via requireApiKeyPermission()
  [ROLES.API]: [
    'view-employees',
    'view-departments',
    'view-attendance',
    'view-leave',
    'view-payroll',
    'view-reports',
  ],
};

// ─── Permission Groups (for UI) ───────────────────────────────────────────────
// Group permissions by module for the permission management UI

export const PERMISSION_GROUPS = {
  'Employee Management': ['view-employees', 'manage-employees'],
  'Organization': ['view-departments', 'manage-departments'],
  'Shift Management': ['view-shifts', 'manage-shifts', 'view-own-shifts', 'view-shift-swaps', 'request-shift-swap', 'manage-shift-swaps'],
  'Attendance': ['view-attendance', 'manage-attendance', 'manage-overtime', 'check-in-out'],
  'Leave': ['view-leave', 'manage-leave-types', 'manage-leave-applications', 'approve-leave'],
  'Payroll': ['view-payroll', 'process-payroll'],
  'Loans': ['view-loans', 'manage-loans', 'apply-loan'],
  'Statutory': ['view-statutory', 'manage-statutory'],
  'Performance': ['view-performance', 'manage-performance', 'view-own-performance', 'manage-own-performance', 'request-feedback'],
  'Training': ['view-training', 'manage-training', 'view-own-training', 'enroll-training'],
  'Helpdesk': ['view-tickets', 'manage-tickets'],
  'Announcements': ['view-announcements', 'manage-announcements'],
  'Assets': ['view-assets', 'manage-assets'],
  'Documents': ['view-documents', 'manage-documents'],
  'Notifications': ['view-notifications'],
  'Reports': ['view-reports'],
  'Settings': ['view-settings', 'manage-settings'],
  'Audit': ['view-audit', 'manage-audit'],
  'Users': ['view-users', 'manage-users'],
  'Profile': ['view-own-profile', 'update-own-profile'],
} as const;
