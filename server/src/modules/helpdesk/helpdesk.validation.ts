import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(300),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['it', 'hr', 'facilities', 'payroll', 'other']).default('other'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  attachments: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
});

export const updateTicketSchema = z.object({
  subject: z.string().min(1).max(300).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['it', 'hr', 'facilities', 'payroll', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  assignedTo: z.string().optional(),
  attachments: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
});

export const addCommentSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  attachments: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
