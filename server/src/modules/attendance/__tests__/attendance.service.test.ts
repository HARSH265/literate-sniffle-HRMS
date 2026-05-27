import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import AttendanceEntry from '../../../models/AttendanceEntry.model.js';
import Employee from '../../../models/Employee.model.js';
import Shift from '../../../models/Shift.model.js';
import { AttendanceService } from '../attendance.service.js';
import { AppError } from '../../../core/errors/AppError.js';
import User from '../../../models/User.model.js';

let userId: string;
let empId: string;
let shiftId: string;

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const year = yesterday.getFullYear();
const month = String(yesterday.getMonth() + 1).padStart(2, '0');
const day = String(yesterday.getDate()).padStart(2, '0');
const todayStr = `${year}-${month}-${day}`;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();

  const shift = await Shift.create({ name: 'General', startTime: '09:00', endTime: '18:00', workingHours: 9 });
  shiftId = shift._id.toString();

  const emp = await Employee.create({
    employeeCode: 'EMP001',
    fullName: 'John Doe',
    fatherName: 'Jane Doe',
    category: 'worker',
    employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    shift: shift._id,
    joiningDate: new Date('2025-01-01'),
    salaryType: 'monthly',
    baseSalary: 25000,
  });
  empId = emp._id.toString();
});

beforeEach(async () => {
  await AttendanceEntry.deleteMany({});
});

describe('AttendanceService', () => {
  describe('create', () => {
    it('creates an attendance entry', async () => {
      const result = await AttendanceService.create(
        { employee: empId, date: todayStr, status: 'present', inTime: '09:00', outTime: '18:00' },
        userId,
      ) as any;

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('present');
      expect(result.inTime).toBe('09:00');
    });

    it('rejects future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureStr = futureDate.toISOString().split('T')[0];

      await expect(
        AttendanceService.create({ employee: empId, date: futureStr, status: 'present' }, userId),
      ).rejects.toThrow(AppError);
    });

    it('rejects outTime before inTime', async () => {
      await expect(
        AttendanceService.create(
          { employee: empId, date: todayStr, status: 'present', inTime: '18:00', outTime: '09:00' },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });

    it('rejects non-existent employee', async () => {
      await expect(
        AttendanceService.create(
          { employee: new mongoose.Types.ObjectId().toString(), date: todayStr, status: 'present' },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates an attendance entry', async () => {
      const entry = await AttendanceEntry.create({
        employee: empId, date: new Date(), shift: shiftId, status: 'present', enteredBy: userId,
      });

      const result = await AttendanceService.update(
        entry._id.toString(),
        { status: 'absent' },
        userId,
      ) as any;

      expect(result.status).toBe('absent');
    });

    it('rejects invalid outTime before inTime on update', async () => {
      const entry = await AttendanceEntry.create({
        employee: empId, date: new Date(), shift: shiftId, status: 'present', enteredBy: userId,
      });

      await expect(
        AttendanceService.update(entry._id.toString(), { inTime: '18:00', outTime: '09:00' }, userId),
      ).rejects.toThrow(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated attendance entries', async () => {
      await AttendanceEntry.create({
        employee: empId, date: new Date(), shift: shiftId, status: 'present', enteredBy: userId,
      });

      const result = await AttendanceService.list({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('filters by date', async () => {
      await AttendanceEntry.create({
        employee: empId, date: new Date('2025-01-01'), shift: shiftId, status: 'present', enteredBy: userId,
      });
      await AttendanceEntry.create({
        employee: empId, date: new Date('2025-03-15'), shift: shiftId, status: 'present', enteredBy: userId,
      });

      const result = await AttendanceService.list({ date: '2025-03-15' });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getByEmployee', () => {
    it('returns entries for an employee', async () => {
      await AttendanceEntry.create({
        employee: empId, date: new Date(), shift: shiftId, status: 'present', enteredBy: userId,
      });

      const result = await AttendanceService.getByEmployee(empId);
      expect(result).toHaveLength(1);
    });

    it('filters by date range', async () => {
      await AttendanceEntry.create({
        employee: empId, date: new Date('2025-03-01'), shift: shiftId, status: 'present', enteredBy: userId,
      });
      await AttendanceEntry.create({
        employee: empId, date: new Date('2025-03-15'), shift: shiftId, status: 'present', enteredBy: userId,
      });

      const result = await AttendanceService.getByEmployee(empId, '2025-03-10', '2025-03-20');
      expect(result).toHaveLength(1);
    });
  });

  describe('bulkCreate', () => {
    it('creates bulk attendance entries', async () => {
      const result = await AttendanceService.bulkCreate(
        {
          date: todayStr,
          entries: [
            { employee: empId, status: 'present', inTime: '09:00', outTime: '18:00' },
          ],
        },
        userId,
      );

      expect(result).toHaveLength(1);
      expect((result[0] as any).status).toBe('created');
    });

    it('updates existing entries in bulk', async () => {
      const date = new Date(todayStr);
      await AttendanceEntry.create({
        employee: empId, date, shift: shiftId, status: 'absent', enteredBy: userId,
      });

      const result = await AttendanceService.bulkCreate(
        {
          date: todayStr,
          entries: [
            { employee: empId, status: 'present', inTime: '09:00' },
          ],
        },
        userId,
      );

      expect(result).toHaveLength(1);
      expect((result[0] as any).status).toBe('updated');
    });

    it('rejects future dates in bulk', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await expect(
        AttendanceService.bulkCreate(
          { date: futureDate.toISOString().split('T')[0], entries: [{ employee: empId, status: 'present' }] },
          userId,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('bulkUpdateEntries', () => {
    it('updates multiple entries', async () => {
      const entry1 = await AttendanceEntry.create({
        employee: empId, date: new Date(), shift: shiftId, status: 'present', enteredBy: userId,
      });
      const entry2 = await AttendanceEntry.create({
        employee: empId, date: new Date(), shift: shiftId, status: 'present', enteredBy: userId,
      });

      const result = await AttendanceService.bulkUpdateEntries(
        [{ id: entry1._id.toString(), status: 'absent' }, { id: entry2._id.toString(), status: 'half-day' }],
        userId,
      );

      expect(result.updated).toBe(2);
    });

    it('reports failure for non-existent entries', async () => {
      const result = await AttendanceService.bulkUpdateEntries(
        [{ id: new mongoose.Types.ObjectId().toString(), status: 'absent' }],
        userId,
      );

      expect(result.failed).toBe(1);
    });
  });

  describe('delete', () => {
    it('deletes an attendance entry', async () => {
      const entry = await AttendanceEntry.create({
        employee: empId, date: new Date(), shift: shiftId, status: 'present', enteredBy: userId,
      });

      await AttendanceService.delete(entry._id.toString(), userId);

      const found = await AttendanceEntry.findById(entry._id);
      expect(found).toBeNull();
    });

    it('throws on non-existent entry', async () => {
      await expect(
        AttendanceService.delete(new mongoose.Types.ObjectId().toString(), userId),
      ).rejects.toThrow(AppError);
    });
  });
});
