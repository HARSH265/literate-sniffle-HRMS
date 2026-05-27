import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import PayrollRun from '../../../models/PayrollRun.model.js';
import PayrollItem from '../../../models/PayrollItem.model.js';
import Employee from '../../../models/Employee.model.js';
import User from '../../../models/User.model.js';
import { PayrollService } from '../payroll.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let empId: string;
let payrollRunId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'Admin', email: 'payroll@test.com', password: 'TestPass1!', role: 'super-admin',
  });
  userId = user._id.toString();

  const emp = await Employee.create({
    employeeCode: 'EMP001', fullName: 'John Doe', fatherName: 'Jane Doe',
    category: 'worker', employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(), designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(), joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly', baseSalary: 25000,
  });
  empId = emp._id.toString();
});

beforeEach(async () => {
  await PayrollRun.deleteMany({});
  await PayrollItem.deleteMany({});

  const run = await PayrollRun.create({
    month: '2025-03', status: 'draft', totalEmployees: 5, totalNetPay: 250000,
    processedBy: userId,
  });
  payrollRunId = run._id.toString();

  await PayrollItem.create({
    payrollRun: run._id, employee: empId, month: '2025-03',
    status: 'draft',     totalDays: 31, presentDays: 22, absentDays: 2, halfDays: 0,
    weeklyOffs: 4, holidays: 1, effectiveWorkingDays: 22,
    basicEarnings: 25000, grossEarnings: 25000, totalDeductions: 2000, netPay: 23000,
  });
});

describe('PayrollService integration', () => {
  describe('listRuns', () => {
    it('returns paginated payroll runs', async () => {
      const result = await PayrollService.listRuns({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect((result.data[0] as any).month).toBe('2025-03');
    });
  });

  describe('getRunDetails', () => {
    it('returns run details with items', async () => {
      const result = await PayrollService.getRunDetails(payrollRunId) as any;
      expect(result.id).toBe(payrollRunId);
      expect(result.month).toBe('2025-03');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].netPay).toBe(23000);
    });

    it('throws on non-existent run', async () => {
      await expect(
        PayrollService.getRunDetails(new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow(AppError);
    });
  });

  describe('submitRun', () => {
    it('submits a draft run', async () => {
      const result = await PayrollService.submitRun(payrollRunId, userId) as any;
      expect(result.status).toBe('submitted');

      const run = await PayrollRun.findById(payrollRunId);
      expect(run!.status).toBe('submitted');
    });

    it('throws on non-draft run', async () => {
      await PayrollService.submitRun(payrollRunId, userId);
      await expect(PayrollService.submitRun(payrollRunId, userId)).rejects.toThrow(AppError);
    });
  });

  describe('approveRun', () => {
    it('approves a submitted run', async () => {
      await PayrollService.submitRun(payrollRunId, userId);
      const result = await PayrollService.approveRun(payrollRunId, userId) as any;
      expect(result.status).toBe('approved');
    });

    it('throws on draft run (not submitted)', async () => {
      await expect(PayrollService.approveRun(payrollRunId, userId)).rejects.toThrow(AppError);
    });
  });

  describe('rejectRun', () => {
    it('rejects a submitted run back to draft', async () => {
      await PayrollService.submitRun(payrollRunId, userId);
      const result = await PayrollService.rejectRun(payrollRunId, userId, 'Fix errors') as any;
      expect(result.status).toBe('draft');
    });
  });

  describe('deleteRun', () => {
    it('deletes a draft run and its items', async () => {
      await PayrollService.deleteRun(payrollRunId, userId);

      const run = await PayrollRun.findById(payrollRunId);
      expect(run).toBeNull();

      const items = await PayrollItem.find({ payrollRun: payrollRunId });
      expect(items).toHaveLength(0);
    });

    it('throws on finalized run', async () => {
      await PayrollService.finalizeRun(payrollRunId, userId);
      await expect(PayrollService.deleteRun(payrollRunId, userId)).rejects.toThrow(AppError);
    });
  });

  describe('finalizeRun', () => {
    it('finalizes a run', async () => {
      const result = await PayrollService.finalizeRun(payrollRunId, userId) as any;
      expect(result.status).toBe('finalized');
    });

    it('throws on already finalized', async () => {
      await PayrollService.finalizeRun(payrollRunId, userId);
      await expect(PayrollService.finalizeRun(payrollRunId, userId)).rejects.toThrow(AppError);
    });
  });

  describe('unfinalizeRun', () => {
    it('unfinalizes within the window', async () => {
      await PayrollService.finalizeRun(payrollRunId, userId);
      const result = await PayrollService.unfinalizeRun(payrollRunId, userId, 'Need changes') as any;
      expect(result.status).toBe('draft');
    });
  });

  describe('getByEmployee', () => {
    it('returns payroll items for an employee', async () => {
      const result = await PayrollService.getByEmployee(empId);
      expect(result).toHaveLength(1);
      expect((result[0] as any).netPay).toBe(23000);
    });

    it('returns empty array for employee with no records', async () => {
      const result = await PayrollService.getByEmployee(new mongoose.Types.ObjectId().toString());
      expect(result).toHaveLength(0);
    });
  });
});
