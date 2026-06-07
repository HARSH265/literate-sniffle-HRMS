import { z } from 'zod';

export const generateChallanSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
});

export const generateReportSchema = z.object({
  reportType: z.enum(['pf-ecr', 'pf-form-5', 'pf-form-10', 'esi-return', 'pt-return', 'custom']),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
});

export const updateChallanSchema = z.object({
  status: z.enum(['pending', 'generated', 'paid', 'filed']).optional(),
  paymentDate: z.string().optional(),
  transactionRef: z.string().optional(),
  challanId: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateReportSchema = z.object({
  status: z.enum(['generated', 'downloaded', 'filed']).optional(),
  filedDate: z.string().optional(),
  acknowledgementNo: z.string().optional(),
});

export const calculateStatutorySchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  grossPay: z.number().min(0, 'Gross pay must be non-negative'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
});

export const monthParamSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
});
