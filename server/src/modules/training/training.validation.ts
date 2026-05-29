import { z } from 'zod';

export const createProgramSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional().default(''),
  category: z.string().min(1),
  mode: z.string().min(1),
  duration: z.object({
    value: z.number().min(1),
    unit: z.enum(['hours', 'days', 'weeks']),
  }),
  maxParticipants: z.number().int().min(0).optional().default(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  trainer: z.string().optional().default(''),
  location: z.string().optional().default(''),
  cost: z.number().min(0).optional().default(0),
  certificationOffered: z.boolean().optional().default(false),
  certificationValidForDays: z.number().int().min(0).optional().default(0),
  prerequisites: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  materials: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional().default([]),
});

export const updateProgramSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  mode: z.string().optional(),
  duration: z.object({
    value: z.number().min(1),
    unit: z.enum(['hours', 'days', 'weeks']),
  }).optional(),
  maxParticipants: z.number().int().min(0).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  trainer: z.string().optional(),
  location: z.string().optional(),
  cost: z.number().min(0).optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']).optional(),
  certificationOffered: z.boolean().optional(),
  certificationValidForDays: z.number().int().min(0).optional(),
  prerequisites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  materials: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
});

export const batchEnrollSchema = z.object({
  trainingId: z.string().min(1),
  employeeIds: z.array(z.string()).min(1, 'At least one employee required'),
});

export const completeEnrollmentSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().max(2000).optional(),
  rating: z.number().min(1).max(5).optional(),
  certificationNumber: z.string().optional(),
  certificationExpiry: z.string().datetime().optional(),
  certificateFile: z.object({
    url: z.string(),
    name: z.string(),
  }).optional(),
});

export const updateSkillSchema = z.object({
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  yearsOfExperience: z.number().min(0).optional(),
  lastUsedAt: z.string().datetime().optional(),
  certified: z.boolean().optional(),
  certificationExpiry: z.string().datetime().optional(),
  source: z.enum(['self-reported', 'manager-assigned', 'training-completed']).optional(),
});

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1),
  description: z.string().optional().default(''),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type BatchEnrollInput = z.infer<typeof batchEnrollSchema>;
export type CompleteEnrollmentInput = z.infer<typeof completeEnrollmentSchema>;
