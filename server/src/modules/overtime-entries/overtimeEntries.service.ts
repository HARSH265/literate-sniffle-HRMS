import mongoose from 'mongoose';
import OvertimeEntry from '../../models/OvertimeEntry.model.js';
import Employee from '../../models/Employee.model.js';
import OvertimeRule from '../../models/OvertimeRule.model.js';
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
    } else if (queryParams.startDate && queryParams.endDate) {
      filter.date = {
        $gte: new Date(queryParams.startDate as string),
        $lte: new Date(queryParams.endDate as string),
      };
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate employee existence
      const employee = await Employee.findById(data.employee).lean();
      if (!employee) throw new AppError('Employee not found', 404);

        // Validate overtime rule if provided
        let rule = null;
        if (data.overtimeRule) {
          rule = await OvertimeRule.findById(data.overtimeRule).lean();
        } else {
          rule = await OvertimeRule.findOne({ isActive: true, applicableTo: 'all' }).lean();
          if (!rule) {
            rule = await OvertimeRule.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
          }
        }

        // Validate overtime date is not in future
        const overtimeDate = new Date(data.date as string);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (overtimeDate > today) {
          throw new AppError('Cannot create overtime for future dates', 400);
        }

        const hours = data.hours as number;
        if (hours < 0.5 || hours > 24) {
          throw new AppError('Overtime hours must be between 0.5 and 24', 400);
        }

        const entryDate = overtimeDate;
        const startOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
        const endOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0);

      if (rule) {
        // Compute existing total within the same session for atomicity
        const existingHoursResult = await OvertimeEntry.aggregate([
          {
            $match: {
              employee: data.employee as any,
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              totalHours: { $sum: '$hours' },
            },
          },
        ]).session(session);

        const existingHours = existingHoursResult[0]?.totalHours || 0;
        const newTotal = existingHours + hours;

        if (rule.maxHoursPerMonth && newTotal > rule.maxHoursPerMonth) {
          throw new AppError(
            `Cannot add ${hours} hours. Employee has ${existingHours} hours this month. Maximum allowed is ${rule.maxHoursPerMonth} hours/month as per "${rule.name}" rule.`,
            400
          );
        }

        if (rule.maxHoursPerDay && hours > rule.maxHoursPerDay) {
          throw new AppError(
            `Cannot add ${hours} hours. Maximum ${rule.maxHoursPerDay} hours per day allowed as per "${rule.name}" rule.`,
            400
          );
        }
      }

      const [entry] = await OvertimeEntry.create([{
        ...data,
        date: new Date(data.date as string),
        enteredBy: userId,
      }], { session });

      // Re‑validate after insertion to ensure no race condition broke the limit
      if (rule) {
        const postInsertHoursResult = await OvertimeEntry.aggregate([
          {
            $match: {
              employee: data.employee as any,
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              totalHours: { $sum: '$hours' },
            },
          },
        ]).session(session);
        const totalAfter = postInsertHoursResult[0]?.totalHours || 0;
        if (rule.maxHoursPerMonth && totalAfter > rule.maxHoursPerMonth) {
          throw new AppError(
            `Overtime limit exceeded after insertion. Total ${totalAfter} hours exceeds allowed ${rule.maxHoursPerMonth} hours/month for "${rule.name}".`,
            400
          );
        }
      }

      await AuditService.log({
        action: 'create',
        module: 'overtime-entries',
        userId,
        targetId: entry._id.toString(),
        details: { employee: data.employee, date: data.date, hours: data.hours },
      }, session);

      await session.commitTransaction();
      session.endSession();

      return entry;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }


  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const entry = await OvertimeEntry.findById(id).session(session);
      if (!entry) throw new AppError('Overtime entry not found or already deleted', 404);

      let rule = null;
      if (data.hours !== undefined) {
        const hours = data.hours as number;
        if (hours < 0.5 || hours > 24) {
          throw new AppError('Overtime hours must be between 0.5 and 24', 400);
        }

        const ruleId = data.overtimeRule as string | undefined;
        if (ruleId) {
          rule = await OvertimeRule.findById(ruleId).lean();
        } else {
          rule = await OvertimeRule.findOne({ isActive: true, applicableTo: 'all' }).lean();
          if (!rule) {
            rule = await OvertimeRule.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
          }
        }

        if (rule) {
          const entryDate = data.date ? new Date(data.date as string) : entry.date;
          const startOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
          const endOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0);

          const existingHoursResult = await OvertimeEntry.aggregate([
            { $match: { employee: entry.employee, _id: { $ne: entry._id }, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, totalHours: { $sum: '$hours' } } },
          ]).session(session);
          const existingHours = existingHoursResult[0]?.totalHours || 0;
          const newTotal = existingHours + hours;

          if (rule.maxHoursPerMonth && newTotal > rule.maxHoursPerMonth) {
            throw new AppError(
              `Cannot update to ${hours} hours. Employee has ${existingHours} hours this month. Maximum allowed is ${rule.maxHoursPerMonth} hours/month as per "${rule.name}" rule.`,
              400
            );
          }
          if (rule.maxHoursPerDay && hours > rule.maxHoursPerDay) {
            throw new AppError(
              `Cannot update to ${hours} hours. Maximum ${rule.maxHoursPerDay} hours per day allowed as per "${rule.name}" rule.`,
              400
            );
          }
        }
      }

      Object.assign(entry, data, { updatedBy: userId });
      await entry.save({ session });

      // Re‑validate total after update to guard against race conditions
      if (rule) {
        const entryDate = data.date ? new Date(data.date as string) : entry.date;
        const startOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
        const endOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0);
        const totalAfterResult = await OvertimeEntry.aggregate([
          { $match: { employee: entry.employee, date: { $gte: startOfMonth, $lte: endOfMonth } } },
          { $group: { _id: null, totalHours: { $sum: '$hours' } } },
        ]).session(session);
        const totalAfter = totalAfterResult[0]?.totalHours || 0;
        if (rule.maxHoursPerMonth && totalAfter > rule.maxHoursPerMonth) {
          throw new AppError(
            `Overtime limit exceeded after update. Total ${totalAfter} hours exceeds allowed ${rule.maxHoursPerMonth} hours/month for "${rule.name}".`,
            400
          );
        }
      }

      await AuditService.log({
        action: 'update',
        module: 'overtime-entries',
        userId,
        targetId: id,
        details: data,
      }, session);

      await session.commitTransaction();
      session.endSession();

      return entry;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  static async delete(id: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const entry = await OvertimeEntry.findById(id).session(session);
      if (!entry) throw new AppError('Overtime entry not found or already deleted', 404);

      await OvertimeEntry.findByIdAndDelete(id).session(session);

      await AuditService.log({
        action: 'delete',
        module: 'overtime-entries',
        userId,
        targetId: id,
      }, session);

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}