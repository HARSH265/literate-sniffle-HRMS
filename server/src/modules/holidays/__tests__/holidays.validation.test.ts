import { describe, it, expect } from 'vitest';
import { createHolidaySchema, updateHolidaySchema } from '../holidays.validation.js';

describe('holidays validation schemas', () => {
  describe('createHolidaySchema', () => {
    it('accepts valid payload', () => {
      const result = createHolidaySchema.safeParse({ name: 'Republic Day', date: '2025-01-26' });
      expect(result.success).toBe(true);
    });

    it('accepts all optional fields', () => {
      const result = createHolidaySchema.safeParse({
        name: 'Diwali', date: '2025-10-20', type: 'festival',
        applicableTo: 'all', year: 2025, isPaid: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = createHolidaySchema.safeParse({ date: '2025-01-26' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = createHolidaySchema.safeParse({ name: 'Test', date: '01-26-2025' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid type', () => {
      const result = createHolidaySchema.safeParse({ name: 'Test', date: '2025-01-26', type: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid applicableTo', () => {
      const result = createHolidaySchema.safeParse({ name: 'Test', date: '2025-01-26', applicableTo: 'all' });
      expect(result.success).toBe(true);
    });
  });

  describe('updateHolidaySchema', () => {
    it('accepts partial update', () => {
      const result = updateHolidaySchema.safeParse({ name: 'Updated Holiday' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = updateHolidaySchema.safeParse({ date: '2025/01/26' });
      expect(result.success).toBe(false);
    });

    it('accepts empty object', () => {
      const result = updateHolidaySchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
