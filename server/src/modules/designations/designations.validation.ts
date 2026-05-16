import { z } from 'zod';

export const createDesignationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(1, 'Department is required'),
});

export const updateDesignationSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;