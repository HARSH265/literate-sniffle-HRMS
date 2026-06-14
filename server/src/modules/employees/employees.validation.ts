import { z } from 'zod';
import mongoose from 'mongoose';

const bankDetailsSchema = z.object({
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().regex(/^[0-9]{9,18}$/, 'Account number must be 9-18 digits').optional(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format').optional(),
  accountHolderName: z.string().max(100).optional(),
  accountType: z.enum(['savings', 'current']).optional(),
}).optional();

const contactNumberSchema = z.string().regex(/^[6-9][0-9]{9}$/, 'Invalid Indian mobile number').optional();

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(20).optional(),
  fullName: z.string().min(2).max(100),
  fatherName: z.string().min(2).max(100),
  dateOfBirth: z.string().or(z.date()).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().max(10).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  emergencyContact: z.string().regex(/^[6-9][0-9]{9}$/, 'Invalid Indian mobile number').optional().or(z.literal('')),
  permanentAddress: z.string().max(500).optional(),
  category: z.enum(['worker', 'office-staff']),
  employmentType: z.enum(['permanent', 'contract', 'temporary', 'trainee']),
  department: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid department ID' }),
  designation: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid designation ID' }),
  shift: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid shift ID' }),
  reportingTo: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid employee ID' }).optional().or(z.literal('')),
  joiningDate: z.string().or(z.date()),
  salaryType: z.enum(['monthly', 'daily']),
  baseSalary: z.number().min(0),
  dailyWage: z.number().min(0).optional(),
  overtimeEligible: z.boolean().optional(),
  contactNumber: contactNumberSchema,
  address: z.string().max(500).optional(),
  bankDetails: bankDetailsSchema,
  photo: z.string().optional(),
  pfUAN: z.string().max(50).optional(),
  esiNumber: z.string().max(50).optional(),
  pfJoiningDate: z.string().or(z.date()).optional(),
  pfExempted: z.boolean().optional(),
  esiExempted: z.boolean().optional(),
  ptExempted: z.boolean().optional(),
  ptState: z.string().max(100).optional(),
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  fatherName: z.string().min(2).max(100).optional(),
  dateOfBirth: z.string().or(z.date()).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().max(10).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  emergencyContact: z.string().regex(/^[6-9][0-9]{9}$/, 'Invalid Indian mobile number').optional().or(z.literal('')),
  permanentAddress: z.string().max(500).optional(),
  category: z.enum(['worker', 'office-staff']).optional(),
  employmentType: z.enum(['permanent', 'contract', 'temporary', 'trainee']).optional(),
  department: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid department ID' }).optional(),
  designation: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid designation ID' }).optional(),
  shift: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid shift ID' }).optional(),
  reportingTo: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid employee ID' }).optional().or(z.literal('')),
  joiningDate: z.string().or(z.date()).optional(),
  salaryType: z.enum(['monthly', 'daily']).optional(),
  baseSalary: z.number().min(0).optional(),
  dailyWage: z.number().min(0).optional(),
  overtimeEligible: z.boolean().optional(),
  contactNumber: contactNumberSchema,
  address: z.string().max(500).optional(),
  bankDetails: bankDetailsSchema,
  photo: z.string().optional(),
  pfUAN: z.string().max(50).optional(),
  esiNumber: z.string().max(50).optional(),
  pfJoiningDate: z.string().or(z.date()).optional(),
  pfExempted: z.boolean().optional(),
  esiExempted: z.boolean().optional(),
  ptExempted: z.boolean().optional(),
  ptState: z.string().max(100).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);

export const listEmployeesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['fullName', 'employeeCode', 'createdAt', 'status', 'category', 'department', 'designation']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated', 'archived']).optional(),
  category: z.enum(['worker', 'office-staff']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  shift: z.string().optional(),
}).default({});

export const bulkAssignShiftSchema = z.object({
  employeeIds: z.array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid employee ID' })).min(1, 'At least one employee is required').max(500, 'Cannot assign more than 500 employees at once'),
  shiftId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid shift ID' }),
});