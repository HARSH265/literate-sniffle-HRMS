import { z } from 'zod';

export const complianceRunParamsSchema = z.object({
  runId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid run ID'),
});

export const auditLogQuerySchema = z.object({
  module: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
