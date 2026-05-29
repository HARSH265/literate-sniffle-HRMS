import PerformanceCycle from '../../models/PerformanceCycle.model.js';
import PerformanceReview from '../../models/PerformanceReview.model.js';
import PerformanceFeedback from '../../models/PerformanceFeedback.model.js';
import Employee from '../../models/Employee.model.js';
import CompanySettings from '../../models/CompanySettings.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { NotificationService } from '../../core/notification/NotificationService.js';
import { PaginationUtil } from '../../core/utils/PaginationUtil.js';

export class PerformanceService {
  static async createCycle(data: Record<string, unknown>, userId: string) {
    const existing = await PerformanceCycle.findOne({ year: data.year, quarter: data.quarter });
    if (existing) {
      throw new AppError('A cycle for this period already exists', 400);
    }

    const cycle = await PerformanceCycle.create({
      ...data,
      startDate: new Date(data.startDate as string),
      goalDeadline: new Date(data.goalDeadline as string),
      selfReviewDeadline: new Date(data.selfReviewDeadline as string),
      managerReviewDeadline: new Date(data.managerReviewDeadline as string),
      closureDate: new Date(data.closureDate as string),
      participants: data.participants || [],
      createdBy: userId,
    });

    const employeeCount = data.participants
      ? (data.participants as string[]).length
      : await Employee.countDocuments({ status: 'active' });

    if (employeeCount > 0) {
      const participants = data.participants
        ? (data.participants as string[])
        : (await Employee.find({ status: 'active' }).select('_id').lean()).map((e) => e._id.toString());

      const reviews = participants.map((empId: string) => ({
        employee: empId,
        reviewCycle: cycle._id,
        reviewPeriod: { year: data.year, quarter: data.quarter, label: data.label as string },
        status: 'draft' as const,
        goals: [],
        isAppealed: false,
        createdBy: userId,
      }));

      if (reviews.length > 0) {
        await PerformanceReview.insertMany(reviews);
      }

      for (const empId of participants) {
        await NotificationService.send({
          title: 'New Performance Review Cycle',
          message: `Review cycle ${data.label} (Q${data.quarter} ${data.year}) has started. Please set your goals by ${new Date(data.goalDeadline as string).toLocaleDateString()}.`,
          type: 'info',
          recipient: empId,
          module: 'performance',
          link: '/performance/reviews/my',
        });
      }
    }

    await AuditService.log({
      action: 'create',
      module: 'performance',
      userId,
      targetId: cycle._id.toString(),
      targetName: `Cycle ${data.label} Q${data.quarter} ${data.year}`,
      details: data,
    });

    return { ...cycle.toObject(), id: cycle._id.toString(), _id: undefined };
  }

  static async listCycles(queryParams: Record<string, unknown>) {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.status) filter.status = queryParams.status;

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [cycles, total] = await Promise.all([
      PerformanceCycle.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      PerformanceCycle.countDocuments(filter),
    ]);

    const meta = PaginationUtil.getMeta(page, limit, total);
    return {
      data: cycles.map((c: any) => ({ ...c, id: String(c._id), _id: undefined })),
      meta,
    };
  }

  static async getCycleProgress(cycleId: string): Promise<any> {
    const cycle = await PerformanceCycle.findById(cycleId).lean();
    if (!cycle) throw new AppError('Cycle not found', 404);

    const total = await PerformanceReview.countDocuments({ reviewCycle: cycleId });
    const byStatus = await PerformanceReview.aggregate([
      { $match: { reviewCycle: cycle._id as any } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap: Record<string, number> = { draft: 0, 'goals-set': 0, 'self-review': 0, 'manager-review': 0, completed: 0, appealed: 0 };
    byStatus.forEach((s: { _id: string; count: number }) => { statusMap[s._id] = s.count; });

    return {
      cycle: { ...cycle, id: cycle._id.toString(), _id: undefined },
      stats: { total, ...statusMap },
      completionPercent: total > 0 ? Math.round(((statusMap.completed + statusMap['manager-review']) / total) * 100) : 0,
    };
  }

  static async listReviews(queryParams: Record<string, unknown>, _userId?: string) {
    const { page, limit, sort, order } = PaginationUtil.parseFromObject(queryParams);

    const filter: Record<string, unknown> = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.cycleId) filter.reviewCycle = queryParams.cycleId;
    if (queryParams.employeeId) filter.employee = queryParams.employeeId;

    const skip = PaginationUtil.getSkip(page, limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
      PerformanceReview.find(filter)
        .populate('employee', 'fullName employeeCode department designation')
        .populate('reviewCycle', 'label year quarter')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      PerformanceReview.countDocuments(filter),
    ]);

    const meta = PaginationUtil.getMeta(page, limit, total);
    return {
      data: reviews.map((r: any) => ({ ...r, id: String(r._id), _id: undefined })),
      meta,
    };
  }

  static async getMyReviews(employeeId: string) {
    const reviews = await PerformanceReview.find({ employee: employeeId })
      .populate('reviewCycle', 'label year quarter status startDate goalDeadline selfReviewDeadline managerReviewDeadline')
      .sort({ 'reviewPeriod.year': -1, 'reviewPeriod.quarter': -1 })
      .lean();

    return reviews.map((r: any) => ({ ...r, id: String(r._id), _id: undefined }));
  }

  static async getReviewById(id: string): Promise<any> {
    const review = await PerformanceReview.findById(id)
      .populate('employee', 'fullName employeeCode department designation')
      .populate('reviewCycle', 'label year quarter status startDate goalDeadline selfReviewDeadline managerReviewDeadline closureDate')
      .populate('managerReview.reviewer', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!review) throw new AppError('Review not found', 404);

    const feedback = await PerformanceFeedback.find({ review: id })
      .populate('fromEmployee', 'fullName employeeCode')
      .lean();

    return { ...review, id: review._id.toString(), _id: undefined, feedback };
  }

  static async setGoals(reviewId: string, goals: Array<{ title: string; description?: string; weight: number; targetValue?: string; category?: string }>, userId: string) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (review.status !== 'draft') throw new AppError('Goals can only be set when review is in draft status', 400);

    const totalWeight = goals.reduce((sum, g) => sum + g.weight, 0);
    if (totalWeight !== 100) {
      throw new AppError('Total goal weight must equal 100', 400);
    }

    review.goals = goals.map((g) => ({
      title: g.title,
      description: g.description || '',
      weight: g.weight,
      targetValue: g.targetValue,
      category: g.category,
    }));
    review.status = 'goals-set';
    await review.save();

    await AuditService.log({
      action: 'update',
      module: 'performance',
      userId,
      targetId: reviewId,
      targetName: `Goals set for ${review.employee.toString()}`,
      details: { action: 'goals-set', goalCount: goals.length },
    });

    return { ...review.toObject(), id: review._id.toString(), _id: undefined };
  }

  static async submitSelfReview(reviewId: string, data: { rating: number; overallComment: string; strengths?: string; improvements?: string }, userId: string) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (review.status !== 'goals-set' && review.status !== 'draft') {
      throw new AppError('Self review can only be submitted when in goals-set or draft status', 400);
    }

    review.selfReview = {
      rating: data.rating,
      overallComment: data.overallComment,
      strengths: data.strengths,
      improvements: data.improvements,
      submittedAt: new Date(),
    };
    review.status = 'self-review';
    await review.save();

    const settings = await CompanySettings.findOne().lean() as any;
    const managerReviewRequired = settings?.performanceConfig?.managerReviewRequired !== false;

    if (!managerReviewRequired) {
      review.status = 'completed';
      review.finalRating = data.rating;
      await review.save();
    }

    await AuditService.log({
      action: 'update',
      module: 'performance',
      userId,
      targetId: reviewId,
      details: { action: 'self-review-submitted' },
    });

    return { ...review.toObject(), id: review._id.toString(), _id: undefined };
  }

  static async submitManagerReview(reviewId: string, data: { rating: number; overallComment: string; strengths?: string; improvements?: string; reviewerNotes?: string }, userId: string) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (review.status !== 'self-review') throw new AppError('Manager review requires self-review to be submitted first', 400);

    review.managerReview = {
      rating: data.rating,
      overallComment: data.overallComment,
      strengths: data.strengths,
      improvements: data.improvements,
      submittedAt: new Date(),
      reviewer: userId as any,
    };
    review.reviewerNotes = data.reviewerNotes;
    review.status = 'completed';

    const goalAvg = review.goals.length > 0
      ? review.goals.reduce((sum, g) => sum + ((g.managerRating || g.selfRating || 0) * g.weight / 100), 0)
      : 0;
    review.overallRating = data.rating;
    review.finalRating = Math.round(((data.rating || 0) + goalAvg) / 2 * 10) / 10;

    await review.save();

    await AuditService.log({
      action: 'update',
      module: 'performance',
      userId,
      targetId: reviewId,
      targetName: `Manager review completed for ${review.employee.toString()}`,
      details: { action: 'manager-review-submitted', rating: data.rating },
    });

    return { ...review.toObject(), id: review._id.toString(), _id: undefined };
  }

  static async getPendingReviews(_userId: string) {
    const reviews = await PerformanceReview.find({ status: 'self-review' })
      .populate('employee', 'fullName employeeCode department designation')
      .populate('reviewCycle', 'label year quarter')
      .sort({ 'reviewPeriod.year': -1, 'reviewPeriod.quarter': -1 })
      .lean();

    return reviews.map((r: any) => ({ ...r, id: String(r._id), _id: undefined }));
  }

  static async getTeamReviews(managerId: string) {
    const team = await Employee.find({ 'department': managerId as any }).select('_id').lean();
    const employeeIds = team.map((e) => e._id);

    const reviews = await PerformanceReview.find({ employee: { $in: employeeIds } })
      .populate('employee', 'fullName employeeCode department designation')
      .populate('reviewCycle', 'label year quarter')
      .sort({ 'reviewPeriod.year': -1, 'reviewPeriod.quarter': -1 })
      .lean();

    return reviews.map((r: any) => ({ ...r, id: String(r._id), _id: undefined }));
  }

  static async requestFeedback(reviewId: string, fromEmployeeId: string, _userId: string) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);

    const existing = await PerformanceFeedback.findOne({ review: reviewId, fromEmployee: fromEmployeeId as any });
    if (existing) throw new AppError('Feedback already requested from this employee', 400);

    await NotificationService.send({
      title: 'Feedback Request',
      message: `You have been requested to provide feedback for a performance review.`,
      type: 'info',
      recipient: fromEmployeeId,
      module: 'performance',
      link: `/performance/feedback/${reviewId}`,
    });

    return { message: 'Feedback request sent' };
  }

  static async submitFeedback(reviewId: string, data: { relationship: string; rating: number; comments: string }, userId: string) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);

    const feedback = await PerformanceFeedback.create({
      review: reviewId,
      fromEmployee: userId,
      relationship: data.relationship,
      rating: data.rating,
      comments: data.comments,
    });

    await AuditService.log({
      action: 'create',
      module: 'performance',
      userId,
      targetId: reviewId,
      details: { action: 'feedback-submitted' },
    });

    return { ...feedback.toObject(), id: feedback._id.toString(), _id: undefined };
  }

  static async appealReview(reviewId: string, reason: string, userId: string) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (review.status !== 'completed') throw new AppError('Only completed reviews can be appealed', 400);
    if (review.isAppealed) throw new AppError('Review already appealed', 400);

    review.isAppealed = true;
    review.status = 'appealed';
    review.appealReason = reason;
    await review.save();

    await AuditService.log({
      action: 'update',
      module: 'performance',
      userId,
      targetId: reviewId,
      details: { action: 'appeal-submitted' },
    });

    return { ...review.toObject(), id: review._id.toString(), _id: undefined };
  }

  static async resolveAppeal(reviewId: string, resolution: string, userId: string, finalRating?: number) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (review.status !== 'appealed') throw new AppError('Review is not in appealed status', 400);

    review.appealResolution = resolution;
    review.status = 'completed';
    if (finalRating !== undefined) review.finalRating = finalRating;
    review.isAppealed = false;
    await review.save();

    await AuditService.log({
      action: 'update',
      module: 'performance',
      userId,
      targetId: reviewId,
      details: { action: 'appeal-resolved', resolution },
    });

    return { ...review.toObject(), id: review._id.toString(), _id: undefined };
  }

  static async finalizeReview(reviewId: string, userId: string) {
    const review = await PerformanceReview.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (review.status !== 'completed') throw new AppError('Only completed reviews can be finalized', 400);

    const settings = await CompanySettings.findOne().lean() as any;
    const ratingScale = settings?.performanceConfig?.ratingScale || '1-5';
    const maxRating = parseInt(ratingScale.split('-')[1], 10);

    if (review.finalRating && review.finalRating > maxRating) {
      review.finalRating = maxRating;
    }

    await review.save();

    await AuditService.log({
      action: 'update',
      module: 'performance',
      userId,
      targetId: reviewId,
      details: { action: 'finalized' },
    });

    return { ...review.toObject(), id: review._id.toString(), _id: undefined };
  }

  static async updateCycle(id: string, data: Record<string, unknown>, userId: string) {
    const cycle = await PerformanceCycle.findById(id);
    if (!cycle) throw new AppError('Cycle not found', 404);

    Object.assign(cycle, data);
    if (data.startDate) cycle.startDate = new Date(data.startDate as string);
    if (data.goalDeadline) cycle.goalDeadline = new Date(data.goalDeadline as string);
    if (data.selfReviewDeadline) cycle.selfReviewDeadline = new Date(data.selfReviewDeadline as string);
    if (data.managerReviewDeadline) cycle.managerReviewDeadline = new Date(data.managerReviewDeadline as string);
    if (data.closureDate) cycle.closureDate = new Date(data.closureDate as string);
    if (data.participants) cycle.participants = data.participants as any;

    await cycle.save();

    await AuditService.log({
      action: 'update',
      module: 'performance',
      userId,
      targetId: cycle._id.toString(),
      targetName: `Cycle ${cycle.label} Q${cycle.quarter} ${cycle.year}`,
      details: data,
    });

    return { ...cycle.toObject(), id: cycle._id.toString(), _id: undefined };
  }

  static async getAllCycles() {
    const cycles = await PerformanceCycle.find()
      .sort({ year: -1, quarter: -1 })
      .populate('createdBy', 'name email')
      .lean();

    return cycles.map((c: any) => ({ ...c, id: String(c._id), _id: undefined }));
  }
}
