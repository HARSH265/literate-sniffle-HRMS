import User from '../../models/User.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class UsersService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (queryParams.status) {
      filter.isActive = queryParams.status === 'active';
    }

    if (queryParams.role) {
      filter.role = queryParams.role;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const meta = PaginationUtil.getMeta(page, limit, total);

    const data: unknown[] = users.map((u) => {
      const { _id, ...rest } = u as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });

    const result: { data: unknown[]; meta: PaginationMeta } = { data, meta };

    return result;
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return { ...user, id: user._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, createdById: string) {
    const existing = await User.findOne({ email: (data.email as string).toLowerCase() });
    if (existing) {
      throw new AppError('Email already in use', 400);
    }

    const user = await User.create({ ...data, createdBy: createdById });
    await AuditService.log({
      action: 'create',
      module: 'users',
      userId: createdById,
      targetId: user._id.toString(),
      details: { email: data.email, role: data.role },
    });

    return { ...user.toObject(), id: user._id.toString(), _id: undefined, password: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.email) {
      const existing = await User.findOne({
        email: (data.email as string).toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        throw new AppError('Email already in use', 400);
      }
    }

    Object.assign(user, data);
    await user.save();

    await AuditService.log({
      action: 'update',
      module: 'users',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    return { ...user.toObject(), id: user._id.toString(), _id: undefined, password: undefined };
  }

  static async delete(id: string, deletedById: string) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await User.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'users',
      userId: deletedById,
      targetId: id,
    });
  }
}