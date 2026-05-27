import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Employee from '../../../models/Employee.model.js';
import User from '../../../models/User.model.js';
import Department from '../../../models/Department.model.js';
import Designation from '../../../models/Designation.model.js';
import Shift from '../../../models/Shift.model.js';
import EssChangeRequest from '../../../models/EssChangeRequest.model.js';
import CompanySettings from '../../../models/CompanySettings.model.js';
import { EssService } from '../ess.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let employeeId: string;
let userId: string;
let userIdWithoutEmployee: string;
let deptId: string;
let desigId: string;
let shiftId: string;

beforeAll(async () => {
  await CompanySettings.deleteMany({});
  await CompanySettings.create({});

  const dept = await Department.create({ name: 'Test Dept', code: 'TEST', isActive: true });
  deptId = dept._id.toString();
  const desig = await Designation.create({ name: 'Test Desig', department: dept._id, isActive: true });
  desigId = desig._id.toString();
  const shift = await Shift.create({ name: 'Test Shift', startTime: '09:00', endTime: '18:00', workingHours: 9, isActive: true });
  shiftId = shift._id.toString();

  const emp = await Employee.create({
    employeeCode: 'ESS001',
    fullName: 'Test Employee',
    fatherName: 'Father Name',
    category: 'worker',
    employmentType: 'permanent',
    department: dept._id,
    designation: desig._id,
    shift: shift._id,
    joiningDate: new Date('2023-01-01'),
    salaryType: 'monthly',
    baseSalary: 20000,
    contactNumber: '1234567890',
    address: 'Test Address',
  });
  employeeId = emp._id.toString();

  const user = await User.create({
    name: 'ESS User',
    email: 'ess@test.com',
    password: 'TestPass1!',
    role: 'hr-staff',
    employeeId: emp._id,
  });
  userId = user._id.toString();

  const userNoEmp = await User.create({
    name: 'No Employee',
    email: 'noemp@test.com',
    password: 'TestPass1!',
    role: 'hr-staff',
  });
  userIdWithoutEmployee = userNoEmp._id.toString();
});

beforeEach(async () => {
  await EssChangeRequest.deleteMany({});
});

describe('EssService', () => {
  describe('getProfile', () => {
    it('returns employee profile for linked user', async () => {
      const result = await EssService.getProfile(userId) as any;
      expect(result.fullName).toBe('Test Employee');
      expect(result.employeeCode).toBe('ESS001');
      expect(result.editableFields).toBeDefined();
    });

    it('returns message when user has no linked employee', async () => {
      const result = await EssService.getProfile(userIdWithoutEmployee);
      expect((result as any).message).toContain('No employee linked');
    });

    it('throws when ESS is disabled', async () => {
      await CompanySettings.updateOne({}, { $set: { 'employeeSelfService.essEnabled': false } });
      await expect(EssService.getProfile(userId)).rejects.toThrow(AppError);
      await CompanySettings.updateOne({}, { $set: { 'employeeSelfService.essEnabled': true } });
    });
  });

  describe('updateProfile', () => {
    it('directly updates when approval not required', async () => {
      await CompanySettings.updateOne({}, { $set: { 'employeeSelfService.changeRequiresApproval': false } });
      const result = await EssService.updateProfile(userId, { contactNumber: '9999999999' }) as any;
      expect(result.message).toBe('Profile updated successfully');
      const emp = await Employee.findById(employeeId);
      expect(emp!.contactNumber).toBe('9999999999');
      await CompanySettings.updateOne({}, { $set: { 'employeeSelfService.changeRequiresApproval': true } });
    });

    it('creates change request when approval required', async () => {
      const result = await EssService.updateProfile(userId, { contactNumber: '8888888888' }) as any;
      expect(result.message).toContain('submitted for approval');
      const requests = await EssChangeRequest.find({ employee: employeeId });
      expect(requests.length).toBe(1);
      expect(requests[0].field).toBe('contactNumber');
      expect(requests[0].status).toBe('pending');
    });
  });

  describe('requestChange', () => {
    it('creates a change request', async () => {
      await CompanySettings.updateOne({}, { $set: { 'employeeSelfService.allowAddressUpdate': true } });
      const result = await EssService.requestChange(userId, {
        field: 'address',
        newValue: 'New Address',
        notes: 'Moving to new location',
      }) as any;
      expect(result.requestId).toBeDefined();

      const request = await EssChangeRequest.findById(result.requestId);
      expect(request).toBeDefined();
      expect(request!.field).toBe('address');
      expect(request!.newValue).toBe('New Address');
      expect(request!.status).toBe('pending');
    });

    it('rejects uneditable field', async () => {
      await expect(EssService.requestChange(userId, { field: 'baseSalary', newValue: 50000 })).rejects.toThrow(AppError);
    });
  });

  describe('approveChange', () => {
    it('approves pending request and updates employee', async () => {
      const request = await EssChangeRequest.create({
        employee: employeeId,
        field: 'contactNumber',
        oldValue: '1234567890',
        newValue: '7777777777',
        status: 'pending',
      });

      await EssService.approveChange(request._id.toString(), userId);

      const updated = await EssChangeRequest.findById(request._id);
      expect(updated!.status).toBe('approved');
      expect(updated!.approvedAt).toBeDefined();

      const emp = await Employee.findById(employeeId);
      expect(emp!.contactNumber).toBe('7777777777');
    });

    it('rejects already processed request', async () => {
      const request = await EssChangeRequest.create({
        employee: employeeId,
        field: 'contactNumber',
        oldValue: '1234567890',
        newValue: '7777777777',
        status: 'approved',
      });

      await expect(EssService.approveChange(request._id.toString(), userId)).rejects.toThrow(AppError);
    });
  });

  describe('rejectChange', () => {
    it('rejects pending request with reason', async () => {
      const request = await EssChangeRequest.create({
        employee: employeeId,
        field: 'address',
        oldValue: 'Old',
        newValue: 'New',
        status: 'pending',
      });

      await EssService.rejectChange(request._id.toString(), userId, 'Not valid');

      const updated = await EssChangeRequest.findById(request._id);
      expect(updated!.status).toBe('rejected');
      expect(updated!.rejectionReason).toBe('Not valid');
    });
  });

  describe('getStats', () => {
    it('returns correct stats', async () => {
      await EssChangeRequest.create([
        { employee: employeeId, field: 'contactNumber', newValue: '1', status: 'pending' },
        { employee: employeeId, field: 'address', newValue: '2', status: 'approved' },
        { employee: employeeId, field: 'contactNumber', newValue: '3', status: 'rejected' },
      ]);

      const stats = await EssService.getStats() as any;
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
    });
  });
});
