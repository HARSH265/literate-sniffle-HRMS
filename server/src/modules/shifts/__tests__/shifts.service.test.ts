import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Shift from '../../../models/Shift.model.js';
import User from '../../../models/User.model.js';
import { ShiftsService } from '../shifts.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let shiftId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'shift@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Shift.deleteMany({});
  const shift = await Shift.create({
    name: 'Morning', startTime: '06:00', endTime: '14:00',
    workingHours: 8, applicableTo: 'all', isActive: true, createdBy: userId,
  });
  shiftId = shift._id.toString();
});

describe('ShiftsService', () => {
  describe('create', () => {
    it('creates a day shift', async () => {
      const result = await ShiftsService.create({
        name: 'Evening', startTime: '14:00', endTime: '22:00',
        workingHours: 8, applicableTo: 'worker',
      }, userId) as any;
      expect(result.name).toBe('Evening');
    });

    it('creates a night shift', async () => {
      const result = await ShiftsService.create({
        name: 'Night', startTime: '22:00', endTime: '06:00',
        workingHours: 8, applicableTo: 'all',
      }, userId) as any;
      expect(result.name).toBe('Night');
    });

    it('throws on duplicate name', async () => {
      await expect(ShiftsService.create({
        name: 'Morning', startTime: '06:00', endTime: '14:00',
        workingHours: 8, applicableTo: 'all',
      }, userId)).rejects.toThrow(AppError);
    });

    it('throws on overlapping shift', async () => {
      await expect(ShiftsService.create({
        name: 'Early', startTime: '05:00', endTime: '13:00',
        workingHours: 8, applicableTo: 'all',
      }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated shifts', async () => {
      const result = await ShiftsService.list({});
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('filters by status', async () => {
      const result = await ShiftsService.list({ status: 'active' });
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('returns shift by id', async () => {
      const result = await ShiftsService.getById(shiftId) as any;
      expect(result.name).toBe('Morning');
    });

    it('throws on non-existent id', async () => {
      await expect(ShiftsService.getById(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates shift name', async () => {
      const result = await ShiftsService.update(shiftId, { name: 'Morning Shift' }, userId) as any;
      expect(result.name).toBe('Morning Shift');
    });
  });

  describe('delete', () => {
    it('deletes a shift with no employees', async () => {
      await expect(ShiftsService.delete(shiftId, userId)).resolves.not.toThrow();
      const shift = await Shift.findById(shiftId);
      expect(shift).toBeNull();
    });
  });
});
