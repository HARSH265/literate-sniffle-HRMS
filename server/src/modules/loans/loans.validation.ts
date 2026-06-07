import { z } from 'zod';

export const createLoanTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  description: z.string().optional(),
  maxAmount: z.number().positive('Max amount must be positive'),
  minAmount: z.number().min(0).default(0),
  interestRate: z.number().min(0).max(100, 'Interest rate must be 0-100'),
  maxTenure: z.number().int().min(1, 'Max tenure must be at least 1').max(120),
  minTenure: z.number().int().min(1).default(1),
  applicableTo: z.enum(['all', 'worker', 'office-staff']).default('all'),
  applicableEmploymentTypes: z.array(z.string()).default([]),
  maxActiveLoans: z.number().int().min(1).default(1),
  coolingOffPeriodDays: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateLoanTypeSchema = createLoanTypeSchema.partial();

export const applyLoanSchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  loanType: z.string().min(1, 'Loan type is required'),
  amount: z.number().positive('Amount must be positive'),
  tenure: z.number().int().min(1, 'Tenure must be at least 1 month'),
  purpose: z.string().optional(),
});

export const approveLoanSchema = z.object({
  approve: z.boolean(),
  remarks: z.string().optional(),
});

export const disburseLoanSchema = z.object({
  remarks: z.string().optional(),
});

export const loanIdParam = z.object({
  id: z.string().min(1, 'Loan ID is required'),
});

export const loanTypeIdParam = z.object({
  id: z.string().min(1, 'Loan type ID is required'),
});
