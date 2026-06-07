import ShiftSwap from '../../models/ShiftSwap.model.js';
import ShiftPreference from '../../models/ShiftPreference.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import Employee from '../../models/Employee.model.js';
import User from '../../models/User.model.js';
import { NotificationService } from '../../core/notification/NotificationService.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { AppError } from '../../core/errors/AppError.js';

interface RequestSwapData {
  targetEmployee?: string;
  fromShift: string;
  toShift: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  isRecurring?: boolean;
  recurringUntil?: string;
  swapType?: 'one-time' | 'recurring' | 'preference';
}

interface ListOptions {
  page?: number;
  limit?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export class ShiftSwapService {
  static async requestSwap(data: RequestSwapData, employeeId: string) {
    const settings = await CompanySettings.findOne();
    if (settings?.shiftSwapConfig?.shiftSwapEnabled === false) {
      throw new AppError('Shift swaps are disabled', 400);
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found', 404);

    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);

    const deadlineHours = settings?.shiftSwapConfig?.swapDeadlineHours || 24;
    const deadline = new Date(fromDate.getTime() - deadlineHours * 60 * 60 * 1000);
    if (new Date() > deadline) {
      throw new AppError(`Swap request must be submitted at least ${deadlineHours} hours before the shift`, 400);
    }

    const maxSwaps = settings?.shiftSwapConfig?.maxSwapsPerMonth || 3;
    const monthStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const monthEnd = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
    const monthCount = await ShiftSwap.countDocuments({
      requestor: employeeId,
      status: { $in: ['pending', 'approved'] },
      createdAt: { $gte: monthStart, $lte: monthEnd },
    });
    if (monthCount >= maxSwaps) {
      throw new AppError(`Maximum ${maxSwaps} swaps per month reached`, 400);
    }

    const overlapping = await ShiftSwap.findOne({
      requestor: employeeId,
      status: { $ne: 'cancelled' },
      fromDate: { $lte: toDate },
      toDate: { $gte: fromDate },
    });
    if (overlapping) {
      throw new AppError('You already have a swap request overlapping with these dates', 400);
    }

    const swap = await ShiftSwap.create({
      requestor: employeeId as any,
      targetEmployee: data.targetEmployee as any,
      fromShift: data.fromShift as any,
      toShift: data.toShift as any,
      fromDate,
      toDate,
      reason: data.reason,
      isRecurring: data.isRecurring || false,
      recurringUntil: data.recurringUntil ? new Date(data.recurringUntil) : undefined,
      swapType: data.swapType || 'one-time',
    });

    await AuditService.log({
      userId: employeeId as any,
      action: 'create',
      module: 'shift-swap',
      targetId: swap._id.toString(),
      targetName: `Swap: ${fromDate.toISOString().split('T')[0]}`,
      details: { fromShift: data.fromShift, toShift: data.toShift, swapType: data.swapType },
    });

    return swap;
  }

  static async approveSwap(id: string, approverId: string) {
    const swap = await ShiftSwap.findById(id);
    if (!swap) throw new AppError('Swap request not found', 404);
    if (swap.status !== 'pending') throw new AppError('Swap request is not pending', 400);

    swap.status = 'approved';
    swap.approvedBy = approverId as any;
    swap.approvedAt = new Date();
    await swap.save();

    await AuditService.log({
      userId: approverId as any,
      action: 'update',
      module: 'shift-swap',
      targetId: swap._id.toString(),
      targetName: `Approve swap: ${swap.fromDate.toISOString().split('T')[0]}`,
      details: { status: 'approved' },
    });

    const requestorUser = await User.findOne({ employee: swap.requestor }).lean();
    if (requestorUser) {
      await NotificationService.send({
        title: 'Shift Swap Approved',
        message: `Your shift swap request from ${swap.fromDate.toISOString().split('T')[0]} to ${swap.toDate.toISOString().split('T')[0]} has been approved.`,
        type: 'success',
        recipient: String(requestorUser._id),
        module: 'shift-swap',
        link: '/shift-swaps',
      });
    }

    return swap;
  }

  static async rejectSwap(id: string, approverId: string, rejectionReason?: string) {
    const swap = await ShiftSwap.findById(id);
    if (!swap) throw new AppError('Swap request not found', 404);
    if (swap.status !== 'pending') throw new AppError('Swap request is not pending', 400);

    swap.status = 'rejected';
    swap.approvedBy = approverId as any;
    swap.approvedAt = new Date();
    swap.rejectionReason = rejectionReason;
    await swap.save();

    await AuditService.log({
      userId: approverId as any,
      action: 'update',
      module: 'shift-swap',
      targetId: swap._id.toString(),
      targetName: `Reject swap: ${swap.fromDate.toISOString().split('T')[0]}`,
      details: { status: 'rejected', reason: rejectionReason },
    });

    const requestorUser = await User.findOne({ employee: swap.requestor }).lean();
    if (requestorUser) {
      await NotificationService.send({
        title: 'Shift Swap Rejected',
        message: `Your shift swap request from ${swap.fromDate.toISOString().split('T')[0]} to ${swap.toDate.toISOString().split('T')[0]} has been rejected${rejectionReason ? `: ${rejectionReason}` : ''}.`,
        type: 'warning',
        recipient: String(requestorUser._id),
        module: 'shift-swap',
        link: '/shift-swaps',
      });
    }

    return swap;
  }

  static async cancelSwap(id: string, employeeId: string) {
    const swap = await ShiftSwap.findById(id);
    if (!swap) throw new AppError('Swap request not found', 404);
    if (swap.requestor.toString() !== employeeId) throw new AppError('You can only cancel your own requests', 403);
    if (swap.status !== 'pending') throw new AppError('Can only cancel pending requests', 400);

    swap.status = 'cancelled';
    await swap.save();

    await AuditService.log({
      userId: employeeId as any,
      action: 'update',
      module: 'shift-swap',
      targetId: swap._id.toString(),
      targetName: `Cancel swap: ${swap.fromDate.toISOString().split('T')[0]}`,
      details: { status: 'cancelled' },
    });

    return swap;
  }

  static async updateSwap(id: string, employeeId: string, data: { reason?: string; toShift?: string; toDate?: string }) {
    const swap = await ShiftSwap.findById(id);
    if (!swap) throw new AppError('Swap request not found', 404);
    if (swap.requestor.toString() !== employeeId) throw new AppError('You can only update your own requests', 403);
    if (swap.status !== 'pending') throw new AppError('Can only update pending requests', 400);

    if (data.reason !== undefined) swap.reason = data.reason;
    if (data.toShift !== undefined) swap.toShift = data.toShift as any;
    if (data.toDate !== undefined) swap.toDate = new Date(data.toDate);
    await swap.save();

    await AuditService.log({
      userId: employeeId as any,
      action: 'update',
      module: 'shift-swap',
      targetId: swap._id.toString(),
      targetName: `Update swap: ${swap.fromDate.toISOString().split('T')[0]}`,
      details: { ...data },
    });

    return swap;
  }

  static async list(options: ListOptions) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (options.status) filter.status = options.status;
    if (options.fromDate) filter.fromDate = { $gte: new Date(options.fromDate) };
    if (options.toDate) filter.toDate = { $lte: new Date(options.toDate) };

    const [data, total] = await Promise.all([
      ShiftSwap.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('requestor', 'fullName employeeCode')
        .populate('targetEmployee', 'fullName employeeCode')
        .populate('fromShift', 'name startTime endTime')
        .populate('toShift', 'name startTime endTime')
        .lean(),
      ShiftSwap.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getMySwaps(employeeId: string, options: ListOptions) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { requestor: employeeId };
    if (options.status) filter.status = options.status;

    const [data, total] = await Promise.all([
      ShiftSwap.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('targetEmployee', 'fullName employeeCode')
        .populate('fromShift', 'name startTime endTime')
        .populate('toShift', 'name startTime endTime')
        .lean(),
      ShiftSwap.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getPendingApprovals() {
    return ShiftSwap.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('requestor', 'fullName employeeCode')
      .populate('targetEmployee', 'fullName employeeCode')
      .populate('fromShift', 'name startTime endTime')
      .populate('toShift', 'name startTime endTime')
      .lean();
  }

  static async checkEligibility(employeeId: string) {
    const settings = await CompanySettings.findOne();
    const maxSwaps = settings?.shiftSwapConfig?.maxSwapsPerMonth || 3;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usedCount = await ShiftSwap.countDocuments({
      requestor: employeeId,
      status: { $in: ['pending', 'approved'] },
      createdAt: { $gte: monthStart, $lte: monthEnd },
    });

    return {
      maxSwaps,
      usedSwaps: usedCount,
      remainingSwaps: Math.max(0, maxSwaps - usedCount),
      shiftSwapEnabled: settings?.shiftSwapConfig?.shiftSwapEnabled !== false,
    };
  }

  static async getById(id: string) {
    const swap = await ShiftSwap.findById(id)
      .populate('requestor', 'fullName employeeCode')
      .populate('targetEmployee', 'fullName employeeCode')
      .populate('fromShift', 'name startTime endTime')
      .populate('toShift', 'name startTime endTime')
      .populate('approvedBy', 'name email')
      .exec();
    if (!swap) throw new AppError('Swap request not found', 404);
    return swap;
  }

  static async setPreference(employeeId: string, data: { preferredShift: string; effectiveFrom: string; effectiveTo?: string; priority?: number; reason?: string }) {
    const settings = await CompanySettings.findOne();
    if (settings?.shiftSwapConfig?.shiftPreferenceEnabled === false) {
      throw new AppError('Shift preferences are disabled', 400);
    }

    const preference = await ShiftPreference.findOneAndUpdate(
      { employee: employeeId },
      {
        employee: employeeId as any,
        preferredShift: data.preferredShift as any,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
        priority: data.priority || 1,
        reason: data.reason,
      },
      { upsert: true, new: true },
    );

    await AuditService.log({
      userId: employeeId as any,
      action: 'create',
      module: 'shift-swap',
      targetId: preference._id.toString(),
      targetName: 'Shift preference',
      details: { preferredShift: data.preferredShift },
    });

    return preference;
  }

  static async getPreference(employeeId: string) {
    return ShiftPreference.findOne({ employee: employeeId })
      .populate('preferredShift', 'name startTime endTime')
      .exec();
  }
}
