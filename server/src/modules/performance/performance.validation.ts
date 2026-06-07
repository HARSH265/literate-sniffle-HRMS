import { z } from 'zod';

export const createCycleSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  quarter: z.number().int().min(1).max(4),
  label: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  goalDeadline: z.string().datetime(),
  selfReviewDeadline: z.string().datetime(),
  managerReviewDeadline: z.string().datetime(),
  closureDate: z.string().datetime(),
  participants: z.array(z.string()).optional().default([]),
});

export const updateCycleSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  goalDeadline: z.string().datetime().optional(),
  selfReviewDeadline: z.string().datetime().optional(),
  managerReviewDeadline: z.string().datetime().optional(),
  closureDate: z.string().datetime().optional(),
  status: z.enum(['upcoming', 'active', 'closed']).optional(),
  participants: z.array(z.string()).optional(),
});

export const setGoalsSchema = z.object({
  goals: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional().default(''),
        weight: z.number().min(1).max(100),
        targetValue: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .min(1, 'At least one goal is required')
    .refine(
      (goals) => {
        const totalWeight = goals.reduce((sum, g) => sum + g.weight, 0);
        return totalWeight === 100;
      },
      { message: 'Total goal weight must equal 100' },
    ),
});

export const submitSelfReviewSchema = z.object({
  rating: z.number().min(1).max(10),
  overallComment: z.string().min(1).max(2000),
  strengths: z.string().max(2000).optional(),
  improvements: z.string().max(2000).optional(),
});

export const submitManagerReviewSchema = z.object({
  rating: z.number().min(1).max(10),
  overallComment: z.string().min(1).max(2000),
  strengths: z.string().max(2000).optional(),
  improvements: z.string().max(2000).optional(),
  reviewerNotes: z.string().max(2000).optional(),
});

export const submitFeedbackSchema = z.object({
  relationship: z.enum(['peer', 'subordinate', 'other']),
  rating: z.number().min(1).max(10),
  comments: z.string().min(1).max(2000),
});

export const appealReviewSchema = z.object({
  reason: z.string().min(1).max(2000),
});

export const resolveAppealSchema = z.object({
  resolution: z.string().min(1).max(2000),
  finalRating: z.number().min(1).max(10).optional(),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type SetGoalsInput = z.infer<typeof setGoalsSchema>;
export type SubmitSelfReviewInput = z.infer<typeof submitSelfReviewSchema>;
export type SubmitManagerReviewInput = z.infer<typeof submitManagerReviewSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type AppealReviewInput = z.infer<typeof appealReviewSchema>;
