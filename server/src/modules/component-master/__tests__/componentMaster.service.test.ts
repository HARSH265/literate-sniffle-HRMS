import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import ComponentMaster from '../../../models/ComponentMaster.model.js';
import User from '../../../models/User.model.js';
import { ComponentMasterService } from '../componentMaster.service.js';

let userId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'CM Admin',
    email: 'cmadmin@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();
});

beforeEach(async () => {
  await ComponentMaster.deleteMany({});
});

const validComponentData = {
  code: 'HRA',
  name: 'House Rent Allowance',
  type: 'earning' as const,
  subType: 'fixed' as const,
  calcType: 'percentage-of-basic' as const,
  calcValue: 40,
  taxable: true,
  pfApplicable: false,
  esiApplicable: false,
  ptApplicable: false,
  lopApplicable: true,
  effectiveFrom: new Date('2024-01-01'),
};

describe('ComponentMasterService', () => {
  describe('create', () => {
    it('creates a component successfully', async () => {
      const result = await ComponentMasterService.create(validComponentData, userId);
      expect(result.code).toBe('HRA');
      expect(result.name).toBe('House Rent Allowance');
      expect(result.type).toBe('earning');
      expect(result.calcType).toBe('percentage-of-basic');
      expect(result.calcValue).toBe(40);
      expect(result.id).toBeDefined();
    });

    it('uppercases the code', async () => {
      const result = await ComponentMasterService.create({ ...validComponentData, code: 'hra' }, userId);
      expect(result.code).toBe('HRA');
    });

    it('throws on duplicate code', async () => {
      await ComponentMasterService.create(validComponentData, userId);
      await expect(
        ComponentMasterService.create(validComponentData, userId),
      ).rejects.toThrow('already exists');
    });

    it('sets effectiveFrom to current date when not provided', async () => {
      const data = { ...validComponentData };
      delete (data as any).effectiveFrom;
      const result = await ComponentMasterService.create(data, userId);
      expect(result.effectiveFrom).toBeDefined();
    });
  });

  describe('list', () => {
    it('returns paginated components', async () => {
      await ComponentMaster.create([
        { ...validComponentData, code: 'HRA', name: 'HRA' },
        { ...validComponentData, code: 'DA', name: 'Dearness Allowance' },
        { ...validComponentData, code: 'PF', name: 'Provident Fund', type: 'deduction' },
      ]);

      const result = await ComponentMasterService.list({ page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
    });

    it('filters by type', async () => {
      await ComponentMaster.create([
        { ...validComponentData, code: 'HRA', name: 'HRA' },
        { ...validComponentData, code: 'PF', name: 'PF', type: 'deduction' },
      ]);

      const result = await ComponentMasterService.list({ type: 'deduction' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].code).toBe('PF');
    });

    it('filters by isActive', async () => {
      await ComponentMaster.create([
        { ...validComponentData, code: 'HRA', name: 'HRA', isActive: true },
        { ...validComponentData, code: 'DA', name: 'DA', isActive: false },
      ]);

      const result = await ComponentMasterService.list({ isActive: 'true' });
      expect(result.data.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns component by id', async () => {
      const created = await ComponentMasterService.create(validComponentData, userId);
      const result = await ComponentMasterService.getById(created.id);
      expect(result.code).toBe('HRA');
    });

    it('throws for non-existent id', async () => {
      await expect(
        ComponentMasterService.getById(new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow('not found');
    });
  });

  describe('update', () => {
    it('updates component fields', async () => {
      const created = await ComponentMasterService.create(validComponentData, userId);
      const updated = await ComponentMasterService.update(created.id, { name: 'HRA Updated', calcValue: 50 }, userId);
      expect(updated.name).toBe('HRA Updated');
      expect(updated.calcValue).toBe(50);
    });

    it('throws on duplicate code during update', async () => {
      await ComponentMasterService.create(validComponentData, userId);
      const second = await ComponentMasterService.create({ ...validComponentData, code: 'DA', name: 'DA' }, userId);
      await expect(
        ComponentMasterService.update(second.id, { code: 'HRA' }, userId),
      ).rejects.toThrow('already exists');
    });

    it('throws for non-existent id', async () => {
      await expect(
        ComponentMasterService.update(new mongoose.Types.ObjectId().toString(), { name: 'X' }, userId),
      ).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('deletes a component', async () => {
      const created = await ComponentMasterService.create(validComponentData, userId);
      await ComponentMasterService.delete(created.id, userId);
      await expect(ComponentMasterService.getById(created.id)).rejects.toThrow('not found');
    });

    it('throws for non-existent id', async () => {
      await expect(
        ComponentMasterService.delete(new mongoose.Types.ObjectId().toString(), userId),
      ).rejects.toThrow('not found');
    });
  });
});
