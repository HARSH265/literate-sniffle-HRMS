import { z } from 'zod';
import mongoose from 'mongoose';

const componentSchema = z.object({
  component: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid component ID'),
  calcType: z.string().optional(),
  calcValue: z.number().min(0).optional(),
  monthlyAmount: z.number().min(0, 'Monthly amount must be non-negative'),
  isActive: z.boolean().optional(),
});

export const createSalaryStructureSchema = z.object({
  employee: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid employee ID'),
  effectiveFrom: z.string().or(z.date()),
  effectiveTo: z.string().or(z.date()).optional(),
  components: z.array(componentSchema).min(1, 'At least one component is required'),
  totalCtc: z.number().min(0).optional(),
  grossMonthly: z.number().min(0).optional(),
  totalMonthlyDeductions: z.number().min(0).optional(),
  netMonthly: z.number().min(0).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().or(z.date()).optional(),
});

export const updateSalaryStructureSchema = z.object({
  effectiveFrom: z.string().or(z.date()).optional(),
  effectiveTo: z.string().or(z.date()).optional(),
  components: z.array(componentSchema).min(1).optional(),
  totalCtc: z.number().min(0).optional(),
  grossMonthly: z.number().min(0).optional(),
  totalMonthlyDeductions: z.number().min(0).optional(),
  netMonthly: z.number().min(0).optional(),
  isCurrent: z.boolean().optional(),
});
