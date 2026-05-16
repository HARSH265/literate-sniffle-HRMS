import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['national', 'state', 'company', 'festival']).optional(),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  year: z.number().optional(),
  isPaid: z.boolean().optional(),
});

export const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  type: z.enum(['national', 'state', 'company', 'festival']).optional(),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  year: z.number().optional(),
  isPaid: z.boolean().optional(),
});