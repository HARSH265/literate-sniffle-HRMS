import LeaveType from '../../models/LeaveType.model.js';
import LeaveApplication from '../../models/LeaveApplication.model.js';
import LeaveBalance from '../../models/LeaveBalance.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import User from '../../models/User.model.js';
import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { NotificationService } from '../../core/notification/NotificationService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getFinancialYear(date: Date, startMonth: number): number {
  return date.getMonth() + 1 >= startMonth ? date.getFullYear() : date.getFullYear() - 1;
}

function countCalendarDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

async function getLeaveSettings() {
  const settings = await CompanySettings.findOne().lean();
  return (settings as any)?.leaveConfig || {
    financialYearStartMonth: 4,
    accrualDayOfMonth: 1,
    defaultApprovalLevels: 1,
    allowCancelAfterApproval: false,
    cancelAfterApprovalDaysLimit: 0,
    deductionPriority: 'unpaid-first',
    allowanceProRateMode: 'days',
    deductionProRateMode: 'days',
  };
}

function mapId(doc: any): any {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, ...rest } = obj;
  return { ...rest, id: String(_id), _id: undefined };
}

function mapPopulatedId(doc: any): any {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id), _id: undefined };
}

async function notifyLeave(recipientId: string, title: string, message: string, module: string, link?: string) {
  try {
    await NotificationService.send({
      title,
      message,
      type: 'info',
      recipient: recipientId,
      module,
      link,
    });
  } catch { /* noop */ }
}

async function getApprovers(employeeId: string): Promise<string[]> {
  const employee = await Employee.findById(employeeId).lean();
  if (!employee) return [];
  const users = await User.find({ role: { $in: ['hr-admin', 'hr-staff', 'super-admin'] } }).select('_id').lean();
  return users.map(u => String(u._id));
}

export class LeaveService {
  static async listLeaveTypes(): Promise<any[]> {
    const types = await LeaveType.find().sort({ sortOrder: 1, name: 1 }).lean();
    return types.map(mapPopulatedId);
  }

  static async createLeaveType(data: Record<string, unknown>, userId: string): Promise<any> {
    const existing = await LeaveType.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${String(data.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { code: String(data.code).toUpperCase() },
      ],
    });
    if (existing) {
      throw new AppError('Leave type with this name or code already exists', 400);
    }
    const leaveType = await LeaveType.create({ ...data, createdBy: userId });
    await AuditService.log({
      action: 'create', module: 'leave', userId,
      targetId: leaveType._id.toString(), targetName: leaveType.name,
      details: { code: leaveType.code, isPaid: leaveType.isPaid },
    });
    return mapId(leaveType);
  }

  static async updateLeaveType(id: string, data: Record<string, unknown>, userId: string): Promise<any> {
    const leaveType = await LeaveType.findById(id);
    if (!leaveType) throw new AppError('Leave type not found', 404);
    Object.assign(leaveType, data, { updatedBy: userId });
    await leaveType.save();
    await AuditService.log({
      action: 'update', module: 'leave', userId,
      targetId: id, targetName: leaveType.name,
      details: data,
    });
    return mapId(leaveType);
  }

  static async deleteLeaveType(id: string, userId: string): Promise<void> {
    const leaveType = await LeaveType.findById(id);
    if (!leaveType) throw new AppError('Leave type not found', 404);
    const inUse = await LeaveApplication.countDocuments({ leaveType: id, status: { $in: ['pending', 'approved'] } });
    if (inUse > 0) {
      throw new AppError('Cannot delete leave type that has active applications', 400);
    }
    await LeaveType.findByIdAndDelete(id);
    await LeaveBalance.deleteMany({ leaveType: id });
    await AuditService.log({
      action: 'delete', module: 'leave', userId,
      targetId: id, targetName: leaveType.name,
    });
  }

  static async listApplications(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);
    const filter: Record<string, unknown> = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.employee) filter.employee = queryParams.employee;
    if (queryParams.leaveType) filter.leaveType = queryParams.leaveType;
    if (queryParams.startDate) {
      filter.startDate = { $gte: new Date(queryParams.startDate as string) };
    }
    if (queryParams.endDate) {
      filter.endDate = { $lte: new Date(queryParams.endDate as string) };
    }
    if (queryParams.department) {
      const employees = await Employee.find({ department: queryParams.department }).select('_id').lean();
      filter.employee = { $in: employees.map(e => e._id) };
    }
    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };
    const [applications, total] = await Promise.all([
      LeaveApplication.find(filter)
        .populate('employee', 'fullName employeeCode department')
        .populate('leaveType', 'name code color isPaid')
        .populate('approvers.approver', 'name email')
        .populate('appliedBy', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveApplication.countDocuments(filter),
    ]);
    const data = applications.map((a: any) => ({
      ...a,
      id: String(a._id),
      _id: undefined,
      employee: a.employee ? { id: String(a.employee._id), fullName: a.employee.fullName, employeeCode: a.employee.employeeCode, department: a.employee.department } : null,
      leaveType: a.leaveType ? { id: String(a.leaveType._id), name: a.leaveType.name, code: a.leaveType.code, color: a.leaveType.color, isPaid: a.leaveType.isPaid } : null,
      approvers: a.approvers?.map((ap: any) => ({
        level: ap.level,
        approver: ap.approver ? { id: String(ap.approver._id), name: ap.approver.name, email: ap.approver.email } : null,
        status: ap.status,
        remarks: ap.remarks,
        decidedAt: ap.decidedAt,
      })),
      appliedBy: a.appliedBy ? { id: String(a.appliedBy._id), name: a.appliedBy.name } : null,
    }));
    const meta = PaginationUtil.getMeta(page, limit, total);
    return { data, meta };
  }

  static async getEmployeeApplications(employeeId: string, queryParams: Record<string, unknown>): Promise<any[]> {
    const filter: Record<string, unknown> = { employee: employeeId };
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.year) {
      const year = Number(queryParams.year);
      filter.startDate = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) };
    }
    const applications = await LeaveApplication.find(filter)
      .populate('leaveType', 'name code color isPaid')
      .populate('approvers.approver', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return applications.map((a: any) => ({
      ...a,
      id: String(a._id),
      _id: undefined,
      leaveType: a.leaveType ? { id: String(a.leaveType._id), name: a.leaveType.name, code: a.leaveType.code, color: a.leaveType.color, isPaid: a.leaveType.isPaid } : null,
    }));
  }

  static async createApplication(data: Record<string, unknown>, userId: string): Promise<any> {
    const employee = await Employee.findById(data.employee);
    if (!employee) throw new AppError('Employee not found', 400);

    const leaveType = await LeaveType.findById(data.leaveType);
    if (!leaveType || !leaveType.isActive) throw new AppError('Leave type not found or inactive', 400);

    if (leaveType.applicableToGender !== 'all') {
      const user = await User.findById(userId).lean();
      if (!user) throw new AppError('User not found', 400);
    }

    const startDate = parseDate(data.startDate as string);
    const endDate = parseDate(data.endDate as string);
    if (endDate < startDate) throw new AppError('End date must be after start date', 400);

    const totalDays = countCalendarDays(startDate, endDate);
    if (totalDays > leaveType.maxDaysPerApplication) {
      throw new AppError(`Maximum ${leaveType.maxDaysPerApplication} days allowed per application for ${leaveType.name}`, 400);
    }

    const settings = await getLeaveSettings();
    const year = getFinancialYear(startDate, settings.financialYearStartMonth);

    const balance = await LeaveBalance.findOne({ employee: data.employee, leaveType: data.leaveType, year });
    const availableBalance = balance ? balance.balance : 0;
    if (totalDays > availableBalance && !leaveType.allowNegativeBalance) {
      throw new AppError(`Insufficient balance. Available: ${availableBalance}, Requested: ${totalDays}`, 400);
    }

    const overlapping = await LeaveApplication.find({
      employee: data.employee,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    });
    if (overlapping.length > 0) {
      throw new AppError('Employee already has a leave application in this date range', 400);
    }

    const isPaid = leaveType.isPaid;
    const deductionMethod = isPaid ? 'none' : leaveType.deductionMethod;

    const needApproval = leaveType.requiresApproval && totalDays > leaveType.autoApproveThreshold;
    const defaultApprovalLevels = needApproval ? (leaveType.approvalLevels || settings.defaultApprovalLevels) : 0;

    let applicationStatus = 'approved';
    let approvers: Array<any> = [];
    let currentLevel = 0;

    if (needApproval) {
      applicationStatus = 'pending';
      currentLevel = 1;
      const approverUserIds = await getApprovers(data.employee as string);
      for (let level = 1; level <= defaultApprovalLevels; level++) {
        for (const approverId of approverUserIds) {
          approvers.push({ level, approver: approverId, status: 'pending' });
        }
      }
    }

    const application = await LeaveApplication.create({
      employee: data.employee,
      leaveType: data.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: data.reason,
      documentUrl: data.documentUrl,
      status: applicationStatus,
      currentApprovalLevel: currentLevel,
      totalApprovalLevels: defaultApprovalLevels,
      approvers,
      isPaid,
      deductionMethod,
      appliedBy: userId,
    });

    if (balance) {
      balance.totalPending += totalDays;
      balance.balance = Math.max(0, balance.totalEntitled + balance.carryForwardFromPrev - balance.totalUsed - balance.totalPending);
      await balance.save();
    }

    await AuditService.log({
      action: 'create', module: 'leave', userId,
      targetId: application._id.toString(),
      details: { employee: data.employee, leaveType: data.leaveType, startDate: data.startDate, endDate: data.endDate, totalDays, status: applicationStatus },
    });

    const recipientUser = await User.findOne({ employee: data.employee }).lean();
    if (recipientUser) {
      await notifyLeave(
        String(recipientUser._id),
        'Leave Application Submitted',
        `Your ${leaveType.name} application for ${totalDays} day(s) from ${data.startDate} to ${data.endDate} has been ${applicationStatus}.`,
        'leave',
        `/leave/my-applications`,
      );
    }

    if (applicationStatus === 'approved') {
      const attendanceStart = new Date(startDate);
      const attendanceEnd = new Date(endDate);
      const attendanceEntries = [];
      for (let d = new Date(attendanceStart); d <= attendanceEnd; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) {
          attendanceEntries.push({
            employee: data.employee,
            date: new Date(d),
            status: 'leave',
            enteredBy: userId,
            source: 'manual-register-entry',
          });
        }
      }
      if (attendanceEntries.length > 0) {
        const existingRecords = await AttendanceEntry.find({
          employee: data.employee,
          date: { $gte: attendanceStart, $lte: attendanceEnd },
        }).lean();
        const existingDates = new Set(existingRecords.map((r: any) => formatDate(new Date(r.date))));
        const toCreate = attendanceEntries.filter(e => !existingDates.has(formatDate(e.date)));
        if (toCreate.length > 0) {
          await AttendanceEntry.insertMany(toCreate);
        }
      }
    }

    return mapId(application);
  }

  static async cancelApplication(id: string, userId: string): Promise<any> {
    const application = await LeaveApplication.findById(id);
    if (!application) throw new AppError('Leave application not found', 404);

    if (application.status === 'approved' || application.status === 'rejected') {
      const settings = await getLeaveSettings();
      if (!settings.allowCancelAfterApproval) {
        throw new AppError('Cannot cancel an application that has been processed', 400);
      }
      const appDoc = application as any;
      const daysSinceDecision = Math.floor((Date.now() - (appDoc.updatedAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24));
      if (daysSinceDecision > settings.cancelAfterApprovalDaysLimit) {
        throw new AppError(`Cancellation period of ${settings.cancelAfterApprovalDaysLimit} days has expired`, 400);
      }
    }

    const wasApproved = application.status === 'approved';

    if (application.status === 'cancelled') {
      throw new AppError('Application is already cancelled', 400);
    }

    application.status = 'cancelled';
    application.cancelledBy = userId as any;
    application.cancelledAt = new Date();
    application.updatedBy = userId as any;
    await application.save();

    const balance = await LeaveBalance.findOne({ employee: application.employee, leaveType: application.leaveType, year: getFinancialYear(application.startDate, 4) });
    if (balance) {
      if (wasApproved) {
        balance.totalUsed = Math.max(0, balance.totalUsed - application.totalDays);
      } else {
        balance.totalPending = Math.max(0, balance.totalPending - application.totalDays);
      }
      balance.balance = balance.totalEntitled + balance.carryForwardFromPrev - balance.totalUsed - balance.totalPending;
      await balance.save();
    }

    if (wasApproved) {
      await AttendanceEntry.deleteMany({
        employee: application.employee,
        date: { $gte: application.startDate, $lte: application.endDate },
        status: 'leave',
      });
    }

    await AuditService.log({
      action: 'update', module: 'leave', userId,
      targetId: id, details: { status: 'cancelled' },
    });

    return mapId(application);
  }

  static async approveApplication(data: { applicationId: string; status: 'approved' | 'rejected'; remarks?: string }, userId: string): Promise<any> {
    const application = await LeaveApplication.findById(data.applicationId).populate('leaveType');
    if (!application) throw new AppError('Leave application not found', 404);
    if (application.status !== 'pending') throw new AppError('Application is not pending', 400);

    const approverEntry = application.approvers.find(
      (a: any) => String(a.approver) === userId && a.level === application.currentApprovalLevel && a.status === 'pending',
    );
    if (!approverEntry) {
      throw new AppError('You are not authorized to approve this application at the current level', 403);
    }

    approverEntry.status = data.status;
    approverEntry.remarks = data.remarks || '';
    approverEntry.decidedAt = new Date();

    if (data.status === 'rejected') {
      application.status = 'rejected';
      await application.save();

      const balance = await LeaveBalance.findOne({ employee: application.employee, leaveType: application.leaveType, year: getFinancialYear(application.startDate, 4) });
      if (balance) {
        balance.totalPending = Math.max(0, balance.totalPending - application.totalDays);
        balance.balance = balance.totalEntitled + balance.carryForwardFromPrev - balance.totalUsed - balance.totalPending;
        await balance.save();
      }
    } else {
      const allApprovedAtLevel = application.approvers
        .filter((a: any) => a.level === application.currentApprovalLevel)
        .every((a: any) => a.status === 'approved');

      if (allApprovedAtLevel && application.currentApprovalLevel < application.totalApprovalLevels) {
        application.currentApprovalLevel += 1;
      } else if (allApprovedAtLevel) {
        application.status = 'approved';

        const balance = await LeaveBalance.findOne({ employee: application.employee, leaveType: application.leaveType, year: getFinancialYear(application.startDate, 4) });
        if (balance) {
          balance.totalPending = Math.max(0, balance.totalPending - application.totalDays);
          balance.totalUsed += application.totalDays;
          balance.balance = Math.max(0, balance.totalEntitled + balance.carryForwardFromPrev - balance.totalUsed);
          await balance.save();
        }

        const attendanceStart = new Date(application.startDate);
        const attendanceEnd = new Date(application.endDate);
        const attendanceEntries = [];
        for (let d = new Date(attendanceStart); d <= attendanceEnd; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0) {
            attendanceEntries.push({
              employee: application.employee,
              date: new Date(d),
              status: 'leave',
              enteredBy: userId as any,
              source: 'manual-register-entry',
            });
          }
        }
        if (attendanceEntries.length > 0) {
          const existingRecords = await AttendanceEntry.find({
            employee: application.employee,
            date: { $gte: attendanceStart, $lte: attendanceEnd },
          }).lean();
          const existingDates = new Set(existingRecords.map((r: any) => formatDate(new Date(r.date))));
          const toCreate = attendanceEntries.filter(e => !existingDates.has(formatDate(e.date)));
          if (toCreate.length > 0) {
            await AttendanceEntry.insertMany(toCreate);
          }
        }

        const empUser = await User.findOne({ employee: application.employee }).lean();
        if (empUser) {
          await notifyLeave(
            String(empUser._id),
            'Leave Application Approved',
            `Your ${(application as any).leaveType?.name || ''} leave application for ${application.totalDays} day(s) has been approved.`,
            'leave-approval',
            `/leave/my-applications`,
          );
        }
      }
    }

    application.updatedBy = userId as any;
    await application.save();

    await AuditService.log({
      action: data.status === 'approved' ? 'approve' : 'reject', module: 'leave', userId,
      targetId: data.applicationId,
      details: { status: data.status, remarks: data.remarks },
    });

    return mapId(application);
  }

  static async getPendingApprovals(userId: string, _queryParams: Record<string, unknown>): Promise<any[]> {
    const applications = await LeaveApplication.find({
      status: 'pending',
      'approvers': {
        $elemMatch: { approver: userId, status: 'pending' },
      },
    })
      .populate('employee', 'fullName employeeCode department')
      .populate('leaveType', 'name code color isPaid')
      .sort({ createdAt: -1 })
      .lean();

    return applications.map((a: any) => ({
      ...a,
      id: String(a._id),
      _id: undefined,
      employee: a.employee ? { id: String(a.employee._id), fullName: a.employee.fullName, employeeCode: a.employee.employeeCode, department: a.employee.department } : null,
      leaveType: a.leaveType ? { id: String(a.leaveType._id), name: a.leaveType.name, code: a.leaveType.code, color: a.leaveType.color, isPaid: a.leaveType.isPaid } : null,
    }));
  }

  static async getBalances(employeeId: string, year?: number): Promise<any[]> {
    const currentYear = year || new Date().getFullYear();
    const leaveTypes = await LeaveType.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    const balances = await LeaveBalance.find({ employee: employeeId, year: currentYear }).lean();
    const balanceMap: Record<string, any> = {};
    balances.forEach((b: any) => { balanceMap[String(b.leaveType)] = b; });

    const result = [];
    for (const lt of leaveTypes) {
      const existing = balanceMap[String(lt._id)];
      result.push({
        leaveType: { id: String(lt._id), name: lt.name, code: lt.code, color: lt.color, isPaid: lt.isPaid },
        year: currentYear,
        totalEntitled: existing?.totalEntitled || 0,
        totalUsed: existing?.totalUsed || 0,
        totalPending: existing?.totalPending || 0,
        carryForward: existing?.carryForwardFromPrev || 0,
        balance: existing?.balance || 0,
      });
    }
    return result;
  }

  static async bulkAccrue(data: { leaveTypeId: string; year: number; employeeIds?: string[] }, userId: string): Promise<any> {
    const leaveType = await LeaveType.findById(data.leaveTypeId);
    if (!leaveType) throw new AppError('Leave type not found', 404);
    if (leaveType.accrualMethod === 'manual') throw new AppError('This leave type uses manual accrual', 400);

    const filter: Record<string, unknown> = { status: 'active' };
    if (data.employeeIds) filter._id = { $in: data.employeeIds };

    const employees = await Employee.find(filter).lean();
    const settings = await getLeaveSettings();
    const results = [];

    for (const emp of employees) {
      const empId = String(emp._id);
      let entitled = leaveType.maxDaysPerYear;

      if (leaveType.accrualMethod === 'monthly-pro-rata') {
        const joinDate = emp.joiningDate ? new Date(emp.joiningDate) : new Date();
        const monthsActive = Math.max(1, 12 - (joinDate.getMonth() + 1) + 1);
        entitled = Math.round((entitled / 12) * monthsActive);
      } else if (leaveType.accrualMethod === 'yearly-lump' && leaveType.proRataOnJoin) {
        const joinDate = emp.joiningDate ? new Date(emp.joiningDate) : new Date();
        const fyStart = new Date(data.year, settings.financialYearStartMonth - 1, 1);
        if (joinDate > fyStart) {
          const totalDays = 365;
          const remainingDays = Math.max(0, Math.floor((new Date(data.year + 1, settings.financialYearStartMonth - 1, 1).getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)));
          entitled = Math.round((entitled / totalDays) * remainingDays);
        }
      }

      let carryForward = 0;
      const prevBalance = await LeaveBalance.findOne({ employee: empId, leaveType: data.leaveTypeId, year: data.year - 1 }).lean();
      if (leaveType.carryForward && prevBalance) {
        carryForward = Math.min(prevBalance.balance, leaveType.carryForwardLimit);
      }

      const existing = await LeaveBalance.findOne({ employee: empId, leaveType: data.leaveTypeId, year: data.year });
      if (existing) {
        existing.totalEntitled = entitled;
        existing.carryForwardFromPrev = carryForward;
        existing.balance = entitled + carryForward - existing.totalUsed - existing.totalPending;
        existing.lastAccruedAt = new Date();
        await existing.save();
        results.push({ employee: empId, status: 'updated', balance: existing.balance, entitled, carryForward });
      } else {
        const newBalance = await LeaveBalance.create({
          employee: empId,
          leaveType: data.leaveTypeId,
          year: data.year,
          totalEntitled: entitled,
          carryForwardFromPrev: carryForward,
          balance: entitled + carryForward,
          lastAccruedAt: new Date(),
          createdBy: userId,
        });
        results.push({ employee: empId, status: 'created', balance: newBalance.balance, entitled, carryForward });
      }
    }

    await AuditService.log({
      action: 'bulk-create', module: 'leave', userId,
      details: { leaveTypeId: data.leaveTypeId, year: data.year, employeeCount: employees.length },
    });

    return { totalProcessed: employees.length, results };
  }

  static async getCalendar(queryParams: Record<string, unknown>): Promise<any[]> {
    const { month, year, department } = queryParams;
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter).select('_id fullName employeeCode department').lean();
    const empIds = employees.map(e => e._id);

    const applications = await LeaveApplication.find({
      employee: { $in: empIds },
      status: { $in: ['approved', 'pending'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
      .populate('leaveType', 'name code color')
      .populate('employee', 'fullName employeeCode')
      .lean();

    const result = applications.map((a: any) => {
      const appStart = new Date(Math.max(startDate.getTime(), new Date(a.startDate).getTime()));
      const appEnd = new Date(Math.min(endDate.getTime(), new Date(a.endDate).getTime()));
      const days: string[] = [];
      for (let d = new Date(appStart); d <= appEnd; d.setDate(d.getDate() + 1)) {
        days.push(formatDate(d));
      }
      return {
        id: String(a._id),
        employee: a.employee ? { id: String(a.employee._id), fullName: a.employee.fullName, employeeCode: a.employee.employeeCode } : null,
        leaveType: a.leaveType ? { id: String(a.leaveType._id), name: a.leaveType.name, code: a.leaveType.code, color: a.leaveType.color } : null,
        startDate: a.startDate,
        endDate: a.endDate,
        totalDays: a.totalDays,
        status: a.status,
        days,
      };
    });

    return result;
  }

  static async getLeaveSummary(queryParams: Record<string, unknown>): Promise<any> {
    const { month, year, department } = queryParams;
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const employeeFilter: Record<string, unknown> = { status: 'active' };
    if (department) employeeFilter.department = department;
    const employees = await Employee.find(employeeFilter).select('_id').lean();
    const empIds = employees.map(e => e._id);

    const applications = await LeaveApplication.find({
      employee: { $in: empIds },
      status: { $in: ['approved', 'pending'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
      .populate('leaveType', 'name code color isPaid')
      .lean();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, { name: string; code: string; days: number; count: number }> = {};
    let totalDays = 0;
    let totalApplications = 0;

    for (const app of applications as any[]) {
      const overlapStart = new Date(Math.max(startDate.getTime(), new Date(app.startDate).getTime()));
      const overlapEnd = new Date(Math.min(endDate.getTime(), new Date(app.endDate).getTime()));
      const daysInMonth = countCalendarDays(overlapStart, overlapEnd);

      byStatus[app.status] = (byStatus[app.status] || 0) + daysInMonth;
      const lt = app.leaveType;
      if (lt) {
        if (!byType[lt.code]) byType[lt.code] = { name: lt.name, code: lt.code, days: 0, count: 0 };
        byType[lt.code].days += daysInMonth;
        byType[lt.code].count += 1;
      }
      totalDays += daysInMonth;
      totalApplications += 1;
    }

    return {
      totalDays,
      totalApplications,
      totalEmployees: employees.length,
      byStatus,
      byType: Object.values(byType),
    };
  }
}
