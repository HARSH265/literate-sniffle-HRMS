import { z } from 'zod';

export const enrollSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
});

export const verifySchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  token: z.string().regex(/^\d{6}$/, 'Token must be a 6-digit code'),
});

export const disableSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
});
