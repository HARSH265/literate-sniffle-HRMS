import { z } from 'zod';

const passwordComplexity = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&)');

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  // Password is optional — auto-generated if not provided
  password: passwordComplexity.optional(),
  role: z.enum(['super-admin', 'hr-admin', 'hr-staff', 'accounts', 'manager', 'api']),
  isActive: z.boolean().optional().default(true),
  // Optional: link to existing employee
  employeeId: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['super-admin', 'hr-admin', 'hr-staff', 'accounts', 'manager']).optional(),
  isActive: z.boolean().optional(),
});

export const generateCredentialsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['super-admin', 'hr-admin', 'hr-staff', 'accounts', 'manager', 'api']),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Email is required'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
