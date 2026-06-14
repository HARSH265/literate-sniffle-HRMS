import Employee from '../../models/Employee.model.js';
import User from '../../models/User.model.js';
import EssChangeRequest from '../../models/EssChangeRequest.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import AttendanceEntry from '../../models/AttendanceEntry.model.js';
import Loan from '../../models/Loan.model.js';
import LoanType from '../../models/LoanType.model.js';
import { LeaveService } from '../leave/leave.service.js';
import { PayrollService } from '../payroll/payroll.service.js';
import { LoansService } from '../loans/loans.service.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { PaginationUtil, PaginationMeta } from '../../core/utils/PaginationUtil.js';
import { AssetService } from '../assets/asset.service.js';

export class EssService {
  static async getSettings(): Promise<Record<string, unknown>> {
    const settings = await CompanySettings.findOne().lean() as Record<string, unknown>;
    return (settings?.employeeSelfService as Record<string, unknown>) || {};
  }

  static async getEmployeeFromUser(userId: string): Promise<Record<string, unknown> | null> {
    const user = await User.findById(userId).lean() as Record<string, unknown> | null;
    if (!user) throw new AppError('User not found', 404);

    const employeeId = (user as any).employeeId;
    if (!employeeId) return null;

    const employee = await Employee.findById(employeeId).populate('department designation shift department.head').lean() as Record<string, unknown> | null;
    return employee || null;
  }

  static async getProfile(userId: string): Promise<Record<string, unknown>> {
    const settings = await this.getSettings();
    const essEnabled = (settings as any).essEnabled !== false;
    if (!essEnabled) throw new AppError('Employee Self-Service is disabled', 403);

    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) {
      return { message: 'No employee linked to this user account. Contact HR to link your profile.' };
    }

    const allowedFields = this.getAllowedFields(settings);

    const profile: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field === 'bankDetails') {
        profile.bankDetails = (employee as any).bankDetails || {};
      } else {
        profile[field] = (employee as any)[field];
      }
    }

    return {
      ...employee,
      editableFields: allowedFields,
    };
  }

  static async updateProfile(userId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const settings = await this.getSettings();
    const essEnabled = (settings as any).essEnabled !== false;
    if (!essEnabled) throw new AppError('Employee Self-Service is disabled', 403);

    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) throw new AppError('No employee linked to this user account', 400);
    const employeeId = (employee as any)._id.toString();

    const changeRequiresApproval = (settings as any).changeRequiresApproval !== false;

    const updatedFields: Record<string, unknown> = {};
    const changeRequests: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

    for (const [key, value] of Object.entries(data)) {
      if (!this.isFieldAllowed(key, settings)) continue;
      const oldValue = (employee as any)[key];

      if (changeRequiresApproval) {
        changeRequests.push({ field: key, oldValue, newValue: value });
      } else {
        updatedFields[key] = value;
      }
    }

    if (changeRequiresApproval && changeRequests.length > 0) {
      const requests = await EssChangeRequest.insertMany(
        changeRequests.map((cr) => ({
          employee: employeeId,
          field: cr.field,
          oldValue: cr.oldValue,
          newValue: cr.newValue,
          status: 'pending',
        })),
      );

      await AuditService.log({
        action: 'create',
        module: 'ess',
        userId,
        targetId: employeeId,
        details: { changeRequests: requests.length, fields: changeRequests.map((r) => r.field) },
      });

      return { message: 'Change requests submitted for approval', requests: requests.length };
    }

    if (Object.keys(updatedFields).length > 0) {
      await Employee.findByIdAndUpdate(employeeId, { $set: updatedFields });

      await AuditService.log({
        action: 'update',
        module: 'ess',
        userId,
        targetId: employeeId,
        details: { updatedFields: Object.keys(updatedFields) },
      });
    }

    return { message: 'Profile updated successfully' };
  }

  static async requestChange(userId: string, data: { field: string; newValue: unknown; notes?: string }): Promise<Record<string, unknown>> {
    const settings = await this.getSettings();
    const essEnabled = (settings as any).essEnabled !== false;
    if (!essEnabled) throw new AppError('Employee Self-Service is disabled', 403);

    if (!this.isFieldAllowed(data.field, settings)) {
      throw new AppError(`Field '${data.field}' is not editable`, 400);
    }

    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) throw new AppError('No employee linked to this user account', 400);
    const employeeId = (employee as any)._id.toString();
    const oldValue = (employee as any)[data.field];

    const request = await EssChangeRequest.create({
      employee: employeeId,
      field: data.field,
      oldValue,
      newValue: data.newValue,
      notes: data.notes,
      status: 'pending',
    });

    await AuditService.log({
      action: 'create',
      module: 'ess',
      userId,
      targetId: employeeId,
      details: { field: data.field, requestId: request._id.toString() },
    });

    return { message: 'Change request submitted', requestId: request._id.toString() };
  }

  static async getChangeRequests(userId: string, queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) {
      return { data: [], meta: PaginationUtil.getMeta(1, limit, 0) };
    }

    const employeeId = (employee as any)._id.toString();
    const filter: Record<string, unknown> = { employee: employeeId };
    if (queryParams.status) filter.status = queryParams.status;

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [requests, total] = await Promise.all([
      EssChangeRequest.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      EssChangeRequest.countDocuments(filter),
    ]);

    const data = requests.map((r) => {
      const { _id, ...rest } = r as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });

    return { data, meta: PaginationUtil.getMeta(page, limit, total) };
  }

  static async getAllChangeRequests(queryParams: Record<string, unknown>): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const { page, limit, sort, order, search } = PaginationUtil.parseFromObject(queryParams);
    void search;

    const filter: Record<string, unknown> = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.employeeId) filter.employee = queryParams.employeeId;

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [requests, total] = await Promise.all([
      EssChangeRequest.find(filter).populate('employee', 'fullName employeeCode').sort(sortObj).skip(skip).limit(limit).lean(),
      EssChangeRequest.countDocuments(filter),
    ]);

    const data = requests.map((r) => {
      const { _id, ...rest } = r as Record<string, unknown>;
      return { ...rest, id: String(_id), _id: undefined };
    });

    return { data, meta: PaginationUtil.getMeta(page, limit, total) };
  }

  static async approveChange(requestId: string, approverId: string, notes?: string): Promise<Record<string, unknown>> {
    const request = await EssChangeRequest.findById(requestId);
    if (!request) throw new AppError('Change request not found', 404);
    if (request.status !== 'pending') throw new AppError('Change request is already processed', 400);

    request.status = 'approved';
    request.approvedBy = approverId as any;
    request.approvedAt = new Date();
    if (notes) request.notes = notes;

    const updatePayload: Record<string, unknown> = {};
    updatePayload[request.field] = request.newValue;

    await Employee.findByIdAndUpdate(request.employee, { $set: updatePayload });
    await request.save();

    await AuditService.log({
      action: 'update',
      module: 'ess',
      userId: approverId,
      targetId: request._id.toString(),
      details: { action: 'approve', field: request.field, employeeId: request.employee.toString() },
    });

    return { message: 'Change request approved', requestId: request._id.toString() };
  }

  static async rejectChange(requestId: string, approverId: string, reason: string): Promise<Record<string, unknown>> {
    const request = await EssChangeRequest.findById(requestId);
    if (!request) throw new AppError('Change request not found', 404);
    if (request.status !== 'pending') throw new AppError('Change request is already processed', 400);

    request.status = 'rejected';
    request.approvedBy = approverId as any;
    request.approvedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    await AuditService.log({
      action: 'update',
      module: 'ess',
      userId: approverId,
      targetId: request._id.toString(),
      details: { action: 'reject', field: request.field, reason, employeeId: request.employee.toString() },
    });

    return { message: 'Change request rejected', requestId: request._id.toString() };
  }

  static async getStats(): Promise<Record<string, unknown>> {
    const [pending, approved, rejected, total] = await Promise.all([
      EssChangeRequest.countDocuments({ status: 'pending' }),
      EssChangeRequest.countDocuments({ status: 'approved' }),
      EssChangeRequest.countDocuments({ status: 'rejected' }),
      EssChangeRequest.countDocuments(),
    ]);

    return { pending, approved, rejected, total };
  }

  static async getMyAttendance(userId: string, month: string): Promise<unknown[]> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) return [];

    const employeeId = (employee as any)._id.toString();
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const records = await AttendanceEntry.find({
      employee: employeeId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate('shift', 'name startTime endTime')
      .sort({ date: 1 })
      .lean();

    return records.map((r: any) => ({
      id: String(r._id),
      date: r.date,
      status: r.status,
      checkIn: r.inTime,
      checkOut: r.outTime,
      otHours: r.otHours || 0,
      shift: r.shift ? { name: r.shift.name } : null,
    }));
  }

  static async getMyLeaveBalances(userId: string): Promise<any[]> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) return [];

    const employeeId = (employee as any)._id.toString();
    return LeaveService.getBalances(employeeId);
  }

  static async getMyLeaveApplications(userId: string): Promise<any[]> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) return [];

    const employeeId = (employee as any)._id.toString();
    return LeaveService.getEmployeeApplications(employeeId, {});
  }

  static async getMyDocuments(userId: string): Promise<any[]> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) return [];

    return (employee as any).documents || [];
  }

  static async getMyPayslips(userId: string): Promise<unknown[]> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) return [];

    const employeeId = (employee as any)._id.toString();
    return PayrollService.getByEmployee(employeeId);
  }

  static async getMyAssets(userId: string): Promise<unknown[]> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) return [];

    const employeeId = (employee as any)._id.toString();
    return AssetService.getEmployeeAssets(employeeId);
  }

  static async getMyLoans(userId: string): Promise<any[]> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) return [];

    const employeeId = (employee as any)._id.toString();
    const loans = await Loan.find({ employee: employeeId })
      .populate('loanType', 'name code interestRate')
      .sort({ createdAt: -1 })
      .lean();

    return loans.map((loan: any) => ({
      id: loan._id.toString(),
      loanType: loan.loanType ? { name: loan.loanType.name, code: loan.loanType.code, interestRate: loan.loanType.interestRate } : null,
      amount: loan.amount,
      interestRate: loan.interestRate,
      tenure: loan.tenure,
      emiAmount: loan.emiAmount,
      totalPayable: loan.totalPayable,
      totalInterest: loan.totalInterest,
      purpose: loan.purpose,
      status: loan.status,
      applicationDate: loan.createdAt,
      disbursedDate: loan.disbursedDate,
      closedDate: loan.closedDate,
    }));
  }

  static async getLoanTypesForEss(): Promise<any[]> {
    const loanTypes = await LoanType.find({ isActive: true }).sort({ name: 1 }).lean();
    return loanTypes.map((lt: any) => ({
      id: lt._id.toString(),
      name: lt.name,
      code: lt.code,
      description: lt.description,
      maxAmount: lt.maxAmount,
      minAmount: lt.minAmount,
      interestRate: lt.interestRate,
      maxTenure: lt.maxTenure,
      minTenure: lt.minTenure,
      applicableTo: lt.applicableTo,
      maxActiveLoans: lt.maxActiveLoans,
    }));
  }

  static async applyLoanFromEss(userId: string, data: { loanType: string; amount: number; tenure: number; purpose?: string }): Promise<any> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) throw new AppError('No employee linked to this user account', 400);

    const employeeId = (employee as any)._id.toString();
    return LoansService.applyLoan({ ...data, employee: employeeId }, userId);
  }

  static async getLoanDetailForEss(userId: string, loanId: string): Promise<any> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) throw new AppError('No employee linked to this user account', 400);

    const employeeId = (employee as any)._id.toString();
    const loan = await Loan.findOne({ _id: loanId, employee: employeeId })
      .populate('loanType', 'name code interestRate')
      .lean();

    if (!loan) throw new AppError('Loan not found', 404);

    return {
      id: (loan as any)._id.toString(),
      loanType: (loan as any).loanType ? { name: (loan as any).loanType.name, code: (loan as any).loanType.code, interestRate: (loan as any).loanType.interestRate } : null,
      amount: (loan as any).amount,
      interestRate: (loan as any).interestRate,
      tenure: (loan as any).tenure,
      emiAmount: (loan as any).emiAmount,
      totalPayable: (loan as any).totalPayable,
      totalInterest: (loan as any).totalInterest,
      purpose: (loan as any).purpose,
      status: (loan as any).status,
      applicationDate: (loan as any).createdAt,
      disbursedDate: (loan as any).disbursedDate,
      closedDate: (loan as any).closedDate,
      remarks: (loan as any).remarks,
    };
  }

  static async cancelLoanFromEss(userId: string, loanId: string): Promise<any> {
    const employee = await this.getEmployeeFromUser(userId);
    if (!employee) throw new AppError('No employee linked to this user account', 400);

    const employeeId = (employee as any)._id.toString();
    const loan = await Loan.findOne({ _id: loanId, employee: employeeId });
    if (!loan) throw new AppError('Loan not found', 404);

    return LoansService.cancelLoan(loanId, userId);
  }

  private static getAllowedFields(settings: Record<string, unknown>): string[] {
    const fields: string[] = [];
    const s = settings as any;
    if (s.allowPhoneUpdate !== false) fields.push('contactNumber');
    if (s.allowAddressUpdate) fields.push('address');
    if (s.allowBankUpdate) fields.push('bankDetails');
    if (s.allowEmergencyContactUpdate) fields.push('emergencyContact');
    return fields;
  }

  private static isFieldAllowed(field: string, settings: Record<string, unknown>): boolean {
    return this.getAllowedFields(settings).includes(field);
  }
}
