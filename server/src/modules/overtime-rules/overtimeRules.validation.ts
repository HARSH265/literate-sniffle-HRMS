import { z } from 'zod';

export const createOvertimeRuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  multiplier: z
    .number()
    .min(1, 'Multiplier must be at least 1')
    .max(3, 'Multiplier cannot exceed 3x'),
  maxHoursPerDay: z
    .number()
    .min(0)
    .max(12, 'Max hours per day cannot exceed 12'),
  maxHoursPerMonth: z
    .number()
    .min(0)
    .max(100, 'Max hours per month cannot exceed 100'),
  isActive: z.boolean().optional(),
});

export const updateOvertimeRuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  multiplier: z
    .number()
    .min(1, 'Multiplier must be at least 1')
    .max(3, 'Multiplier cannot exceed 3x')
    .optional(),
  maxHoursPerDay: z
    .number()
    .min(0)
    .max(12, 'Max hours per day cannot exceed 12')
    .optional(),
  maxHoursPerMonth: z
    .number()
    .min(0)
    .max(100, 'Max hours per month cannot exceed 100')
    .optional(),
  isActive: z.boolean().optional(),
});