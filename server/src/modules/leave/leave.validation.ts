import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  code: z.string().min(1).max(20).trim().transform(v => v.toUpperCase()),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4f46e5'),
  isPaid: z.boolean().default(true),
  maxDaysPerApplication: z.number().int().min(1).max(365),
  maxDaysPerYear: z.number().int().min(0).max(365),
  carryForward: z.boolean().default(false),
  carryForwardLimit: z.number().int().min(0).default(0),
  encashable: z.boolean().default(false),
  encashmentRatePercent: z.number().min(0).max(100).default(100),
  requiresDocuments: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  approvalLevels: z.number().int().min(1).max(3).default(1),
  autoApproveThreshold: z.number().int().min(0).default(0),
  applicableToGender: z.enum(['all', 'male', 'female']).default('all'),
  applicableCategories: z.array(z.enum(['worker', 'office-staff'])).default(['worker', 'office-staff']),
  applicableEmploymentTypes: z.array(z.enum(['permanent', 'contract', 'temporary', 'trainee'])).default(['permanent', 'contract', 'temporary', 'trainee']),
  deductionMethod: z.enum(['none', 'basic-only', 'basic-plus-allowances', 'gross']).default('none'),
  accrualMethod: z.enum(['yearly-lump', 'monthly-pro-rata', 'manual']).default('yearly-lump'),
  proRataOnJoin: z.boolean().default(true),
  allowNegativeBalance: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const createLeaveApplicationSchema = z.object({
  employee: z.string().min(1),
  leaveType: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(1000).trim(),
  documentUrl: z.string().optional(),
});

export const approveLeaveSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(['approved', 'rejected']),
  remarks: z.string().max(500).optional(),
});

export const bulkAccrueSchema = z.object({
  leaveTypeId: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  employeeIds: z.array(z.string()).optional(),
});
