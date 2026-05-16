import { z } from 'zod';

export const createAttendanceEntrySchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  shift: z.string().optional(),
  status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']),
  inTime: z.string().optional(),
  outTime: z.string().optional(),
  overtimeHours: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  entries: z.array(z.object({
    employee: z.string(),
    status: z.enum(['present', 'absent', 'half-day', 'leave', 'weekly-off', 'holiday']),
    inTime: z.string().optional(),
    outTime: z.string().optional(),
    overtimeHours: z.number().min(0).optional(),
    remarks: z.string().optional(),
  })).min(1, 'At least one entry required'),
});