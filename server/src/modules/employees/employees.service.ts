import Employee from '../../models/Employee.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class EmployeesService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { employeeCode: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    if (queryParams.category) {
      filter.category = queryParams.category;
    }

    if (queryParams.department) {
      filter.department = queryParams.department;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('department', 'name code')
        .populate('designation', 'name')
        .populate('shift', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
    ]);

    const data: unknown[] = employees.map((e) => {
      const { _id, ...rest } = e as Record<string, unknown>;
      return {
        ...rest,
        id: String(_id),
        _id: undefined,
        department: e.department ? { id: (e.department as any)._id.toString(), name: (e.department as any).name } : null,
        designation: e.designation ? { id: (e.designation as any)._id.toString(), name: (e.designation as any).name } : null,
        shift: e.shift ? { id: (e.shift as any)._id.toString(), name: (e.shift as any).name } : null,
      };
    });

    const meta = PaginationUtil.getMeta(page, limit, total);
    return { data, meta };
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const emp = await Employee.findById(id)
      .populate('department', 'name code')
      .populate('designation', 'name')
      .populate('shift', 'name')
      .lean();
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }
    const { _id, ...rest } = emp as Record<string, unknown>;
    return {
      ...rest,
      id: String(_id),
      _id: undefined,
      department: (emp as any).department ? { id: ((emp as any).department as any)._id.toString(), name: ((emp as any).department as any).name } : null,
      designation: (emp as any).designation ? { id: ((emp as any).designation as any)._id.toString(), name: ((emp as any).designation as any).name } : null,
      shift: (emp as any).shift ? { id: ((emp as any).shift as any)._id.toString(), name: ((emp as any).shift as any).name } : null,
    };
  }

  static async create(data: Record<string, unknown>, createdById: string) {
    const existing = await Employee.findOne({ employeeCode: (data.employeeCode as string).toUpperCase() });
    if (existing) {
      throw new AppError('Employee code already exists', 400);
    }

    const emp = await Employee.create({
      ...data,
      employeeCode: (data.employeeCode as string).toUpperCase(),
      createdBy: createdById,
    });

    await AuditService.log({
      action: 'create',
      module: 'employees',
      userId: createdById,
      targetId: emp._id.toString(),
      details: { employeeCode: data.employeeCode, fullName: data.fullName },
    });

    return this.getById(emp._id.toString());
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    Object.assign(emp, data, { updatedBy: updatedById });
    await emp.save();

    await AuditService.log({
      action: 'update',
      module: 'employees',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    return this.getById(id);
  }

  static async delete(id: string, deletedById: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    await Employee.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'employees',
      userId: deletedById,
      targetId: id,
    });
  }

  static async updatePhoto(id: string, photoUrl: string, updatedById: string) {
    const emp = await Employee.findById(id);
    if (!emp) {
      throw new AppError('Employee not found', 404);
    }

    emp.photo = photoUrl;
    emp.updatedBy = updatedById as any;
    await emp.save();

    return this.getById(id);
  }
}