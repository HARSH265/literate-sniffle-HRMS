import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  employee: z.string().optional(),
  isCompanyDocument: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  expiryDate: z.string().datetime().optional(),
  accessRoles: z.array(z.string()).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  expiryDate: z.string().datetime().optional(),
  accessRoles: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
