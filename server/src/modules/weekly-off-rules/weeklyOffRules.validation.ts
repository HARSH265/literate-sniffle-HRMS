import { z } from 'zod';

export const createWeeklyOffRuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  category: z.enum(['all', 'worker', 'office-staff']).optional(),
  offDays: z
    .array(z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'))
    .min(1, 'At least one off day required')
    .max(7, 'Cannot have more than 7 off days'),
  isActive: z.boolean().optional(),
});

export const updateWeeklyOffRuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  category: z.enum(['all', 'worker', 'office-staff']).optional(),
  offDays: z
    .array(z.number().min(0).max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'))
    .min(1, 'At least one off day required')
    .max(7, 'Cannot have more than 7 off days')
    .optional(),
  isActive: z.boolean().optional(),
});