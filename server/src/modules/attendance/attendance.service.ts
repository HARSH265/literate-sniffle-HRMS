import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import Employee from '../../models/Employee.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export class AttendanceService {
  static async list(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};

    if (queryParams.date) {
      const date = new Date(queryParams.date as string);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: date, $lt: nextDay };
    }

    if (queryParams.employee) {
      filter.employee = queryParams.employee;
    }

    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [entries, total] = await Promise.all([
      AttendanceEntry.find(filter)
        .populate('employee', 'fullName employeeCode')
        .populate('shift', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      AttendanceEntry.countDocuments(filter),
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
        _id: undefined,
      };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async monthlyView(queryParams: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const { month, year, department } = queryParams;
    
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) {
      employeeFilter.department = department;
    }

    const employees = await Employee.find(employeeFilter).select('fullName employeeCode department').lean();

    const attendanceFilter = {
      date: { $gte: startDate, $lte: endDate },
    };

    const attendanceRecords = await AttendanceEntry.find(attendanceFilter)
      .populate('employee', 'fullName employeeCode')
      .lean();

    const recordsByEmployee: Record<string, Record<string, unknown>> = {};
    
    attendanceRecords.forEach((record) => {
      const empId = String((record.employee as any)._id);
      if (!recordsByEmployee[empId]) {
        recordsByEmployee[empId] = {};
      }
      const day = new Date(record.date).getDate();
      recordsByEmployee[empId][day] = record;
    });

    const result = employees.map((emp) => {
      const empId = String(emp._id);
      const monthData: Record<string, unknown> = {
        employee: {
          id: empId,
          fullName: emp.fullName,
          employeeCode: emp.employeeCode,
        },
        days: {},
      };

      for (let day = 1; day <= endDate.getDate(); day++) {
        const record = recordsByEmployee[empId]?.[day] as any;
        (monthData.days as Record<string, unknown>)[day] = record ? {
          id: String(record._id),
          status: record.status,
          inTime: record.inTime,
          outTime: record.outTime,
          overtimeHours: record.overtimeHours,
        } : null;
      }

      return monthData;
    });

    return result;
  }

  static async bulkCreate(data: { date: string; entries: Array<Record<string, unknown>> }, userId: string) {
    const date = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      throw new AppError('Cannot mark attendance for future dates', 400);
    }

    const results = [];

    for (const entry of data.entries) {
      try {
        const employeeExists = await Employee.exists({ _id: entry.employee });
        if (!employeeExists) {
          results.push({ employee: entry.employee, status: 'failed', error: 'Employee not found' });
          continue;
        }
        const existing = await AttendanceEntry.findOne({
          employee: entry.employee,
          date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999)),
          },
        });

        if (existing) {
          Object.assign(existing, {
            status: entry.status,
            inTime: entry.inTime,
            outTime: entry.outTime,
            overtimeHours: entry.overtimeHours || 0,
            remarks: entry.remarks,
            updatedBy: userId,
          });
          await existing.save();
          results.push({ employee: entry.employee, status: 'updated' });
        } else {
          await AttendanceEntry.create({
            ...entry,
            date: new Date(data.date),
            overtimeHours: entry.overtimeHours || 0,
            enteredBy: userId,
          });
          results.push({ employee: entry.employee, status: 'created' });
        }
      } catch (error) {
        results.push({ employee: entry.employee, status: 'failed', error: (error as Error).message });
      }
    }

    await AuditService.log({
      action: 'create',
      module: 'attendance',
      userId,
      details: { date: data.date, total: data.entries.length },
    });

    return results;
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const employeeExists = await Employee.exists({ _id: data.employee });
    if (!employeeExists) {
      throw new AppError('Employee not found', 400);
    }

    const attendanceDate = new Date(data.date as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (attendanceDate > today) {
      throw new AppError('Cannot mark attendance for future dates', 400);
    }

    if (data.inTime && data.outTime) {
      const inMinutes = parseTimeToMinutes(data.inTime as string);
      const outMinutes = parseTimeToMinutes(data.outTime as string);
      if (outMinutes <= inMinutes) {
        throw new AppError('Out time must be greater than in time', 400);
      }
    }

    const entry = await AttendanceEntry.create({
      ...data,
      date: new Date(data.date as string),
      enteredBy: userId,
    });

    await AuditService.log({
      action: 'create',
      module: 'attendance',
      userId,
      targetId: entry._id.toString(),
      details: { employee: data.employee, date: data.date, status: data.status },
    });

    return entry;
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const entry = await AttendanceEntry.findById(id);
    if (!entry) {
      throw new AppError('Attendance entry not found or already deleted', 404);
    }

    if (data.inTime && data.outTime) {
      const inMinutes = parseTimeToMinutes(data.inTime as string);
      const outMinutes = parseTimeToMinutes(data.outTime as string);
      if (outMinutes <= inMinutes) {
        throw new AppError('Out time must be greater than in time', 400);
      }
    }

    Object.assign(entry, data, { updatedBy: userId });
    await entry.save();

    await AuditService.log({
      action: 'update',
      module: 'attendance',
      userId,
      targetId: id,
      details: data,
    });

    return entry;
  }

  static async delete(id: string, userId: string) {
    const entry = await AttendanceEntry.findById(id);
    if (!entry) {
      throw new AppError('Attendance entry not found or already deleted', 404);
    }

    await AttendanceEntry.findByIdAndDelete(id);

    await AuditService.log({
      action: 'delete',
      module: 'attendance',
      userId,
      targetId: id,
    });
  }
}