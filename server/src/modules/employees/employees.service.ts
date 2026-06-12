import Employee from '../../models/Employee.model.js';
import mongoose from 'mongoose';
import Shift from '../../models/Shift.model.js';
import User from '../../models/User.model.js';
import Notification from '../../models/Notification.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { encryptBankDetails, decryptBankDetails } from '../../core/utils/EncryptionUtil.js';
import { RedisCacheService } from '../../core/cache/RedisCacheService.js';
import { CACHE_KEYS } from '../../core/cache/cache.keys.js';

const SALARY_ACCESS_ROLES = ['super-admin', 'hr-admin', 'hr-staff', 'accounts'];

const SENSITIVE_FIELDS = ['pfUAN', 'esiNumber', 'pfNumber', 'panNumber', 'aadhaarNumber'];

const sanitizeEmployee = (emp: Record<string, unknown>, userRole: string): Record<string, unknown> => {
  const sanitized = { ...emp };
  
  const hasSalaryAccess = SALARY_ACCESS_ROLES.includes(userRole) || userRole === 'super-admin';
  const hasFullAccess = userRole === 'super-admin' || ['hr-admin', 'hr-staff', 'accounts'].includes(userRole);
  
  if (!hasSalaryAccess) {
    delete sanitized.baseSalary;
    delete sanitized.dailyWage;
  }
  
  if (!hasFullAccess) {
    for (const field of SENSITIVE_FIELDS) {
      if (sanitized[field]) {
        const val = String(sanitized[field]);
        sanitized[field] = val.length > 4 ? '*'.repeat(val.length - 4) + val.slice(-4) : '****';
      }
    }
    // Mask employeeCode as a sensitive identifier for non-privileged roles
    if (sanitized['employeeCode']) {
      const val = String(sanitized['employeeCode']);
      sanitized['employeeCode'] = val.length > 4 ? '*'.repeat(val.length - 4) + val.slice(-4) : '****';
    }
  }
  
  if (emp.bankDetails) {
    const decrypted = decryptBankDetails(emp.bankDetails as Record<string, unknown>);
    const bankDetails = decrypted as Record<string, unknown>;
    sanitized.bankDetails = {
      bankName: bankDetails.bankName,
      accountNumber: bankDetails.accountNumber ? '****' + String(bankDetails.accountNumber).slice(-4) : undefined,
      ifscCode: bankDetails.ifscCode ? '****' + String(bankDetails.ifscCode).slice(-4) : undefined,
      accountType: bankDetails.accountType,
    };
  }
  
  return sanitized;
};

export class EmployeesService {
  static async list(queryParams: Record<string, unknown>, userRole: string): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { employeeCode: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { fullName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { fatherName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ];
    }

    if (queryParams.status) {
      filter.status = queryParams.status;
    } else {
      filter.status = { $ne: 'archived' };
    }

    if (queryParams.category) {
      filter.category = queryParams.category;
    }

    if (queryParams.department) {
      filter.department = queryParams.department;
    }

    if (queryParams.designation) {
      filter.designation = queryParams.designation;
    }

    if (queryParams.shift) {
      filter.shift = queryParams.shift;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const cacheKey = `${CACHE_KEYS.EMPLOYEES_LIST}:${userRole}:${JSON.stringify(queryParams)}`;
    return await RedisCacheService.getOrSet(cacheKey, async () => {
      const [employees, total] = await Promise.all([
        Employee.find(filter)
          .populate('department', 'name code')
          .populate('designation', 'name')
          .populate('shift', 'name')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Employee.countDocuments(filter),
      ]);

      const data: unknown[] = employees.map((e) => {
        const { _id, ...rest } = e as Record<string, unknown>;
        const emp = {
          ...rest,
          id: String(_id),
          _id: undefined,
          department: e.department ? { id: (e.department as any)._id.toString(), name: (e.department as any).name } : null,
          designation: e.designation ? { id: (e.designation as any)._id.toString(), name: (e.designation as any).name } : null,
          shift: e.shift ? { id: (e.shift as any)._id.toString(), name: (e.shift as any).name } : null,
        };
        return sanitizeEmployee(emp, userRole);
      });

      const meta = PaginationUtil.getMeta(page, limit, total);
      return { data, meta };
    }, 300);
  }

  static async getById(id: string, userRole: string): Promise<Record<string, unknown>> {
    const emp = await Employee.findById(id)
      .populate('department', 'name code')
      .populate('designation', 'name')
      .populate('shift', 'name')
      .lean();
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }
    const { _id, ...rest } = emp as Record<string, unknown>;
    const employee = {
      ...rest,
      id: String(_id),
      _id: undefined,
      department: (emp as any).department ? { id: ((emp as any).department as any)._id.toString(), name: ((emp as any).department as any).name } : null,
      designation: (emp as any).designation ? { id: ((emp as any).designation as any)._id.toString(), name: ((emp as any).designation as any).name } : null,
      shift: (emp as any).shift ? { id: ((emp as any).shift as any)._id.toString(), name: ((emp as any).shift as any).name } : null,
    };
    return sanitizeEmployee(employee, userRole);
  }

  static async generateNextEmployeeCode(): Promise<string> {
    const settings = await CompanySettings.findOne().lean() as any;
    const config = settings?.employeeCodeConfig || { prefix: 'EMP', startNumber: 1, padding: 3, isAutoGenerate: true };
    const { prefix, startNumber, padding } = config;

    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lastEmployee = await Employee.findOne({ employeeCode: { $regex: `^${escapedPrefix}` } })
      .sort({ employeeCode: -1 })
      .select('employeeCode')
      .lean();

    let nextNumber = startNumber;
    if (lastEmployee) {
      const lastCode = (lastEmployee as any).employeeCode as string;
      const numPart = parseInt(lastCode.replace(prefix, ''), 10);
      if (!isNaN(numPart)) {
        nextNumber = numPart + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(padding, '0')}`;
  }

  private static async getWorkingDaysPerMonth(): Promise<number> {
    const settings = await CompanySettings.findOne().lean() as any;
    return settings?.payrollConfig?.defaultWorkingDays || 26;
  }

  private static autoCalculateSalary(data: Record<string, unknown>, workingDays: number): void {
    const salaryType = data.salaryType as string | undefined;
    const baseSalary = data.baseSalary as number | undefined;
    const dailyWage = data.dailyWage as number | undefined;

    if (salaryType === 'monthly') {
      if (typeof baseSalary === 'number' && baseSalary > 0 && (!dailyWage || dailyWage === 0)) {
        data.dailyWage = Math.round((baseSalary / workingDays) * 100) / 100;
      }
    } else if (salaryType === 'daily') {
      if (typeof dailyWage === 'number' && dailyWage > 0 && (!baseSalary || baseSalary === 0)) {
        data.baseSalary = Math.round(dailyWage * 30);
      }
    }
  }

  static async create(data: Record<string, unknown>, createdById: string, userRole: string) {
    const settings = await CompanySettings.findOne().lean() as any;
    const isAutoGenerate = settings?.employeeCodeConfig?.isAutoGenerate !== false;

    const workingDays = settings?.payrollConfig?.defaultWorkingDays || 26;
    this.autoCalculateSalary(data, workingDays);

    const minimumWage = settings?.payrollConfig?.minimumWage;
    if (minimumWage && typeof data.baseSalary === 'number' && data.baseSalary < minimumWage) {
      throw new AppError(
        `Base salary (${data.baseSalary}) is below the configured minimum wage (${minimumWage})`,
        400,
        'VALIDATION_ERROR',
      );
    }

    let employeeCode = (data.employeeCode as string) || '';
    const isCustomCode = !!employeeCode;

    if (!employeeCode) {
      if (!isAutoGenerate) {
        throw new AppError('Employee code is required when auto-generation is disabled', 400);
      }
      employeeCode = await this.generateNextEmployeeCode();
    }

    const existing = await Employee.findOne({ employeeCode: employeeCode.toUpperCase() }).lean();
    if (existing) {
      throw new AppError(`Employee with code '${employeeCode}' already exists`, 400);
    }

    const encryptedData = {
      ...data,
      employeeCode: employeeCode.toUpperCase(),
      bankDetails: data.bankDetails ? encryptBankDetails(data.bankDetails as Record<string, unknown>) : undefined,
      createdBy: createdById,
    };

    let emp;
    if (isCustomCode) {
      emp = await Employee.create(encryptedData);
    } else {
      const MAX_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          emp = await Employee.create(attempt === 0 ? encryptedData : { ...encryptedData, employeeCode: await this.generateNextEmployeeCode() });
          break;
        } catch (err: any) {
          if (err.code === 11000 && attempt < MAX_RETRIES - 1) {
            continue;
          }
          throw err;
        }
      }
    }
    if (!emp) {
      throw new AppError('Failed to create employee after retries', 500);
    }

    await AuditService.log({
      action: 'create',
      module: 'employees',
      userId: createdById,
      targetId: emp._id.toString(),
      details: { employeeCode, fullName: data.fullName },
    });

    const hrAdmins = await User.find({ role: { $in: ['super-admin', 'hr-admin', 'hr-staff'] } }).lean();
    if (hrAdmins.length > 0) {
      const notifications = hrAdmins.map((admin) => ({
        title: 'New Employee Added',
        message: `${data.fullName} (${employeeCode}) has been added to the system.`,
        type: 'info' as const,
        recipient: admin._id,
        module: 'employees',
        link: `/employees/${emp._id.toString()}`,
      }));
      try {
        await Notification.insertMany(notifications, { ordered: false });
      } catch {
        // Log but don't fail if batch notification fails
      }
    }

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);
    return this.getById(emp._id.toString(), userRole);
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string, userRole: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    const workingDays = await this.getWorkingDaysPerMonth();
    this.autoCalculateSalary(data, workingDays);

    if (data.baseSalary !== undefined) {
      const settings = await CompanySettings.findOne().lean() as any;
      const minimumWage = settings?.payrollConfig?.minimumWage;
      if (minimumWage && typeof data.baseSalary === 'number' && data.baseSalary < minimumWage) {
        throw new AppError(
          `Base salary (${data.baseSalary}) is below the configured minimum wage (${minimumWage})`,
          400,
          'VALIDATION_ERROR',
        );
      }
    }

    const updateData = {
      ...data,
      bankDetails: data.bankDetails ? encryptBankDetails(data.bankDetails as Record<string, unknown>) : data.bankDetails,
      updatedBy: updatedById,
    };

    Object.assign(emp, updateData);
    await emp.save();

    await AuditService.log({
      action: 'update',
      module: 'employees',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);
    return this.getById(id, userRole);
  }

  static async delete(id: string, deletedById: string, userRole: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }
    // Resource‑level ownership: allow privileged roles or creator
    const privileged = ['super-admin', 'hr-admin', 'hr-staff'];
    const creatorId = (emp.createdBy as any)?.toString();
    if (!privileged.includes(userRole) && creatorId !== deletedById) {
      throw new AppError('Unauthorized to delete employee', 403);
    }

    emp.status = 'archived';
    emp.updatedBy = deletedById as unknown as mongoose.Types.ObjectId;
    await emp.save();

    await AuditService.log({
      action: 'archive',
      module: 'employees',
      userId: deletedById,
      targetId: id,
    });

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);
  }

  static async restore(id: string, restoredById: string, userRole: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    if (emp.status !== 'archived') {
      throw new AppError('Only archived employees can be restored', 400);
    }

    const privileged = ['super-admin', 'hr-admin', 'hr-staff'];
    const creatorId = (emp.createdBy as any)?.toString();
    if (!privileged.includes(userRole) && creatorId !== restoredById) {
      throw new AppError('Unauthorized to restore employee', 403);
    }

    emp.status = 'active';
    emp.updatedBy = restoredById as unknown as mongoose.Types.ObjectId;
    await emp.save();

    await AuditService.log({
      action: 'update',
      module: 'employees',
      userId: restoredById,
      targetId: id,
    });

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);
    return this.getById(id, userRole);
  }

  static async bulkAssignShift(employeeIds: string[], shiftId: string, updatedById: string, userRole: string) {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    const privileged = ['super-admin', 'hr-admin', 'hr-staff'];
    if (!privileged.includes(userRole)) {
      const ownedEmployees = await Employee.find({
        _id: { $in: employeeIds },
        createdBy: updatedById,
      }).select('_id').lean();
      const ownedIds = new Set(ownedEmployees.map((e) => e._id.toString()));
      const unauthorized = employeeIds.filter((id) => !ownedIds.has(id));
      if (unauthorized.length > 0) {
        throw new AppError('Unauthorized to modify some employees', 403);
      }
    }

    const result = await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { $set: { shift: shiftId as unknown as mongoose.Types.ObjectId, updatedBy: updatedById as unknown as mongoose.Types.ObjectId } },
    );

    await AuditService.log({
      action: 'bulk-update',
      module: 'employees',
      userId: updatedById,
      targetId: shiftId,
      targetName: `Bulk shift assign: ${shift.name}`,
      details: { shiftId, employeeCount: result.modifiedCount },
    });

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);
    return { modifiedCount: result.modifiedCount };
  }

  static async updatePhoto(id: string, photoUrl: string, updatedById: string, userRole: string = 'super-admin') {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    emp.photo = photoUrl;
    emp.updatedBy = updatedById as any;
    await emp.save();

    return this.getById(id, userRole);
  }
}