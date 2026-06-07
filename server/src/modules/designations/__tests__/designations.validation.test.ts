import { describe, it, expect } from 'vitest';
import { createDesignationSchema, updateDesignationSchema } from '../designations.validation.js';

describe('designations validation schemas', () => {
  describe('createDesignationSchema', () => {
    it('accepts valid payload', () => {
      const result = createDesignationSchema.safeParse({ name: 'Supervisor', department: 'dept1' });
      expect(result.success).toBe(true);
    });

    it('rejects missing department', () => {
      const result = createDesignationSchema.safeParse({ name: 'Supervisor' });
      expect(result.success).toBe(false);
    });

    it('rejects too short name', () => {
      const result = createDesignationSchema.safeParse({ name: 'A', department: 'dept1' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateDesignationSchema', () => {
    it('accepts partial update', () => {
      const result = updateDesignationSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('accepts isActive', () => {
      const result = updateDesignationSchema.safeParse({ isActive: false });
      expect(result.success).toBe(true);
    });

    it('accepts empty object', () => {
      const result = updateDesignationSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects too short name', () => {
      const result = updateDesignationSchema.safeParse({ name: 'A' });
      expect(result.success).toBe(false);
    });
  });
});
