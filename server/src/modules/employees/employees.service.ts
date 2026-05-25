import Employee from '../../models/Employee.model.js';
import User from '../../models/User.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { encryptBankDetails, decryptBankDetails } from '../../core/utils/EncryptionUtil.js';
import { NotificationService } from '../../core/notification/NotificationService.js';

const SALARY_ACCESS_ROLES = ['super-admin', 'hr-admin', 'hr-staff', 'accounts'];

const sanitizeEmployee = (emp: Record<string, unknown>, userRole: string): Record<string, unknown> => {
  const sanitized = { ...emp };
  
  const hasSalaryAccess = SALARY_ACCESS_ROLES.includes(userRole) || userRole === 'super-admin';
  
  if (!hasSalaryAccess) {
    delete sanitized.baseSalary;
    delete sanitized.dailyWage;
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

    const lastEmployee = await Employee.findOne({ employeeCode: { $regex: `^${prefix}` } })
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

  static async create(data: Record<string, unknown>, createdById: string, userRole: string) {
    const settings = await CompanySettings.findOne().lean() as any;
    const isAutoGenerate = settings?.employeeCodeConfig?.isAutoGenerate !== false;

    let employeeCode = (data.employeeCode as string) || '';

    if (!employeeCode) {
      if (!isAutoGenerate) {
        throw new AppError('Employee code is required when auto-generation is disabled', 400);
      }
      employeeCode = await this.generateNextEmployeeCode();
    }

    const existing = await Employee.findOne({ employeeCode: employeeCode.toUpperCase() });
    if (existing) {
      throw new AppError('Employee code already exists', 400);
    }

    const encryptedData = {
      ...data,
      employeeCode: employeeCode.toUpperCase(),
      bankDetails: data.bankDetails ? encryptBankDetails(data.bankDetails as Record<string, unknown>) : undefined,
      createdBy: createdById,
    };

    const emp = await Employee.create(encryptedData);

    await AuditService.log({
      action: 'create',
      module: 'employees',
      userId: createdById,
      targetId: emp._id.toString(),
      details: { employeeCode, fullName: data.fullName },
    });

    const hrAdmins = await User.find({ role: { $in: ['super-admin', 'hr-admin', 'hr-staff'] } }).lean();
    for (const admin of hrAdmins) {
      await NotificationService.send({
        title: 'New Employee Added',
        message: `${data.fullName} (${employeeCode}) has been added to the system.`,
        type: 'info',
        recipient: admin._id.toString(),
        module: 'employees',
        link: `/employees/${emp._id.toString()}`,
      });
    }

    return this.getById(emp._id.toString(), userRole);
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string, userRole: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
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

    return this.getById(id, userRole);
  }

  static async delete(id: string, deletedById: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    emp.status = 'archived';
    emp.updatedBy = deletedById as any;
    await emp.save();

    await AuditService.log({
      action: 'archive',
      module: 'employees',
      userId: deletedById,
      targetId: id,
    });
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