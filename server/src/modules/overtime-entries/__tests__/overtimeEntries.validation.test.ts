import { describe, it, expect } from 'vitest';
import { createOvertimeEntrySchema, updateOvertimeEntrySchema } from '../overtimeEntries.validation.js';

describe('overtime entries validation schemas', () => {
  describe('createOvertimeEntrySchema', () => {
    it('accepts valid payload', () => {
      const result = createOvertimeEntrySchema.safeParse({ employee: 'emp1', date: '2025-03-15', hours: 2 });
      expect(result.success).toBe(true);
    });

    it('accepts with overtime rule', () => {
      const result = createOvertimeEntrySchema.safeParse({ employee: 'emp1', date: '2025-03-15', hours: 2, overtimeRule: 'rule1', remarks: 'Weekend work' });
      expect(result.success).toBe(true);
    });

    it('rejects hours < 0.5', () => {
      const result = createOvertimeEntrySchema.safeParse({ employee: 'emp1', date: '2025-03-15', hours: 0.1 });
      expect(result.success).toBe(false);
    });

    it('rejects hours > 24', () => {
      const result = createOvertimeEntrySchema.safeParse({ employee: 'emp1', date: '2025-03-15', hours: 25 });
      expect(result.success).toBe(false);
    });

    it('rejects missing employee', () => {
      const result = createOvertimeEntrySchema.safeParse({ date: '2025-03-15', hours: 2 });
      expect(result.success).toBe(false);
    });

    it('rejects too long remarks', () => {
      const result = createOvertimeEntrySchema.safeParse({ employee: 'emp1', date: '2025-03-15', hours: 2, remarks: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateOvertimeEntrySchema', () => {
    it('accepts hours update', () => {
      const result = updateOvertimeEntrySchema.safeParse({ hours: 3 });
      expect(result.success).toBe(true);
    });

    it('rejects hours < 0.5', () => {
      const result = updateOvertimeEntrySchema.safeParse({ hours: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects too long remarks', () => {
      const result = updateOvertimeEntrySchema.safeParse({ remarks: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('accepts empty object', () => {
      const result = updateOvertimeEntrySchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
