import { describe, it, expect } from 'vitest';
import { complianceRunParamsSchema, auditLogQuerySchema } from '../compliance.validation.js';

describe('Compliance Validation', () => {
  describe('complianceRunParamsSchema', () => {
    it('accepts valid run ID', () => {
      const result = complianceRunParamsSchema.safeParse({ runId: '507f1f77bcf86cd799439011' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid run ID', () => {
      const result = complianceRunParamsSchema.safeParse({ runId: 'invalid-id' });
      expect(result.success).toBe(false);
    });

    it('rejects missing run ID', () => {
      const result = complianceRunParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('auditLogQuerySchema', () => {
    it('accepts valid query', () => {
      const result = auditLogQuerySchema.safeParse({
        module: 'payroll',
        action: 'create',
        page: 1,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty query', () => {
      const result = auditLogQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects limit > 200', () => {
      const result = auditLogQuerySchema.safeParse({ limit: 201 });
      expect(result.success).toBe(false);
    });

    it('coerces string numbers', () => {
      const result = auditLogQuerySchema.safeParse({ page: '2', limit: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it('rejects negative page', () => {
      const result = auditLogQuerySchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });
  });
});
