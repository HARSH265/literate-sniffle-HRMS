import { z } from 'zod';
import mongoose from 'mongoose';

export const mongoIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ID format' },
);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

export const statusSchema = z.object({
  status: z.string().optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, {
  message: 'Month must be in YYYY-MM format',
});

export const categorySchema = z.object({
  category: z.string().optional(),
});

export const departmentSchema = z.object({
  department: z.string().optional(),
});

export const mongoIdInParamsSchema = z.object({
  id: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: 'Invalid ID format' },
  ),
});

export const combinedListSchema = paginationSchema
  .merge(searchSchema)
  .merge(statusSchema)
  .merge(dateRangeSchema)
  .merge(categorySchema)
  .merge(departmentSchema)
  .default({});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type StatusInput = z.infer<typeof statusSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type CombinedListInput = z.infer<typeof combinedListSchema>;