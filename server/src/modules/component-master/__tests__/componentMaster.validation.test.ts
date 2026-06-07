import { describe, it, expect } from 'vitest';
import { createComponentMasterSchema, updateComponentMasterSchema } from '../componentMaster.validation.js';

describe('ComponentMaster Validation', () => {
  describe('createComponentMasterSchema', () => {
    it('accepts valid data', () => {
      const result = createComponentMasterSchema.safeParse({
        code: 'HRA',
        name: 'House Rent Allowance',
        type: 'earning',
        calcType: 'percentage-of-basic',
        calcValue: 40,
        effectiveFrom: '2024-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing code', () => {
      const result = createComponentMasterSchema.safeParse({
        name: 'HRA',
        type: 'earning',
        calcType: 'fixed',
        calcValue: 1000,
        effectiveFrom: '2024-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid type', () => {
      const result = createComponentMasterSchema.safeParse({
        code: 'HRA',
        name: 'HRA',
        type: 'invalid',
        calcType: 'fixed',
        calcValue: 1000,
        effectiveFrom: '2024-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid calcType', () => {
      const result = createComponentMasterSchema.safeParse({
        code: 'HRA',
        name: 'HRA',
        type: 'earning',
        calcType: 'invalid',
        calcValue: 1000,
        effectiveFrom: '2024-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative calcValue', () => {
      const result = createComponentMasterSchema.safeParse({
        code: 'HRA',
        name: 'HRA',
        type: 'earning',
        calcType: 'fixed',
        calcValue: -100,
        effectiveFrom: '2024-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional fields', () => {
      const result = createComponentMasterSchema.safeParse({
        code: 'PF',
        name: 'Provident Fund',
        type: 'deduction',
        calcType: 'percentage-of-basic',
        calcValue: 12,
        effectiveFrom: '2024-01-01',
        subType: 'fixed',
        taxable: false,
        pfApplicable: false,
        sortOrder: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateComponentMasterSchema', () => {
    it('accepts partial updates', () => {
      const result = updateComponentMasterSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('accepts empty update', () => {
      const result = updateComponentMasterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects invalid type on update', () => {
      const result = updateComponentMasterSchema.safeParse({ type: 'bad' });
      expect(result.success).toBe(false);
    });
  });
});
