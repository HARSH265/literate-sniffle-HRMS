import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import dayjs from 'dayjs';
import mongoose from 'mongoose';

interface AttendanceConfig {
  pastEntryLimitDays: number;
  lateMarkEnabled: boolean;
  lateMarkThresholdMinutes: number;
  lateToHalfDayAfterOccurrences: number;
  shiftStartTime: string;
  shiftEndTime: string;
  gracePeriodMinutes: number;
  lateMarkAsAbsent: boolean;
  lateTreatWorkAsOT: boolean;
  autoCheckoutEnabled: boolean;
  autoCheckoutGraceMinutes: number;
  breakMinutes: number;
  breakDeductionThresholdMinutes: number;
}

interface AttendanceAggDay {
  day: number;
  record: {
    id: string;
    status: string;
    inTime: string;
    outTime: string;
  };
}

interface AttendanceAggEmployeeInfo {
  fullName: string;
  employeeCode: string;
  department: string;
}

interface AttendanceAggGroup {
  _id: string;
  employeeInfo: AttendanceAggEmployeeInfo;
  days: AttendanceAggDay[];
}

interface BulkEntry {
  employee: string;
  status: string;
  inTime?: string;
  outTime?: string;
  remarks?: string;
  isLate?: boolean;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getMinutesDiff(inTime: string, outTime: string): number {
  const diff = parseTimeToMinutes(outTime) - parseTimeToMinutes(inTime);
  return diff < 0 ? diff + 24 * 60 : diff;
}

async function getAttendanceSettings(): Promise<AttendanceConfig> {
  const settings = await CompanySettings.findOne().lean();
  const raw = settings?.attendanceConfig as Record<string, unknown> | undefined;
  return {
    pastEntryLimitDays: (raw?.pastEntryLimitDays as number) ?? 7,
    lateMarkEnabled: (raw?.lateMarkEnabled as boolean) ?? false,
    lateMarkThresholdMinutes: (raw?.lateMarkThresholdMinutes as number) ?? 15,
    lateToHalfDayAfterOccurrences: (raw?.lateToHalfDayAfterOccurrences as number) ?? 3,
    shiftStartTime: (raw?.shiftStartTime as string) ?? '09:00',
    shiftEndTime: (raw?.shiftEndTime as string) ?? '18:00',
    gracePeriodMinutes: (raw?.gracePeriodMinutes as number) ?? 5,
    lateMarkAsAbsent: (raw?.lateMarkAsAbsent as boolean) ?? true,
    lateTreatWorkAsOT: (raw?.lateTreatWorkAsOT as boolean) ?? true,
    autoCheckoutEnabled: (raw?.autoCheckoutEnabled as boolean) ?? true,
    autoCheckoutGraceMinutes: (raw?.autoCheckoutGraceMinutes as number) ?? 30,
    breakMinutes: (raw?.breakMinutes as number) ?? 30,
    breakDeductionThresholdMinutes: (raw?.breakDeductionThresholdMinutes as number) ?? 360,
  };
}

function calculateLateStatus(inTime: string, shiftStartTime: string, thresholdMinutes: number): boolean {
  if (!inTime || !shiftStartTime) return false;
  const inMinutes = parseTimeToMinutes(inTime);
  const shiftStartMinutes = parseTimeToMinutes(shiftStartTime);
  return (inMinutes - shiftStartMinutes) > thresholdMinutes;
}

async function checkHalfDayConversion(employeeId: string, date: Date, isLate: boolean, threshold: number): Promise<boolean> {
  if (!isLate || threshold <= 0) return false;

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  const existingLateCount = await AttendanceEntry.countDocuments({
    employee: employeeId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
    isLate: true,
    status: { $in: ['present', 'half-day'] },
  });

  return existingLateCount >= threshold - 1;
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
      const emp = rest.employee as Record<string, unknown> | null;
      const sh = rest.shift as Record<string, unknown> | null;
      return {
        ...rest,
        id: String(_id),
        employee: emp ? {
          id: String(emp._id),
          fullName: emp.fullName,
          employeeCode: emp.employeeCode,
          department: emp.department,
        } : null,
        shift: sh ? {
          id: String(sh._id),
          name: sh.name,
          startTime: sh.startTime,
          endTime: sh.endTime,
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
      const sh = rest.shift as Record<string, unknown> | null;
      return {
        ...rest,
        id: String(_id),
        shift: sh ? {
          id: String(sh._id),
          name: sh.name,
          startTime: sh.startTime,
          endTime: sh.endTime,
        } : null,
        _id: undefined,
      };
    });
  }

  static async monthlyView(queryParams: Record<string, unknown>): Promise<{ data: Record<string, unknown>[]; meta: { page: number; limit: number; total: number } }> {
    const { month, year, department } = queryParams;
    // Parse pagination parameters (defaults handled by PaginationUtil)
    const { page, limit } = PaginationUtil.parseFromObject(queryParams);

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    // Build employee filter for active status (and optional department)
    const employeeMatch: Record<string, unknown> = { 'employee.status': 'active' };
    if (department) {
      employeeMatch['employee.department'] = department;
    }

    // Aggregation pipeline to fetch attendance records grouped by employee and day
    const pipeline = [
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      { $match: employeeMatch },
      {
        $project: {
          employeeId: '$employee._id',
          fullName: '$employee.fullName',
          employeeCode: '$employee.employeeCode',
          department: '$employee.department',
          day: { $dayOfMonth: '$date' },
          status: 1,
          inTime: 1,
          outTime: 1,
          _id: 1,
        },
      },
      {
        $group: {
          _id: '$employeeId',
          employeeInfo: {
            $first: {
              fullName: '$fullName',
              employeeCode: '$employeeCode',
              department: '$department',
            },
          },
          days: {
            $push: {
              day: '$day',
              record: {
                id: { $toString: '$_id' },
                status: '$status',
                inTime: '$inTime',
                outTime: '$outTime',
              },
            },
          },
        },
      },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          total: [
            { $count: 'count' },
          ],
        },
      },
    ];

    const facetResult = await AttendanceEntry.aggregate(pipeline).exec() as unknown as [{ data: AttendanceAggGroup[]; total: { count: number }[] }];
    const { data: groupedData, total: totalArr } = facetResult[0] ?? { data: [], total: [] };
    const total = totalArr[0]?.count ?? 0;

    const data = groupedData.map((group) => {
      const daysMap: Record<string, unknown> = {};
      // Initialise every day of the month as null
      for (let d = 1; d <= endDate.getDate(); d++) {
        daysMap[d] = null;
      }
      // Fill in days we have records for
      group.days.forEach((d) => {
        daysMap[d.day] = d.record;
      });

      return {
        employee: {
          id: String(group._id),
          fullName: group.employeeInfo.fullName,
          employeeCode: group.employeeInfo.employeeCode,
          department: group.employeeInfo.department,
        },
        days: daysMap,
      };
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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

    const empShiftMap: Record<string, Record<string, unknown>> = {};
    employees.forEach((emp) => {
      empShiftMap[String(emp._id)] = emp.shift as unknown as Record<string, unknown>;
    });

    const results: Array<Record<string, unknown>> = [];
    const toUpdate: Array<{ filter: Record<string, unknown>; update: Record<string, unknown> }> = [];
    const toCreate: Array<Record<string, unknown>> = [];
    const attendanceDateStart = new Date(date);
    attendanceDateStart.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(date);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const existingEntries = await AttendanceEntry.find({
      employee: { $in: employeeIds },
      date: { $gte: attendanceDateStart, $lt: attendanceDateEnd },
    }).lean();

    const existingMap: Record<string, Record<string, unknown>> = {};
    existingEntries.forEach((e) => {
      existingMap[String(e.employee)] = e as unknown as Record<string, unknown>;
    });

    for (const entry of data.entries as unknown as BulkEntry[]) {
      try {
        const shift = empShiftMap[String(entry.employee)];
        if (!shift) {
          results.push({ employee: entry.employee, status: 'failed', error: 'Employee not found' });
          continue;
        }
        const shiftStartTime = shift.startTime as string;

        if (entry.inTime && entry.outTime) {
          const sStart = parseTimeToMinutes(shift.startTime as string);
          const sEnd = parseTimeToMinutes(shift.endTime as string);
          const isNightShift = sStart > sEnd;
          const isValid = isNightShift
            ? getMinutesDiff(entry.inTime, entry.outTime) > 0
            : parseTimeToMinutes(entry.outTime) > parseTimeToMinutes(entry.inTime);
          if (!isValid) {
            results.push({ employee: entry.employee, status: 'failed', error: 'Out time must be greater than in time' });
            continue;
          }
        }

        let isLate = false;
        if (settings.lateMarkEnabled && entry.status === 'present' && entry.inTime && shiftStartTime) {
          isLate = calculateLateStatus(entry.inTime, shiftStartTime, settings.lateMarkThresholdMinutes);
          entry.isLate = isLate;
          if (isLate && settings.lateToHalfDayAfterOccurrences > 0) {
            const shouldConvert = await checkHalfDayConversion(
              String(entry.employee),
              date,
              true,
              settings.lateToHalfDayAfterOccurrences,
            );
            if (shouldConvert) entry.status = 'half-day';
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
              ...(isLate !== undefined && { isLate }),
            },
          });
          results.push({ employee: entry.employee, status: 'updated' });
        } else {
          toCreate.push({
            employee: entry.employee,
            date: new Date(data.date),
            shift: shift._id,
            status: entry.status,
            inTime: entry.inTime,
            outTime: entry.outTime,
            remarks: entry.remarks,
            source: 'manual-register-entry',
            enteredBy: userId,
            ...(isLate !== undefined && { isLate }),
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
      await AttendanceEntry.bulkWrite(bulkUpdateOps);
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
      const empShift = employee.shift as unknown as Record<string, unknown> | null;
      if (empShift && typeof empShift.startTime === 'string' && typeof empShift.endTime === 'string') {
        const isNightShift = parseTimeToMinutes(empShift.startTime) > parseTimeToMinutes(empShift.endTime);
        const isValid = isNightShift
          ? getMinutesDiff(data.inTime as string, data.outTime as string) > 0
          : parseTimeToMinutes(data.outTime as string) > parseTimeToMinutes(data.inTime as string);
        if (!isValid) {
          throw new AppError('Out time must be greater than in time', 400);
        }
      }
    }

    let isLate = undefined;
    let effectiveStatus = data.status as string;
    const empShift = employee.shift as unknown as Record<string, unknown> | null;
    if (settings.lateMarkEnabled && data.status === 'present' && data.inTime && empShift) {
      const shiftStartTime = empShift.startTime as string;
      isLate = calculateLateStatus(data.inTime as string, shiftStartTime, settings.lateMarkThresholdMinutes);
      if (isLate && settings.lateToHalfDayAfterOccurrences > 0) {
        const shouldConvert = await checkHalfDayConversion(
          String(employee._id),
          attendanceDate,
          true,
          settings.lateToHalfDayAfterOccurrences,
        );
        if (shouldConvert) effectiveStatus = 'half-day';
      }
    }

    const entry = await AttendanceEntry.create({
      ...data,
      status: effectiveStatus,
      date: new Date(data.date as string),
      shift: empShift?._id,
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
    const entry = await AttendanceEntry.findById(id).populate({ path: 'employee', select: 'shift', populate: { path: 'shift', select: 'startTime endTime' } });
    if (!entry) {
      throw new AppError('Attendance entry not found or already deleted', 404);
    }

    if (data.inTime && data.outTime) {
      const emp = entry.employee as unknown as Record<string, unknown> | null;
      const empShift = emp?.shift as unknown as Record<string, unknown> | null;
      if (empShift && typeof empShift.startTime === 'string' && typeof empShift.endTime === 'string') {
        const isNightShift = parseTimeToMinutes(empShift.startTime) > parseTimeToMinutes(empShift.endTime);
        const isValid = isNightShift
          ? getMinutesDiff(data.inTime as string, data.outTime as string) > 0
          : parseTimeToMinutes(data.outTime as string) > parseTimeToMinutes(data.inTime as string);
        if (!isValid) {
          throw new AppError('Out time must be greater than in time', 400);
        }
      }
    }

    const updateData: Record<string, unknown> = { ...data, updatedBy: userId };
    delete updateData.overtimeHours;

    if (settings.lateMarkEnabled && data.status === 'present' && data.inTime) {
      const emp = entry.employee as unknown as Record<string, unknown> | null;
      const empShift = emp?.shift as Record<string, unknown> | null;
      if (empShift?.startTime) {
        const isLate = calculateLateStatus(data.inTime as string, empShift.startTime as string, settings.lateMarkThresholdMinutes);
        updateData.isLate = isLate;
      }
    } else if (settings.lateMarkEnabled && data.status !== 'present') {
      updateData.isLate = false;
    }

    Object.assign(entry, updateData);
    await entry.save();

    if (entry.inTime && entry.outTime) {
      const OvertimeRule = (await import('../../models/OvertimeRule.model.js')).default;
      const overtimeRule = await OvertimeRule.findOne({ isActive: true, applicableTo: 'all' }).lean();
      const maxOTHours = (overtimeRule as Record<string, unknown>)?.maxHoursPerDay as number || 4;

      const employeeIsLate = entry.isLate || false;

      const { totalHours, otHours } = this.calculateOTHours(
        entry.inTime,
        entry.outTime,
        employeeIsLate,
        settings,
        maxOTHours,
      );

      entry.totalHours = totalHours;
      await entry.save();

      const dayStart = new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate());
      const dayEnd = new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate(), 23, 59, 59, 999);

      const OvertimeEntry = (await import('../../models/OvertimeEntry.model.js')).default;
      const existingOT = await OvertimeEntry.findOne({
        employee: entry.employee,
        date: { $gte: dayStart, $lte: dayEnd },
      });

      if (otHours > 0) {
        if (existingOT) {
          existingOT.hours = otHours;
          existingOT.remarks = 'Updated via attendance update';
          await existingOT.save();
        } else {
          await OvertimeEntry.create({
            employee: entry.employee,
            date: entry.date,
            hours: otHours,
            remarks: 'Auto-calculated from attendance update',
            enteredBy: userId,
          });
        }
      } else if (existingOT) {
        await existingOT.deleteOne();
      }
    }

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

    const settings = await getAttendanceSettings();
    const entryIds = entries.map((e) => e.id);

    const existingDocs = await AttendanceEntry.find({ _id: { $in: entryIds } })
      .populate({ path: 'employee', select: 'shift', populate: { path: 'shift', select: 'startTime endTime' } })
      .lean();

    const entriesMap = new Map(existingDocs.map((e) => [String(e._id), e]));

    const bulkOps = entries.map((entry) => {
      const existing = entriesMap.get(entry.id);
      const update: Record<string, unknown> = { updatedBy: userId };
      if (entry.status) update.status = entry.status;
      if (entry.inTime !== undefined) update.inTime = entry.inTime;
      if (entry.outTime !== undefined) update.outTime = entry.outTime;
      if (entry.remarks !== undefined) update.remarks = entry.remarks;

      if (entry.inTime && entry.outTime) {
        const emp = existing ? existing.employee as unknown as Record<string, unknown> | null : null;
        const empShift = emp?.shift as unknown as Record<string, unknown> | null;
        if (empShift && typeof empShift.startTime === 'string' && typeof empShift.endTime === 'string') {
          const isNightShift = parseTimeToMinutes(empShift.startTime) > parseTimeToMinutes(empShift.endTime);
          const isValid = isNightShift
            ? getMinutesDiff(entry.inTime, entry.outTime) > 0
            : parseTimeToMinutes(entry.outTime) > parseTimeToMinutes(entry.inTime);
          if (!isValid) throw new AppError(`Entry ${entry.id}: out time must be greater than in time`, 400);
        } else if (getMinutesDiff(entry.inTime, entry.outTime) <= 0) {
          throw new AppError(`Entry ${entry.id}: out time must be greater than in time`, 400);
        }
      }

      if (settings.lateMarkEnabled && entry.inTime !== undefined && existing) {
        const effectiveStatus = entry.status ?? (existing.status as string | undefined);
        const emp = existing.employee as unknown as Record<string, unknown> | null;
        const empShift = emp?.shift as unknown as Record<string, unknown> | null;
        if (effectiveStatus === 'present' && empShift?.startTime) {
          update.isLate = calculateLateStatus(entry.inTime, empShift.startTime as string, settings.lateMarkThresholdMinutes);
        } else if (entry.status && entry.status !== 'present') {
          update.isLate = false;
        }
      }

      return {
        updateOne: {
          filter: { _id: entry.id },
          update: { $set: update },
        },
      };
    });

    const result = await AttendanceEntry.bulkWrite(bulkOps);

    await AuditService.log({
      action: 'bulk-update',
      module: 'attendance',
      userId,
      details: { total: entries.length, updated: result.modifiedCount },
    });

    return { updated: result.modifiedCount, failed: entries.length - result.modifiedCount, results: entries.map((e, i) => ({ id: e.id, status: i < result.modifiedCount ? 'updated' : 'failed' })) };
  }

  static calculateOTHours(
    inTime: string,
    outTime: string,
    isLate: boolean,
    config: AttendanceConfig,
    maxOTHours: number,
  ): { totalHours: number; otHours: number } {
    const workMinutes = getMinutesDiff(inTime, outTime);
    const totalHours = Math.max(0, workMinutes / 60);

    if (isLate && config.lateTreatWorkAsOT) {
      const otHours = Math.min(totalHours, maxOTHours);
      return { totalHours, otHours: Math.max(0, otHours) };
    }

    const shiftDurationMinutes = getMinutesDiff(config.shiftStartTime, config.shiftEndTime);

    const regularMinutes = Math.min(workMinutes, shiftDurationMinutes);
    const breakToDeduct = workMinutes > config.breakDeductionThresholdMinutes ? config.breakMinutes : 0;
    const otMinutes = Math.max(0, workMinutes - regularMinutes - breakToDeduct);
    const otHours = Math.min(otMinutes / 60, maxOTHours);

    return { totalHours, otHours: Math.max(0, otHours) };
  }

  static async adminCheckout(
    employeeId: string,
    adminId: string,
    reason: string,
  ) {
    const settings = await getAttendanceSettings();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const entry = await AttendanceEntry.findOne({
      employee: employeeId,
      date: { $gte: todayStart, $lte: todayEnd },
      outTime: { $exists: false },
    });

    if (!entry) {
      throw new AppError('No active check-in found for this employee today', 400);
    }

    const now = dayjs();
    const outTime = now.format('HH:mm');

    entry.outTime = outTime;
    entry.checkOutMethod = 'admin-override';
    entry.source = 'supervisor-override';
    entry.adminCheckout = {
      by: adminId as unknown as mongoose.Types.ObjectId,
      reason,
    };

    const overtimeRule = await import('../../models/OvertimeRule.model.js').then((m) =>
      m.default.findOne({ isActive: true, applicableTo: 'all' }).lean(),
    );
    const maxOTHours = (overtimeRule as Record<string, unknown>)?.maxHoursPerDay as number || 4;

    const employeeIsLate = entry.isLate || entry.isLatePresent;

    const { totalHours, otHours } = this.calculateOTHours(
      entry.inTime!,
      outTime,
      employeeIsLate,
      settings,
      maxOTHours,
    );

    entry.totalHours = totalHours;
    await entry.save();

    if (otHours > 0) {
      const OvertimeEntry = (await import('../../models/OvertimeEntry.model.js')).default;
      const existingOT = await OvertimeEntry.findOne({
        employee: employeeId,
        date: { $gte: todayStart, $lte: todayEnd },
      });

      if (existingOT) {
        existingOT.hours = otHours;
        existingOT.remarks = 'Admin checkout';
        await existingOT.save();
      } else {
        await OvertimeEntry.create({
          employee: employeeId,
          date: now.toDate(),
          hours: otHours,
          remarks: 'Admin checkout',
          enteredBy: adminId,
        });
      }
    }

    await AuditService.log({
      action: 'attendance-checkout',
      module: 'attendance',
      userId: adminId,
      targetId: String(entry._id),
      details: { method: 'admin-override', outTime, reason, totalHours, otHours },
    });

    return {
      id: String(entry._id),
      outTime,
      totalHours,
      otHours,
      message: 'Admin checkout completed',
    };
  }

  static async runAutoCheckout(): Promise<{ processed: number; checkedOut: number }> {
    const settings = await getAttendanceSettings();
    if (!settings.autoCheckoutEnabled) {
      return { processed: 0, checkedOut: 0 };
    }

    const overtimeRule = await import('../../models/OvertimeRule.model.js').then((m) =>
      m.default.findOne({ isActive: true, applicableTo: 'all' }).lean(),
    );
    const maxOTHours = (overtimeRule as Record<string, unknown>)?.maxHoursPerDay as number || 4;

    const defaultShiftEndTime = settings.shiftEndTime;

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const stuckEntries = await AttendanceEntry.find({
      outTime: { $exists: false },
      date: { $gte: yesterdayStart, $lte: todayEnd },
    }).populate('shift', 'startTime endTime');

    let checkedOut = 0;

    for (const entry of stuckEntries) {
      const entryDate = dayjs(entry.date);
      const shiftData = entry.shift as unknown as { startTime?: string; endTime?: string } | null;
      const shiftStart = shiftData?.startTime ? parseTimeToMinutes(shiftData.startTime) : null;
      const shiftEnd = shiftData?.endTime ? parseTimeToMinutes(shiftData.endTime) : null;
      const isNightShift = shiftStart !== null && shiftEnd !== null && shiftStart > shiftEnd;
      const entryDayShiftEnd = shiftEnd ?? parseTimeToMinutes(defaultShiftEndTime);
      const entryDayAutoCheckout = entryDayShiftEnd + (maxOTHours * 60) + settings.autoCheckoutGraceMinutes;

      const autoCheckoutHour = Math.floor(entryDayAutoCheckout / 60) % 24;
      const autoCheckoutMinute = entryDayAutoCheckout % 60;

      const autoCheckoutDay = isNightShift ? entryDate.add(1, 'day') : entryDate;
      const autoCheckoutTime = autoCheckoutDay.hour(autoCheckoutHour).minute(autoCheckoutMinute).second(0);

      if (dayjs().isBefore(autoCheckoutTime)) {
        continue;
      }

      const outTime = `${String(autoCheckoutHour).padStart(2, '0')}:${String(autoCheckoutMinute).padStart(2, '0')}`;

      entry.outTime = outTime;
      entry.autoCheckout = true;
      entry.checkOutMethod = 'auto-checkout';
      entry.source = 'auto-checkout';

      const employeeIsLate = entry.isLate || entry.isLatePresent;

      const { totalHours, otHours } = this.calculateOTHours(
        entry.inTime!,
        outTime,
        employeeIsLate,
        settings,
        maxOTHours,
      );

      entry.totalHours = totalHours;
      await entry.save();

      if (otHours > 0) {
        const OvertimeEntry = (await import('../../models/OvertimeEntry.model.js')).default;
        const existingOT = await OvertimeEntry.findOne({
          employee: entry.employee,
          date: { $gte: entryDate.startOf('day').toDate(), $lte: entryDate.endOf('day').toDate() },
        });

        if (existingOT) {
          existingOT.hours = otHours;
          existingOT.remarks = 'Auto-checkout';
          await existingOT.save();
        } else {
          await OvertimeEntry.create({
            employee: entry.employee,
            date: entryDate.toDate(),
            hours: otHours,
            remarks: 'Auto-checkout',
            enteredBy: entry.employee,
          });
        }
      }

      await AuditService.log({
        action: 'attendance-checkout',
        module: 'attendance',
        userId: String(entry.employee),
        targetId: String(entry._id),
        details: { method: 'auto-checkout', outTime, totalHours, otHours },
      });

      checkedOut++;
    }

    return { processed: stuckEntries.length, checkedOut };
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