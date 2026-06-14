import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import Employee from '../../../models/Employee.model.js';
import EmployeeCounter from '../../../models/EmployeeCounter.model.js';
import Department from '../../../models/Department.model.js';
import Designation from '../../../models/Designation.model.js';
import Shift from '../../../models/Shift.model.js';
import { EmployeesService } from '../employees.service.js';
import { AppError } from '../../../core/errors/AppError.js';
import { encryptBankDetails, decryptBankDetails } from '../../../core/utils/EncryptionUtil.js';
import EmployeeSkill from '../../../models/EmployeeSkill.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';

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
  await EmployeeCounter.deleteMany({});
});

// Mock the FileUploadService to prevent actual external calls
vi.mock('../../../../core/file/FileUploadService.js', () => ({
  FileUploadService: {
    uploadFromBuffer: vi.fn().mockResolvedValue('https://res.cloudinary.com/fakepath'),
    getPublicIdFromUrl: vi.fn().mockReturnValue('fakePublicId'),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

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

      await EmployeesService.archive(emp._id.toString(), new mongoose.Types.ObjectId().toString(), 'super-admin');

      const found = await Employee.findById(emp._id);
      expect(found!.status).toBe('archived');
    });

    it('throws on non-existent id', async () => {
      await expect(
        EmployeesService.archive(new mongoose.Types.ObjectId().toString(), new mongoose.Types.ObjectId().toString(), 'super-admin'),
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

  describe('bulkAssignShift', () => {
  it('assigns shift to multiple employees', async () => {
    // create a new shift
    const newShift = await Shift.create({ name: 'Evening', startTime: '14:00', endTime: '22:00', workingHours: 8 });
    // create employees
    const emp1 = await Employee.create({ ...baseEmployee, employeeCode: 'EMP100', department: deptId, designation: desigId, shift: shiftId });
    const emp2 = await Employee.create({ ...baseEmployee, employeeCode: 'EMP101', department: deptId, designation: desigId, shift: shiftId });
    const result = await EmployeesService.bulkAssignShift(
      [emp1._id.toString(), emp2._id.toString()],
      newShift._id.toString(),
      new mongoose.Types.ObjectId().toString(),
      'super-admin',
    );
    expect(result.modifiedCount).toBe(2);
    const updated1 = await Employee.findById(emp1._id);
    const updated2 = await Employee.findById(emp2._id);
    expect(updated1!.shift?.toString()).toBe(newShift._id.toString());
    expect(updated2!.shift?.toString()).toBe(newShift._id.toString());
  });

  it('throws when shift does not exist', async () => {
    const emp = await Employee.create({ ...baseEmployee, employeeCode: 'EMP200', department: deptId, designation: desigId, shift: shiftId });
    await expect(
      EmployeesService.bulkAssignShift(
        [emp._id.toString()],
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        'super-admin',
      ),
    ).rejects.toThrow(AppError);
  });

  it('unauthorized non‑privileged role cannot modify others\' employees', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const otherId = new mongoose.Types.ObjectId().toString();
    const emp = await Employee.create({ ...baseEmployee, employeeCode: 'EMP300', department: deptId, designation: desigId, shift: shiftId, createdBy: ownerId });
    await expect(
      EmployeesService.bulkAssignShift([emp._id.toString()], shiftId, otherId, 'manager'),
    ).rejects.toThrow(AppError);
  });
});

describe('restore', () => {
  it('restores an archived employee', async () => {
    const emp = await Employee.create({ ...baseEmployee, employeeCode: 'EMP400', department: deptId, designation: desigId, shift: shiftId, status: 'archived' });
    const result = await EmployeesService.restore(emp._id.toString(), new mongoose.Types.ObjectId().toString(), 'super-admin') as any;
    expect(result.status).toBe('active');
  });

  it('throws when employee not archived', async () => {
    const emp = await Employee.create({ ...baseEmployee, employeeCode: 'EMP401', department: deptId, designation: desigId, shift: shiftId });
    await expect(
      EmployeesService.restore(emp._id.toString(), new mongoose.Types.ObjectId().toString(), 'super-admin')
    ).rejects.toThrow(AppError);
  });
});

describe('uploadDocument', () => {
  it('uploads a document and adds it to employee', async () => {
    const emp = await Employee.create({ ...baseEmployee, employeeCode: 'EMP500', department: deptId, designation: desigId, shift: shiftId });
    const file = {
      fieldname: 'file',
      originalname: 'contract.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 12345,
      buffer: Buffer.from('dummy'),
    };
    const docs = await EmployeesService.uploadDocument(emp._id.toString(), file, 'other', new mongoose.Types.ObjectId().toString());
    expect(docs).toHaveLength(1);
    const doc = docs[0];
    expect(doc.type).toBe('other');
    expect(doc.fileName).toBe('contract.pdf');
    expect(doc.filePath).toBe('https://res.cloudinary.com/fakepath');
  });
});

describe('removeDocument', () => {
  it('removes a document and deletes from Cloudinary', async () => {
    const emp = await Employee.create({
      ...baseEmployee,
      employeeCode: 'EMP600',
      department: deptId,
      designation: desigId,
      shift: shiftId,
      documents: [{ _id: new mongoose.Types.ObjectId(), type: 'other', fileName: 'contract.pdf', filePath: 'https://res.cloudinary.com/fakepath', uploadedAt: new Date() }],
    });
    const docId = (emp.documents as any)[0]._id.toString();
    const updatedDocs = await EmployeesService.removeDocument(emp._id.toString(), docId, new mongoose.Types.ObjectId().toString());
    expect(updatedDocs).toHaveLength(0);
    // Ensure Cloudinary delete was called
    const { FileUploadService } = await import('../../../../core/file/FileUploadService.js');
    expect(FileUploadService.delete).toHaveBeenCalled();
  });

  it('throws when document not found', async () => {
    const emp = await Employee.create({ ...baseEmployee, employeeCode: 'EMP601', department: deptId, designation: desigId, shift: shiftId });
    await expect(
      EmployeesService.removeDocument(emp._id.toString(), new mongoose.Types.ObjectId().toString(), new mongoose.Types.ObjectId().toString())
    ).rejects.toThrow(AppError);
  });
});

describe('getDocumentUrl', () => {
  it('returns URL for valid document', async () => {
    const emp = await Employee.create({
      ...baseEmployee,
      employeeCode: 'EMP700',
      department: deptId,
      designation: desigId,
      shift: shiftId,
      documents: [{ _id: new mongoose.Types.ObjectId(), type: 'other', fileName: 'contract.pdf', filePath: 'https://res.cloudinary.com/fakepath', uploadedAt: new Date() }],
    });
    const url = await EmployeesService.getDocumentUrl(emp._id.toString(), (emp.documents as any)[0]._id.toString(), 'manager');
    expect(url).toBe('https://res.cloudinary.com/fakepath');
  });

  it('throws if employee is archived and user lacks permission', async () => {
    const emp = await Employee.create({
      ...baseEmployee,
      employeeCode: 'EMP701',
      department: deptId,
      designation: desigId,
      shift: shiftId,
      status: 'archived',
      documents: [{ _id: new mongoose.Types.ObjectId(), type: 'other', fileName: 'contract.pdf', filePath: 'https://res.cloudinary.com/fakepath', uploadedAt: new Date() }],
    });
    await expect(
      EmployeesService.getDocumentUrl(emp._id.toString(), (emp.documents as any)[0]._id.toString(), 'manager')
    ).rejects.toThrow(AppError);
  });

  it('throws on disallowed host', async () => {
    const emp = await Employee.create({
      ...baseEmployee,
      employeeCode: 'EMP702',
      department: deptId,
      designation: desigId,
      shift: shiftId,
      documents: [{ _id: new mongoose.Types.ObjectId(), type: 'other', fileName: 'contract.pdf', filePath: 'https://example.com/file', uploadedAt: new Date() }],
    });
    await expect(
      EmployeesService.getDocumentUrl(emp._id.toString(), (emp.documents as any)[0]._id.toString(), 'super-admin')
    ).rejects.toThrow(AppError);
  });
});

describe('importEmployees', () => {
  it('imports rows successfully', async () => {
    const row = {
      number: 2,
      values: [null, 'EMP900', 'John Doe', 'Robert Doe', 'worker', 'permanent', 'Production', 'Operator', 'General', '2024-01-01', 'monthly', '25000', '0', 'yes'],
    };
    const result = await EmployeesService.importEmployees([row], new mongoose.Types.ObjectId().toString());
    expect(result.success).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('fails on duplicate employee code', async () => {
    await Employee.create({
      employeeCode: 'EMP901',
      fullName: 'Existing',
      fatherName: 'Father',
      category: 'worker',
      employmentType: 'permanent',
      department: deptId,
      designation: desigId,
      shift: shiftId,
      joiningDate: new Date(),
      salaryType: 'monthly',
      baseSalary: 20000,
    });
    const rowDup = {
      number: 3,
      values: [null, 'EMP901', 'Jane', 'Doe', 'worker', 'permanent', 'Production', 'Operator', 'General', '2024-01-01', 'monthly', '26000', '0', 'yes'],
    };
    const result = await EmployeesService.importEmployees([rowDup], new mongoose.Types.ObjectId().toString());
    expect(result.success).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('already exists');
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
