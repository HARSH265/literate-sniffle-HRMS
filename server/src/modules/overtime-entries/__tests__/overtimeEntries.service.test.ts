import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import OvertimeEntry from '../../../models/OvertimeEntry.model.js';
import OvertimeRule from '../../../models/OvertimeRule.model.js';
import Employee from '../../../models/Employee.model.js';
import User from '../../../models/User.model.js';
import { OvertimeEntriesService } from '../overtimeEntries.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let empId: string;
let ruleId: string;
let entryId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'otentry@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
  const emp = await Employee.create({
    employeeCode: 'OT001', fullName: 'John OT', fatherName: 'Jane',
    category: 'worker', employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(), designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(), joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly', baseSalary: 25000,
  });
  empId = emp._id.toString();
  const rule = await OvertimeRule.create({
    name: 'Standard OT', applicableTo: 'all', multiplier: 2,
    maxHoursPerDay: 4, maxHoursPerMonth: 60, isActive: true,
  });
  ruleId = rule._id.toString();
});

beforeEach(async () => {
  await OvertimeEntry.deleteMany({});
  const entry = await OvertimeEntry.create({
    employee: empId, date: new Date('2025-03-15'), hours: 2,
    overtimeRule: ruleId, enteredBy: userId,
  });
  entryId = entry._id.toString();
});

describe('OvertimeEntriesService', () => {
  describe('create', () => {
    it('creates an overtime entry', async () => {
      const result = await OvertimeEntriesService.create({
        employee: empId, date: '2025-03-16', hours: 3, overtimeRule: ruleId,
      }, userId) as any;
      expect(result.hours).toBe(3);
    });

    it('throws on non-existent employee', async () => {
      await expect(OvertimeEntriesService.create({
        employee: new mongoose.Types.ObjectId().toString(), date: '2025-03-16', hours: 2,
      }, userId)).rejects.toThrow(AppError);
    });

    it('throws on future date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];
      await expect(OvertimeEntriesService.create({
        employee: empId, date: dateStr, hours: 2,
      }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated entries', async () => {
      const result = await OvertimeEntriesService.list({});
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('filters by employee', async () => {
      const result = await OvertimeEntriesService.list({ employee: empId });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('returns entry by id', async () => {
      const result = await OvertimeEntriesService.getById(entryId) as any;
      expect(result.hours).toBe(2);
    });

    it('throws on non-existent id', async () => {
      await expect(OvertimeEntriesService.getById(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates entry hours', async () => {
      const result = await OvertimeEntriesService.update(entryId, { hours: 4 }, userId) as any;
      expect(result.hours).toBe(4);
    });
  });

  describe('delete', () => {
    it('deletes an entry', async () => {
      await expect(OvertimeEntriesService.delete(entryId, userId)).resolves.not.toThrow();
      const entry = await OvertimeEntry.findById(entryId);
      expect(entry).toBeNull();
    });
  });
});
