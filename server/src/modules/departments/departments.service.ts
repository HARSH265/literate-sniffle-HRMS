import Department from '../../models/Department.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { CacheService } from '../../core/cache/CacheService.js';
import { CACHE_KEYS } from '../../core/cache/cache.keys.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class DepartmentsService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (queryParams.status) {
      filter.isActive = queryParams.status === 'active';
    }

    const cached = CacheService.get<{ data: unknown[]; meta: PaginationMeta }>(CACHE_KEYS.DEPARTMENTS);
    if (cached && !search && page === 1 && limit === 20) {
      return cached;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [departments, total] = await Promise.all([
      Department.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Department.countDocuments(filter),
    ]);

    const data: unknown[] = departments.map((d) => {
      const { _id, ...rest } = d as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);
    const result: { data: unknown[]; meta: PaginationMeta } = { data, meta };

    if (!search && page === 1 && limit === 20) {
      CacheService.set(CACHE_KEYS.DEPARTMENTS, result, 3600);
    }

    return result;
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const dept = await Department.findById(id).lean();
    if (!dept) {
      throw new AppError('Department not found or already deleted', 404);
    }
    return { ...dept, id: dept._id.toString(), _id: undefined };
  }

  static async generateNextDepartmentCode(): Promise<string> {
    const settings = await CompanySettings.findOne().lean() as any;
    const config = settings?.departmentCodeConfig || { prefix: 'DEPT', startNumber: 1, padding: 3, isAutoGenerate: true };
    const { prefix, startNumber, padding } = config;

    const lastDept = await Department.findOne({ code: { $regex: `^${prefix}` } })
      .sort({ code: -1 })
      .select('code')
      .lean();

    let nextNumber = startNumber;
    if (lastDept) {
      const lastCode = (lastDept as any).code as string;
      const numPart = parseInt(lastCode.replace(prefix, ''), 10);
      if (!isNaN(numPart)) {
        nextNumber = numPart + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(padding, '0')}`;
  }

  static async create(data: Record<string, unknown>, createdById: string) {
    const settings = await CompanySettings.findOne().lean() as any;
    const isAutoGenerate = settings?.departmentCodeConfig?.isAutoGenerate !== false;

    let code = (data.code as string) || '';

    if (!code) {
      if (!isAutoGenerate) {
        throw new AppError('Department code is required when auto-generation is disabled', 400);
      }
      code = await this.generateNextDepartmentCode();
    }

    const existing = await Department.findOne({
      $or: [
        { name: (data.name as string) },
        { code: code.toUpperCase() },
      ],
    });
    if (existing) {
      throw new AppError('Department name or code already exists', 400);
    }

    const dept = await Department.create({
      ...data,
      code: code.toUpperCase(),
      isActive: true,
      createdBy: createdById,
    });

    CacheService.invalidateDepartments();

    await AuditService.log({
      action: 'create',
      module: 'departments',
      userId: createdById,
      targetId: dept._id.toString(),
      details: { name: data.name, code },
    });

    return { ...dept.toObject(), id: dept._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const dept = await Department.findById(id);
    if (!dept) {
      throw new AppError('Department not found or already deleted', 404);
    }

    if (data.code) {
      const existing = await Department.findOne({
        code: (data.code as string).toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) {
        throw new AppError('Department code already exists', 400);
      }
    }

    if (data.name) dept.name = data.name as string;
    if (data.code) dept.code = (data.code as string).toUpperCase();
    if (data.description !== undefined) dept.description = data.description as string;
    if (data.isActive !== undefined) dept.isActive = data.isActive as boolean;

    await dept.save();

    CacheService.invalidateDepartments();

    await AuditService.log({
      action: 'update',
      module: 'departments',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    return { ...dept.toObject(), id: dept._id.toString(), _id: undefined };
  }

  static async delete(id: string, deletedById: string) {
    const dept = await Department.findById(id);
    if (!dept) {
      throw new AppError('Department not found or already deleted', 404);
    }

    const employeeCount = await Employee.countDocuments({ department: id });
    if (employeeCount > 0) {
      throw new AppError(`Cannot delete department with ${employeeCount} assigned employees. Please reassign employees first.`, 400);
    }

    await Department.findByIdAndDelete(id);
    CacheService.invalidateDepartments();

    await AuditService.log({
      action: 'delete',
      module: 'departments',
      userId: deletedById,
      targetId: id,
    });
  }
}