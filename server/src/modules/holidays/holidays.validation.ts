import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['national', 'state', 'company', 'festival']).optional(),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  isPaid: z.boolean().optional(),
});

export const updateHolidaySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  type: z.enum(['national', 'state', 'company', 'festival']).optional(),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  isPaid: z.boolean().optional(),
});