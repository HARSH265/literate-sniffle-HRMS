import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const moneySchema = z.coerce.number().finite().min(0);
const dayCountSchema = z.coerce.number().finite().min(0);

const lineItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['fixed', 'percentage']),
  value: moneySchema,
  calculatedValue: moneySchema,
});

export const runPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const listRunsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['draft', 'submitted', 'approved', 'finalized']).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export const updatePayrollItemSchema = z.object({
  basicEarnings: moneySchema.optional(),
  allowances: z.array(lineItemSchema).optional(),
  deductions: z.array(lineItemSchema).optional(),
  netPay: moneySchema.optional(),
  presentDays: dayCountSchema.optional(),
  absentDays: dayCountSchema.optional(),
  halfDays: dayCountSchema.optional(),
  paidLeaveDays: dayCountSchema.optional(),
  unpaidLeaveDays: dayCountSchema.optional(),
  overtimeHours: dayCountSchema.optional(),
  overtimeAmount: moneySchema.optional(),
  totalDeductions: moneySchema.optional(),
  remarks: z.string().max(500).optional(),
});

export const batchUpdateItemsSchema = z.object({
  items: z.array(z.object({
    itemId: objectIdSchema,
    data: updatePayrollItemSchema,
  })).min(1).max(100),
});

export const finalizeRunSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export const unfinalizeRunSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const payrollIdParamSchema = z.object({
  id: objectIdSchema,
});

export const payrollItemParamSchema = z.object({
  id: objectIdSchema,
  itemId: objectIdSchema,
});

export const payrollEmployeeParamSchema = z.object({
  employeeId: objectIdSchema,
});
