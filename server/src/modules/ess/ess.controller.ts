import { Request, Response } from 'express';
import { EssService } from './ess.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getProfile(req.user!.id);
  ResponseHandler.success(res, result, 'Profile fetched successfully');
});

const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.updateProfile(req.user!.id, req.body);
  ResponseHandler.success(res, result, 'Profile updated');
});

const getChangeRequests = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getChangeRequests(req.user!.id, req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Change requests fetched');
});

const createChangeRequest = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.requestChange(req.user!.id, req.body);
  ResponseHandler.created(res, result, 'Change request submitted');
});

const getAllChangeRequests = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getAllChangeRequests(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Change requests fetched');
});

const approveChange = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.approveChange(req.params.id, req.user!.id, req.body.notes);
  ResponseHandler.success(res, result, 'Change request approved');
});

const rejectChange = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.rejectChange(req.params.id, req.user!.id, req.body.reason);
  ResponseHandler.success(res, result, 'Change request rejected');
});

const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await EssService.getStats();
  ResponseHandler.success(res, result, 'Stats fetched');
});

const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const result = await EssService.getMyAttendance(req.user!.id, month);
  ResponseHandler.success(res, result, 'Attendance fetched successfully');
});

const getMyLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getMyLeaveBalances(req.user!.id);
  ResponseHandler.success(res, result, 'Leave balances fetched successfully');
});

const getMyLeaveApplications = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getMyLeaveApplications(req.user!.id);
  ResponseHandler.success(res, result, 'Leave applications fetched successfully');
});

const getMyDocuments = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getMyDocuments(req.user!.id);
  ResponseHandler.success(res, result, 'Documents fetched successfully');
});

const getMyPayslips = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getMyPayslips(req.user!.id);
  ResponseHandler.success(res, result, 'Payslips fetched successfully');
});

const getMyAssets = asyncHandler(async (req: Request, res: Response) => {
  const result = await EssService.getMyAssets(req.user!.id);
  ResponseHandler.success(res, result, 'Assets fetched successfully');
});

export const essController = {
  getProfile, updateProfile,
  getChangeRequests, createChangeRequest,
  getAllChangeRequests,
  approveChange, rejectChange,
  getStats,
  getMyAttendance,
  getMyLeaveBalances, getMyLeaveApplications,
  getMyDocuments,
  getMyPayslips,
  getMyAssets,
};
