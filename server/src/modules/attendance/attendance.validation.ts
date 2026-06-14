import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createAttendanceEntrySchema = z.object({
  employee: objectId,
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  shift: z.string().optional(),
  status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']),
  inTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
  outTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
  overtimeHours: z.number().min(0).max(24, 'Overtime cannot exceed 24 hours').optional(),
  remarks: z.string().max(500, 'Remarks must be at most 500 characters').optional(),
});

export const bulkUpdateAttendanceSchema = z.object({
  entries: z
    .array(z.object({
      id: objectId,
      status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']).optional(),
      inTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
      outTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
      remarks: z.string().max(500, 'Remarks must be at most 500 characters').optional(),
    }))
    .min(1, 'At least one entry required')
    .max(100, 'Cannot process more than 100 entries at once'),
});

export const updateAttendanceEntrySchema = z.object({
  employee: objectId.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  shift: objectId.optional(),
  status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']).optional(),
  inTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format').optional(),
  outTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format').optional(),
  overtimeHours: z.number().min(0).max(24).optional(),
  remarks: z.string().max(500, 'Remarks must be at most 500 characters').optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
});

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']).optional(),
  department: objectId.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const monthlyViewQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  department: objectId.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const adminCheckoutBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required for admin checkout').max(500),
});

export const bulkAttendanceSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  entries: z
    .array(z.object({
      employee: objectId,
      status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']),
      inTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
      outTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
      overtimeHours: z.number().min(0).max(24).optional(),
      remarks: z.string().max(500).optional(),
    }))
    .min(1, 'At least one entry required')
    .max(500, 'Cannot process more than 500 entries at once'),
});