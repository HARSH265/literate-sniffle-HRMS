import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Employee from '../../../models/Employee.model.js';
import Department from '../../../models/Department.model.js';
import Designation from '../../../models/Designation.model.js';
import Shift from '../../../models/Shift.model.js';
import { EmployeesService } from '../employees.service.js';
import { AppError } from '../../../core/errors/AppError.js';
import { encryptBankDetails, decryptBankDetails } from '../../../core/utils/EncryptionUtil.js';

let deptId: string;
let desigId: string;
let shiftId: string;

const baseEmployee = {
  fullName: 'John Doe',
  fatherName: 'Jane Doe',
  category: 'worker' as const,
  employmentType: 'permanent' as const,
  joiningDate: new Date('2025-01-15'),
  salaryType: 'monthly' as const,
  baseSalary: 25000,
  dailyWage: 0,
  overtimeEligible: false,
  contactNumber: '9876543210',
};

beforeAll(async () => {
  const dept = await Department.create({ name: 'Production', code: 'PROD' });
  deptId = dept._id.toString();

  const desig = await Designation.create({ name: 'Operator', department: deptId });
  desigId = desig._id.toString();

  const shift = await Shift.create({ name: 'General', startTime: '09:00', endTime: '18:00', workingHours: 9 });
  shiftId = shift._id.toString();
});

beforeEach(async () => {
  await Employee.deleteMany({});
});

describe('EmployeesService', () => {
  describe('generateNextEmployeeCode', () => {
    it('generates default code when no employees exist', async () => {
      const code = await EmployeesService.generateNextEmployeeCode();
      expect(code).toMatch(/^EMP\d{3}$/);
      expect(code).toBe('EMP001');
    });

    it('increments code from last employee', async () => {
      await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP005',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      const code = await EmployeesService.generateNextEmployeeCode();
      expect(code).toBe('EMP006');
    });
  });

  describe('create', () => {
    it('creates an employee with auto-generated code', async () => {
      const result = await EmployeesService.create(
        { ...baseEmployee, department: deptId, designation: desigId, shift: shiftId },
        new mongoose.Types.ObjectId().toString(),
        'super-admin',
      ) as any;

      expect(result).toHaveProperty('id');
      expect(result.fullName).toBe('John Doe');
      expect(result.employeeCode).toBe('EMP001');
    });

    it('creates employee with custom code', async () => {
      const result = await EmployeesService.create(
        {
          ...baseEmployee,
          employeeCode: 'CUST001',
          department: deptId,
          designation: desigId,
          shift: shiftId,
        },
        new mongoose.Types.ObjectId().toString(),
        'super-admin',
      ) as any;

      expect(result.employeeCode).toBe('CUST001');
    });

    it('throws on duplicate employee code', async () => {
      await Employee.create({
        ...baseEmployee,
        employeeCode: 'DUP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      await expect(
        EmployeesService.create(
          { ...baseEmployee, employeeCode: 'DUP001', department: deptId, designation: desigId, shift: shiftId },
          new mongoose.Types.ObjectId().toString(),
          'super-admin',
        ),
      ).rejects.toThrow(AppError);
    });

    it('encrypts bank details on create', async () => {
      const result = await EmployeesService.create(
        {
          ...baseEmployee,
          department: deptId,
          designation: desigId,
          shift: shiftId,
          bankDetails: {
            bankName: 'SBI',
            accountNumber: '123456789012345',
            ifscCode: 'SBIN0123456',
            accountType: 'savings' as const,
          },
        },
        new mongoose.Types.ObjectId().toString(),
        'super-admin',
      ) as any;

      expect(result.bankDetails).toBeDefined();
      expect(result.bankDetails.accountNumber).toMatch(/^\*{4}\d{4}$/);
    });
  });

  describe('getById', () => {
    it('returns employee by id', async () => {
      const emp = await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      const result = await EmployeesService.getById(emp._id.toString(), 'super-admin') as any;
      expect(result.id).toBe(emp._id.toString());
      expect(result.fullName).toBe('John Doe');
    });

    it('throws on non-existent id', async () => {
      await expect(
        EmployeesService.getById(new mongoose.Types.ObjectId().toString(), 'super-admin'),
      ).rejects.toThrow(AppError);
    });
  });

  describe('list', () => {
    it('returns paginated employees', async () => {
      await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      const result = await EmployeesService.list({}, 'super-admin');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('filters by status', async () => {
      await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
        status: 'active',
      });
      await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP002',
        department: deptId,
        designation: desigId,
        shift: shiftId,
        status: 'inactive',
      });

      const result = await EmployeesService.list({ status: 'inactive' }, 'super-admin');
      expect(result.data).toHaveLength(1);
      expect((result.data[0] as any).employeeCode).toBe('EMP002');
    });

    it('sanitizes salary for non-privileged roles', async () => {
      await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      const result = await EmployeesService.list({}, 'manager') as any;
      expect(result.data[0].baseSalary).toBeUndefined();
      expect(result.data[0].dailyWage).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates employee fields', async () => {
      const emp = await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      const result = await EmployeesService.update(
        emp._id.toString(),
        { fullName: 'Jane Doe' },
        new mongoose.Types.ObjectId().toString(),
        'super-admin',
      ) as any;

      expect(result.fullName).toBe('Jane Doe');
    });

    it('throws on non-existent id', async () => {
      await expect(
        EmployeesService.update(
          new mongoose.Types.ObjectId().toString(),
          { fullName: 'Test' },
          new mongoose.Types.ObjectId().toString(),
          'super-admin',
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('archives employee instead of hard delete', async () => {
      const emp = await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      await EmployeesService.delete(emp._id.toString(), new mongoose.Types.ObjectId().toString());

      const found = await Employee.findById(emp._id);
      expect(found!.status).toBe('archived');
    });

    it('throws on non-existent id', async () => {
      await expect(
        EmployeesService.delete(new mongoose.Types.ObjectId().toString(), new mongoose.Types.ObjectId().toString()),
      ).rejects.toThrow(AppError);
    });
  });

  describe('updatePhoto', () => {
    it('updates employee photo', async () => {
      const emp = await Employee.create({
        ...baseEmployee,
        employeeCode: 'EMP001',
        department: deptId,
        designation: desigId,
        shift: shiftId,
      });

      const result = await EmployeesService.updatePhoto(
        emp._id.toString(),
        'https://example.com/photo.jpg',
        new mongoose.Types.ObjectId().toString(),
        'super-admin',
      ) as any;

      expect(result.photo).toBe('https://example.com/photo.jpg');
    });

    it('throws on non-existent id', async () => {
      await expect(
        EmployeesService.updatePhoto(
          new mongoose.Types.ObjectId().toString(),
          'photo-url',
          new mongoose.Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('encryptBankDetails', () => {
    it('encrypts and decrypts bank account number', () => {
      const details = {
        bankName: 'SBI',
        accountNumber: '123456789012345',
        ifscCode: 'SBIN0123456',
        accountType: 'savings',
      };

      const encrypted = encryptBankDetails(details);
      expect(encrypted!.accountNumber).not.toBe(details.accountNumber);
      expect(encrypted!.ifscCode).not.toBe(details.ifscCode);

      const decrypted = decryptBankDetails(encrypted);
      expect(decrypted!.accountNumber).toBe(details.accountNumber);
      expect(decrypted!.ifscCode).toBe(details.ifscCode);
    });

    it('returns undefined for undefined input', () => {
      expect(encryptBankDetails(undefined)).toBeUndefined();
      expect(decryptBankDetails(undefined)).toBeUndefined();
    });
  });
});
