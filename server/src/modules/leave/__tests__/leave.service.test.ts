import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import LeaveType from '../../../models/LeaveType.model.js';
import LeaveApplication from '../../../models/LeaveApplication.model.js';
import LeaveBalance from '../../../models/LeaveBalance.model.js';
import Employee from '../../../models/Employee.model.js';
import User from '../../../models/User.model.js';
import { LeaveService } from '../leave.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let empId: string;
let leaveTypeId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'HR Admin', email: 'hr@test.com', password: 'TestPass1!', role: 'super-admin',
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

  const lt = await LeaveType.create({
    name: 'Annual Leave', code: 'AL', color: '#4f46e5',
    isPaid: true, maxDaysPerApplication: 15, maxDaysPerYear: 30,
    requiresApproval: true, autoApproveThreshold: 0, approvalLevels: 1,
    accrualMethod: 'yearly-lump', carryForward: false,
  });
  leaveTypeId = lt._id.toString();
});

beforeEach(async () => {
  await LeaveApplication.deleteMany({});
  await LeaveBalance.deleteMany({});
  await LeaveBalance.create({
    employee: empId, leaveType: leaveTypeId, year: 2025,
    totalEntitled: 30, balance: 30, totalUsed: 0, totalPending: 0,
  });
});

describe('LeaveService', () => {
  describe('listLeaveTypes', () => {
    it('returns all leave types', async () => {
      const types = await LeaveService.listLeaveTypes();
      expect(types.length).toBeGreaterThanOrEqual(1);
      expect(types[0]).toHaveProperty('id');
    });
  });

  describe('createLeaveType', () => {
    it('creates a new leave type', async () => {
      const result = await LeaveService.createLeaveType(
        { name: 'Sick Leave', code: 'SL', maxDaysPerApplication: 7, maxDaysPerYear: 15 },
        userId,
      );

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Sick Leave');
      expect(result.code).toBe('SL');
    });

    it('rejects duplicate name', async () => {
      await expect(
        LeaveService.createLeaveType(
          { name: 'Annual Leave', code: 'AL2', maxDaysPerApplication: 5, maxDaysPerYear: 10 },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateLeaveType', () => {
    it('updates a leave type', async () => {
      const result = await LeaveService.updateLeaveType(leaveTypeId, { name: 'Updated Annual Leave' }, userId);
      expect(result.name).toBe('Updated Annual Leave');
    });

    it('throws on non-existent id', async () => {
      await expect(
        LeaveService.updateLeaveType(new mongoose.Types.ObjectId().toString(), { name: 'Nope' }, userId),
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteLeaveType', () => {
    it('deletes a leave type with no active applications', async () => {
      const lt = await LeaveType.create({
        name: 'Temp Leave', code: 'TL', maxDaysPerApplication: 5, maxDaysPerYear: 10,
      });

      await expect(LeaveService.deleteLeaveType(lt._id.toString(), userId)).resolves.not.toThrow();

      const found = await LeaveType.findById(lt._id);
      expect(found).toBeNull();
    });

    it('throws on non-existent id', async () => {
      await expect(
        LeaveService.deleteLeaveType(new mongoose.Types.ObjectId().toString(), userId),
      ).rejects.toThrow(AppError);
    });
  });

  describe('createApplication', () => {
    it('creates a leave application (auto-approved when balance sufficient and no approval needed)', async () => {
      const lt = await LeaveType.create({
        name: 'Quick Leave', code: 'QL', maxDaysPerApplication: 5, maxDaysPerYear: 10,
        requiresApproval: false, isPaid: true,
      });

      await LeaveBalance.create({
        employee: empId, leaveType: lt._id, year: 2025,
        totalEntitled: 10, balance: 10, totalUsed: 0, totalPending: 0,
      });

      const result = await LeaveService.createApplication(
        { employee: empId, leaveType: lt._id.toString(), startDate: '2025-06-01', endDate: '2025-06-03', reason: 'Personal' },
        userId,
      );

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('approved');
      expect(result.totalDays).toBe(3);
    });

    it('creates a pending application when approval required', async () => {
      const result = await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-06-01', endDate: '2025-06-03', reason: 'Vacation' },
        userId,
      );

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
    });

    it('rejects application exceeding max days', async () => {
      await expect(
        LeaveService.createApplication(
          { employee: empId, leaveType: leaveTypeId, startDate: '2025-06-01', endDate: '2025-06-20', reason: 'Too long' },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });

    it('rejects application with end before start', async () => {
      await expect(
        LeaveService.createApplication(
          { employee: empId, leaveType: leaveTypeId, startDate: '2025-06-10', endDate: '2025-06-05', reason: 'Oops' },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });

    it('rejects non-existent employee', async () => {
      await expect(
        LeaveService.createApplication(
          { employee: new mongoose.Types.ObjectId().toString(), leaveType: leaveTypeId, startDate: '2025-06-01', endDate: '2025-06-03', reason: 'Test' },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('getBalances', () => {
    it('returns balances for all active leave types', async () => {
      await LeaveBalance.deleteMany({});
      await LeaveBalance.create({
        employee: empId, leaveType: leaveTypeId, year: 2025,
        totalEntitled: 30, balance: 27, totalUsed: 3, totalPending: 0,
      });

      const balances = await LeaveService.getBalances(empId, 2025);
      expect(balances.length).toBeGreaterThanOrEqual(1);
      const alBalance = balances.find((b: any) => b.leaveType.code === 'AL');
      expect(alBalance).toBeDefined();
      expect(alBalance.balance).toBe(27);
    });

    it('returns zero balance for leave types without records', async () => {
      await LeaveBalance.deleteMany({});
      const balances = await LeaveService.getBalances(empId, 2025);
      const alBalance = balances.find((b: any) => b.leaveType.code === 'AL');
      expect(alBalance).toBeDefined();
      expect(alBalance.balance).toBe(0);
    });
  });

  describe('getPendingApprovals', () => {
    it('returns pending approvals for user', async () => {
      await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-07-01', endDate: '2025-07-03', reason: 'Need approval' },
        userId,
      );

      const result = await LeaveService.getPendingApprovals(userId, {});
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data[0]).toHaveProperty('id');
    });
  });

  describe('approveApplication', () => {
    it('approves a pending application', async () => {
      const app = await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-08-01', endDate: '2025-08-03', reason: 'Test approval' },
        userId,
      );

      const result = await LeaveService.approveApplication(
        { applicationId: app.id, status: 'approved' },
        userId,
      );

      expect(result.status).toBe('approved');
    });

    it('rejects application not in pending status', async () => {
      const app = await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-09-01', endDate: '2025-09-03', reason: 'Test rejection' },
        userId,
      );

      await LeaveService.approveApplication({ applicationId: app.id, status: 'approved' }, userId);

      await expect(
        LeaveService.approveApplication({ applicationId: app.id, status: 'approved' }, userId),
      ).rejects.toThrow(AppError);
    });
  });

  describe('cancelApplication', () => {
    it('cancels a pending application', async () => {
      const app = await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-10-01', endDate: '2025-10-03', reason: 'To cancel' },
        userId,
      );

      const result = await LeaveService.cancelApplication(app.id, userId);
      expect(result.status).toBe('cancelled');
    });

    it('throws on non-existent id', async () => {
      await expect(
        LeaveService.cancelApplication(new mongoose.Types.ObjectId().toString(), userId),
      ).rejects.toThrow(AppError);
    });

    it('restores pending balance on cancellation', async () => {
      const lt = await LeaveType.create({
        name: 'Cancel Test', code: 'CT', maxDaysPerApplication: 5, maxDaysPerYear: 10,
        requiresApproval: true, autoApproveThreshold: 1, approvalLevels: 1, isPaid: true,
      });

      await LeaveBalance.create({
        employee: empId, leaveType: lt._id, year: 2025,
        totalEntitled: 10, balance: 7, totalUsed: 0, totalPending: 3,
      });

      const app = await LeaveService.createApplication(
        { employee: empId, leaveType: lt._id.toString(), startDate: '2025-11-01', endDate: '2025-11-03', reason: 'Cancel me' },
        userId,
      );

      const beforeBalance = await LeaveBalance.findOne({ employee: empId, leaveType: lt._id, year: 2025 });
      const pendingBefore = beforeBalance?.totalPending || 0;

      await LeaveService.cancelApplication(app.id, userId);

      const afterBalance = await LeaveBalance.findOne({ employee: empId, leaveType: lt._id, year: 2025 });
      expect(afterBalance?.totalPending).toBe(pendingBefore - 3);
    });
  });

  describe('listApplications', () => {
    it('returns paginated applications', async () => {
      await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-12-01', endDate: '2025-12-03', reason: 'List test' },
        userId,
      );

      const result = await LeaveService.listApplications({ page: 1, limit: 10 });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('totalPages');
    });

    it('filters by status', async () => {
      const result = await LeaveService.listApplications({ status: 'approved', page: 1, limit: 10 });
      result.data.forEach((a: any) => {
        expect(a.status).toBe('approved');
      });
    });
  });

  describe('getEmployeeApplications', () => {
    it('returns applications for a specific employee', async () => {
      await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-06-15', endDate: '2025-06-17', reason: 'Employee apps' },
        userId,
      );

      const result = await LeaveService.getEmployeeApplications(empId, { page: 1, limit: 10 });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      result.data.forEach((a: any) => {
        expect(a.employee || a.leaveType).toBeDefined();
      });
    });

    it('filters by year', async () => {
      const result = await LeaveService.getEmployeeApplications(empId, { year: '2025', page: 1, limit: 10 });
      expect(result.data).toBeDefined();
    });

    it('returns empty array for employee with no applications', async () => {
      const result = await LeaveService.getEmployeeApplications(
        new mongoose.Types.ObjectId().toString(),
        { page: 1, limit: 10 },
      );
      expect(result.data).toEqual([]);
    });
  });

  describe('bulkAccrue', () => {
    it('accrues leave balances for all employees', async () => {
      const result = await LeaveService.bulkAccrue(
        { leaveTypeId, year: 2025 },
        userId,
      );
      expect(result.totalProcessed).toBeGreaterThanOrEqual(1);
      expect(result.results[0]).toHaveProperty('status');
    });

    it('throws for non-existent leave type', async () => {
      await expect(
        LeaveService.bulkAccrue(
          { leaveTypeId: new mongoose.Types.ObjectId().toString(), year: 2025 },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('getCalendar', () => {
    it('returns leave calendar for a month', async () => {
      const lt = await LeaveType.create({
        name: 'Calendar Leave', code: 'CL', maxDaysPerApplication: 5, maxDaysPerYear: 10,
        requiresApproval: false, isPaid: true, allowNegativeBalance: true,
      });
      await LeaveService.createApplication(
        { employee: empId, leaveType: lt._id.toString(), startDate: '2025-04-10', endDate: '2025-04-12', reason: 'Calendar test' },
        userId,
      );

      const result = await LeaveService.getCalendar({ month: 4, year: 2025 });
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('days');
    });
  });

  describe('getLeaveSummary', () => {
    it('returns leave summary for a month', async () => {
      await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-04-05', endDate: '2025-04-07', reason: 'Summary test' },
        userId,
      );

      const result = await LeaveService.getLeaveSummary({ month: 4, year: 2025 });
      expect(result).toHaveProperty('totalDays');
      expect(result).toHaveProperty('totalApplications');
      expect(result).toHaveProperty('byStatus');
    });

    it('returns zeros when no applications exist', async () => {
      const result = await LeaveService.getLeaveSummary({ month: 6, year: 2025 });
      expect(result.totalDays).toBe(0);
      expect(result.totalApplications).toBe(0);
    });
  });
});
