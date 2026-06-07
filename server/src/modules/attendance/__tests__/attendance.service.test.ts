import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import AttendanceEntry from '../../../models/AttendanceEntry.model.js';
import Employee from '../../../models/Employee.model.js';
import Shift from '../../../models/Shift.model.js';
import { AttendanceService } from '../attendance.service.js';
import { AppError } from '../../../core/errors/AppError.js';
import User from '../../../models/User.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';

let userId: string;
let empId: string;
let shiftId: string;
let nightShiftId: string;
let nightEmpId: string;

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

  const nightShift = await Shift.create({ name: 'Night', startTime: '22:00', endTime: '06:00', workingHours: 8 });
  nightShiftId = nightShift._id.toString();

  const nightEmp = await Employee.create({
    employeeCode: 'EMP002',
    fullName: 'Jane Night',
    fatherName: 'John Night',
    category: 'worker',
    employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    shift: nightShift._id,
    joiningDate: new Date('2025-01-01'),
    salaryType: 'monthly',
    baseSalary: 25000,
  });
  nightEmpId = nightEmp._id.toString();
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

    it('accepts overnight shift times for night shift employee', async () => {
      const result = await AttendanceService.create(
        { employee: nightEmpId, date: todayStr, status: 'present', inTime: '22:00', outTime: '06:00' },
        userId,
      ) as any;

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('present');
      expect(result.inTime).toBe('22:00');
      expect(result.outTime).toBe('06:00');
    });

    it('rejects zero-duration times for night shift employee', async () => {
      await expect(
        AttendanceService.create(
          { employee: nightEmpId, date: todayStr, status: 'present', inTime: '22:00', outTime: '22:00' },
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

    it('accepts overnight times on update for night shift employee', async () => {
      const entry = await AttendanceEntry.create({
        employee: nightEmpId, date: new Date(), shift: nightShiftId, status: 'present', enteredBy: userId,
      });

      const result = await AttendanceService.update(
        entry._id.toString(),
        { inTime: '22:00', outTime: '06:00' },
        userId,
      ) as any;

      expect(result.inTime).toBe('22:00');
      expect(result.outTime).toBe('06:00');
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

    it('accepts overnight shift times in bulk', async () => {
      const result = await AttendanceService.bulkCreate(
        {
          date: todayStr,
          entries: [
            { employee: nightEmpId, status: 'present', inTime: '22:00', outTime: '06:00' },
          ],
        },
        userId,
      );

      expect(result).toHaveLength(1);
      expect((result[0] as any).status).toBe('created');
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

  describe('calculateOTHours', () => {
    const defaultConfig = {
      pastEntryLimitDays: 7,
      lateMarkEnabled: true,
      lateMarkThresholdMinutes: 15,
      lateToHalfDayAfterOccurrences: 3,
      shiftStartTime: '09:00',
      shiftEndTime: '18:00',
      gracePeriodMinutes: 5,
      lateMarkAsAbsent: true,
      lateTreatWorkAsOT: false,
      autoCheckoutEnabled: true,
      autoCheckoutGraceMinutes: 30,
      breakMinutes: 30,
      breakDeductionThresholdMinutes: 360,
    };

    it('deducts break when work exceeds threshold', () => {
      // workMinutes = 600 (10h), shiftDuration = 540 (9h), threshold = 360
      // OT = 600 - 540 - 30 = 30
      const result = AttendanceService.calculateOTHours('08:00', '18:00', false, defaultConfig, 12);
      expect(result.totalHours).toBe(10);
      expect(result.otHours).toBe(0.5);
    });

    it('skips break deduction when work is below threshold', () => {
      // workMinutes = 300 (5h), shiftDuration = 540 (9h), threshold = 360
      // workMinutes < shiftDuration, so regular = 300, OT = max(0, 300 - 300 - 0) = 0
      const config = { ...defaultConfig, breakDeductionThresholdMinutes: 360 };
      const result = AttendanceService.calculateOTHours('09:00', '14:00', false, config, 12);
      expect(result.totalHours).toBe(5);
      expect(result.otHours).toBe(0);
    });

    it('deducts break only when above configurable threshold', () => {
      // workMinutes = 540 (9h), shiftDuration = 480 (8h), threshold = 600 (10h)
      // workMinutes (540) <= threshold (600) -> no break deducted
      // OT = max(0, 540 - 480 - 0) = 60
      const config = { ...defaultConfig, shiftStartTime: '09:00', shiftEndTime: '17:00', breakDeductionThresholdMinutes: 600 };
      const result = AttendanceService.calculateOTHours('08:00', '17:00', false, config, 12);
      expect(result.totalHours).toBe(9);
      expect(result.otHours).toBe(1);
    });

    it('deducts break when work is above configurable threshold', () => {
      // workMinutes = 600 (10h), shiftDuration = 480 (8h), threshold = 480 (8h)
      // workMinutes (600) > threshold (480) -> break deducted
      // OT = max(0, 600 - 480 - 30) = 90
      const config = { ...defaultConfig, shiftStartTime: '09:00', shiftEndTime: '17:00', breakDeductionThresholdMinutes: 480 };
      const result = AttendanceService.calculateOTHours('08:00', '18:00', false, config, 12);
      expect(result.totalHours).toBe(10);
      expect(result.otHours).toBe(1.5);
    });
  });

  describe('late to half-day conversion', () => {
    beforeAll(async () => {
      await CompanySettings.deleteMany({});
      await CompanySettings.create({
        companyInfo: { name: 'Test Corp', financialYearStart: 4 },
        attendanceConfig: {
          pastEntryLimitDays: 7,
          lateMarkEnabled: true,
          lateMarkThresholdMinutes: 0,
          lateToHalfDayAfterOccurrences: 2,
          shiftStartTime: '09:00',
          shiftEndTime: '18:00',
          gracePeriodMinutes: 5,
          lateMarkAsAbsent: false,
          lateTreatWorkAsOT: true,
          autoCheckoutEnabled: true,
          autoCheckoutGraceMinutes: 30,
          breakMinutes: 30,
        },
      });
    });

    afterAll(async () => {
      await CompanySettings.deleteMany({});
    });

    it('marks first late as present', async () => {
      const result = await AttendanceService.create(
        { employee: empId, date: todayStr, status: 'present', inTime: '09:05', outTime: '18:00' },
        userId,
      ) as any;

      expect(result.status).toBe('present');
      expect(result.isLate).toBe(true);
    });

    it('converts to half-day on threshold', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await AttendanceEntry.create({
        employee: empId, date: twoDaysAgo, shift: shiftId, status: 'present', isLate: true, enteredBy: userId,
      });

      const result = await AttendanceService.create(
        { employee: empId, date: todayStr, status: 'present', inTime: '09:05', outTime: '18:00' },
        userId,
      ) as any;

      expect(result.status).toBe('half-day');
      expect(result.isLate).toBe(true);
    });

    it('converts to half-day in bulkCreate on threshold', async () => {
      const bulkEmp = await Employee.create({
        employeeCode: 'EMP003',
        fullName: 'Bulk Late',
        fatherName: 'Test',
        category: 'worker',
        employmentType: 'permanent',
        department: new mongoose.Types.ObjectId(),
        designation: new mongoose.Types.ObjectId(),
        shift: shiftId,
        joiningDate: new Date('2025-01-01'),
        salaryType: 'monthly',
        baseSalary: 25000,
      });
      const bulkEmpId = bulkEmp._id.toString();

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      await AttendanceEntry.create({
        employee: bulkEmpId, date: twoDaysAgo, shift: shiftId, status: 'present', isLate: true, enteredBy: userId,
      });

      const result = await AttendanceService.bulkCreate(
        {
          date: todayStr,
          entries: [
            { employee: bulkEmpId, status: 'present', inTime: '09:10', outTime: '18:00' },
          ],
        },
        userId,
      );

      expect(result).toHaveLength(1);
      expect((result[0] as any).status).toBe('created');

      const saved = await AttendanceEntry.findOne({ employee: bulkEmpId, date: { $gte: new Date(todayStr), $lte: new Date(todayStr + 'T23:59:59.999Z') } });
      expect(saved).not.toBeNull();
      expect(saved!.status).toBe('half-day');
      expect(saved!.isLate).toBe(true);
    });
  });
});
