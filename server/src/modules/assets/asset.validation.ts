import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  brand: z.string().optional(),
  assetModel: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().min(0).optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  brand: z.string().optional(),
  assetModel: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().min(0).optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const allocateAssetSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  notes: z.string().optional(),
});

export const returnAssetSchema = z.object({
  condition: z.string().optional(),
  notes: z.string().optional(),
});

export const maintenanceAssetSchema = z.object({
  notes: z.string().optional(),
});

export const retireAssetSchema = z.object({
  notes: z.string().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
