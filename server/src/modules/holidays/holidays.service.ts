import Holiday from '../../models/Holiday.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

export class HolidaysService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (queryParams.year) {
      filter.year = Number(queryParams.year);
    }

    if (queryParams.type) {
      filter.type = queryParams.type;
    }

    if (queryParams.applicableTo) {
      filter.applicableTo = queryParams.applicableTo;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [holidays, total] = await Promise.all([
      Holiday.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Holiday.countDocuments(filter),
    ]);

    const data: unknown[] = holidays.map((h) => {
      const { _id, ...rest } = h as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async getById(id: string): Promise<Record<string, unknown>> {
    const holiday = await Holiday.findById(id).lean();
    if (!holiday) {
      throw new AppError('Holiday not found or already deleted', 404);
    }
    return { ...holiday, id: holiday._id.toString(), _id: undefined };
  }

  static async create(data: Record<string, unknown>, createdById: string) {
    const date = new Date(data.date as string);
    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date format', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      throw new AppError('Cannot create holidays for past dates', 400);
    }

    const year = data.year ? Number(data.year) : date.getFullYear();

    const existing = await Holiday.findOne({
      name: (data.name as string).trim(),
      year,
    });
    if (existing) {
      throw new AppError('Holiday with this name already exists for the year', 400);
    }

    const holiday = await Holiday.create({
      ...data,
      year,
      createdBy: createdById,
    });

    await AuditService.log({
      action: 'create',
      module: 'holidays',
      userId: createdById,
      targetId: holiday._id.toString(),
      details: { name: data.name, date: data.date, year },
    });

    return { ...holiday.toObject(), id: holiday._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      throw new AppError('Holiday not found or already deleted', 404);
    }

    if (data.date) {
      const date = new Date(data.date as string);
      if (isNaN(date.getTime())) {
        throw new AppError('Invalid date format', 400);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new AppError('Cannot set holidays for past dates', 400);
      }
      (holiday as any).year = date.getFullYear();
      (holiday as any).date = date;
    }
    if (data.name) (holiday as any).name = (data.name as string).trim();
    if (data.type) (holiday as any).type = data.type;
    if (data.applicableTo) (holiday as any).applicableTo = data.applicableTo;
    if (data.isPaid !== undefined) (holiday as any).isPaid = data.isPaid;

    const year = (holiday as any).year;
    const existing = await Holiday.findOne({
      name: (holiday as any).name,
      year,
      _id: { $ne: id },
    });
    if (existing) {
      throw new AppError('Holiday with this name already exists for the year', 400);
    }

    await (holiday as any).save();

    await AuditService.log({
      action: 'update',
      module: 'holidays',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    return { ...(holiday as any).toObject(), id: holiday._id.toString(), _id: undefined };
  }

  static async delete(id: string, deletedById: string) {
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      throw new AppError('Holiday not found or already deleted', 404);
    }

    await Holiday.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'holidays',
      userId: deletedById,
      targetId: id,
    });
  }
}