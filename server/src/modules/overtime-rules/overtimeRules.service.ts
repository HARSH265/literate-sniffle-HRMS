import OvertimeRule from '../../models/OvertimeRule.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class OvertimeRulesService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.applicableTo) filter.applicableTo = queryParams.applicableTo;
    if (queryParams.isActive !== undefined) filter.isActive = queryParams.isActive === 'true';

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [rules, total] = await Promise.all([
      OvertimeRule.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      OvertimeRule.countDocuments(filter),
    ]);

    const data = rules.map((r) => {
      const { _id, ...rest } = r as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const rule = await OvertimeRule.findById(id).lean();
    if (!rule) throw new AppError('Overtime rule not found', 404);
    return { ...rule, id: rule._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const rule = await OvertimeRule.create({ ...data, createdBy: userId });

    await AuditService.log({
      action: 'create',
      module: 'overtime-rules',
      userId,
      targetId: rule._id.toString(),
      details: { name: data.name, multiplier: data.multiplier },
    });

    return { ...rule.toObject(), id: rule._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const rule = await OvertimeRule.findById(id);
    if (!rule) throw new AppError('Overtime rule not found', 404);

    Object.assign(rule, data);
    await rule.save();

    await AuditService.log({
      action: 'update',
      module: 'overtime-rules',
      userId,
      targetId: id,
      details: data,
    });

    return { ...rule.toObject(), id: rule._id.toString(), _id: undefined };
  }

  static async delete(id: string, userId: string) {
    const rule = await OvertimeRule.findById(id);
    if (!rule) throw new AppError('Overtime rule not found', 404);

    await OvertimeRule.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'overtime-rules',
      userId,
      targetId: id,
    });
  }
}