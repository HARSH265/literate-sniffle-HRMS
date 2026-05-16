import { z } from 'zod';

export const createOvertimeEntrySchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0, 'Hours must be positive'),
  overtimeRule: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateOvertimeEntrySchema = z.object({
  hours: z.number().min(0).optional(),
  overtimeRule: z.string().optional(),
  remarks: z.string().optional(),
});