import { describe, it, expect } from 'vitest';
import {
  runPayrollSchema,
  listRunsSchema,
  updatePayrollItemSchema,
  batchUpdateItemsSchema,
  finalizeRunSchema,
  unfinalizeRunSchema,
  payrollIdParamSchema,
} from '../payroll.validation.js';

describe('payroll validation schemas', () => {
  describe('runPayrollSchema', () => {
    it('accepts valid month and year', () => {
      const result = runPayrollSchema.safeParse({ month: 3, year: 2025 });
      expect(result.success).toBe(true);
    });

    it('rejects invalid month', () => {
      const result = runPayrollSchema.safeParse({ month: 13, year: 2025 });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer month', () => {
      const result = runPayrollSchema.safeParse({ month: 3.5, year: 2025 });
      expect(result.success).toBe(false);
    });
  });

  describe('listRunsSchema', () => {
    it('uses defaults for empty input', () => {
      const result = listRunsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('accepts valid status filter', () => {
      const result = listRunsSchema.safeParse({ status: 'draft' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = listRunsSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('updatePayrollItemSchema', () => {
    it('accepts partial update', () => {
      const result = updatePayrollItemSchema.safeParse({ netPay: 30000 });
      expect(result.success).toBe(true);
    });

    it('accepts basic earnings update', () => {
      const result = updatePayrollItemSchema.safeParse({
        basicEarnings: 50000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative money values', () => {
      const result = updatePayrollItemSchema.safeParse({
        basicEarnings: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('batchUpdateItemsSchema', () => {
    it('accepts valid batch', () => {
      const result = batchUpdateItemsSchema.safeParse({
        items: [
          { itemId: '507f1f77bcf86cd799439011', data: { netPay: 30000 } },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty items array', () => {
      const result = batchUpdateItemsSchema.safeParse({ items: [] });
      expect(result.success).toBe(false);
    });

    it('rejects invalid ObjectId', () => {
      const result = batchUpdateItemsSchema.safeParse({
        items: [{ itemId: 'not-an-objectid', data: {} }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('finalizeRunSchema', () => {
    it('accepts without remarks', () => {
      const result = finalizeRunSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts with remarks', () => {
      const result = finalizeRunSchema.safeParse({ remarks: 'All good' });
      expect(result.success).toBe(true);
    });
  });

  describe('unfinalizeRunSchema', () => {
    it('requires reason', () => {
      const result = unfinalizeRunSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid reason', () => {
      const result = unfinalizeRunSchema.safeParse({ reason: 'Need corrections' });
      expect(result.success).toBe(true);
    });
  });

  describe('payrollIdParamSchema', () => {
    it('accepts valid ObjectId', () => {
      const result = payrollIdParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid id format', () => {
      const result = payrollIdParamSchema.safeParse({ id: '123' });
      expect(result.success).toBe(false);
    });
  });
});
