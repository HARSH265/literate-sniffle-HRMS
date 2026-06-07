import SalaryStructureTemplate from '../../models/SalaryStructureTemplate.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class SalaryStructureTemplateService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.isActive !== undefined) filter.isActive = queryParams.isActive === 'true';

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [templates, total] = await Promise.all([
      SalaryStructureTemplate.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      SalaryStructureTemplate.countDocuments(filter),
    ]);

    const data = templates.map((t) => {
      return { ...t, id: t._id.toString(), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const template = await SalaryStructureTemplate.findById(id).lean();
    if (!template) throw new AppError('Template not found or already deleted', 404);
    return { ...template, id: template._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const existing = await SalaryStructureTemplate.findOne({ name: data.name }).lean();
    if (existing) throw new AppError(`Template with name "${data.name}" already exists`, 409);

    const template = await SalaryStructureTemplate.create({ ...data, createdBy: userId });

    await AuditService.log({
      action: 'create',
      module: 'salary-structure-templates',
      userId,
      targetId: template._id.toString(),
      details: { name: data.name },
    });

    return { ...template.toObject(), id: template._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const template = await SalaryStructureTemplate.findById(id);
    if (!template) throw new AppError('Template not found or already deleted', 404);

    if (data.name && data.name !== template.name) {
      const existing = await SalaryStructureTemplate.findOne({ name: data.name, _id: { $ne: id } }).lean();
      if (existing) throw new AppError(`Template with name "${data.name}" already exists`, 409);
    }

    Object.assign(template, data, { updatedBy: userId });
    await template.save();

    await AuditService.log({
      action: 'update',
      module: 'salary-structure-templates',
      userId,
      targetId: id,
      details: data,
    });

    return { ...template.toObject(), id: template._id.toString(), _id: undefined };
  }

  static async delete(id: string, userId: string) {
    const template = await SalaryStructureTemplate.findById(id);
    if (!template) throw new AppError('Template not found or already deleted', 404);

    await SalaryStructureTemplate.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'salary-structure-templates',
      userId,
      targetId: id,
    });
  }
}
