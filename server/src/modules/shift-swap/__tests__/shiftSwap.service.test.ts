import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import ShiftSwap from '../../../models/ShiftSwap.model.js';
import ShiftPreference from '../../../models/ShiftPreference.model.js';
import User from '../../../models/User.model.js';
import Employee from '../../../models/Employee.model.js';
import Shift from '../../../models/Shift.model.js';
import Department from '../../../models/Department.model.js';
import Designation from '../../../models/Designation.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';
import { ShiftSwapService } from '../shiftSwap.service.js';

let userId: string;
let employeeId: string;
let shiftAId: string;
let shiftBId: string;

beforeAll(async () => {
  await CompanySettings.deleteMany({});
  await CompanySettings.create({ shiftSwapConfig: { shiftSwapEnabled: true, shiftPreferenceEnabled: true, maxSwapsPerMonth: 3, swapDeadlineHours: 24 } });

  const user = await User.create({
    name: 'Swap Admin',
    email: 'swap@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();

  const dept = await Department.create({ name: 'Test Dept', code: 'TST' });
  const desig = await Designation.create({ name: 'Test Desig', department: dept._id });

  const shiftA = await Shift.create({ name: 'Morning', startTime: '06:00', endTime: '14:00', workingHours: 8 });
  shiftAId = shiftA._id.toString();

  const shiftB = await Shift.create({ name: 'Evening', startTime: '14:00', endTime: '22:00', workingHours: 8 });
  shiftBId = shiftB._id.toString();

  const employee = await Employee.create({
    employeeCode: 'EMP001',
    fullName: 'Test Employee',
    fatherName: 'Father',
    category: 'worker',
    employmentType: 'permanent',
    department: dept._id,
    designation: desig._id,
    shift: shiftA._id,
    joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly',
    baseSalary: 20000,
    dailyWage: 769,
    overtimeEligible: true,
    status: 'active',
  });
  employeeId = employee._id.toString();
});

beforeEach(async () => {
  await ShiftSwap.deleteMany({});
  await ShiftPreference.deleteMany({});
});

describe('shiftSwapService', () => {
  describe('requestSwap', () => {
    it('creates a swap request', async () => {
      const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const result = await ShiftSwapService.requestSwap(
        {
          fromShift: shiftAId,
          toShift: shiftBId,
          fromDate: tomorrow.toISOString(),
          toDate: dayAfter.toISOString(),
          reason: 'Need evening shift',
          swapType: 'one-time',
        },
        employeeId,
      );

      expect(result.requestor.toString()).toBe(employeeId);
      expect(result.fromShift.toString()).toBe(shiftAId);
      expect(result.toShift.toString()).toBe(shiftBId);
      expect(result.status).toBe('pending');
    });

    it('throws when shift swaps are disabled', async () => {
      await CompanySettings.updateOne({}, { $set: { 'shiftSwapConfig.shiftSwapEnabled': false } });
      await expect(
        ShiftSwapService.requestSwap(
          { fromShift: shiftAId, toShift: shiftBId, fromDate: new Date().toISOString(), toDate: new Date().toISOString() },
          employeeId,
        ),
      ).rejects.toThrow('Shift swaps are disabled');
      await CompanySettings.updateOne({}, { $set: { 'shiftSwapConfig.shiftSwapEnabled': true } });
    });

    it('throws when deadline is too close', async () => {
      const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await expect(
        ShiftSwapService.requestSwap(
          { fromShift: shiftAId, toShift: shiftBId, fromDate: soon.toISOString(), toDate: soon.toISOString() },
          employeeId,
        ),
      ).rejects.toThrow('hours before the shift');
    });

    it('throws when overlapping swap exists', async () => {
      const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 72 * 60 * 60 * 1000);

      await ShiftSwap.create({
        requestor: employeeId,
        fromShift: shiftAId as any,
        toShift: shiftBId as any,
        fromDate: tomorrow,
        toDate: dayAfter,
        status: 'pending',
      });

      await expect(
        ShiftSwapService.requestSwap(
          { fromShift: shiftAId, toShift: shiftBId, fromDate: tomorrow.toISOString(), toDate: dayAfter.toISOString() },
          employeeId,
        ),
      ).rejects.toThrow('overlapping');
    });
  });

  describe('approveSwap', () => {
    it('approves a pending swap', async () => {
      const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const dayAfter = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const created = await ShiftSwap.create({
        requestor: employeeId as any,
        fromShift: shiftAId as any,
        toShift: shiftBId as any,
        fromDate: tomorrow,
        toDate: dayAfter,
        status: 'pending',
      });

      const approved = await ShiftSwapService.approveSwap(created._id.toString(), userId);
      expect(approved.status).toBe('approved');
      expect(approved.approvedBy!.toString()).toBe(userId);
    });

    it('throws for non-pending swap', async () => {
      const created = await ShiftSwap.create({
        requestor: employeeId as any,
        fromShift: shiftAId as any,
        toShift: shiftBId as any,
        fromDate: new Date(),
        toDate: new Date(),
        status: 'cancelled',
      });

      await expect(
        ShiftSwapService.approveSwap(created._id.toString(), userId),
      ).rejects.toThrow('not pending');
    });
  });

  describe('rejectSwap', () => {
    it('rejects a pending swap with reason', async () => {
      const created = await ShiftSwap.create({
        requestor: employeeId as any,
        fromShift: shiftAId as any,
        toShift: shiftBId as any,
        fromDate: new Date(),
        toDate: new Date(),
        status: 'pending',
      });

      const rejected = await ShiftSwapService.rejectSwap(created._id.toString(), userId, 'Not enough staff');
      expect(rejected.status).toBe('rejected');
      expect(rejected.rejectionReason).toBe('Not enough staff');
    });
  });

  describe('cancelSwap', () => {
    it('cancels own pending swap', async () => {
      const created = await ShiftSwap.create({
        requestor: employeeId as any,
        fromShift: shiftAId as any,
        toShift: shiftBId as any,
        fromDate: new Date(),
        toDate: new Date(),
        status: 'pending',
      });

      const cancelled = await ShiftSwapService.cancelSwap(created._id.toString(), employeeId);
      expect(cancelled.status).toBe('cancelled');
    });

    it('throws when cancelling someone else swap', async () => {
      const created = await ShiftSwap.create({
        requestor: employeeId as any,
        fromShift: shiftAId as any,
        toShift: shiftBId as any,
        fromDate: new Date(),
        toDate: new Date(),
        status: 'pending',
      });

      await expect(
        ShiftSwapService.cancelSwap(created._id.toString(), new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow('own requests');
    });
  });

  describe('list', () => {
    it('returns paginated swaps', async () => {
      await ShiftSwap.create([
        { requestor: employeeId as any, fromShift: shiftAId as any, toShift: shiftBId as any, fromDate: new Date(), toDate: new Date() },
        { requestor: employeeId as any, fromShift: shiftAId as any, toShift: shiftBId as any, fromDate: new Date(), toDate: new Date() },
        { requestor: employeeId as any, fromShift: shiftAId as any, toShift: shiftBId as any, fromDate: new Date(), toDate: new Date() },
      ]);

      const result = await ShiftSwapService.list({ page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
    });
  });

  describe('getMySwaps', () => {
    it('returns employee swaps', async () => {
      await ShiftSwap.create([
        { requestor: employeeId as any, fromShift: shiftAId as any, toShift: shiftBId as any, fromDate: new Date(), toDate: new Date() },
        { requestor: employeeId as any, fromShift: shiftAId as any, toShift: shiftBId as any, fromDate: new Date(), toDate: new Date() },
      ]);

      const result = await ShiftSwapService.getMySwaps(employeeId, { page: 1, limit: 10 });
      expect(result.data.length).toBe(2);
    });
  });

  describe('getPendingApprovals', () => {
    it('returns all pending swaps', async () => {
      await ShiftSwap.create([
        { requestor: employeeId as any, fromShift: shiftAId as any, toShift: shiftBId as any, fromDate: new Date(), toDate: new Date(), status: 'pending' },
        { requestor: employeeId as any, fromShift: shiftAId as any, toShift: shiftBId as any, fromDate: new Date(), toDate: new Date(), status: 'approved' },
      ]);

      const result = await ShiftSwapService.getPendingApprovals();
      expect(result.length).toBe(1);
    });
  });

  describe('checkEligibility', () => {
    it('returns remaining swaps count', async () => {
      const result = await ShiftSwapService.checkEligibility(employeeId);
      expect(result.maxSwaps).toBeGreaterThan(0);
      expect(result.remainingSwaps).toBe(result.maxSwaps);
      expect(result.shiftSwapEnabled).toBe(true);
    });
  });

  describe('setPreference / getPreference', () => {
    it('sets and retrieves shift preference', async () => {
      await ShiftSwapService.setPreference(employeeId, {
        preferredShift: shiftBId,
        effectiveFrom: new Date().toISOString(),
        priority: 1,
        reason: 'Prefer evening',
      });

      const preference = await ShiftSwapService.getPreference(employeeId);
      expect(preference).toBeDefined();
      expect(preference!.preferredShift._id.toString()).toBe(shiftBId);
    });

    it('throws when preferences are disabled', async () => {
      await CompanySettings.updateOne({}, { $set: { 'shiftSwapConfig.shiftPreferenceEnabled': false } });
      await expect(
        ShiftSwapService.setPreference(employeeId, {
          preferredShift: shiftBId,
          effectiveFrom: new Date().toISOString(),
        }),
      ).rejects.toThrow('Shift preferences are disabled');
      await CompanySettings.updateOne({}, { $set: { 'shiftSwapConfig.shiftPreferenceEnabled': true } });
    });
  });
});
