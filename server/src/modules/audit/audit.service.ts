import AuditLog from '../../models/AuditLog.model.js';
import { Response } from 'express';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { PaginationUtil } from '../../core/utils/PaginationUtil.js';
import { getActionLabel, getModuleLabel } from '../../core/audit/AuditUtils.js';

export class AuditService {
  static async list(query: Record<string, unknown>, res: Response) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = String(query.sort || 'createdAt');
    const order = query.order === 'asc' ? 1 : -1;

    const filter: Record<string, unknown> = {};
    if (query.module) filter.module = query.module;
    if (query.action) filter.action = query.action;
    if (query.userId) filter.userId = query.userId;
    if (query.targetId) filter.targetId = query.targetId;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(String(query.startDate));
      if (query.endDate) (filter.createdAt as Record<string, unknown>).$lte = new Date(String(query.endDate) + 'T23:59:59.999Z');
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

    const data = logs.map((log: any) => ({
      _id: log._id,
      action: log.action,
      actionLabel: getActionLabel(log.action),
      module: log.module,
      moduleLabel: getModuleLabel(log.module),
      userId: log.userId,
      targetId: log.targetId,
      targetName: log.targetName,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      responseTime: log.responseTime,
      createdAt: log.createdAt,
    }));

    const meta = PaginationUtil.getMeta(page, limit, total);
    return ResponseHandler.paginated(res, data, meta);
  }

  static async getModules() {
    const modules = await AuditLog.distinct('module').lean();
    return modules.map((m: string) => ({ value: m, label: getModuleLabel(m) }));
  }

  static async getActions() {
    const actions = await AuditLog.distinct('action').lean();
    return actions.map((a: string) => ({ value: a, label: getActionLabel(a) }));
  }

  static async exportLogs(query: Record<string, unknown>) {
    const filter: Record<string, unknown> = {};
    if (query.module) filter.module = query.module;
    if (query.action) filter.action = query.action;
    if (query.userId) filter.userId = query.userId;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(String(query.startDate));
      if (query.endDate) (filter.createdAt as Record<string, unknown>).$lte = new Date(String(query.endDate) + 'T23:59:59.999Z');
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    return logs.map((log: any) => ({
      'Date & Time': new Date(log.createdAt).toLocaleString(),
      'Action': getActionLabel(log.action),
      'Module': getModuleLabel(log.module),
      'User Name': log.userId?.name || 'Unknown',
      'User Email': log.userId?.email || 'Unknown',
      'Target ID': log.targetId || '-',
      'Target Name': log.targetName || '-',
      'Details': log.details ? JSON.stringify(log.details) : '-',
      'IP Address': log.ipAddress || '-',
      'User Agent': log.userAgent || '-',
      'HTTP Method': log.method || '-',
      'Path': log.path || '-',
      'Status Code': log.statusCode || '-',
      'Response Time (ms)': log.responseTime || '-',
      'Timestamp': log.createdAt,
    }));
  }

  static async getStats() {
    const total = await AuditLog.countDocuments();
    const last24h = await AuditLog.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const last7d = await AuditLog.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    const oldest = await AuditLog.findOne().sort({ createdAt: 1 }).lean();

    const byModule = await AuditLog.aggregate([
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byAction = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return {
      total,
      last24h,
      last7d,
      oldestDate: oldest ? (oldest as any).createdAt : null,
      byModule: byModule.map((m) => ({ module: getModuleLabel(m._id as string), count: m.count })),
      byAction: byAction.map((a) => ({ action: getActionLabel(a._id as string), count: a.count })),
    };
  }

  static async getRetentionInfo() {
    const total = await AuditLog.countDocuments();
    const oldest = await AuditLog.findOne().sort({ createdAt: 1 }).lean();
    const oldestDate = oldest ? new Date((oldest as any).createdAt) : null;
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const deletableCount = oldestDate && oldestDate < cutoffDate
      ? await AuditLog.countDocuments({ createdAt: { $lt: cutoffDate } })
      : 0;

    return {
      totalLogs: total,
      oldestDate: oldestDate?.toISOString() || null,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      deletableCount,
      message: deletableCount > 0
        ? `Found ${deletableCount} logs older than ${retentionDays} days that can be cleaned up.`
        : `All logs are within the ${retentionDays}-day retention period.`,
    };
  }

  static async deleteOldLogs(cutoffDate: Date): Promise<{ deletedCount: number }> {
    const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });
    return { deletedCount: result.deletedCount || 0 };
  }
}