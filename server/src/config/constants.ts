import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  MONGODB_URI: process.env.MONGODB_URI || '',

  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN || '1',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  EMAIL_HOST: process.env.EMAIL_HOST || '',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
};

export const APP_NAME = 'HRMS';

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  HR_ADMIN: 'hr-admin',
  HR_STAFF: 'hr-staff',
  ACCOUNTS: 'accounts',
  MANAGER: 'manager',
} as const;

export const CATEGORIES = {
  WORKER: 'worker',
  OFFICE_STAFF: 'office-staff',
} as const;

export const EMPLOYMENT_TYPES = {
  PERMANENT: 'permanent',
  CONTRACT: 'contract',
  TEMPORARY: 'temporary',
  TRAINEE: 'trainee',
} as const;

export const SALARY_TYPES = {
  MONTHLY: 'monthly',
  DAILY: 'daily',
} as const;

export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half-day',
  LEAVE: 'leave',
  WEEKLY_OFF: 'weekly-off',
  HOLIDAY: 'holiday',
} as const;

export const PAYROLL_RUN_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  FINALIZED: 'finalized',
} as const;

export const ALLOWANCE_TYPES = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
} as const;

export const OT_BASES = {
  BASIC: 'basic',
  BASIC_PLUS_ALLOWANCES: 'basicPlusAllowances',
} as const;

export const LEAVE_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const ACCRUAL_METHODS = {
  YEARLY_LUMP: 'yearly-lump',
  MONTHLY_PRO_RATA: 'monthly-pro-rata',
  MANUAL: 'manual',
} as const;

export const DEDUCTION_METHODS = {
  NONE: 'none',
  BASIC_ONLY: 'basic-only',
  BASIC_PLUS_ALLOWANCES: 'basic-plus-allowances',
  GROSS: 'gross',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[keyof typeof EMPLOYMENT_TYPES];
export type SalaryType = (typeof SALARY_TYPES)[keyof typeof SALARY_TYPES];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[keyof typeof ATTENDANCE_STATUSES];
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[keyof typeof PAYROLL_RUN_STATUSES];
export type AllowanceType = (typeof ALLOWANCE_TYPES)[keyof typeof ALLOWANCE_TYPES];
export type OTBase = (typeof OT_BASES)[keyof typeof OT_BASES];