import { describe, it, expect } from 'vitest';
import { createShiftSchema, updateShiftSchema } from '../shifts.validation.js';

describe('shifts validation schemas', () => {
  describe('createShiftSchema', () => {
    it('accepts valid day shift', () => {
      const result = createShiftSchema.safeParse({
        name: 'Morning', startTime: '06:00', endTime: '14:00',
        workingHours: 8, applicableTo: 'all',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid night shift', () => {
      const result = createShiftSchema.safeParse({
        name: 'Night', startTime: '22:00', endTime: '06:00',
        workingHours: 8, applicableTo: 'worker',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid start time format', () => {
      const result = createShiftSchema.safeParse({
        name: 'Test', startTime: '6:00', endTime: '14:00',
        workingHours: 8, applicableTo: 'all',
      });
      expect(result.success).toBe(false);
    });

    it('rejects endTime <= startTime (non-night)', () => {
      const result = createShiftSchema.safeParse({
        name: 'Test', startTime: '14:00', endTime: '14:00',
        workingHours: 8, applicableTo: 'all',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid applicableTo', () => {
      const result = createShiftSchema.safeParse({
        name: 'Test', startTime: '06:00', endTime: '14:00',
        workingHours: 8, applicableTo: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects workingHours > 24', () => {
      const result = createShiftSchema.safeParse({
        name: 'Test', startTime: '06:00', endTime: '14:00',
        workingHours: 25, applicableTo: 'all',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateShiftSchema', () => {
    it('accepts partial update', () => {
      const result = updateShiftSchema.safeParse({ name: 'Updated Shift' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid time format', () => {
      const result = updateShiftSchema.safeParse({ startTime: '9:00' });
      expect(result.success).toBe(false);
    });

    it('accepts empty object', () => {
      const result = updateShiftSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
