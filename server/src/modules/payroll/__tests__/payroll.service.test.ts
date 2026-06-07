import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import PayrollRun from '../../../models/PayrollRun.model.js';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calculateAllowances(baseEarnings: number, _employeeCategory: string, _employeeType: string, allowances: any[]): any[] {
  return allowances
    .filter((a) => a.isActive !== false)
    .map((a) => {
      let calculatedValue = 0;
      if (a.type === 'percentage') {
        calculatedValue = Math.round(baseEarnings * (a.value / 100));
      } else {
        calculatedValue = a.value;
      }
      return { name: a.name, type: a.type, value: a.value, calculatedValue };
    });
}

function calculateDeductions(baseEarnings: number, _grossEarnings: number, _employeeCategory: string, _employeeType: string, deductions: any[]): any[] {
  const skipped = new Set(['PF', 'ESI', 'PT', 'PROFESSIONAL TAX']);
  return deductions
    .filter((d) => d.isActive !== false && !skipped.has(d.name.toUpperCase()))
    .map((d) => {
      let calculatedValue = 0;
      const amount = baseEarnings;
      if (d.type === 'percentage') {
        calculatedValue = Math.round(amount * (d.value / 100));
      } else {
        calculatedValue = d.value;
      }
      return { name: d.name, type: d.type, value: d.value, calculatedValue };
    });
}

describe('PayrollService helpers', () => {
  describe('getDaysInMonth', () => {
    it('returns 31 for January', () => {
      expect(getDaysInMonth(2025, 1)).toBe(31);
    });

    it('returns 28 for February non-leap year', () => {
      expect(getDaysInMonth(2025, 2)).toBe(28);
    });

    it('returns 29 for February leap year', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });

    it('returns 30 for April', () => {
      expect(getDaysInMonth(2025, 4)).toBe(30);
    });
  });

  describe('calculateAllowances', () => {
    it('calculates fixed allowances', () => {
      const allowances = [
        { name: 'HRA', type: 'fixed', value: 10000, isActive: true },
      ];
      const result = calculateAllowances(50000, 'office-staff', 'permanent', allowances);
      expect(result).toHaveLength(1);
      expect(result[0].calculatedValue).toBe(10000);
    });

    it('calculates percentage allowances', () => {
      const allowances = [
        { name: 'DA', type: 'percentage', value: 10, isActive: true },
      ];
      const result = calculateAllowances(50000, 'office-staff', 'permanent', allowances);
      expect(result[0].calculatedValue).toBe(5000);
    });

    it('filters out inactive allowances', () => {
      const allowances = [
        { name: 'HRA', type: 'fixed', value: 10000, isActive: false },
        { name: 'DA', type: 'fixed', value: 5000, isActive: true },
      ];
      const result = calculateAllowances(50000, 'office-staff', 'permanent', allowances);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('DA');
    });
  });

  describe('calculateDeductions', () => {
    it('calculates fixed deductions', () => {
      const deductions = [
        { name: 'Health Insurance', type: 'fixed', value: 2000, isActive: true },
      ];
      const result = calculateDeductions(50000, 60000, 'office-staff', 'permanent', deductions);
      expect(result[0].calculatedValue).toBe(2000);
    });

    it('calculates percentage deductions', () => {
      const deductions = [
        { name: 'Professional Fee', type: 'percentage', value: 2, isActive: true },
      ];
      const result = calculateDeductions(50000, 60000, 'office-staff', 'permanent', deductions);
      expect(result[0].calculatedValue).toBe(1000);
    });

    it('skips PF, ESI, PT deductions (handled by statutory)', () => {
      const deductions = [
        { name: 'PF', type: 'percentage', value: 12, isActive: true },
        { name: 'ESI', type: 'percentage', value: 1.75, isActive: true },
        { name: 'PT', type: 'fixed', value: 200, isActive: true },
        { name: 'Professional Tax', type: 'fixed', value: 200, isActive: true },
        { name: 'Other Deduction', type: 'fixed', value: 500, isActive: true },
      ];
      const result = calculateDeductions(50000, 60000, 'office-staff', 'permanent', deductions);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Other Deduction');
    });
  });
});

describe('PayrollRun model', () => {
  it('creates and saves a payroll run', async () => {
    const run = await PayrollRun.create({
      month: '2025-03',
      status: 'draft',
      totalEmployees: 5,
      totalNetPay: 250000,
      processedBy: new mongoose.Types.ObjectId(),
    });

    expect(run).toBeDefined();
    expect(run.month).toBe('2025-03');
    expect(run.status).toBe('draft');
    expect(run.totalEmployees).toBe(5);

    const found = await PayrollRun.findById(run._id).lean();
    expect(found).toBeDefined();
    expect(found!.month).toBe('2025-03');
  });
});
