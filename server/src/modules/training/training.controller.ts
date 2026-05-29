import { Request, Response } from 'express';
import { TrainingService } from './training.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AppError } from '../../core/errors/AppError.js';

export const trainingController = {
  createProgram: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.createProgram(req.body, req.user!.id);
    ResponseHandler.created(res, result, 'Training program created');
  }),

  listPrograms: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.getPrograms(req.query as Record<string, unknown>);
    ResponseHandler.paginated(res, result.data, result.meta, 'Programs fetched');
  }),

  getProgramById: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.getProgramById(req.params.id);
    ResponseHandler.success(res, result, 'Program fetched');
  }),

  updateProgram: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.updateProgram(req.params.id, req.body, req.user!.id);
    ResponseHandler.success(res, result, 'Program updated');
  }),

  cancelProgram: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.cancelProgram(req.params.id, req.user!.id);
    ResponseHandler.success(res, result, 'Program cancelled');
  }),

  enrollEmployee: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.enrollEmployee(req.body.trainingId, req.body.employeeId, req.user!.id);
    ResponseHandler.created(res, result, 'Enrolled successfully');
  }),

  batchEnroll: asyncHandler(async (req: Request, res: Response) => {
    const { trainingId, employeeIds } = req.body;
    const result = await TrainingService.batchEnroll(trainingId, employeeIds, req.user!.id);
    ResponseHandler.success(res, result, 'Batch enrollment completed');
  }),

  dropEnrollment: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.dropEnrollment(req.params.id, req.body.reason || '', req.user!.id);
    ResponseHandler.success(res, result, 'Enrollment dropped');
  }),

  markCompleted: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.markCompleted(req.params.id, req.body, req.user!.id);
    ResponseHandler.success(res, result, 'Enrollment completed');
  }),

  getMyEnrollments: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req.query.employeeId as string) || req.user!.employeeId;
    if (!employeeId) throw new AppError('No employee linked to this user', 400);
    const result = await TrainingService.getMyEnrollments(employeeId);
    ResponseHandler.success(res, result, 'Enrollments fetched');
  }),

  getPendingEnrollments: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req.query.employeeId as string) || req.user!.employeeId;
    if (!employeeId) throw new AppError('No employee linked to this user', 400);
    const result = await TrainingService.getPendingEnrollments(employeeId);
    ResponseHandler.success(res, result, 'Pending enrollments fetched');
  }),

  recordAttendance: asyncHandler(async (req: Request, res: Response) => {
    const { date, employeeIds } = req.body;
    const result = await TrainingService.recordAttendance(req.params.id, date, employeeIds);
    ResponseHandler.success(res, result, 'Attendance recorded');
  }),

  getSkills: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req.query.employeeId || req.params.employeeId) as string;
    const result = await TrainingService.getSkills(employeeId);
    ResponseHandler.success(res, result, 'Skills fetched');
  }),

  updateSkill: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.updateSkill(req.params.employeeId, req.params.skillId, req.body, req.user!.id);
    ResponseHandler.success(res, result, 'Skill updated');
  }),

  getSkillGapAnalysis: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.getSkillGapAnalysis(req.params.designationId);
    ResponseHandler.success(res, result, 'Gap analysis fetched');
  }),

  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const result = await TrainingService.getStats();
    ResponseHandler.success(res, result, 'Stats fetched');
  }),

  getExpiringCertifications: asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const result = await TrainingService.getExpiringCertifications(days);
    ResponseHandler.success(res, result, 'Expiring certifications fetched');
  }),

  listSkills: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.listSkills(req.query as Record<string, unknown>);
    ResponseHandler.paginated(res, result.data, result.meta, 'Skills fetched');
  }),

  createSkill: asyncHandler(async (req: Request, res: Response) => {
    const result = await TrainingService.createSkill(req.body, req.user!.id);
    ResponseHandler.created(res, result, 'Skill created');
  }),
};
