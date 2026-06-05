import ComponentMaster from '../../models/ComponentMaster.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class ComponentMasterService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.type) filter.type = queryParams.type;
    if (queryParams.isActive !== undefined) filter.isActive = queryParams.isActive === 'true';
    if (queryParams.subType) filter.subType = queryParams.subType;

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [components, total] = await Promise.all([
      ComponentMaster.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      ComponentMaster.countDocuments(filter),
    ]);

    const data = components.map((c) => {
      return { ...c, id: c._id.toString(), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const component = await ComponentMaster.findById(id).lean();
    if (!component) throw new AppError('Component not found or already deleted', 404);
    return { ...component, id: component._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const existing = await ComponentMaster.findOne({ code: String(data.code).toUpperCase() }).lean();
    if (existing) throw new AppError(`Component with code "${data.code}" already exists`, 409);

    const component = await ComponentMaster.create({
      ...data,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom as string) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo as string) : undefined,
      createdBy: userId,
    });

    await AuditService.log({
      action: 'create',
      module: 'component-master',
      userId,
      targetId: component._id.toString(),
      details: { code: data.code, name: data.name, type: data.type },
    });

    return { ...component.toObject(), id: component._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const component = await ComponentMaster.findById(id);
    if (!component) throw new AppError('Component not found or already deleted', 404);

    if (data.code && data.code !== component.code) {
      const existing = await ComponentMaster.findOne({ code: String(data.code).toUpperCase(), _id: { $ne: id } }).lean();
      if (existing) throw new AppError(`Component with code "${data.code}" already exists`, 409);
    }

    const updateData = { ...data };
    if (updateData.effectiveFrom) updateData.effectiveFrom = new Date(updateData.effectiveFrom as string);
    if (updateData.effectiveTo) updateData.effectiveTo = new Date(updateData.effectiveTo as string);

    Object.assign(component, updateData, { updatedBy: userId });
    await component.save();

    await AuditService.log({
      action: 'update',
      module: 'component-master',
      userId,
      targetId: id,
      details: data,
    });

    return { ...component.toObject(), id: component._id.toString(), _id: undefined };
  }

  static async delete(id: string, userId: string) {
    const component = await ComponentMaster.findById(id);
    if (!component) throw new AppError('Component not found or already deleted', 404);

    await ComponentMaster.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'component-master',
      userId,
      targetId: id,
    });
  }
}
