import { z } from 'zod';

export const requestSwapSchema = z.object({
  targetEmployee: z.string().optional(),
  fromShift: z.string().min(1, 'From shift is required'),
  toShift: z.string().min(1, 'To shift is required'),
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  reason: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
  recurringUntil: z.string().optional(),
  swapType: z.enum(['one-time', 'recurring', 'preference']).default('one-time'),
});

export const updateSwapSchema = z.object({
  reason: z.string().max(500).optional(),
  toShift: z.string().optional(),
  toDate: z.string().optional(),
});

export const approveSwapSchema = z.object({
  rejectionReason: z.string().max(500).optional(),
});

export const setPreferenceSchema = z.object({
  preferredShift: z.string().min(1, 'Preferred shift is required'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(1),
  reason: z.string().max(500).optional(),
});

export type RequestSwapInput = z.infer<typeof requestSwapSchema>;
export type UpdateSwapInput = z.infer<typeof updateSwapSchema>;
export type SetPreferenceInput = z.infer<typeof setPreferenceSchema>;
