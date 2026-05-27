import { describe, it, expect } from 'vitest';
import {
  createLoanTypeSchema, updateLoanTypeSchema, applyLoanSchema,
  approveLoanSchema, disburseLoanSchema, loanIdParam, loanTypeIdParam,
} from '../loans.validation.js';

describe('loans validation schemas', () => {
  describe('createLoanTypeSchema', () => {
    const valid = {
      name: 'Home Loan', code: 'HL', maxAmount: 500000,
      minAmount: 1000, interestRate: 8.5, maxTenure: 60,
    };

    it('accepts valid payload', () => {
      const result = createLoanTypeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const { name, ...rest } = valid;
      const result = createLoanTypeSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects negative maxAmount', () => {
      const result = createLoanTypeSchema.safeParse({ ...valid, maxAmount: -100 });
      expect(result.success).toBe(false);
    });

    it('rejects interestRate > 100', () => {
      const result = createLoanTypeSchema.safeParse({ ...valid, interestRate: 150 });
      expect(result.success).toBe(false);
    });

    it('rejects maxTenure > 120', () => {
      const result = createLoanTypeSchema.safeParse({ ...valid, maxTenure: 200 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateLoanTypeSchema', () => {
    it('accepts partial update', () => {
      const result = updateLoanTypeSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid interestRate', () => {
      const result = updateLoanTypeSchema.safeParse({ interestRate: 150 });
      expect(result.success).toBe(false);
    });

    it('accepts empty object', () => {
      const result = updateLoanTypeSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('applyLoanSchema', () => {
    it('accepts valid payload', () => {
      const result = applyLoanSchema.safeParse({ employee: 'emp1', loanType: 'lt1', amount: 50000, tenure: 12 });
      expect(result.success).toBe(true);
    });

    it('accepts with purpose', () => {
      const result = applyLoanSchema.safeParse({ employee: 'emp1', loanType: 'lt1', amount: 50000, tenure: 12, purpose: 'Emergency' });
      expect(result.success).toBe(true);
    });

    it('rejects missing employee', () => {
      const result = applyLoanSchema.safeParse({ loanType: 'lt1', amount: 50000, tenure: 12 });
      expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
      const result = applyLoanSchema.safeParse({ employee: 'emp1', loanType: 'lt1', amount: -100, tenure: 12 });
      expect(result.success).toBe(false);
    });

    it('rejects tenure < 1', () => {
      const result = applyLoanSchema.safeParse({ employee: 'emp1', loanType: 'lt1', amount: 50000, tenure: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe('approveLoanSchema', () => {
    it('accepts approve=true', () => {
      const result = approveLoanSchema.safeParse({ approve: true });
      expect(result.success).toBe(true);
    });

    it('accepts with remarks', () => {
      const result = approveLoanSchema.safeParse({ approve: false, remarks: 'Not eligible' });
      expect(result.success).toBe(true);
    });
  });

  describe('disburseLoanSchema', () => {
    it('accepts valid payload', () => {
      const result = disburseLoanSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts with remarks', () => {
      const result = disburseLoanSchema.safeParse({ remarks: 'Disbursed via bank' });
      expect(result.success).toBe(true);
    });
  });

  describe('loanIdParam', () => {
    it('rejects empty id', () => {
      const result = loanIdParam.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('loanTypeIdParam', () => {
    it('rejects empty id', () => {
      const result = loanTypeIdParam.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
  });
});
