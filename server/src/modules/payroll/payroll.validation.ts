import { z } from 'zod';

export const runPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const listRunsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'finalized']).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export const updatePayrollItemSchema = z.object({
  earnings: z.record(z.number().positive()).optional(),
  deductions: z.record(z.number().positive()).optional(),
  remarks: z.string().max(500).optional(),
});

export const batchUpdateItemsSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
    updates: updatePayrollItemSchema,
  })).min(1).max(100),
});

export const finalizeRunSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export const unfinalizeRunSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const payrollIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payroll ID'),
});
