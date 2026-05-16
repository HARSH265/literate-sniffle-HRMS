import { z } from 'zod';

export const createShiftSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  workingHours: z.number().min(1).max(24),
  applicableTo: z.enum(['all', 'worker', 'office-staff']),
});

export const updateShiftSchema = z.object({
  name: z.string().min(2).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  workingHours: z.number().min(1).max(24).optional(),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;