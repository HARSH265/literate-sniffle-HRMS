import { z } from 'zod';

export const createOvertimeRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  multiplier: z.number().min(1, 'Multiplier must be at least 1'),
  maxHoursPerDay: z.number().min(0),
  maxHoursPerMonth: z.number().min(0),
  isActive: z.boolean().optional(),
});

export const updateOvertimeRuleSchema = z.object({
  name: z.string().min(1).optional(),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  multiplier: z.number().min(1).optional(),
  maxHoursPerDay: z.number().min(0).optional(),
  maxHoursPerMonth: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});