import { z } from 'zod';

export const checkInSchema = z.object({
  token: z.string().min(1, 'QR token is required'),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  deviceId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  gpsAccuracy: z.number().min(0).optional(),
  selfieUrl: z.string().optional(),
});

export const checkOutSchema = z.object({
  token: z.string().min(1, 'QR token is required'),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  deviceId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  gpsAccuracy: z.number().min(0).optional(),
});
