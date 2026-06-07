import { z } from 'zod';
import mongoose from 'mongoose';

const templateComponentSchema = z.object({
  componentCode: z.string().min(1, 'Component code is required'),
  calcType: z.string().min(1, 'Calculation type is required'),
  calcValue: z.number().min(0),
  calcReferenceComponent: z.string().optional(),
  isMandatory: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createSalaryStructureTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  applicableTo: z.object({
    categories: z.array(z.string()).optional(),
    employmentTypes: z.array(z.string()).optional(),
    departments: z.array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid department ID')).optional(),
    locations: z.array(z.string()).optional(),
    grades: z.array(z.string()).optional(),
  }).optional(),
  components: z.array(templateComponentSchema).min(1, 'At least one component is required'),
  isActive: z.boolean().optional(),
});

export const updateSalaryStructureTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  applicableTo: z.object({
    categories: z.array(z.string()).optional(),
    employmentTypes: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    grades: z.array(z.string()).optional(),
  }).optional(),
  components: z.array(templateComponentSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});
