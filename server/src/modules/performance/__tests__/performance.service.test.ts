import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import PerformanceCycle from '../../../models/PerformanceCycle.model.js';
import PerformanceReview from '../../../models/PerformanceReview.model.js';
import PerformanceFeedback from '../../../models/PerformanceFeedback.model.js';
import Employee from '../../../models/Employee.model.js';
import User from '../../../models/User.model.js';
import { PerformanceService } from '../performance.service.js';
import { AppError } from '../../../core/errors/AppError.js';

let userId: string;
let employeeId: string;
let cycleId: string;
let reviewId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'perf@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Promise.all([
    PerformanceCycle.deleteMany({}),
    PerformanceReview.deleteMany({}),
    PerformanceFeedback.deleteMany({}),
    Employee.deleteMany({}),
  ]);

  const employee = await Employee.create({
    employeeCode: 'EMP001',
    fullName: 'Test Employee',
    fatherName: 'Father',
    category: 'office-staff',
    employmentType: 'permanent',
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    shift: new mongoose.Types.ObjectId(),
    joiningDate: new Date('2023-01-01'),
    salaryType: 'monthly',
    baseSalary: 50000,
    status: 'active',
  });
  employeeId = employee._id.toString();
});

describe('PerformanceService', () => {
  describe('createCycle', () => {
    it('creates a performance cycle', async () => {
      const result = await PerformanceService.createCycle({
        year: 2026,
        quarter: 1,
        label: 'Q1 Review',
        startDate: new Date('2026-01-01').toISOString(),
        goalDeadline: new Date('2026-01-15').toISOString(),
        selfReviewDeadline: new Date('2026-02-01').toISOString(),
        managerReviewDeadline: new Date('2026-02-15').toISOString(),
        closureDate: new Date('2026-03-01').toISOString(),
        participants: [employeeId],
      }, userId) as any;

      expect(result.year).toBe(2026);
      expect(result.quarter).toBe(1);
      expect(result.label).toBe('Q1 Review');
      cycleId = result.id;

      const review = await PerformanceReview.findOne({ reviewCycle: cycleId });
      expect(review).not.toBeNull();
    });

    it('throws on duplicate cycle', async () => {
      await PerformanceCycle.create({
        year: 2026, quarter: 1, label: 'Existing', startDate: new Date(),
        goalDeadline: new Date(), selfReviewDeadline: new Date(),
        managerReviewDeadline: new Date(), closureDate: new Date(),
        participants: [], createdBy: userId,
      });

      await expect(PerformanceService.createCycle({
        year: 2026, quarter: 1, label: 'Duplicate', startDate: new Date().toISOString(),
        goalDeadline: new Date().toISOString(), selfReviewDeadline: new Date().toISOString(),
        managerReviewDeadline: new Date().toISOString(), closureDate: new Date().toISOString(),
      }, userId)).rejects.toThrow(AppError);
    });

    it('creates reviews for all participants', async () => {
      const result = await PerformanceService.createCycle({
        year: 2026, quarter: 2, label: 'Q2', startDate: new Date().toISOString(),
        goalDeadline: new Date().toISOString(), selfReviewDeadline: new Date().toISOString(),
        managerReviewDeadline: new Date().toISOString(), closureDate: new Date().toISOString(),
        participants: [employeeId],
      }, userId) as any;

      const reviewCount = await PerformanceReview.countDocuments({ reviewCycle: result.id });
      expect(reviewCount).toBe(1);
    });
  });

  describe('setGoals', () => {
    beforeEach(async () => {
      const cycle = await PerformanceCycle.create({
        year: 2026, quarter: 1, label: 'Q1', startDate: new Date(),
        goalDeadline: new Date(), selfReviewDeadline: new Date(),
        managerReviewDeadline: new Date(), closureDate: new Date(),
        participants: [employeeId], createdBy: userId,
      });
      cycleId = cycle._id.toString();

      const review = await PerformanceReview.create({
        employee: employeeId, reviewCycle: cycleId,
        reviewPeriod: { year: 2026, quarter: 1, label: 'Q1' },
        status: 'draft', createdBy: userId,
      });
      reviewId = review._id.toString();
    });

    it('sets goals on a draft review', async () => {
      const result = await PerformanceService.setGoals(reviewId, [
        { title: 'Complete Project A', description: 'Finish by Q1', weight: 60 },
        { title: 'Team Training', description: 'Train 5 members', weight: 40 },
      ], userId) as any;

      expect(result.status).toBe('goals-set');
      expect(result.goals.length).toBe(2);
      expect(result.goals[0].title).toBe('Complete Project A');
    });

    it('rejects goals with weight not summing to 100', async () => {
      await expect(PerformanceService.setGoals(reviewId, [
        { title: 'Goal 1', weight: 30 },
        { title: 'Goal 2', weight: 30 },
      ], userId)).rejects.toThrow(AppError);
    });

    it('throws if review is not in draft status', async () => {
      await PerformanceReview.findByIdAndUpdate(reviewId, { status: 'completed' });
      await expect(PerformanceService.setGoals(reviewId, [
        { title: 'Goal', weight: 100 },
      ], userId)).rejects.toThrow(AppError);
    });
  });

  describe('full review lifecycle', () => {
    beforeEach(async () => {
      const cycle = await PerformanceCycle.create({
        year: 2026, quarter: 1, label: 'Q1', startDate: new Date(),
        goalDeadline: new Date(), selfReviewDeadline: new Date(),
        managerReviewDeadline: new Date(), closureDate: new Date(),
        participants: [employeeId], createdBy: userId,
      });
      cycleId = cycle._id.toString();

      const review = await PerformanceReview.create({
        employee: employeeId, reviewCycle: cycleId,
        reviewPeriod: { year: 2026, quarter: 1, label: 'Q1' },
        status: 'draft', createdBy: userId,
      });
      reviewId = review._id.toString();
    });

    it('completes the full review lifecycle', async () => {
      await PerformanceService.setGoals(reviewId, [
        { title: 'Main Goal', weight: 100 },
      ], userId);

      await PerformanceService.submitSelfReview(reviewId, {
        rating: 8, overallComment: 'Good quarter', strengths: 'Strong', improvements: 'None',
      }, userId);

      const afterSelf = await PerformanceReview.findById(reviewId);
      expect(afterSelf!.status).toBe('self-review');

      await PerformanceService.submitManagerReview(reviewId, {
        rating: 7, overallComment: 'Solid performance', strengths: 'Good', improvements: 'Improve docs',
      }, userId);

      const completed = await PerformanceReview.findById(reviewId);
      expect(completed!.status).toBe('completed');
      expect(completed!.finalRating).toBeDefined();
    });

    it('submits and resolves an appeal', async () => {
      await PerformanceService.setGoals(reviewId, [{ title: 'Goal', weight: 100 }], userId);
      await PerformanceService.submitSelfReview(reviewId, { rating: 8, overallComment: 'Good' }, userId);
      await PerformanceService.submitManagerReview(reviewId, { rating: 5, overallComment: 'Okay' }, userId);

      await PerformanceService.appealReview(reviewId, 'Rating too low', userId);

      const appealed = await PerformanceReview.findById(reviewId);
      expect(appealed!.status).toBe('appealed');
      expect(appealed!.isAppealed).toBe(true);

      await PerformanceService.resolveAppeal(reviewId, 'Adjusted to 6', userId, 6);

      const resolved = await PerformanceReview.findById(reviewId);
      expect(resolved!.status).toBe('completed');
      expect(resolved!.finalRating).toBe(6);
    });
  });
});
