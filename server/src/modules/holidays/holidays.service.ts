import Holiday from '../../models/Holiday.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { CacheService } from '../../core/cache/CacheService.js';

export class HolidaysService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
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
    const dateStr = data.date as string;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date format', 400);
    }

    const year = data.year ? Number(data.year) : date.getFullYear();

    const existingByName = await Holiday.findOne({
      name: (data.name as string).trim(),
      year,
    });
    if (existingByName) {
      throw new AppError('Holiday with this name already exists for the year', 400);
    }

    const dateStrNormalized = date.toISOString().split('T')[0];
    const existingByDate = await Holiday.findOne({
      date: {
        $gte: new Date(dateStrNormalized + 'T00:00:00.000Z'),
        $lte: new Date(dateStrNormalized + 'T23:59:59.999Z'),
      },
    });
    if (existingByDate) {
      throw new AppError(`A holiday already exists on ${dateStrNormalized}`, 400);
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

    CacheService.invalidateHolidays();

    return { ...holiday.toObject(), id: holiday._id.toString(), _id: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      throw new AppError('Holiday not found or already deleted', 404);
    }

    let year = (holiday as any).year;

    if (data.date) {
      const date = new Date(data.date as string);
      if (isNaN(date.getTime())) {
        throw new AppError('Invalid date format', 400);
      }
      year = date.getFullYear();
      (holiday as any).date = date;
      (holiday as any).year = year;
    }
    if (data.name) (holiday as any).name = (data.name as string).trim();
    if (data.type) (holiday as any).type = data.type;
    if (data.applicableTo) (holiday as any).applicableTo = data.applicableTo;
    if (data.isPaid !== undefined) (holiday as any).isPaid = data.isPaid;
    (holiday as any).updatedBy = updatedById;

    await (holiday as any).save();

    await AuditService.log({
      action: 'update',
      module: 'holidays',
      userId: updatedById,
      targetId: id,
      details: data,
    });

    CacheService.invalidateHolidays();

    return { ...(holiday as any).toObject(), id: holiday._id.toString(), _id: undefined };
  }

  static async delete(id: string, deletedById: string) {
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      throw new AppError('Holiday not found or already deleted', 404);
    }

    await Holiday.findByIdAndDelete(id);

    CacheService.invalidateHolidays();

    await AuditService.log({
      action: 'delete',
      module: 'holidays',
      userId: deletedById,
      targetId: id,
    });
  }
}