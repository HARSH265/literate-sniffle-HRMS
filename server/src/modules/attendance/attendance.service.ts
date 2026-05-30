import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

async function getAttendanceSettings() {
  const settings = await CompanySettings.findOne().lean();
  return (settings?.attendanceConfig as any) || {
    pastEntryLimitDays: 7,
    lateMarkEnabled: false,
    lateMarkThresholdMinutes: 15,
    lateToHalfDayAfterOccurrences: 3,
  };
}

function calculateLateStatus(inTime: string, shiftStartTime: string, thresholdMinutes: number): boolean {
  if (!inTime || !shiftStartTime) return false;
  const inMinutes = parseTimeToMinutes(inTime);
  const shiftStartMinutes = parseTimeToMinutes(shiftStartTime);
  return (inMinutes - shiftStartMinutes) > thresholdMinutes;
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

    if (queryParams.department) {
      const employees = await Employee.find({ department: queryParams.department }).select('_id').lean();
      filter.employee = { $in: employees.map((e) => e._id) };
    }

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [entries, total] = await Promise.all([
      AttendanceEntry.find(filter)
        .populate('employee', 'fullName employeeCode department')
        .populate('shift', 'name startTime endTime')
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
          department: (rest.employee as any).department,
        } : null,
        shift: rest.shift ? {
          id: String((rest.shift as any)._id),
          name: (rest.shift as any).name,
          startTime: (rest.shift as any).startTime,
          endTime: (rest.shift as any).endTime,
        } : null,
        overtimeHours: undefined,
        _id: undefined,
      };
    });
    const meta = PaginationUtil.getMeta(page, limit, total);

    return { data, meta };
  }

  static async getByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<unknown[]> {
    const filter: Record<string, unknown> = { employee: employeeId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $lte: end };
    }

    const entries = await AttendanceEntry.find(filter)
      .populate('shift', 'name startTime endTime')
      .sort({ date: -1 })
      .lean();

    return entries.map((e) => {
      const { _id, ...rest } = e as Record<string, unknown>;
      return {
        ...rest,
        id: String(_id),
        shift: rest.shift ? {
          id: String((rest.shift as any)._id),
          name: (rest.shift as any).name,
          startTime: (rest.shift as any).startTime,
          endTime: (rest.shift as any).endTime,
        } : null,
        _id: undefined,
      };
    });
  }

  static async monthlyView(queryParams: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const { month, year, department } = queryParams;
    
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) {
      employeeFilter.department = department;
    }

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

    const employeesWithShifts = await Employee.find(employeeFilter)
      .populate('shift', 'startTime')
      .select('fullName employeeCode department shift')
      .lean();

    const empShiftMap: Record<string, string> = {};
    employeesWithShifts.forEach((emp: any) => {
      if (emp.shift) {
        empShiftMap[String(emp._id)] = emp.shift.startTime;
      }
    });

    const result = employeesWithShifts.map((emp: any) => {
      const empId = String(emp._id);
      const monthData: Record<string, unknown> = {
        employee: {
          id: empId,
          fullName: emp.fullName,
          employeeCode: emp.employeeCode,
          department: emp.department,
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
        } : null;
      }

      return monthData;
    });

    return result;
  }

  static async bulkCreate(data: { date: string; entries: Array<Record<string, unknown>> }, userId: string) {
    const settings = await getAttendanceSettings();
    const date = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      throw new AppError('Cannot mark attendance for future dates', 400);
    }

    const pastLimitDate = new Date(today);
    pastLimitDate.setDate(pastLimitDate.getDate() - settings.pastEntryLimitDays);
    if (date < pastLimitDate) {
      throw new AppError(`Cannot mark attendance older than ${settings.pastEntryLimitDays} days`, 400);
    }

    const employeeIds = data.entries.map((e) => e.employee);
    const employees = await Employee.find({ _id: { $in: employeeIds } })
      .populate('shift', 'startTime endTime')
      .select('_id employeeCode shift')
      .lean();

    const empShiftMap: Record<string, any> = {};
    employees.forEach((emp: any) => {
      empShiftMap[String(emp._id)] = emp.shift;
    });

    const results = [];
    const toUpdate: any[] = [];
    const toCreate: any[] = [];
    const attendanceDateStart = new Date(date);
    attendanceDateStart.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(date);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const existingEntries = await AttendanceEntry.find({
      employee: { $in: employeeIds },
      date: { $gte: attendanceDateStart, $lt: attendanceDateEnd },
    }).lean();

    const existingMap: Record<string, any> = {};
    existingEntries.forEach((e: any) => {
      existingMap[String(e.employee)] = e;
    });

    for (const entry of data.entries) {
      try {
        const emp = employees.find((e: any) => String(e._id) === String(entry.employee));
        if (!emp) {
          results.push({ employee: entry.employee, status: 'failed', error: 'Employee not found' });
          continue;
        }

        const shift = empShiftMap[String(entry.employee)];
        const shiftStartTime = shift?.startTime;

        if (entry.inTime && entry.outTime) {
          const inMinutes = parseTimeToMinutes(entry.inTime as string);
          const outMinutes = parseTimeToMinutes(entry.outTime as string);
          if (outMinutes <= inMinutes) {
            results.push({ employee: entry.employee, status: 'failed', error: 'Out time must be greater than in time' });
            continue;
          }
        }

        if (settings.lateMarkEnabled && entry.status === 'present' && entry.inTime && shiftStartTime) {
          const isLate = calculateLateStatus(entry.inTime as string, shiftStartTime, settings.lateMarkThresholdMinutes);
          if (isLate) {
            (entry as any).isLate = true;
          }
        }

        const existing = existingMap[String(entry.employee)];
        if (existing) {
          toUpdate.push({
            filter: { _id: existing._id },
            update: {
              status: entry.status,
              inTime: entry.inTime,
              outTime: entry.outTime,
              remarks: entry.remarks,
              updatedBy: userId,
              ...((entry as any).isLate !== undefined && { isLate: (entry as any).isLate }),
            },
          });
          results.push({ employee: entry.employee, status: 'updated' });
        } else {
          toCreate.push({
            employee: entry.employee,
            date: new Date(data.date),
            shift: shift?._id,
            status: entry.status,
            inTime: entry.inTime,
            outTime: entry.outTime,
            remarks: entry.remarks,
            source: 'manual-register-entry',
            enteredBy: userId,
            ...((entry as any).isLate !== undefined && { isLate: (entry as any).isLate }),
          });
          results.push({ employee: entry.employee, status: 'created' });
        }
      } catch (error) {
        results.push({ employee: entry.employee, status: 'failed', error: (error as Error).message });
      }
    }

    if (toUpdate.length > 0) {
      const bulkUpdateOps = toUpdate.map((u) => ({
        updateOne: {
          filter: u.filter,
          update: u.update,
        },
      }));
      await AttendanceEntry.bulkWrite(bulkUpdateOps as any);
    }

    if (toCreate.length > 0) {
      await AttendanceEntry.insertMany(toCreate);
    }

    await AuditService.log({
      action: 'create',
      module: 'attendance',
      userId,
      details: { date: data.date, total: data.entries.length, created: toCreate.length, updated: toUpdate.length },
    });

    return results;
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const settings = await getAttendanceSettings();

    const employee = await Employee.findById(data.employee).populate('shift', 'startTime endTime');
    if (!employee) {
      throw new AppError('Employee not found', 400);
    }

    const attendanceDate = new Date(data.date as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (attendanceDate > today) {
      throw new AppError('Cannot mark attendance for future dates', 400);
    }

    const pastLimitDate = new Date(today);
    pastLimitDate.setDate(pastLimitDate.getDate() - settings.pastEntryLimitDays);
    if (attendanceDate < pastLimitDate) {
      throw new AppError(`Cannot mark attendance older than ${settings.pastEntryLimitDays} days`, 400);
    }

    if (data.inTime && data.outTime) {
      const inMinutes = parseTimeToMinutes(data.inTime as string);
      const outMinutes = parseTimeToMinutes(data.outTime as string);
      if (outMinutes <= inMinutes) {
        throw new AppError('Out time must be greater than in time', 400);
      }
    }

    let isLate = undefined;
    if (settings.lateMarkEnabled && data.status === 'present' && data.inTime && (employee as any).shift) {
      const shiftStartTime = (employee as any).shift.startTime;
      isLate = calculateLateStatus(data.inTime as string, shiftStartTime, settings.lateMarkThresholdMinutes);
    }

    const entry = await AttendanceEntry.create({
      ...data,
      date: new Date(data.date as string),
      shift: (employee as any).shift?._id,
      overtimeHours: undefined,
      ...(isLate !== undefined && { isLate }),
      enteredBy: userId,
    });

    await AuditService.log({
      action: 'create',
      module: 'attendance',
      userId,
      targetId: entry._id.toString(),
      details: { employee: data.employee, date: data.date, status: data.status },
    });

    const { _id, ...rest } = entry.toObject();
    return { ...rest, id: String(_id), _id: undefined, overtimeHours: undefined };
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    const settings = await getAttendanceSettings();
    const entry = await AttendanceEntry.findById(id).populate('employee', 'shift');
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

    const updateData: Record<string, unknown> = { ...data, updatedBy: userId };
    delete updateData.overtimeHours;

    if (settings.lateMarkEnabled && data.status === 'present' && data.inTime) {
      const emp = entry.employee as any;
      if (emp?.shift?.startTime) {
        const isLate = calculateLateStatus(data.inTime as string, emp.shift.startTime, settings.lateMarkThresholdMinutes);
        updateData.isLate = isLate;
      }
    } else if (settings.lateMarkEnabled && data.status !== 'present') {
      updateData.isLate = false;
    }

    Object.assign(entry, updateData);
    await entry.save();

    await AuditService.log({
      action: 'update',
      module: 'attendance',
      userId,
      targetId: id,
      details: data,
    });

    const { _id, ...rest } = entry.toObject();
    return { ...rest, id: String(_id), _id: undefined, overtimeHours: undefined };
  }

  static async bulkUpdateEntries(entries: Array<{ id: string; status?: string; inTime?: string; outTime?: string; remarks?: string }>, userId: string) {
    if (!entries.length) throw new AppError('No entries provided', 400);

    const bulkOps = entries.map((entry) => {
      const update: Record<string, unknown> = { updatedBy: userId };
      if (entry.status) update.status = entry.status;
      if (entry.inTime !== undefined) update.inTime = entry.inTime;
      if (entry.outTime !== undefined) update.outTime = entry.outTime;
      if (entry.remarks !== undefined) update.remarks = entry.remarks;

      return {
        updateOne: {
          filter: { _id: entry.id },
          update: { $set: update },
        },
      };
    });

    const result = await AttendanceEntry.bulkWrite(bulkOps as any);

    await AuditService.log({
      action: 'bulk-update',
      module: 'attendance',
      userId,
      details: { total: entries.length, updated: result.modifiedCount },
    });

    return { updated: result.modifiedCount, failed: entries.length - result.modifiedCount, results: entries.map((e, i) => ({ id: e.id, status: i < result.modifiedCount ? 'updated' : 'failed' })) };
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