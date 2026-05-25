import Designation from '../../models/Designation.model.js';
import Department from '../../models/Department.model.js';
import Employee from '../../models/Employee.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { CacheService } from '../../core/cache/CacheService.js';
import { CACHE_KEYS } from '../../core/cache/cache.keys.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class DesignationsService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    if (queryParams.department) {
      filter.department = queryParams.department;
    }

    if (queryParams.status) {
      filter.isActive = queryParams.status === 'active';
    }

    const cached = CacheService.get<{ data: unknown[]; meta: PaginationMeta }>(CACHE_KEYS.DESIGNATIONS);
    if (cached && !search && !queryParams.department && page === 1 && limit === 20) {
      return cached;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [designations, total] = await Promise.all([
      Designation.find(filter)
        .populate('department', 'name code')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Designation.countDocuments(filter),
    ]);

    const data = designations.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      department: d.department ? { id: (d.department as any)._id.toString(), name: (d.department as any).name, code: (d.department as any).code } : null,
      isActive: d.isActive,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    const meta = PaginationUtil.getMeta(page, limit, total);
    const result = { data, meta };

    if (!search && !queryParams.department && page === 1 && limit === 20) {
      CacheService.set(CACHE_KEYS.DESIGNATIONS, result, 3600);
    }

    return result;
  }

  static async getById(id: string) {
    const des = await Designation.findById(id).populate('department', 'name code').lean();
    if (!des) {
      throw new AppError('Designation not found or already deleted', 404);
    }
    return {
      id: des._id.toString(),
      name: des.name,
      department: des.department ? { id: (des.department as any)._id.toString(), name: (des.department as any).name, code: (des.department as any).code } : null,
      isActive: des.isActive,
      createdAt: des.createdAt,
      updatedAt: des.updatedAt,
    };
  }

  static async create(data: Record<string, unknown>, createdById: string) {
    const deptExists = await Department.exists({ _id: data.department });
    if (!deptExists) {
      throw new AppError('Department not found', 400);
    }

    const existing = await Designation.findOne({
      name: data.name as string,
      department: data.department,
    });
    if (existing) {
      throw new AppError('Designation already exists in this department', 400);
    }

    const des = await Designation.create({
      ...data,
      isActive: true,
      createdBy: createdById,
    });

    CacheService.invalidateDesignations();

    await AuditService.log({
      action: 'create',
      module: 'designations',
      userId: createdById,
      targetId: des._id.toString(),
      details: { name: data.name, department: data.department },
    });

    const populated = await Designation.findById(des._id).populate('department', 'name code').lean();
    return {
      id: populated!._id.toString(),
      name: populated!.name,
      department: populated!.department ? { id: (populated!.department as any)._id.toString(), name: (populated!.department as any).name, code: (populated!.department as any).code } : null,
      isActive: populated!.isActive,
      createdAt: populated!.createdAt,
      updatedAt: populated!.updatedAt,
    };
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const des = await Designation.findById(id);
    if (!des) {
      throw new AppError('Designation not found or already deleted', 404);
    }

    if (data.department) {
      const deptExists = await Department.exists({ _id: data.department });
      if (!deptExists) {
        throw new AppError('Department not found', 400);
      }
    }

    if (data.name && data.department) {
      const existing = await Designation.findOne({
        name: data.name as string,
        department: data.department,
        _id: { $ne: id },
      });
      if (existing) {
        throw new AppError('Designation already exists in this department', 400);
      }
    }

    if (data.name) des.name = data.name as string;
    if (data.department) des.department = data.department as any;
    if (data.isActive !== undefined) des.isActive = data.isActive as boolean;
    des.updatedBy = updatedById as any;

    await des.save();

    CacheService.invalidateDesignations();

    await AuditService.log({
      action: 'update',
      module: 'designations',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    const populated = await Designation.findById(des._id).populate('department', 'name code').lean();
    return {
      id: populated!._id.toString(),
      name: populated!.name,
      department: populated!.department ? { id: (populated!.department as any)._id.toString(), name: (populated!.department as any).name, code: (populated!.department as any).code } : null,
      isActive: populated!.isActive,
      createdAt: populated!.createdAt,
      updatedAt: populated!.updatedAt,
    };
  }

  static async delete(id: string, deletedById: string) {
    const des = await Designation.findById(id);
    if (!des) {
      throw new AppError('Designation not found or already deleted', 404);
    }

    const employeeCount = await Employee.countDocuments({ designation: id });
    if (employeeCount > 0) {
      throw new AppError(`Cannot delete designation with ${employeeCount} assigned employees. Please reassign employees first.`, 400);
    }

    await Designation.findByIdAndDelete(id);
    CacheService.invalidateDesignations();

    await AuditService.log({
      action: 'delete',
      module: 'designations',
      userId: deletedById,
      targetId: id,
    });
  }
}