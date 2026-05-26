import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  type: z.string().optional(),
  read: z.coerce.boolean().optional(),
});

export const markAsReadSchema = z.object({
  notificationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID'),
});

export const markAllAsReadSchema = z.object({}).optional();
