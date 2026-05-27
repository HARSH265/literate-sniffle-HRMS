import { describe, it, expect } from 'vitest';
import { createDepartmentSchema, updateDepartmentSchema } from '../departments.validation.js';

describe('departments validation schemas', () => {
  describe('createDepartmentSchema', () => {
    it('accepts valid payload', () => {
      const result = createDepartmentSchema.safeParse({ name: 'Production', code: 'PROD', description: 'Manufacturing' });
      expect(result.success).toBe(true);
    });

    it('accepts payload without code and description', () => {
      const result = createDepartmentSchema.safeParse({ name: 'Production' });
      expect(result.success).toBe(true);
    });

    it('rejects too short name', () => {
      const result = createDepartmentSchema.safeParse({ name: 'A' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid code format', () => {
      const result = createDepartmentSchema.safeParse({ name: 'Production', code: 'prod-123' });
      expect(result.success).toBe(false);
    });

    it('accepts valid code format', () => {
      const result = createDepartmentSchema.safeParse({ name: 'Production', code: 'PROD_01' });
      expect(result.success).toBe(true);
    });

    it('rejects too long description', () => {
      const result = createDepartmentSchema.safeParse({ name: 'Test', description: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateDepartmentSchema', () => {
    it('accepts partial update', () => {
      const result = updateDepartmentSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('accepts isActive boolean', () => {
      const result = updateDepartmentSchema.safeParse({ isActive: false });
      expect(result.success).toBe(true);
    });

    it('rejects invalid code', () => {
      const result = updateDepartmentSchema.safeParse({ code: 'lower' });
      expect(result.success).toBe(false);
    });

    it('accepts empty object (no updates)', () => {
      const result = updateDepartmentSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
