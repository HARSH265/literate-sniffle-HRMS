import { z } from 'zod';
import mongoose from 'mongoose';

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
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountType: z.enum(['savings', 'current']).optional(),
  }).optional(),
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
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountType: z.enum(['savings', 'current']).optional(),
  }).optional(),
  photo: z.string().optional(),
});

export const listEmployeesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
}).default({});