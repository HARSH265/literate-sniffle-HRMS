import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { createSalaryStructureSchema, updateSalaryStructureSchema } from '../salaryStructure.validation.js';

const validId = new mongoose.Types.ObjectId().toString();

describe('SalaryStructure Validation', () => {
  describe('createSalaryStructureSchema', () => {
    it('accepts valid data', () => {
      const result = createSalaryStructureSchema.safeParse({
        employee: validId,
        effectiveFrom: '2024-01-01',
        components: [{ component: validId, monthlyAmount: 30000 }],
        totalCtc: 360000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing employee', () => {
      const result = createSalaryStructureSchema.safeParse({
        effectiveFrom: '2024-01-01',
        components: [{ component: validId, monthlyAmount: 30000 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty components array', () => {
      const result = createSalaryStructureSchema.safeParse({
        employee: validId,
        effectiveFrom: '2024-01-01',
        components: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative monthlyAmount', () => {
      const result = createSalaryStructureSchema.safeParse({
        employee: validId,
        effectiveFrom: '2024-01-01',
        components: [{ component: validId, monthlyAmount: -1000 }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid employee ID', () => {
      const result = createSalaryStructureSchema.safeParse({
        employee: 'invalid-id',
        effectiveFrom: '2024-01-01',
        components: [{ component: validId, monthlyAmount: 30000 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSalaryStructureSchema', () => {
    it('accepts partial updates', () => {
      const result = updateSalaryStructureSchema.safeParse({ totalCtc: 400000 });
      expect(result.success).toBe(true);
    });

    it('accepts empty update', () => {
      const result = updateSalaryStructureSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts components update', () => {
      const result = updateSalaryStructureSchema.safeParse({
        components: [{ component: validId, monthlyAmount: 35000 }],
      });
      expect(result.success).toBe(true);
    });
  });
});
