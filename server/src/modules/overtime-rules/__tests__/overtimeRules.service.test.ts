import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import OvertimeRule from '../../../models/OvertimeRule.model.js';
import User from '../../../models/User.model.js';
import { OvertimeRulesService } from '../overtimeRules.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let ruleId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'otrule@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await OvertimeRule.deleteMany({});
  const rule = await OvertimeRule.create({
    name: 'Double Time', applicableTo: 'all', multiplier: 2,
    maxHoursPerDay: 4, maxHoursPerMonth: 60, isActive: true, createdBy: userId,
  });
  ruleId = rule._id.toString();
});

describe('OvertimeRulesService', () => {
  describe('create', () => {
    it('creates an overtime rule', async () => {
      const result = await OvertimeRulesService.create({
        name: 'Triple Time', multiplier: 3, maxHoursPerDay: 4, maxHoursPerMonth: 50,
      }, userId) as any;
      expect(result.name).toBe('Triple Time');
      expect(result.multiplier).toBe(3);
    });
  });

  describe('list', () => {
    it('returns paginated rules', async () => {
      const result = await OvertimeRulesService.list({});
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('filters by isActive', async () => {
      const result = await OvertimeRulesService.list({ isActive: 'true' });
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('returns rule by id', async () => {
      const result = await OvertimeRulesService.getById(ruleId) as any;
      expect(result.name).toBe('Double Time');
    });

    it('throws on non-existent id', async () => {
      await expect(OvertimeRulesService.getById(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates rule multiplier', async () => {
      const result = await OvertimeRulesService.update(ruleId, { multiplier: 2.5 }, userId) as any;
      expect(result.multiplier).toBe(2.5);
    });
  });

  describe('delete', () => {
    it('deletes a rule', async () => {
      await expect(OvertimeRulesService.delete(ruleId, userId)).resolves.not.toThrow();
      const rule = await OvertimeRule.findById(ruleId);
      expect(rule).toBeNull();
    });

    it('throws on non-existent id', async () => {
      await expect(OvertimeRulesService.delete(new mongoose.Types.ObjectId().toString(), userId)).rejects.toThrow(AppError);
    });
  });
});
