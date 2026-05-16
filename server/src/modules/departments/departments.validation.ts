import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).toUpperCase().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;