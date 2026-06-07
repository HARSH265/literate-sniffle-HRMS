import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import SalaryStructureTemplate from '../../../models/SalaryStructureTemplate.model.js';
import User from '../../../models/User.model.js';
import { SalaryStructureTemplateService } from '../salaryStructureTemplate.service.js';

let userId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'SST Admin',
    email: 'sstadmin@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();
});

beforeEach(async () => {
  await SalaryStructureTemplate.deleteMany({});
});

const validTemplateData = {
  name: 'Standard Worker Template',
  description: 'Default template for worker category',
  applicableTo: {
    categories: ['worker'],
    employmentTypes: ['permanent'],
    departments: [],
    locations: [],
    grades: [],
  },
  components: [
    { componentCode: 'BASIC', calcType: 'fixed', calcValue: 20000, isMandatory: true, sortOrder: 1 },
    { componentCode: 'HRA', calcType: 'fixed', calcValue: 8000, isMandatory: false, sortOrder: 2 },
  ],
  isActive: true,
};

describe('SalaryStructureTemplateService', () => {
  describe('create', () => {
    it('creates a template successfully', async () => {
      const result = await SalaryStructureTemplateService.create(validTemplateData, userId);
      expect(result.name).toBe('Standard Worker Template');
      expect(result.components).toHaveLength(2);
      expect(result.id).toBeDefined();
    });

    it('throws on duplicate name', async () => {
      await SalaryStructureTemplateService.create(validTemplateData, userId);
      await expect(
        SalaryStructureTemplateService.create(validTemplateData, userId),
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('returns paginated templates', async () => {
      await SalaryStructureTemplate.create([
        { ...validTemplateData, name: 'Template 1' },
        { ...validTemplateData, name: 'Template 2' },
        { ...validTemplateData, name: 'Template 3' },
      ]);

      const result = await SalaryStructureTemplateService.list({ page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
    });

    it('filters by isActive', async () => {
      await SalaryStructureTemplate.create([
        { ...validTemplateData, name: 'Active', isActive: true },
        { ...validTemplateData, name: 'Inactive', isActive: false },
      ]);

      const result = await SalaryStructureTemplateService.list({ isActive: 'true' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Active');
    });
  });

  describe('getById', () => {
    it('returns template by id', async () => {
      const created = await SalaryStructureTemplateService.create(validTemplateData, userId);
      const result = await SalaryStructureTemplateService.getById(created.id);
      expect(result.name).toBe('Standard Worker Template');
    });

    it('throws for non-existent id', async () => {
      await expect(
        SalaryStructureTemplateService.getById(new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates template fields', async () => {
      const created = await SalaryStructureTemplateService.create(validTemplateData, userId);
      const updated = await SalaryStructureTemplateService.update(created.id, { name: 'Updated Template' }, userId);
      expect(updated.name).toBe('Updated Template');
    });

    it('throws for non-existent id', async () => {
      await expect(
        SalaryStructureTemplateService.update(new mongoose.Types.ObjectId().toString(), { name: 'X' }, userId),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes a template', async () => {
      const created = await SalaryStructureTemplateService.create(validTemplateData, userId);
      await SalaryStructureTemplateService.delete(created.id, userId);
      await expect(SalaryStructureTemplateService.getById(created.id)).rejects.toThrow();
    });

    it('throws for non-existent id', async () => {
      await expect(
        SalaryStructureTemplateService.delete(new mongoose.Types.ObjectId().toString(), userId),
      ).rejects.toThrow();
    });
  });
});
