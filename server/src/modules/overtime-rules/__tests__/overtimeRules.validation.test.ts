import { describe, it, expect } from 'vitest';
import { createOvertimeRuleSchema, updateOvertimeRuleSchema } from '../overtimeRules.validation.js';

describe('overtime rules validation schemas', () => {
  describe('createOvertimeRuleSchema', () => {
    it('accepts valid payload', () => {
      const result = createOvertimeRuleSchema.safeParse({
        name: 'Double Time', multiplier: 2, maxHoursPerDay: 4, maxHoursPerMonth: 60,
      });
      expect(result.success).toBe(true);
    });

    it('accepts with applicableTo and isActive', () => {
      const result = createOvertimeRuleSchema.safeParse({
        name: 'Triple Time', multiplier: 3, maxHoursPerDay: 4, maxHoursPerMonth: 50,
        applicableTo: 'worker', isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = createOvertimeRuleSchema.safeParse({ multiplier: 2, maxHoursPerDay: 4, maxHoursPerMonth: 60 });
      expect(result.success).toBe(false);
    });

    it('rejects multiplier < 1', () => {
      const result = createOvertimeRuleSchema.safeParse({ name: 'Test', multiplier: 0.5, maxHoursPerDay: 4, maxHoursPerMonth: 60 });
      expect(result.success).toBe(false);
    });

    it('rejects multiplier > 3', () => {
      const result = createOvertimeRuleSchema.safeParse({ name: 'Test', multiplier: 5, maxHoursPerDay: 4, maxHoursPerMonth: 60 });
      expect(result.success).toBe(false);
    });

    it('rejects maxHoursPerDay > 12', () => {
      const result = createOvertimeRuleSchema.safeParse({ name: 'Test', multiplier: 2, maxHoursPerDay: 15, maxHoursPerMonth: 60 });
      expect(result.success).toBe(false);
    });

    it('rejects maxHoursPerMonth > 100', () => {
      const result = createOvertimeRuleSchema.safeParse({ name: 'Test', multiplier: 2, maxHoursPerDay: 4, maxHoursPerMonth: 200 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateOvertimeRuleSchema', () => {
    it('accepts partial update', () => {
      const result = updateOvertimeRuleSchema.safeParse({ multiplier: 2.5 });
      expect(result.success).toBe(true);
    });

    it('rejects invalid multiplier', () => {
      const result = updateOvertimeRuleSchema.safeParse({ multiplier: 4 });
      expect(result.success).toBe(false);
    });

    it('accepts empty object', () => {
      const result = updateOvertimeRuleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
