import SalaryStructure from '../../models/SalaryStructure.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class SalaryStructureService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.employee) filter.employee = queryParams.employee;
    if (queryParams.isCurrent !== undefined) filter.isCurrent = queryParams.isCurrent === 'true';

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [structures, total] = await Promise.all([
      SalaryStructure.find(filter)
        .populate('employee', 'employeeCode fullName')
        .populate('components.component', 'code name type')
        .sort(sortObj).skip(skip).limit(limit).lean(),
      SalaryStructure.countDocuments(filter),
    ]);

    const data = structures.map((s) => {
      return { ...s, id: s._id.toString(), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const structure = await SalaryStructure.findById(id)
      .populate('employee', 'employeeCode fullName')
      .populate('components.component', 'code name type subType calcType pfApplicable esiApplicable taxable')
      .lean();
    if (!structure) throw new AppError('Salary structure not found or already deleted', 404);
    return { ...structure, id: structure._id.toString(), _id: undefined };
  }

  static async getByEmployee(employeeId: string): Promise<Record<string, unknown>[]> {
    const structures = await SalaryStructure.find({ employee: employeeId })
      .populate('components.component', 'code name type subType calcType')
      .sort({ effectiveFrom: -1 }).lean();
    return structures.map((s) => ({ ...s, id: s._id.toString(), _id: undefined }));
  }

  static async create(data: Record<string, unknown>, userId: string) {
    if (data.effectiveFrom && data.effectiveTo) {
      const from = new Date(data.effectiveFrom as string);
      const to = new Date(data.effectiveTo as string);
      if (from >= to) throw new AppError('effectiveFrom must be before effectiveTo', 400);
    }

    if (data.isCurrent === undefined || data.isCurrent === true) {
      await SalaryStructure.updateMany(
        { employee: data.employee, isCurrent: true },
        { $set: { isCurrent: false, effectiveTo: data.effectiveFrom ? new Date(data.effectiveFrom as string) : new Date() } },
      );
    }

    const structure = await SalaryStructure.create({
      ...data,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom as string) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo as string) : undefined,
      approvedAt: data.approvedAt ? new Date(data.approvedAt as string) : undefined,
      createdBy: userId,
    });

    await AuditService.log({
      action: 'create',
      module: 'salary-structures',
      userId,
      targetId: structure._id.toString(),
      details: { employee: data.employee, totalCtc: data.totalCtc },
    });

    return { ...structure.toObject(), id: structure._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const structure = await SalaryStructure.findById(id);
    if (!structure) throw new AppError('Salary structure not found or already deleted', 404);

    const allowedFields = ['effectiveFrom', 'effectiveTo', 'totalCtc', 'components', 'isCurrent', 'remarks'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in data) updateData[key] = data[key];
    }
    if (updateData.effectiveFrom) updateData.effectiveFrom = new Date(updateData.effectiveFrom as string);
    if (updateData.effectiveTo) updateData.effectiveTo = new Date(updateData.effectiveTo as string);

    Object.assign(structure, updateData, { updatedBy: userId });
    await structure.save();

    await AuditService.log({
      action: 'update',
      module: 'salary-structures',
      userId,
      targetId: id,
      details: data,
    });

    const populated = await SalaryStructure.findById(structure._id)
      .populate('employee', 'employeeCode fullName')
      .populate('components.component', 'code name type')
      .lean() as Record<string, unknown> | null;

    return { ...(populated ?? {}), id: structure._id.toString(), _id: undefined };
  }

  static async delete(id: string, userId: string) {
    const structure = await SalaryStructure.findById(id);
    if (!structure) throw new AppError('Salary structure not found or already deleted', 404);

    await SalaryStructure.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'salary-structures',
      userId,
      targetId: id,
    });
  }
}
