import { describe, it, expect } from 'vitest';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
} from '../employees.validation.js';

const validObjectId = '507f1f77bcf86cd799439011';

describe('employees validation schemas', () => {
  describe('createEmployeeSchema', () => {
    const validPayload = {
      fullName: 'John Doe',
      fatherName: 'Jane Doe',
      category: 'worker' as const,
      employmentType: 'permanent' as const,
      department: validObjectId,
      designation: validObjectId,
      shift: validObjectId,
      joiningDate: '2025-01-15',
      salaryType: 'monthly' as const,
      baseSalary: 25000,
      contactNumber: '9876543210',
    };

    it('accepts valid payload', () => {
      const result = createEmployeeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects missing fullName', () => {
      const { fullName, ...rest } = validPayload;
      const result = createEmployeeSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects short fullName', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, fullName: 'A' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, category: 'manager' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid employmentType', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, employmentType: 'intern' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid department ObjectId', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, department: 'not-an-id' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid salaryType', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, salaryType: 'hourly' });
      expect(result.success).toBe(false);
    });

    it('rejects negative baseSalary', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, baseSalary: -100 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid contact number format', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, contactNumber: '123' });
      expect(result.success).toBe(false);
    });

    it('accepts optional employeeCode', () => {
      const result = createEmployeeSchema.safeParse({ ...validPayload, employeeCode: 'EMP001' });
      expect(result.success).toBe(true);
    });

    it('accepts bank details', () => {
      const result = createEmployeeSchema.safeParse({
        ...validPayload,
        bankDetails: {
          bankName: 'SBI',
          accountNumber: '123456789012345',
          ifscCode: 'SBIN0123456',
          accountType: 'savings',
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid IFSC code', () => {
      const result = createEmployeeSchema.safeParse({
        ...validPayload,
        bankDetails: {
          ifscCode: 'INVALID',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateEmployeeSchema', () => {
    it('accepts partial update', () => {
      const result = updateEmployeeSchema.safeParse({ fullName: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = updateEmployeeSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects invalid status value', () => {
      const result = updateEmployeeSchema.safeParse({ status: 'fired' });
      expect(result.success).toBe(false);
    });

    it('accepts valid status values', () => {
      for (const status of ['active', 'inactive', 'terminated']) {
        const result = updateEmployeeSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid ObjectId for department', () => {
      const result = updateEmployeeSchema.safeParse({ department: 'bad-id' });
      expect(result.success).toBe(false);
    });
  });

  describe('listEmployeesSchema', () => {
    it('uses defaults for empty input', () => {
      const result = listEmployeesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sort).toBe('createdAt');
        expect(result.data.order).toBe('desc');
      }
    });

    it('accepts with all filters', () => {
      const result = listEmployeesSchema.safeParse({
        page: 2,
        limit: 25,
        search: 'john',
        status: 'active',
        category: 'worker',
        department: validObjectId,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid page number', () => {
      const result = listEmployeesSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects limit over 100', () => {
      const result = listEmployeesSchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });
  });
});
