import { z } from 'zod';
import { paginationSchema } from '../../core/validation/common.schemas.js';

export const auditListSchema = paginationSchema.extend({
  module: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditListQuery = z.infer<typeof auditListSchema>;