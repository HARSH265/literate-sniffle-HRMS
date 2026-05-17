import { z } from 'zod';
import mongoose from 'mongoose';

const bankDetailsSchema = z.object({
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().regex(/^[0-9]{9,18}$/, 'Account number must be 9-18 digits').optional(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format').optional(),
  accountType: z.enum(['savings', 'current']).optional(),
}).optional();

const contactNumberSchema = z.string().regex(/^[6-9][0-9]{9}$/, 'Invalid Indian mobile number').optional();

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(20),
  fullName: z.string().min(2).max(100),
  fatherName: z.string().min(2).max(100),
  category: z.enum(['worker', 'office-staff']),
  employmentType: z.enum(['permanent', 'contract', 'temporary', 'trainee']),
  department: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid department ID' }),
  designation: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid designation ID' }),
  shift: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid shift ID' }),
  joiningDate: z.string().or(z.date()),
  salaryType: z.enum(['monthly', 'daily']),
  baseSalary: z.number().min(0),
  dailyWage: z.number().min(0).optional(),
  overtimeEligible: z.boolean().optional(),
  contactNumber: contactNumberSchema,
  address: z.string().optional(),
  bankDetails: bankDetailsSchema,
  photo: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  fatherName: z.string().min(2).max(100).optional(),
  category: z.enum(['worker', 'office-staff']).optional(),
  employmentType: z.enum(['permanent', 'contract', 'temporary', 'trainee']).optional(),
  department: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid department ID' }).optional(),
  designation: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid designation ID' }).optional(),
  shift: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid shift ID' }).optional(),
  joiningDate: z.string().or(z.date()).optional(),
  salaryType: z.enum(['monthly', 'daily']).optional(),
  baseSalary: z.number().min(0).optional(),
  dailyWage: z.number().min(0).optional(),
  overtimeEligible: z.boolean().optional(),
  contactNumber: contactNumberSchema,
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  bankDetails: bankDetailsSchema,
  photo: z.string().optional(),
});

export const listEmployeesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
}).default({});