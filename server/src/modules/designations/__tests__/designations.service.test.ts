import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Designation from '../../../models/Designation.model.js';
import Department from '../../../models/Department.model.js';
import User from '../../../models/User.model.js';
import { DesignationsService } from '../designations.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let deptId: string;
let desigId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'desig@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
  const dept = await Department.create({ name: 'Engineering', code: 'ENG', isActive: true, createdBy: userId });
  deptId = dept._id.toString();
});

beforeEach(async () => {
  await Designation.deleteMany({});
  const desig = await Designation.create({ name: 'Senior Engineer', department: deptId, isActive: true, createdBy: userId });
  desigId = desig._id.toString();
});

describe('DesignationsService', () => {
  describe('create', () => {
    it('creates a designation', async () => {
      const result = await DesignationsService.create({ name: 'Junior Engineer', department: deptId }, userId) as any;
      expect(result.name).toBe('Junior Engineer');
      expect(result.department).toBeTruthy();
    });

    it('throws on duplicate name in same department', async () => {
      await expect(DesignationsService.create({ name: 'Senior Engineer', department: deptId }, userId)).rejects.toThrow(AppError);
    });

    it('throws on non-existent department', async () => {
      await expect(DesignationsService.create({ name: 'Test Role', department: new mongoose.Types.ObjectId().toString() }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated designations', async () => {
      const result = await DesignationsService.list({});
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('filters by department', async () => {
      const result = await DesignationsService.list({ department: deptId });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('returns designation by id', async () => {
      const result = await DesignationsService.getById(desigId) as any;
      expect(result.name).toBe('Senior Engineer');
    });

    it('throws on non-existent id', async () => {
      await expect(DesignationsService.getById(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates designation name', async () => {
      const result = await DesignationsService.update(desigId, { name: 'Lead Engineer' }, userId) as any;
      expect(result.name).toBe('Lead Engineer');
    });
  });

  describe('delete', () => {
    it('deletes a designation with no employees', async () => {
      await expect(DesignationsService.delete(desigId, userId)).resolves.not.toThrow();
      const desig = await Designation.findById(desigId);
      expect(desig).toBeNull();
    });
  });
});
