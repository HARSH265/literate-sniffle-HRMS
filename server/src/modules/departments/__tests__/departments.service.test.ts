import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Department from '../../../models/Department.model.js';
import User from '../../../models/User.model.js';
import { DepartmentsService } from '../departments.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let deptId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'dept@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Department.deleteMany({});
  const dept = await Department.create({ name: 'Production', code: 'PROD', isActive: true, createdBy: userId });
  deptId = dept._id.toString();
});

describe('DepartmentsService', () => {
  describe('create', () => {
    it('creates a department', async () => {
      const result = await DepartmentsService.create({ name: 'HR', code: 'HR' }, userId) as any;
      expect(result.name).toBe('HR');
      expect(result.code).toBe('HR');
      expect(result.isActive).toBe(true);
    });

    it('auto-generates code when not provided', async () => {
      const result = await DepartmentsService.create({ name: 'Finance' }, userId) as any;
      expect(result.code).toMatch(/^DEPT/);
    });

    it('throws on duplicate name', async () => {
      await expect(DepartmentsService.create({ name: 'Production' }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated departments', async () => {
      const result = await DepartmentsService.list({});
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.meta.total).toBeGreaterThan(0);
    });

    it('filters by search', async () => {
      const result = await DepartmentsService.list({ search: 'Prod' });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('returns department by id', async () => {
      const result = await DepartmentsService.getById(deptId) as any;
      expect(result.name).toBe('Production');
    });

    it('throws on non-existent id', async () => {
      await expect(DepartmentsService.getById(new mongoose.Types.ObjectId().toString())).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('updates department name', async () => {
      const result = await DepartmentsService.update(deptId, { name: 'Manufacturing' }, userId) as any;
      expect(result.name).toBe('Manufacturing');
    });

    it('throws on non-existent id', async () => {
      await expect(DepartmentsService.update(new mongoose.Types.ObjectId().toString(), { name: 'Test' }, userId)).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('deletes a department with no employees', async () => {
      await expect(DepartmentsService.delete(deptId, userId)).resolves.not.toThrow();
      const dept = await Department.findById(deptId);
      expect(dept).toBeNull();
    });

    it('throws on non-existent id', async () => {
      await expect(DepartmentsService.delete(new mongoose.Types.ObjectId().toString(), userId)).rejects.toThrow(AppError);
    });
  });
});
