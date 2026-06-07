import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import SalaryStructure from '../../../models/SalaryStructure.model.js';
import Employee from '../../../models/Employee.model.js';
import ComponentMaster from '../../../models/ComponentMaster.model.js';
import User from '../../../models/User.model.js';
import { SalaryStructureService } from '../salaryStructure.service.js';

let userId: string;
let employeeId: string;
let componentId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'SS Admin',
    email: 'ssadmin@test.com',
    password: 'TestPass1!',
    role: 'hr-admin',
  });
  userId = user._id.toString();

  const emp = await Employee.create({
    fullName: 'Test Employee',
    employeeCode: 'EMP001',
    fatherName: 'Father Name',
    category: 'worker',
    employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(),
    joiningDate: new Date('2024-01-01'),
    salaryType: 'monthly',
    baseSalary: 30000,
    status: 'active',
  });
  employeeId = emp._id.toString();

  const comp = await ComponentMaster.create({
    code: 'BASIC',
    name: 'Basic Salary',
    type: 'earning',
    calcType: 'fixed',
    calcValue: 30000,
    effectiveFrom: new Date('2024-01-01'),
  });
  componentId = comp._id.toString();
});

beforeEach(async () => {
  await SalaryStructure.deleteMany({});
});

const validStructureData = {
  employee: '' as string,
  effectiveFrom: '2024-01-01',
  components: [{ component: '' as string, monthlyAmount: 30000, calcType: 'fixed', calcValue: 30000, isActive: true }],
  totalCtc: 360000,
  grossMonthly: 30000,
  netMonthly: 26000,
};

function getValidData() {
  return {
    ...validStructureData,
    employee: employeeId,
    components: [{ component: componentId, monthlyAmount: 30000, calcType: 'fixed', calcValue: 30000, isActive: true }],
  };
}

describe('SalaryStructureService', () => {
  describe('create', () => {
    it('creates a salary structure', async () => {
      const data = getValidData();
      const result = await SalaryStructureService.create(data, userId);
      expect(result.employee).toBeDefined();
      expect(result.totalCtc).toBe(360000);
      expect(result.isCurrent).toBe(true);
    });

    it('marks previous structures as not current', async () => {
      const data = getValidData();
      await SalaryStructureService.create(data, userId);
      const updated = await SalaryStructureService.create({ ...data, effectiveFrom: '2024-06-01', totalCtc: 400000 }, userId);
      expect(updated.totalCtc).toBe(400000);

      const structures = await SalaryStructure.find({ employee: employeeId });
      const currents = structures.filter((s: any) => s.isCurrent);
      expect(currents.length).toBe(1);
    });
  });

  describe('list', () => {
    it('returns paginated structures', async () => {
      const data = getValidData();
      await SalaryStructureService.create(data, userId);
      await SalaryStructureService.create({ ...data, effectiveFrom: '2024-06-01' }, userId);

      const result = await SalaryStructureService.list({ page: 1, limit: 10 });
      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(2);
    });

    it('filters by employee', async () => {
      const data = getValidData();
      await SalaryStructureService.create(data, userId);

      const result = await SalaryStructureService.list({ employee: employeeId });
      expect(result.data.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns structure by id', async () => {
      const created = await SalaryStructureService.create(getValidData(), userId);
      const result = await SalaryStructureService.getById(created.id);
      expect(result.totalCtc).toBe(360000);
    });

    it('throws for non-existent id', async () => {
      await expect(
        SalaryStructureService.getById(new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow('not found');
    });
  });

  describe('getByEmployee', () => {
    it('returns all structures for an employee', async () => {
      const data = getValidData();
      await SalaryStructureService.create(data, userId);
      await SalaryStructureService.create({ ...data, effectiveFrom: '2024-06-01' }, userId);

      const result = await SalaryStructureService.getByEmployee(employeeId);
      expect(result.length).toBe(2);
    });
  });

  describe('update', () => {
    it('updates structure fields', async () => {
      const created = await SalaryStructureService.create(getValidData(), userId);
      const updated = await SalaryStructureService.update(created.id, { totalCtc: 400000 }, userId);
      expect(updated.totalCtc).toBe(400000);
    });

    it('throws for non-existent id', async () => {
      await expect(
        SalaryStructureService.update(new mongoose.Types.ObjectId().toString(), { totalCtc: 100 }, userId),
      ).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('deletes a structure', async () => {
      const created = await SalaryStructureService.create(getValidData(), userId);
      await SalaryStructureService.delete(created.id, userId);
      await expect(SalaryStructureService.getById(created.id)).rejects.toThrow('not found');
    });

    it('throws for non-existent id', async () => {
      await expect(
        SalaryStructureService.delete(new mongoose.Types.ObjectId().toString(), userId),
      ).rejects.toThrow('not found');
    });
  });
});
