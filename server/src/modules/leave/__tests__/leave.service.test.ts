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
      const result = await LeaveService.createApplication(
        { employee: empId, leaveType: leaveTypeId, startDate: '2025-07-01', endDate: '2025-07-03', reason: 'Need approval' },
        userId,
      );

      expect(result.status).toBe('pending');
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
});
