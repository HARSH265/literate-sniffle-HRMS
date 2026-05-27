import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Holiday from '../../../models/Holiday.model.js';
import User from '../../../models/User.model.js';
import { HolidaysService } from '../holidays.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let holidayId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'holiday@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Holiday.deleteMany({});
  const holiday = await Holiday.create({
    name: 'Republic Day', date: new Date('2025-01-26'), year: 2025,
    type: 'national', applicableTo: 'all', isPaid: true,
  });
  holidayId = holiday._id.toString();
});

describe('HolidaysService', () => {
  describe('create', () => {
    it('creates a holiday', async () => {
      const result = await HolidaysService.create({ name: 'Independence Day', date: '2025-08-15', year: 2025 }, userId) as any;
      expect(result.name).toBe('Independence Day');
      expect(result.year).toBe(2025);
    });

    it('throws on duplicate name for same year', async () => {
      await expect(HolidaysService.create({ name: 'Republic Day', date: '2025-01-26' }, userId)).rejects.toThrow(AppError);
    });

    it('auto-derives year from date', async () => {
      const result = await HolidaysService.create({ name: 'New Year', date: '2025-01-01' }, userId) as any;
      expect(result.year).toBe(2025);
    });
  });

  describe('list', () => {
    it('returns paginated holidays', async () => {
      const result = await HolidaysService.list({});
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('filters by year', async () => {
      const result = await HolidaysService.list({ year: 2025 });
      expect(result.data).toHaveLength(1);
    });

    it('filters by type', async () => {
      const result = await HolidaysService.list({ type: 'national' });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('returns holiday by id', async () => {
      const result = await HolidaysService.getById(holidayId) as any;
      expect(result.name).toBe('Republic Day');
    });

    it('throws on non-existent id', async () => {
      await expect(HolidaysService.getById(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates holiday name', async () => {
      const result = await HolidaysService.update(holidayId, { name: 'Updated Republic Day' }, userId) as any;
      expect(result.name).toBe('Updated Republic Day');
    });
  });

  describe('delete', () => {
    it('deletes a holiday', async () => {
      await expect(HolidaysService.delete(holidayId, userId)).resolves.not.toThrow();
      const holiday = await Holiday.findById(holidayId);
      expect(holiday).toBeNull();
    });
  });
});
