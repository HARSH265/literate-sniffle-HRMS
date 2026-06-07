import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import CompanySettings from '../../../models/CompanySettings.model.js';
import PayrollRun from '../../../models/PayrollRun.model.js';
import PayrollItem from '../../../models/PayrollItem.model.js';
import Employee from '../../../models/Employee.model.js';
import User from '../../../models/User.model.js';
import { runComplianceCheck, getComplianceSummary } from '../compliance.service.js';

let userId: string;
let runId: string;
let employeeId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'Comp Admin',
    email: 'compadmin@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();

  await CompanySettings.deleteMany({});
  await CompanySettings.create({
    payrollConfig: { minimumWage: 10000 },
    statutoryConfig: {
      pfWageCeiling: 15000,
      esiThreshold: 21000,
      pfEmployeeRate: 12,
      pfEmployerRate: 12,
      esiEmployeeRate: 0.75,
      esiEmployerRate: 3.25,
    },
    ptSlabs: [{ state: 'Karnataka', slabs: [{ minSalary: 0, maxSalary: 15000, amount: 0 }, { minSalary: 15001, maxSalary: 20000, amount: 200 }] }],
  });

  const emp = await Employee.create({
    fullName: 'Compliance Test Emp',
    employeeCode: 'COMP001',
    fatherName: 'Father',
    category: 'worker',
    employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(),
    joiningDate: new Date('2020-01-01'),
    salaryType: 'monthly',
    baseSalary: 20000,
    status: 'active',
    ptState: 'Karnataka',
    bankDetails: { bankName: 'SBI', accountNumber: '1234567890', ifscCode: 'SBIN0001234' },
  });
  employeeId = emp._id.toString();
});

beforeEach(async () => {
  await PayrollRun.deleteMany({});
  await PayrollItem.deleteMany({});
});

describe('Compliance Service', () => {
  describe('runComplianceCheck', () => {
    it('throws for non-existent run', async () => {
      await expect(
        runComplianceCheck(new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow('not found');
    });

    it('returns a compliance report for a valid run', async () => {
      const run = await PayrollRun.create({
        month: '2024-01',
        status: 'finalized',
        totalEmployees: 1,
        totalNetPay: 25000,
        totalGrossPay: 30000,
        totalDeductions: 5000,
        processedBy: userId,
      });
      runId = run._id.toString();

      await PayrollItem.create({
        payrollRun: run._id,
        employee: employeeId,
        month: '2024-01',
        totalDays: 31,
        presentDays: 26,
        absentDays: 0,
        halfDays: 0,
        paidLeaveDays: 5,
        unpaidLeaveDays: 0,
        weeklyOffs: 4,
        holidays: 1,
        effectiveWorkingDays: 26,
        overtimeHours: 0,
        overtimeAmount: 0,
        basicEarnings: 20000,
        allowances: [],
        grossEarnings: 20000,
        deductions: [{ name: 'PF', type: 'fixed', value: 2400, calculatedValue: 2400 }],
        totalDeductions: 2400,
        netPay: 17600,
        employerContributions: [],
        loanEmiDeduction: 0,
        status: 'finalized',
        complianceFlags: [],
        componentWiseEarnings: [],
        componentWiseDeductions: [],
      });

      const report = await runComplianceCheck(runId);
      expect(report.runId).toBe(runId);
      expect(report.month).toBe('2024-01');
      expect(report.summary.totalChecks).toBeGreaterThan(0);
      expect(['pass', 'warning', 'fail']).toContain(report.overallStatus);
      expect(report.gapReport).toBeDefined();
      expect(report.integrityReport).toBeDefined();
    });
  });

  describe('getComplianceSummary', () => {
    it('returns summary of all runs', async () => {
      await PayrollRun.create({
        month: '2024-01',
        status: 'finalized',
        totalEmployees: 1,
        totalNetPay: 25000,
        totalGrossPay: 30000,
        totalDeductions: 5000,
        processedBy: userId,
        complianceStatus: 'pass',
      });

      const summary = await getComplianceSummary();
      expect(summary.runsCompliance.length).toBe(1);
      expect(summary.summary.totalRuns).toBe(1);
      expect(summary.summary.passed).toBe(1);
    });

    it('filters by runId', async () => {
      const run = await PayrollRun.create({
        month: '2024-01',
        status: 'finalized',
        totalEmployees: 1,
        totalNetPay: 25000,
        totalGrossPay: 30000,
        totalDeductions: 5000,
        processedBy: userId,
        complianceStatus: 'warning',
      });

      const summary = await getComplianceSummary(run._id.toString());
      expect(summary.runsCompliance.length).toBe(1);
      expect(summary.summary.warnings).toBe(1);
    });
  });
});
