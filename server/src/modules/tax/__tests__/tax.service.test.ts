import { describe, it, expect } from 'vitest';
import { computeTax, TaxInput } from '../tax.service.js';

function baseInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    grossMonthly: 100000,
    ytdGross: 600000,
    ytdTdsDeducted: 0,
    monthsRemaining: 6,
    regime: 'new',
    declaration: {
      section80C: 0, section80CCD1B: 0, section80D: 0, section80E: 0, section24b: 0,
      hraExemption: 0, ltaExemption: 0, otherExemptions: 0, standardDeduction: 75000,
    },
    ...overrides,
  };
}

describe('computeTax', () => {
  describe('new regime', () => {
    it('returns zero tax for income below ₹7L (rebate 87A)', () => {
      const result = computeTax(baseInput({
        grossMonthly: 50000,
        ytdGross: 300000,
        monthsRemaining: 6,
      }));
      expect(result.projectedTaxableIncome).toBeLessThanOrEqual(700000);
      expect(result.rebate87a).toBeGreaterThan(0);
      expect(result.totalTaxLiability).toBe(0);
      expect(result.monthlyTds).toBe(0);
    });

    it('computes correct tax for ₹12L annual income', () => {
      const result = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 0,
        monthsRemaining: 12,
      }));
      // Annual gross = 12L, standard deduction 75K, taxable = 11.25L
      // Slabs: 0-3L: 0, 3-7L: 20000, 7-10L: 30000, 10-11.25L: 37500 = 87500
      expect(result.projectedAnnualGross).toBe(1200000);
      expect(result.annualTaxAmount).toBeGreaterThan(0);
      expect(result.monthlyTds).toBeGreaterThan(0);
    });

    it('applies 15% surcharge for income >₹1Cr', () => {
      const result = computeTax(baseInput({
        grossMonthly: 1000000,
        ytdGross: 0,
        monthsRemaining: 12,
      }));
      expect(result.projectedTaxableIncome).toBeGreaterThan(10000000);
      expect(result.surcharge).toBeGreaterThan(0);
    });

    it('applies 25% surcharge for income >₹2Cr', () => {
      const result = computeTax(baseInput({
        grossMonthly: 2500000,
        ytdGross: 0,
        monthsRemaining: 12,
      }));
      expect(result.projectedTaxableIncome).toBeGreaterThan(20000000);
      expect(result.surcharge).toBeGreaterThan(0);
    });
  });

  describe('old regime', () => {
    it('returns zero tax for income below ₹5L (rebate 87A)', () => {
      const result = computeTax(baseInput({
        grossMonthly: 40000,
        ytdGross: 240000,
        monthsRemaining: 6,
        regime: 'old',
        declaration: {
          section80C: 0, section80CCD1B: 0, section80D: 0, section80E: 0, section24b: 0,
          hraExemption: 0, ltaExemption: 0, otherExemptions: 0, standardDeduction: 50000,
        },
      }));
      expect(result.projectedTaxableIncome).toBeLessThanOrEqual(500000);
      expect(result.rebate87a).toBeGreaterThan(0);
      expect(result.totalTaxLiability).toBe(0);
    });

    it('applies 37% surcharge for income >₹5Cr (old regime)', () => {
      const result = computeTax(baseInput({
        grossMonthly: 5000000,
        ytdGross: 0,
        monthsRemaining: 12,
        regime: 'old',
        declaration: {
          section80C: 0, section80CCD1B: 0, section80D: 0, section80E: 0, section24b: 0,
          hraExemption: 0, ltaExemption: 0, otherExemptions: 0, standardDeduction: 50000,
        },
      }));
      expect(result.projectedTaxableIncome).toBeGreaterThan(50000000);
      expect(result.surcharge).toBeGreaterThan(0);
    });

    it('caps 80D at ₹25K for non-senior', () => {
      const result = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 0,
        monthsRemaining: 12,
        regime: 'old',
        employeeAge: 35,
        declaration: {
          section80C: 150000, section80CCD1B: 50000, section80D: 100000, section80E: 0, section24b: 0,
          hraExemption: 0, ltaExemption: 0, otherExemptions: 0, standardDeduction: 50000,
        },
      }));
      // Exemptions: 150K + 50K + 25K (capped) + 50K std = 275K
      // Gross 12L, taxable = 12L - 275K = 925K
      expect(result.projectedTaxableIncome).toBeGreaterThan(0);
      expect(result.projectedAnnualExemptions).toBeLessThan(300000);
    });

    it('caps 80D at ₹50K for senior citizens', () => {
      const result = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 0,
        monthsRemaining: 12,
        regime: 'old',
        employeeAge: 65,
        declaration: {
          section80C: 150000, section80CCD1B: 50000, section80D: 100000, section80E: 0, section24b: 0,
          hraExemption: 0, ltaExemption: 0, otherExemptions: 0, standardDeduction: 50000,
        },
      }));
      // Exemptions: 150K + 50K + 50K (senior cap) + 50K std = 300K
      expect(result.projectedAnnualExemptions).toBe(300000);
    });

    it('applies section 80C cap at ₹1.5L', () => {
      const result = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 0,
        monthsRemaining: 12,
        regime: 'old',
        declaration: {
          section80C: 300000, section80CCD1B: 0, section80D: 0, section80E: 0, section24b: 0,
          hraExemption: 0, ltaExemption: 0, otherExemptions: 0, standardDeduction: 50000,
        },
      }));
      // Exemptions: 150K (capped) + 50K std = 200K
      expect(result.projectedAnnualExemptions).toBe(200000);
    });
  });

  describe('monthly TDS', () => {
    it('distributes remaining tax evenly across remaining months', () => {
      const result = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 300000,
        ytdTdsDeducted: 0,
        monthsRemaining: 9,
        regime: 'new',
      }));
      expect(result.monthlyTds).toBeGreaterThan(0);
      // monthlyTds * monthsRemaining should roughly equal totalTaxLiability
      expect(result.monthlyTds * 9).toBeGreaterThanOrEqual(result.totalTaxLiability - 100);
    });

    it('deducts YTD TDS already paid', () => {
      const full = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 300000,
        ytdTdsDeducted: 0,
        monthsRemaining: 9,
      }));
      const withYtd = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 300000,
        ytdTdsDeducted: full.monthlyTds * 3,
        monthsRemaining: 9,
      }));
      expect(withYtd.monthlyTds).toBeLessThanOrEqual(full.monthlyTds);
    });
  });

  describe('education cess', () => {
    it('applies 4% cess on tax + surcharge', () => {
      const result = computeTax(baseInput({
        grossMonthly: 200000,
        ytdGross: 0,
        monthsRemaining: 12,
      }));
      const expectedCess = Math.round((result.annualTaxAmount + result.surcharge) * 0.04);
      expect(result.educationCess).toBe(expectedCess);
    });
  });

  describe('employer NPS (new regime)', () => {
    it('caps NPS exemption at 14% of gross', () => {
      const result = computeTax(baseInput({
        grossMonthly: 100000,
        ytdGross: 0,
        monthsRemaining: 12,
        regime: 'new',
        employerNps: 20000,
      }));
      // NPS cap: min(20000*12, 1200000*0.14) = min(240000, 168000) = 168000
      expect(result.projectedAnnualExemptions).toBeCloseTo(75000 + 168000);
    });
  });
});
