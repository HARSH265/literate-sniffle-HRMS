import User from '../../models/User.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { NotificationService } from '../../core/notification/NotificationService.js';

export class UsersService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { email: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
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

    const superAdmins = await User.find({ role: 'super-admin' }).lean();
    for (const admin of superAdmins) {
      await NotificationService.send({
        title: 'New User Created',
        message: `User ${data.email} has been created with role: ${data.role}.`,
        type: 'info',
        recipient: admin._id.toString(),
        module: 'users',
        link: `/users/${user._id.toString()}/edit`,
      });
    }

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

    Object.assign(user, data, { updatedBy: updatedById });
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

  static async deactivate(id: string, deactivatedById: string) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (id === deactivatedById) {
      throw new AppError('You cannot deactivate your own account', 400);
    }

    if (user.role === 'super-admin') {
      const superAdminCount = await User.countDocuments({ role: 'super-admin', isActive: true });
      if (superAdminCount <= 1) {
        throw new AppError('Cannot deactivate the last super admin', 400);
      }
    }

    user.isActive = false;
    user.refreshToken = undefined;
    user.updatedBy = deactivatedById as any;
    await user.save();

    await AuditService.log({
      action: 'deactivate',
      module: 'users',
      userId: deactivatedById,
      targetId: id,
      targetName: user.name,
      details: { email: user.email, role: user.role },
    });

    return { id: user._id.toString(), isActive: false };
  }

  static async activate(id: string, activatedById: string) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = true;
    user.updatedBy = activatedById as any;
    await user.save();

    await AuditService.log({
      action: 'activate',
      module: 'users',
      userId: activatedById,
      targetId: id,
      targetName: user.name,
      details: { email: user.email, role: user.role },
    });

    return { id: user._id.toString(), isActive: true };
  }

  static async getUserActivity(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments({ userId }),
    ]);

    const meta = PaginationUtil.getMeta(page, limit, total);
    return { data: logs, meta };
  }

  static async getUserStats(userId: string) {
    const [totalActions, last24h, last7d, last30d, byModule, byAction] = await Promise.all([
      AuditLog.countDocuments({ userId }),
      AuditLog.countDocuments({ userId, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      AuditLog.countDocuments({ userId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      AuditLog.countDocuments({ userId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      AuditLog.aggregate([
        { $match: { userId: userId as any } },
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $match: { userId: userId as any } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      totalActions,
      last24h,
      last7d,
      last30d,
      byModule,
      byAction,
    };
  }

  static async exportUsers() {
    const users = await User.find({}).select('-password -refreshToken -passwordHistory').lean();
    return users.map((u: any) => ({
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Status: u.isActive ? 'Active' : 'Inactive',
      'Created At': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-',
      'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
    }));
  }

  static async importUsers(users: Array<{ name: string; email: string; password: string; role: string }>, createdById: string) {
    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const userData of users) {
      try {
        const existing = await User.findOne({ email: userData.email.toLowerCase() });
        if (existing) {
          existing.name = userData.name;
          existing.role = userData.role as any;
          existing.isActive = true;
          existing.updatedBy = createdById as any;
          await existing.save();
          results.updated++;
        } else {
          await User.create({
            ...userData,
            email: userData.email.toLowerCase(),
            createdBy: createdById,
          });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Failed to import ${userData.email}: ${err.message}`);
      }
    }

    return results;
  }
}