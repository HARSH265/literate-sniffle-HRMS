import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createAttendanceEntrySchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
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

export const bulkAttendanceSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  entries: z
    .array(z.object({
      employee: z.string().min(1, 'Employee is required'),
      status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']),
      inTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
      outTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
      overtimeHours: z.number().min(0).max(24).optional(),
      remarks: z.string().max(500).optional(),
    }))
    .min(1, 'At least one entry required')
    .max(500, 'Cannot process more than 500 entries at once'),
});