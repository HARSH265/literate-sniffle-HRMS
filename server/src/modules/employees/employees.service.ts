import Employee from '../../models/Employee.model.js';
import EmployeeCounter from '../../models/EmployeeCounter.model.js';
import mongoose from 'mongoose';
import Shift from '../../models/Shift.model.js';
import User from '../../models/User.model.js';
import Notification from '../../models/Notification.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { encryptBankDetails, decryptBankDetails, encryptIdField, decryptIdField } from '../../core/utils/EncryptionUtil.js';
import { RedisCacheService } from '../../core/cache/RedisCacheService.js';
import { CACHE_KEYS } from '../../core/cache/cache.keys.js';
import { logger } from '../../core/logger/logger.js';
import { refToIdName } from '../../core/utils/PopulateUtil.js';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const SALARY_ACCESS_ROLES = ['super-admin', 'hr-admin', 'hr-staff', 'accounts'];

const SENSITIVE_FIELDS = ['pfUAN', 'esiNumber', 'pfNumber', 'panNumber', 'aadhaarNumber'];

/** Lean shape for CompanySettings fields used by employees module */
interface CompanySettingsLean {
  employeeCodeConfig?: { prefix?: string; startNumber?: number; padding?: number; isAutoGenerate?: boolean };
  employeeDefaults?: { defaultCategory?: string; defaultEmploymentType?: string; defaultSalaryType?: string };
  payrollConfig?: { defaultWorkingDays?: number; minimumWage?: number };
  currency?: string;
}

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
  } else {
    if (emp.panNumber) sanitized.panNumber = decryptIdField(String(emp.panNumber));
    if (emp.aadhaarNumber) sanitized.aadhaarNumber = decryptIdField(String(emp.aadhaarNumber));
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
          department: refToIdName(e.department),
          designation: refToIdName(e.designation),
          shift: refToIdName(e.shift),
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
      department: refToIdName((emp as Record<string, unknown>).department),
      designation: refToIdName((emp as Record<string, unknown>).designation),
      shift: refToIdName((emp as Record<string, unknown>).shift),
    };
    return sanitizeEmployee(employee, userRole);
  }

  private static async getReportingChain(startId: string, targetId: string, maxDepth = 20): Promise<Set<string>> {
    const visited = new Set<string>();
    let currentId: string | null = startId;
    let depth = 0;

    while (currentId && depth < maxDepth) {
      if (currentId === targetId) {
        visited.add(currentId);
        break;
      }
      visited.add(currentId);
      const manager = await Employee.findById(currentId).select('reportingTo').lean() as { reportingTo?: mongoose.Types.ObjectId } | null;
      currentId = manager?.reportingTo ? String(manager.reportingTo) : null;
      depth++;
    }
    return visited;
  }

  static async getNextEmployeeCodePreview(): Promise<string> {
    const settings = await CompanySettings.findOne().lean() as unknown as CompanySettingsLean;
    const config = settings?.employeeCodeConfig || { prefix: 'EMP', padding: 3, startNumber: 1, isAutoGenerate: true };
    const prefix = config.prefix || 'EMP';
    const padding = config.padding || 3;

    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lastEmployee = await Employee.findOne({ employeeCode: { $regex: `^${escapedPrefix}` } })
      .sort({ employeeCode: -1 })
      .select('employeeCode')
      .lean();

    if (lastEmployee) {
      const lastCode = String((lastEmployee as Record<string, unknown>).employeeCode ?? '');
      const numPart = parseInt(lastCode.replace(prefix, ''), 10);
      if (!isNaN(numPart)) {
        return `${prefix}${String(numPart + 1).padStart(padding, '0')}`;
      }
    }
    return `${prefix}${String(config.startNumber || 1).padStart(padding, '0')}`;
  }

  static async generateNextEmployeeCode(): Promise<string> {
    const settings = await CompanySettings.findOne().lean() as unknown as CompanySettingsLean;
    const config = settings?.employeeCodeConfig || { prefix: 'EMP', padding: 3, startNumber: 1, isAutoGenerate: true };
    const prefix = config.prefix || 'EMP';
    const padding = config.padding || 3;

    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const MAX_RETRIES = 10;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Initialize counter from existing employees if it doesn't exist yet
      const existing = await EmployeeCounter.findById('employeeCode').lean();
      if (!existing) {
        const lastEmployee = await Employee.findOne({ employeeCode: { $regex: `^${escapedPrefix}` } })
          .sort({ employeeCode: -1 })
          .select('employeeCode')
          .lean();

        let seq = 0;
        if (lastEmployee) {
          const lastCode = String((lastEmployee as Record<string, unknown>).employeeCode ?? '');
          const numPart = parseInt(lastCode.replace(prefix, ''), 10);
          if (!isNaN(numPart)) {
            seq = numPart;
          }
        } else {
          seq = (config.startNumber || 1) - 1;
        }
        await EmployeeCounter.findByIdAndUpdate('employeeCode', { seq }, { upsert: true });
      }

      const counter = await EmployeeCounter.findByIdAndUpdate(
        'employeeCode',
        { $inc: { seq: 1 } },
        { new: true },
      );

      const code = `${prefix}${String(counter!.seq).padStart(padding, '0')}`;
      const conflict = await Employee.findOne({ employeeCode: code }).select('_id').lean();
      if (!conflict) {
        return code;
      }
    }
    throw new AppError('Failed to generate unique employee code after multiple attempts', 500);
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
        data.baseSalary = Math.round(dailyWage * workingDays);
      }
    }
  }

  static async create(data: Record<string, unknown>, createdById: string, userRole: string) {
    const settings = await CompanySettings.findOne().lean() as unknown as CompanySettingsLean;
    const isAutoGenerate = settings?.employeeCodeConfig?.isAutoGenerate !== false;

    const workingDays = settings?.payrollConfig?.defaultWorkingDays || 26;

    // Apply defaults from CompanySettings employeeDefaults when not explicitly provided
    const defaults = settings?.employeeDefaults;
    if (defaults) {
      if (!data.category && defaults.defaultCategory) data.category = defaults.defaultCategory;
      if (!data.employmentType && defaults.defaultEmploymentType) data.employmentType = defaults.defaultEmploymentType;
      if (!data.salaryType && defaults.defaultSalaryType) data.salaryType = defaults.defaultSalaryType;
    }

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

    if (data.email && typeof data.email === 'string' && data.email.trim()) {
      const existingEmail = await Employee.findOne({ email: data.email.trim().toLowerCase() }).lean();
      if (existingEmail) {
        throw new AppError(`Employee with email '${data.email}' already exists`, 400);
      }
    }

    const encryptedData = {
      ...data,
      employeeCode: employeeCode.toUpperCase(),
      bankDetails: data.bankDetails ? encryptBankDetails(data.bankDetails as Record<string, unknown>) : undefined,
      panNumber: data.panNumber ? encryptIdField(String(data.panNumber)) : data.panNumber,
      aadhaarNumber: data.aadhaarNumber ? encryptIdField(String(data.aadhaarNumber)) : data.aadhaarNumber,
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
      } catch (err) {
        logger.error('Failed to send new employee notifications', { error: err, employeeCode });
      }
    }

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);

    logger.info('Employee created', { employeeCode, fullName: data.fullName, createdById });
    return this.getById(emp._id.toString(), userRole);
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string, userRole: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    // Resource-level ownership: allow privileged roles or creator
    const privileged = ['super-admin', 'hr-admin', 'hr-staff'];
    const creatorId = emp.createdBy ? String(emp.createdBy) : null;
    if (!privileged.includes(userRole) && creatorId !== updatedById) {
      throw new AppError('Unauthorized to update employee', 403);
    }

    const previousVersion = emp.__v;

    if (data.reportingTo !== undefined && data.reportingTo !== '' && data.reportingTo !== null) {
      if (data.reportingTo === id) {
        throw new AppError('An employee cannot report to themselves', 400, 'VALIDATION_ERROR');
      }
      const ancestors = await EmployeesService.getReportingChain(data.reportingTo as string, id);
      if (ancestors.has(id)) {
        throw new AppError('Circular reporting chain detected — this assignment would create a loop', 400, 'VALIDATION_ERROR');
      }
    }

    const workingDays = (await CompanySettings.findOne().lean() as unknown as CompanySettingsLean)?.payrollConfig?.defaultWorkingDays || 26;
    this.autoCalculateSalary(data, workingDays);

    if (data.baseSalary !== undefined) {
      const settings = await CompanySettings.findOne().lean() as unknown as CompanySettingsLean;
      const minimumWage = settings?.payrollConfig?.minimumWage;
      if (minimumWage && typeof data.baseSalary === 'number' && data.baseSalary < minimumWage) {
        throw new AppError(
          `Base salary (${data.baseSalary}) is below the configured minimum wage (${minimumWage})`,
          400,
          'VALIDATION_ERROR',
        );
      }
    }

    const updateData: Record<string, unknown> = {
      ...data,
      updatedBy: updatedById,
    };
    // Only encrypt and include bankDetails when explicitly provided
    if (data.bankDetails) {
      updateData.bankDetails = encryptBankDetails(data.bankDetails as Record<string, unknown>);
    }
    if (data.panNumber !== undefined) {
      updateData.panNumber = data.panNumber ? encryptIdField(String(data.panNumber)) : data.panNumber;
    }
    if (data.aadhaarNumber !== undefined) {
      updateData.aadhaarNumber = data.aadhaarNumber ? encryptIdField(String(data.aadhaarNumber)) : data.aadhaarNumber;
    }

    // Optimistic lock: update only if version matches
    const updated = await Employee.findOneAndUpdate(
      { _id: id, __v: previousVersion },
      { $set: updateData, $inc: { __v: 1 } },
      { new: true },
    );
    if (!updated) {
      throw new AppError('Employee was modified by another user. Please refresh and try again.', 409, 'CONFLICT');
    }

    await AuditService.log({
      action: 'update',
      module: 'employees',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);
    logger.info('Employee updated', { id, updatedById, fields: Object.keys(data) });
    return this.getById(id, userRole);
  }

  static async archive(id: string, archivedById: string, userRole: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }
    // Resource‑level ownership: allow privileged roles or creator
    const privileged = ['super-admin', 'hr-admin', 'hr-staff'];
    const creatorId = emp.createdBy ? String(emp.createdBy) : null;
    if (!privileged.includes(userRole) && creatorId !== archivedById) {
      throw new AppError('Unauthorized to archive employee', 403);
    }

    emp.status = 'archived';
    emp.updatedBy = new mongoose.Types.ObjectId(archivedById);
    await emp.save();

    await AuditService.log({
      action: 'archive',
      module: 'employees',
      userId: archivedById,
      targetId: id,
    });

    await RedisCacheService.invalidate(CACHE_KEYS.EMPLOYEES_LIST);
    logger.info('Employee archived', { id, archivedById });

    // Cascade: delete EmployeeSkill records for archived employee
    try {
      const EmployeeSkill = (await import('../../models/EmployeeSkill.model.js')).default;
      await EmployeeSkill.deleteMany({ employee: id });
    } catch {
      // Non-critical — log but don't fail the archive
      logger.error('Failed to cascade-delete EmployeeSkill records on archive', { employeeId: id });
    }
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
    const creatorId = emp.createdBy ? String(emp.createdBy) : null;
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
    logger.info('Employee restored', { id, restoredById });
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

  static async updatePhoto(id: string, photoUrl: string, updatedById: string, userRole: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    emp.photo = photoUrl;
    emp.updatedBy = new mongoose.Types.ObjectId(updatedById);
    await emp.save();

    return this.getById(id, userRole);
  }

  static async uploadDocument(id: string, file: MulterFile, documentType: string, uploadedById: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    const { FileUploadService } = await import('../../core/file/FileUploadService.js');
    const filePath = await FileUploadService.uploadFromBuffer(file.buffer, `employees/${id}/documents`);

    const newDoc = {
      type: documentType || 'other',
      fileName: file.originalname,
      filePath,
      uploadedAt: new Date(),
    };

    if (!emp.documents) {
      emp.documents = [];
    }
    emp.documents!.push(newDoc as { _id?: mongoose.Types.ObjectId; type: 'aadhar' | 'pan' | 'voter' | 'driver_license' | 'passport' | 'other'; fileName: string; filePath: string; uploadedAt: Date });
    await emp.save();

    const uploadedDoc = emp.documents[emp.documents.length - 1];
    await AuditService.log({
      action: 'upload-document',
      module: 'employees',
      userId: uploadedById,
      targetId: emp._id.toString(),
      targetName: uploadedDoc.type,
      details: { documentId: uploadedDoc._id?.toString(), fileName: uploadedDoc.fileName },
    });

    return emp.documents;
  }

  static async removeDocument(id: string, docId: string, removedById: string) {
    // Step 1: Find employee and the specific document to get its filePath
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    const doc = (emp.documents || []).find((d: any) => d._id?.toString() === docId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    const filePath = doc.filePath;

    // Step 2: Atomically pull the subdocument — prevents concurrent delete race
    const updated = await Employee.findByIdAndUpdate(
      id,
      { $pull: { documents: { _id: docId } } },
      { new: true },
    );

    // Step 3: Delete from Cloudinary after atomic DB removal
    if (filePath) {
      try {
        const { FileUploadService } = await import('../../core/file/FileUploadService.js');
        const publicId = FileUploadService.getPublicIdFromUrl(filePath);
        await FileUploadService.delete(publicId);
      } catch {
        // Log but don't fail if Cloudinary deletion fails
      }
    }

    await AuditService.log({
      action: 'delete-document',
      module: 'employees',
      userId: removedById,
      targetId: updated!._id.toString(),
      targetName: 'employee-document',
      details: { documentId: docId },
    });

    return updated!.documents;
  }

  static async getDocumentUrl(id: string, docId: string, userRole: string): Promise<string> {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    if (emp.status === 'archived' && !['super-admin', 'hr-admin'].includes(userRole)) {
      throw new AppError('Access denied', 403);
    }

    const doc = (emp.documents || []).find((d: any) => d._id?.toString() === docId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    const filePath = doc.filePath as string;
    if (!filePath || (!filePath.startsWith('/') && !filePath.startsWith('http'))) {
      throw new AppError('Invalid document path', 500);
    }

    const allowedHosts = ['cloudinary.com', 'res.cloudinary.com'];
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        const isAllowed = allowedHosts.some(host => url.hostname.endsWith(host));
        if (!isAllowed) {
          throw new AppError('Document path not allowed', 403);
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError('Invalid document path', 500);
      }
    }

    return filePath;
  }

  static async importEmployees(rows: any[], importedById: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const Department = (await import('../../models/Department.model.js')).default;
    const Designation = (await import('../../models/Designation.model.js')).default;

    function escapeRegex(str: string): string {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const results = { success: 0, failed: 0, errors: [] as string[] };

    const allDeptNames = new Set<string>();
    const allDesigNames = new Set<string>();
    const allShiftNames = new Set<string>();
    const allEmpCodes = new Set<string>();
    const allEmails = new Set<string>();
    const rowData: { row: any; data: unknown[] }[] = [];

    for (const row of rows) {
      const values = row.values as unknown[];
      const data = Array.from(values).slice(1);
      const departmentName = data[5] ? String(data[5]).trim() : '';
      const designationName = data[6] ? String(data[6]).trim() : '';
      const shiftName = data[7] ? String(data[7]).trim() : '';
      const employeeCode = data[0] ? String(data[0]).trim() : '';
      const email = data[16] ? String(data[16]).trim().toLowerCase() : '';
      if (departmentName) allDeptNames.add(departmentName);
      if (designationName) allDesigNames.add(designationName);
      if (shiftName) allShiftNames.add(shiftName);
      if (employeeCode) allEmpCodes.add(employeeCode.toUpperCase());
      if (email) allEmails.add(email);
      rowData.push({ row, data });
    }

    const [departments, designations, shifts, existingEmployees, existingEmails] = await Promise.all([
      allDeptNames.size > 0 ? Department.find({ name: { $in: Array.from(allDeptNames).map(n => new RegExp(`^${escapeRegex(n)}$`, 'i')) } }) : [],
      allDesigNames.size > 0 ? Designation.find({ name: { $in: Array.from(allDesigNames).map(n => new RegExp(`^${escapeRegex(n)}$`, 'i')) } }) : [],
      allShiftNames.size > 0 ? Shift.find({ name: { $in: Array.from(allShiftNames).map(n => new RegExp(`^${escapeRegex(n)}$`, 'i')) } }) : [],
      allEmpCodes.size > 0 ? Employee.find({ employeeCode: { $in: Array.from(allEmpCodes) } }).select('employeeCode') : [],
      allEmails.size > 0 ? Employee.find({ email: { $in: Array.from(allEmails) } }).select('email') : [],
    ]);

    const deptMap = new Map(departments.map((d: any) => [d.name.toLowerCase(), d]));
    const desigMap = new Map(designations.map((d: any) => [d.name.toLowerCase(), d]));
    const shiftMap = new Map(shifts.map((s: any) => [s.name.toLowerCase(), s]));
    const empCodeSet = new Set(existingEmployees.map((e: any) => e.employeeCode.toUpperCase()));
    const emailSet = new Set(existingEmails.map((e: any) => e.email?.toLowerCase()).filter(Boolean));

    try {
      for (const { row, data } of rowData) {
        const employeeCode = data[0] ? String(data[0]).trim() : '';
        const fullName = data[1] ? String(data[1]).trim() : '';
        const fatherName = data[2] ? String(data[2]).trim() : '';

        const rawCategory = data[3] ? String(data[3]).trim().toLowerCase() : '';
        const category = rawCategory.includes('manufacturing') || rawCategory.includes('worker') ? 'worker' :
                         rawCategory.includes('office') ? 'office-staff' : 'worker';

        const employmentType = data[4] ? String(data[4]).trim().toLowerCase() : '';
        const departmentName = data[5] ? String(data[5]).trim() : '';
        const designationName = data[6] ? String(data[6]).trim() : '';
        const shiftName = data[7] ? String(data[7]).trim() : '';
        const joiningDate = data[8] ? String(data[8]).trim() : '';

        const rawSalaryType = data[9] ? String(data[9]).trim().toLowerCase() : '';
        const salaryType = rawSalaryType.includes('daily') ? 'daily' : 'monthly';

        const baseSalary = parseFloat(data[10] ? String(data[10]).trim() : '0');
        const dailyWage = parseFloat(data[11] ? String(data[11]).trim() : '0');
        const overtimeEligible = data[12] ? String(data[12]).trim().toLowerCase() === 'yes' : false;
        const status = data[13] ? String(data[13]).trim().toLowerCase() : 'active';
        const contactNumber = data[14] ? String(data[14]).trim() : '';
        const address = data[15] ? String(data[15]).trim() : '';
        const email = data[16] ? String(data[16]).trim().toLowerCase() : '';
        const panNumber = data[17] ? String(data[17]).trim() : '';
        const aadhaarNumber = data[18] ? String(data[18]).trim() : '';

        if (!employeeCode || !fullName || !fatherName) {
          results.failed++;
          results.errors.push(`Row ${row.number}: Missing required fields (code, name, or father name)`);
          continue;
        }

        const department = departmentName ? deptMap.get(departmentName.toLowerCase()) : null;
        const designation = designationName ? desigMap.get(designationName.toLowerCase()) : null;
        const shift = shiftName ? shiftMap.get(shiftName.toLowerCase()) : null;

        if (empCodeSet.has(employeeCode.toUpperCase())) {
          results.failed++;
          results.errors.push(`Row ${row.number}: Employee code ${employeeCode} already exists`);
          continue;
        }

        if (email && emailSet.has(email)) {
          results.failed++;
          results.errors.push(`Row ${row.number}: Email ${email} already exists`);
          continue;
        }

        try {
          await Employee.create({
            employeeCode: employeeCode.toUpperCase(),
            fullName,
            fatherName,
            category,
            employmentType,
            department: department?._id,
            designation: designation?._id,
            shift: shift?._id,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            salaryType,
            baseSalary,
            dailyWage,
            overtimeEligible,
            status,
            contactNumber,
            address,
            email: email || undefined,
            panNumber: panNumber ? encryptIdField(panNumber) : undefined,
            aadhaarNumber: aadhaarNumber ? encryptIdField(aadhaarNumber) : undefined,
            createdBy: new mongoose.Types.ObjectId(importedById),
          }, { session });

          empCodeSet.add(employeeCode.toUpperCase());
          if (email) emailSet.add(email);
          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Row ${row.number}: ${err.message || 'Creation failed'}`);
        }
      }
      await session.commitTransaction();
      session.endSession();
      return results;
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      const errorMessage = err instanceof AppError ? err.message : err.message || 'Import failed';
      throw new AppError(errorMessage, err.status || 500);
    }
  }
}