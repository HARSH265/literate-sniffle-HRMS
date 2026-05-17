import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import Employee from '../../models/Employee.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class OvertimeEntriesService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.employee) filter.employee = queryParams.employee;
    if (queryParams.month && queryParams.year) {
      const start = new Date(Number(queryParams.year), Number(queryParams.month) - 1, 1);
      const end = new Date(Number(queryParams.year), Number(queryParams.month), 0);
      filter.date = { $gte: start, $lte: end };
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [entries, total] = await Promise.all([
      OvertimeEntry.find(filter)
        .populate('employee', 'fullName employeeCode')
        .populate('overtimeRule', 'name multiplier')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      OvertimeEntry.countDocuments(filter),
    ]);

    const data = entries.map((e) => {
      const { _id, ...rest } = e as Record<string, unknown>;
      return {
        ...rest,
        id: String(_id),
        employee: rest.employee ? {
          id: String((rest.employee as any)._id),
          fullName: (rest.employee as any).fullName,
          employeeCode: (rest.employee as any).employeeCode,
        } : null,
        overtimeRule: rest.overtimeRule ? {
          id: String((rest.overtimeRule as any)._id),
          name: (rest.overtimeRule as any).name,
          multiplier: (rest.overtimeRule as any).multiplier,
        } : null,
        _id: undefined,
      };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const entry = await OvertimeEntry.findById(id).populate('employee', 'fullName employeeCode').lean();
    if (!entry) throw new AppError('Overtime entry not found or already deleted', 404);
    return { ...entry, id: entry._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const employeeExists = await Employee.exists({ _id: data.employee });
    if (!employeeExists) {
      throw new AppError('Employee not found', 400);
    }

    const overtimeDate = new Date(data.date as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (overtimeDate > today) {
      throw new AppError('Cannot create overtime for future dates', 400);
    }

    const hours = data.hours as number;
    if (hours <= 0 || hours > 24) {
      throw new AppError('Overtime hours must be between 0 and 24', 400);
    }

    const entry = await OvertimeEntry.create({
      ...data,
      date: new Date(data.date as string),
      enteredBy: userId,
    });

    await AuditService.log({
      action: 'create',
      module: 'overtime-entries',
      userId,
      targetId: entry._id.toString(),
      details: { employee: data.employee, date: data.date, hours: data.hours },
    });

    return entry;
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const entry = await OvertimeEntry.findById(id);
    if (!entry) throw new AppError('Overtime entry not found or already deleted', 404);

    if (data.hours !== undefined) {
      const hours = data.hours as number;
      if (hours <= 0 || hours > 24) {
        throw new AppError('Overtime hours must be between 0 and 24', 400);
      }
    }

    Object.assign(entry, data);
    await entry.save();

    await AuditService.log({
      action: 'update',
      module: 'overtime-entries',
      userId,
      targetId: id,
      details: data,
    });

    return entry;
  }

  static async delete(id: string, userId: string) {
    const entry = await OvertimeEntry.findById(id);
    if (!entry) throw new AppError('Overtime entry not found or already deleted', 404);

    await OvertimeEntry.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'overtime-entries',
      userId,
      targetId: id,
    });
  }
}