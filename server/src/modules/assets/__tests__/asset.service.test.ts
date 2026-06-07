import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Asset from '../../../models/Asset.model.js';
import User from '../../../models/User.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';
import Employee from '../../../models/Employee.model.js';
import { AssetService } from '../asset.service.js';

let userId: string;
let employeeId: string;

beforeAll(async () => {
  await CompanySettings.deleteMany({});
  await CompanySettings.create({});

  const user = await User.create({
    name: 'Asset Admin',
    email: 'asset@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();

  const employee = await Employee.create({
    employeeCode: 'AST001',
    fullName: 'Test Employee',
    fatherName: 'Father',
    category: 'office-staff',
    employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(),
    joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly',
    baseSalary: 30000,
  });
  employeeId = employee._id.toString();
});

beforeEach(async () => {
  await Asset.deleteMany({});
});

describe('AssetService', () => {
  describe('create', () => {
    it('creates an asset with auto-generated code', async () => {
      const result = await AssetService.create(
        { name: 'Dell Laptop', category: 'Laptop', brand: 'Dell', serialNumber: 'SN001' },
        userId,
      );
      expect(result.name).toBe('Dell Laptop');
      expect(result.category).toBe('Laptop');
      expect(result.assetCode).toMatch(/^AST\d{4}$/);
      expect(result.status).toBe('available');
      expect(result.createdBy.toString()).toBe(userId);
    });

    it('throws when asset management is disabled', async () => {
      await CompanySettings.updateOne({}, { $set: { 'assetConfig.assetManagementEnabled': false } });
      await expect(
        AssetService.create({ name: 'Test', category: 'Laptop' }, userId),
      ).rejects.toThrow('Asset management is disabled');
      await CompanySettings.updateOne({}, { $set: { 'assetConfig.assetManagementEnabled': true } });
    });

    it('throws on duplicate serial number', async () => {
      await AssetService.create({ name: 'Asset 1', category: 'Laptop', serialNumber: 'SN-DUP' }, userId);
      await expect(
        AssetService.create({ name: 'Asset 2', category: 'Laptop', serialNumber: 'SN-DUP' }, userId),
      ).rejects.toThrow('serial number already exists');
    });

    it('increments asset code', async () => {
      const a1 = await AssetService.create({ name: 'Asset 1', category: 'Laptop' }, userId);
      const a2 = await AssetService.create({ name: 'Asset 2', category: 'Monitor' }, userId);
      const code1 = parseInt(a1.assetCode.replace('AST', ''), 10);
      const code2 = parseInt(a2.assetCode.replace('AST', ''), 10);
      expect(code2).toBe(code1 + 1);
    });
  });

  describe('list', () => {
    it('returns paginated assets', async () => {
      await Asset.create([
        { assetCode: 'AST0001', name: 'A1', category: 'Laptop', status: 'available', createdBy: userId },
        { assetCode: 'AST0002', name: 'A2', category: 'Laptop', status: 'available', createdBy: userId },
        { assetCode: 'AST0003', name: 'A3', category: 'Monitor', status: 'allocated', createdBy: userId },
      ]);

      const result = await AssetService.list({ page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('filters by status', async () => {
      await Asset.create([
        { assetCode: 'AST0010', name: 'Available', category: 'Laptop', status: 'available', createdBy: userId },
        { assetCode: 'AST0011', name: 'Allocated', category: 'Laptop', status: 'allocated', createdBy: userId },
      ]);

      const result = await AssetService.list({ status: 'allocated' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Allocated');
    });

    it('filters by category', async () => {
      await Asset.create([
        { assetCode: 'AST0020', name: 'Lap', category: 'Laptop', status: 'available', createdBy: userId },
        { assetCode: 'AST0021', name: 'Mon', category: 'Monitor', status: 'available', createdBy: userId },
      ]);

      const result = await AssetService.list({ category: 'Monitor' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Mon');
    });

    it('searches by name or code', async () => {
      await Asset.create([
        { assetCode: 'AST0030', name: 'Dell Laptop', category: 'Laptop', status: 'available', createdBy: userId },
        { assetCode: 'AST0031', name: 'HP Monitor', category: 'Monitor', status: 'available', createdBy: userId },
      ]);

      const result = await AssetService.list({ search: 'Dell' });
      expect(result.data.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns asset by id', async () => {
      const created = await AssetService.create({ name: 'Get Test', category: 'Laptop' }, userId);
      const result = await AssetService.getById(created._id.toString());
      expect(result).toBeDefined();
      expect(result!.name).toBe('Get Test');
    });

    it('returns null for non-existent id', async () => {
      const result = await AssetService.getById(new mongoose.Types.ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates asset fields', async () => {
      const created = await AssetService.create(
        { name: 'Original', category: 'Laptop', location: 'Floor 1' },
        userId,
      );
      const updated = await AssetService.update(
        created._id.toString(),
        { name: 'Updated Name', location: 'Floor 2' },
        userId,
      );
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.location).toBe('Floor 2');
    });

    it('throws for non-existent id', async () => {
      await expect(
        AssetService.update(
          new mongoose.Types.ObjectId().toString(),
          { name: 'Nope' },
          userId,
        ),
      ).rejects.toThrow('Asset not found');
    });
  });

  describe('allocate', () => {
    it('allocates an available asset', async () => {
      const asset = await AssetService.create({ name: 'To Allocate', category: 'Laptop' }, userId);
      const result = await AssetService.allocate(asset._id.toString(), employeeId, 'Initial allocation', userId);
      expect(result!.status).toBe('allocated');
      expect((result!.assignedTo as any)._id.toString()).toBe(employeeId);
      expect(result!.history.length).toBe(1);
      expect(result!.history[0].action).toBe('allocated');
    });

    it('throws when allocating a retired asset', async () => {
      const asset = await AssetService.create({ name: 'Retired', category: 'Laptop' }, userId);
      await Asset.findByIdAndUpdate(asset._id, { $set: { status: 'retired' } });
      await expect(
        AssetService.allocate(asset._id.toString(), employeeId, undefined, userId),
      ).rejects.toThrow('Cannot allocate a retired asset');
    });

    it('throws when allocating already allocated asset without multiple allocation', async () => {
      const asset = await AssetService.create({ name: 'Allocated', category: 'Laptop' }, userId);
      await AssetService.allocate(asset._id.toString(), employeeId, undefined, userId);
      await expect(
        AssetService.allocate(asset._id.toString(), employeeId, undefined, userId),
      ).rejects.toThrow('already allocated');
    });

    it('throws for non-existent id', async () => {
      await expect(
        AssetService.allocate(
          new mongoose.Types.ObjectId().toString(),
          employeeId,
          undefined,
          userId,
        ),
      ).rejects.toThrow('Asset not found');
    });
  });

  describe('returnAsset', () => {
    it('returns an allocated asset', async () => {
      const asset = await AssetService.create({ name: 'To Return', category: 'Laptop' }, userId);
      await AssetService.allocate(asset._id.toString(), employeeId, undefined, userId);
      const result = await AssetService.returnAsset(asset._id.toString(), 'Good', 'Returned in good condition', userId);
      expect(result!.status).toBe('available');
      expect(result!.assignedTo).toBeNull();
      expect(result!.condition).toBe('Good');
      expect(result!.history.length).toBe(2);
      expect(result!.history[1].action).toBe('returned');
    });

    it('throws when returning a non-allocated asset', async () => {
      const asset = await AssetService.create({ name: 'Available', category: 'Laptop' }, userId);
      await expect(
        AssetService.returnAsset(asset._id.toString(), undefined, undefined, userId),
      ).rejects.toThrow('not currently allocated');
    });
  });

  describe('markMaintenance', () => {
    it('marks available asset as maintenance', async () => {
      const asset = await AssetService.create({ name: 'For Maintenance', category: 'Laptop' }, userId);
      const result = await AssetService.markMaintenance(asset._id.toString(), 'Needs repair', userId);
      expect(result!.status).toBe('maintenance');
      expect(result!.history[0].action).toBe('maintenance');
    });

    it('throws when marking retired asset as maintenance', async () => {
      const asset = await AssetService.create({ name: 'Retired', category: 'Laptop' }, userId);
      await Asset.findByIdAndUpdate(asset._id, { $set: { status: 'retired' } });
      await expect(
        AssetService.markMaintenance(asset._id.toString(), undefined, userId),
      ).rejects.toThrow('Cannot mark a retired asset');
    });
  });

  describe('retire', () => {
    it('retires an asset', async () => {
      const asset = await AssetService.create({ name: 'To Retire', category: 'Laptop' }, userId);
      const result = await AssetService.retire(asset._id.toString(), 'End of life', userId);
      expect(result!.status).toBe('retired');
      expect(result!.history[0].action).toBe('retired');
    });

    it('throws when retiring already retired asset', async () => {
      const asset = await AssetService.create({ name: 'Already Retired', category: 'Laptop' }, userId);
      await AssetService.retire(asset._id.toString(), undefined, userId);
      await expect(
        AssetService.retire(asset._id.toString(), undefined, userId),
      ).rejects.toThrow('already retired');
    });
  });

  describe('getEmployeeAssets', () => {
    it('returns assets allocated to an employee', async () => {
      const a1 = await AssetService.create({ name: 'Asset 1', category: 'Laptop' }, userId);
      const a2 = await AssetService.create({ name: 'Asset 2', category: 'Monitor' }, userId);
      await AssetService.allocate(a1._id.toString(), employeeId, undefined, userId);
      await AssetService.allocate(a2._id.toString(), employeeId, undefined, userId);

      const result = await AssetService.getEmployeeAssets(employeeId);
      expect(result.length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', async () => {
      await Asset.create([
        { assetCode: 'AST0100', name: 'A', category: 'Laptop', status: 'available', createdBy: userId },
        { assetCode: 'AST0101', name: 'B', category: 'Laptop', status: 'allocated', createdBy: userId },
        { assetCode: 'AST0102', name: 'C', category: 'Monitor', status: 'maintenance', createdBy: userId },
      ]);

      const stats = await AssetService.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byStatus.available).toBe(1);
      expect(stats.byStatus.allocated).toBe(1);
      expect(stats.byStatus.maintenance).toBe(1);
      expect(stats.byCategory.Laptop).toBe(2);
      expect(stats.byCategory.Monitor).toBe(1);
    });
  });

  describe('getHistory', () => {
    it('returns asset history', async () => {
      const asset = await AssetService.create({ name: 'History Test', category: 'Laptop' }, userId);
      await AssetService.allocate(asset._id.toString(), employeeId, 'First alloc', userId);
      await AssetService.returnAsset(asset._id.toString(), 'Good', 'First return', userId);

      const history = await AssetService.getHistory(asset._id.toString());
      expect(history.length).toBe(2);
      expect(history[0].action).toBe('allocated');
      expect(history[1].action).toBe('returned');
    });
  });
});
