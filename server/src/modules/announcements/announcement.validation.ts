import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  content: z.string().min(1, 'Content is required').max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  targetAudience: z.enum(['all', 'department', 'designation', 'specificEmployees']).default('all'),
  targetIds: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).max(5000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  targetAudience: z.enum(['all', 'department', 'designation', 'specificEmployees']).optional(),
  targetIds: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export const markAsReadSchema = z.object({
  announcementId: z.string().min(1),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
