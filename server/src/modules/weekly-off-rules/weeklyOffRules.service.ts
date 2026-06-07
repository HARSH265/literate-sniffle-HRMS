import WeeklyOffRule from '../../models/WeeklyOffRule.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { CacheService } from '../../core/cache/CacheService.js';
import { CACHE_KEYS } from '../../core/cache/cache.keys.js';

export class WeeklyOffRulesService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (queryParams.category) {
      filter.category = queryParams.category;
    }

    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === 'true';
    }

    // Cached result for default first page
    const cached = CacheService.get<{ data: unknown[]; meta: PaginationMeta }>(CACHE_KEYS.WEEKLY_OFF_RULES);
    if (cached && page === 1 && limit === 20) {
      return cached;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [rules, total] = await Promise.all([
      WeeklyOffRule.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      WeeklyOffRule.countDocuments(filter),
    ]);

    const data: unknown[] = rules.map((r) => {
      const { _id, ...rest } = r as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);
    const result = { data, meta };

    // Store result for default first page to cache
    if (page === 1 && limit === 20) {
      CacheService.set(CACHE_KEYS.WEEKLY_OFF_RULES, result, 3600);
    }

    return result;
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const rule = await WeeklyOffRule.findById(id).lean();
    if (!rule) {
      throw new AppError('Weekly off rule not found or already deleted', 404);
    }
    return { ...rule, id: rule._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, createdById: string) {
    const category = data.category || 'all';
    const existing = await WeeklyOffRule.findOne({ category });
    if (existing) {
      throw new AppError(`Weekly off rule already exists for category: ${category}`, 400);
    }

    const rule = await WeeklyOffRule.create({
      ...data,
      createdBy: createdById,
    });

    CacheService.invalidateWeeklyOffRules();

    await AuditService.log({
      action: 'create',
      module: 'weekly-off-rules',
      userId: createdById,
      targetId: rule._id.toString(),
      details: { name: data.name, offDays: data.offDays },
    });

    return { ...rule.toObject(), id: rule._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const rule = await WeeklyOffRule.findById(id);
    if (!rule) {
      throw new AppError('Weekly off rule not found or already deleted', 404);
    }

    if (data.name) (rule as any).name = data.name;
    if (data.category) (rule as any).category = data.category;
    if (data.offDays) (rule as any).offDays = data.offDays;
    if (data.isActive !== undefined) (rule as any).isActive = data.isActive;

    (rule as any).updatedBy = updatedById;
    await (rule as any).save();

    CacheService.invalidateWeeklyOffRules();

    await AuditService.log({
      action: 'update',
      module: 'weekly-off-rules',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    return { ...(rule as any).toObject(), id: rule._id.toString(), _id: undefined };
  }

  static async delete(id: string, deletedById: string) {
    const rule = await WeeklyOffRule.findById(id);
    if (!rule) {
      throw new AppError('Weekly off rule not found or already deleted', 404);
    }

    await WeeklyOffRule.findByIdAndDelete(id);

    CacheService.invalidateWeeklyOffRules();

    await AuditService.log({
      action: 'delete',
      module: 'weekly-off-rules',
      userId: deletedById,
      targetId: id,
    });
  }
}
