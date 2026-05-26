import { z } from 'zod';

export const registerKioskSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500).optional(),
});

export const kioskIdParamSchema = z.object({
  kioskId: z.string().min(1),
});

export const validateQRQuerySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
