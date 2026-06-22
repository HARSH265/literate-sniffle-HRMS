import { z } from 'zod';

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const roleParamSchema = z.object({
  role: z.enum(['super-admin', 'hr-admin', 'hr-staff', 'accounts', 'manager', 'worker']),
});
