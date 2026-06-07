import { z } from 'zod';

export const updateProfileSchema = z.object({
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountType: z.enum(['savings', 'current']).optional(),
  }).optional(),
  emergencyContact: z.string().optional(),
});

export const createChangeRequestSchema = z.object({
  field: z.string().min(1, 'Field name is required'),
  newValue: z.any(),
  notes: z.string().max(500).optional(),
});

export const approveChangeRequestSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const rejectChangeRequestSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateChangeRequestInput = z.infer<typeof createChangeRequestSchema>;
export type ApproveChangeRequestInput = z.infer<typeof approveChangeRequestSchema>;
export type RejectChangeRequestInput = z.infer<typeof rejectChangeRequestSchema>;
