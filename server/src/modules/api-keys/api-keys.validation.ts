import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  rateLimit: z.number().int().min(100).max(100000).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const listApiKeysSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const revokeApiKeySchema = z.object({
  id: z.string().min(1, 'API key ID is required'),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type ListApiKeysInput = z.infer<typeof listApiKeysSchema>;
export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;
