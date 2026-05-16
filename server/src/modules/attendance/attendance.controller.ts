import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await AttendanceService.list(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Attendance records fetched successfully');
});

const monthlyView = asyncHandler(async (req: Request, res: Response) => {
  const result = await AttendanceService.monthlyView(req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Monthly view fetched successfully');
});

const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const result = await AttendanceService.bulkCreate(req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Attendance bulk updated successfully');
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await AttendanceService.create(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Attendance entry created successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await AttendanceService.update(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Attendance entry updated successfully');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await AttendanceService.delete(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const attendanceController = { list, monthlyView, bulkCreate, create, update, remove };