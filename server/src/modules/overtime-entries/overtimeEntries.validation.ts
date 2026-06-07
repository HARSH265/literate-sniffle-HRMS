import { z } from 'zod';

export const createOvertimeEntrySchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  hours: z.number()
    .min(0.5, 'Overtime hours must be at least 0.5 hours')
    .max(24, 'Overtime hours cannot exceed 24 hours per day'),
  overtimeRule: z.string().optional(),
  remarks: z.string().max(500, 'Remarks must be at most 500 characters').optional(),
});

export const updateOvertimeEntrySchema = z.object({
  hours: z.number()
    .min(0.5, 'Overtime hours must be at least 0.5 hours')
    .max(24, 'Overtime hours cannot exceed 24 hours per day')
    .optional(),
  overtimeRule: z.string().optional(),
  remarks: z.string().max(500, 'Remarks must be at most 500 characters').optional(),
});