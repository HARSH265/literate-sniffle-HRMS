import Shift from '../../models/Shift.model.js';
import Employee from '../../models/Employee.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { CacheService } from '../../core/cache/CacheService.js';
import { CACHE_KEYS } from '../../core/cache/cache.keys.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class ShiftsService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (queryParams.status) {
      filter.isActive = queryParams.status === 'active';
    }

    if (queryParams.applicableTo) {
      filter.applicableTo = { $in: [queryParams.applicableTo, 'all'] };
    }

    const cached = CacheService.get<{ data: unknown[]; meta: PaginationMeta }>(CACHE_KEYS.SHIFTS);
    if (cached && !search && page === 1 && limit === 20) {
      return cached;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [shifts, total] = await Promise.all([
      Shift.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Shift.countDocuments(filter),
    ]);

    const data: unknown[] = shifts.map((s) => {
      const { _id, ...rest } = s as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);
    const result: { data: unknown[]; meta: PaginationMeta } = { data, meta };

    if (!search && page === 1 && limit === 20) {
      CacheService.set(CACHE_KEYS.SHIFTS, result, 3600);
    }

    return result;
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const shift = await Shift.findById(id).lean();
    if (!shift) {
      throw new AppError('Shift not found or already deleted', 404);
    }
    return { ...shift, id: shift._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, createdById: string) {
    const existing = await Shift.findOne({ name: data.name as string });
    if (existing) {
      throw new AppError('Shift name already exists', 400);
    }

    const shift = await Shift.create({
      ...data,
      isActive: true,
      createdBy: createdById,
    });

    CacheService.invalidateShifts();

    await AuditService.log({
      action: 'create',
      module: 'shifts',
      userId: createdById,
      targetId: shift._id.toString(),
      details: { name: data.name },
    });

    return { ...shift.toObject(), id: shift._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const shift = await Shift.findById(id);
    if (!shift) {
      throw new AppError('Shift not found or already deleted', 404);
    }

    const startTime = (data.startTime as string) || shift.startTime;
    const endTime = (data.endTime as string) || shift.endTime;

    if (data.startTime && data.endTime) {
      const isNightShift = startTime > endTime;
      if (!isNightShift && startTime >= endTime) {
        throw new AppError('End time must be greater than start time', 400);
      }
    }

    if (data.name) shift.name = data.name as string;
    if (data.startTime) shift.startTime = data.startTime as string;
    if (data.endTime) shift.endTime = data.endTime as string;
    if (data.workingHours) shift.workingHours = data.workingHours as number;
    if (data.applicableTo) shift.applicableTo = data.applicableTo as 'all' | 'worker' | 'office-staff';
    if (data.isActive !== undefined) shift.isActive = data.isActive as boolean;

    await shift.save();
    CacheService.invalidateShifts();

    await AuditService.log({
      action: 'update',
      module: 'shifts',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    return { ...shift.toObject(), id: shift._id.toString(), _id: undefined };
  }

  static async delete(id: string, deletedById: string) {
    const shift = await Shift.findById(id);
    if (!shift) {
      throw new AppError('Shift not found or already deleted', 404);
    }

    const employeeCount = await Employee.countDocuments({ shift: id });
    if (employeeCount > 0) {
      throw new AppError(`Cannot delete shift with ${employeeCount} assigned employees. Please reassign employees first.`, 400);
    }

    await Shift.findByIdAndDelete(id);
    CacheService.invalidateShifts();

    await AuditService.log({
      action: 'delete',
      module: 'shifts',
      userId: deletedById,
      targetId: id,
    });
  }
}