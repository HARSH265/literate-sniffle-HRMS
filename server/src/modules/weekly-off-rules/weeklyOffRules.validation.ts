import { z } from 'zod';

export const createWeeklyOffRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['all', 'worker', 'office-staff']).optional(),
  offDays: z.array(z.number()).min(1, 'At least one off day required'),
  isActive: z.boolean().optional(),
});

export const updateWeeklyOffRuleSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['all', 'worker', 'office-staff']).optional(),
  offDays: z.array(z.number()).optional(),
  isActive: z.boolean().optional(),
});