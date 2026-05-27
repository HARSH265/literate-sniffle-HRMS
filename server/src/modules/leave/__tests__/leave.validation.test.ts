import { describe, it, expect } from 'vitest';
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  createLeaveApplicationSchema,
  approveLeaveSchema,
  bulkAccrueSchema,
} from '../leave.validation.js';

describe('leave validation schemas', () => {
  describe('createLeaveTypeSchema', () => {
    const validPayload = {
      name: 'Annual Leave',
      code: 'AL',
      maxDaysPerApplication: 15,
      maxDaysPerYear: 30,
    };

    it('accepts valid payload', () => {
      const result = createLeaveTypeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('AL');
        expect(result.data.isPaid).toBe(true);
      }
    });

    it('rejects missing name', () => {
      const { name, ...rest } = validPayload;
      const result = createLeaveTypeSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects invalid hex color', () => {
      const result = createLeaveTypeSchema.safeParse({ ...validPayload, color: 'red' });
      expect(result.success).toBe(false);
    });

    it('accepts valid custom color', () => {
      const result = createLeaveTypeSchema.safeParse({ ...validPayload, color: '#ff0000' });
      expect(result.success).toBe(true);
    });

    it('rejects maxDaysPerYear > 365', () => {
      const result = createLeaveTypeSchema.safeParse({ ...validPayload, maxDaysPerYear: 500 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid deduction method', () => {
      const result = createLeaveTypeSchema.safeParse({ ...validPayload, deductionMethod: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('accepts all valid deduction methods', () => {
      for (const method of ['none', 'basic-only', 'basic-plus-allowances', 'gross']) {
        const result = createLeaveTypeSchema.safeParse({ ...validPayload, deductionMethod: method });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid accrual method', () => {
      const result = createLeaveTypeSchema.safeParse({ ...validPayload, accrualMethod: 'weekly' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid applicableToGender', () => {
      const result = createLeaveTypeSchema.safeParse({ ...validPayload, applicableToGender: 'other' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateLeaveTypeSchema', () => {
    it('accepts partial update', () => {
      const result = updateLeaveTypeSchema.safeParse({ name: 'Updated Leave' });
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = updateLeaveTypeSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createLeaveApplicationSchema', () => {
    const validPayload = {
      employee: '507f1f77bcf86cd799439011',
      leaveType: '507f1f77bcf86cd799439012',
      startDate: '2025-03-15',
      endDate: '2025-03-17',
      reason: 'Medical appointment',
    };

    it('accepts valid payload', () => {
      const result = createLeaveApplicationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects missing employee', () => {
      const { employee, ...rest } = validPayload;
      const result = createLeaveApplicationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = createLeaveApplicationSchema.safeParse({ ...validPayload, startDate: '15-03-2025' });
      expect(result.success).toBe(false);
    });

    it('rejects empty reason', () => {
      const result = createLeaveApplicationSchema.safeParse({ ...validPayload, reason: '' });
      expect(result.success).toBe(false);
    });

    it('rejects long reason', () => {
      const result = createLeaveApplicationSchema.safeParse({ ...validPayload, reason: 'x'.repeat(1001) });
      expect(result.success).toBe(false);
    });

    it('accepts optional documentUrl', () => {
      const result = createLeaveApplicationSchema.safeParse({ ...validPayload, documentUrl: 'https://example.com/doc.pdf' });
      expect(result.success).toBe(true);
    });
  });

  describe('approveLeaveSchema', () => {
    it('accepts valid approval', () => {
      const result = approveLeaveSchema.safeParse({
        applicationId: '507f1f77bcf86cd799439011',
        status: 'approved',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid rejection', () => {
      const result = approveLeaveSchema.safeParse({
        applicationId: '507f1f77bcf86cd799439011',
        status: 'rejected',
        remarks: 'Not enough balance',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = approveLeaveSchema.safeParse({
        applicationId: '507f1f77bcf86cd799439011',
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });

    it('rejects long remarks', () => {
      const result = approveLeaveSchema.safeParse({
        applicationId: '507f1f77bcf86cd799439011',
        status: 'rejected',
        remarks: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkAccrueSchema', () => {
    it('accepts valid payload', () => {
      const result = bulkAccrueSchema.safeParse({
        leaveTypeId: '507f1f77bcf86cd799439011',
        year: 2025,
      });
      expect(result.success).toBe(true);
    });

    it('accepts with employee filter', () => {
      const result = bulkAccrueSchema.safeParse({
        leaveTypeId: '507f1f77bcf86cd799439011',
        year: 2025,
        employeeIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects year < 2020', () => {
      const result = bulkAccrueSchema.safeParse({
        leaveTypeId: '507f1f77bcf86cd799439011',
        year: 2019,
      });
      expect(result.success).toBe(false);
    });

    it('rejects year > 2100', () => {
      const result = bulkAccrueSchema.safeParse({
        leaveTypeId: '507f1f77bcf86cd799439011',
        year: 2101,
      });
      expect(result.success).toBe(false);
    });
  });
});
