import AuditLog from '../../models/AuditLog.model.js';
import { Response } from 'express';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { PaginationUtil } from '../../core/utils/PaginationUtil.js';

export class AuditService {
  static async list(query: Record<string, unknown>, res: Response) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const sort = String(query.sort || 'createdAt');
    const order = query.order === 'asc' ? 1 : -1;

    const filter: Record<string, unknown> = {};
    if (query.module) filter.module = query.module;
    if (query.action) filter.action = query.action;
    if (query.userId) filter.userId = query.userId;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(String(query.startDate));
      if (query.endDate) (filter.createdAt as Record<string, unknown>).$lte = new Date(String(query.endDate));
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email')
        .sort({ [sort]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const meta = PaginationUtil.getMeta(page, limit, total);
    return ResponseHandler.paginated(res, logs, meta);
  }

  static async getModules() {
    const modules = await AuditLog.distinct('module').lean();
    return modules;
  }
}