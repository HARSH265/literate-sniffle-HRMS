import { Request, Response } from 'express';
import { PerformanceService } from './performance.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AppError } from '../../core/errors/AppError.js';

export const performanceController = {
  createCycle: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.createCycle(req.body, req.user!.id);
    ResponseHandler.created(res, result, 'Performance cycle created');
  }),

  listCycles: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.listCycles(req.query as Record<string, unknown>);
    ResponseHandler.paginated(res, result.data, result.meta, 'Cycles fetched');
  }),

  getCycleProgress: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.getCycleProgress(req.params.id);
    ResponseHandler.success(res, result, 'Cycle progress fetched');
  }),

  listReviews: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.listReviews(req.query as Record<string, unknown>, req.user?.id);
    ResponseHandler.paginated(res, result.data, result.meta, 'Reviews fetched');
  }),

  getMyReviews: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req.query.employeeId as string) || req.user!.employeeId;
    if (!employeeId) throw new AppError('No employee linked to this user', 400);
    const result = await PerformanceService.getMyReviews(employeeId);
    ResponseHandler.success(res, result, 'My reviews fetched');
  }),

  getReviewById: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.getReviewById(req.params.id);
    ResponseHandler.success(res, result, 'Review fetched');
  }),

  setGoals: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.setGoals(req.params.id, req.body.goals, req.user!.id);
    ResponseHandler.success(res, result, 'Goals set successfully');
  }),

  submitSelfReview: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.submitSelfReview(req.params.id, req.body, req.user!.id);
    ResponseHandler.success(res, result, 'Self review submitted');
  }),

  submitManagerReview: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.submitManagerReview(req.params.id, req.body, req.user!.id);
    ResponseHandler.success(res, result, 'Manager review submitted');
  }),

  getPendingReviews: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.getPendingReviews(req.user!.id);
    ResponseHandler.success(res, result, 'Pending reviews fetched');
  }),

  getTeamReviews: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.getTeamReviews(req.user!.id);
    ResponseHandler.success(res, result, 'Team reviews fetched');
  }),

  requestFeedback: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.requestFeedback(req.params.id, req.body.fromEmployeeId, req.user!.id);
    ResponseHandler.success(res, result, 'Feedback request sent');
  }),

  submitFeedback: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.submitFeedback(req.params.id, req.body, req.user!.id);
    ResponseHandler.created(res, result, 'Feedback submitted');
  }),

  appealReview: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.appealReview(req.params.id, req.body.reason, req.user!.id);
    ResponseHandler.success(res, result, 'Appeal submitted');
  }),

  resolveAppeal: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.resolveAppeal(req.params.id, req.body.resolution, req.user!.id, req.body.finalRating);
    ResponseHandler.success(res, result, 'Appeal resolved');
  }),

  finalizeReview: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.finalizeReview(req.params.id, req.user!.id);
    ResponseHandler.success(res, result, 'Review finalized');
  }),

  updateCycle: asyncHandler(async (req: Request, res: Response) => {
    const result = await PerformanceService.updateCycle(req.params.id, req.body, req.user!.id);
    ResponseHandler.success(res, result, 'Performance cycle updated');
  }),

  getAllCycles: asyncHandler(async (_req: Request, res: Response) => {
    const result = await PerformanceService.getAllCycles();
    ResponseHandler.success(res, result, 'All cycles fetched');
  }),
};
