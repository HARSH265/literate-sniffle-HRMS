import { Request, Response } from 'express';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { ShiftSwapService } from './shiftSwap.service.js';

export const shiftSwapController = {
  requestSwap: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user.employeeId || (req as any).user._id;
    const swap = await ShiftSwapService.requestSwap(req.body, employeeId.toString());
    ResponseHandler.created(res, swap, 'Swap request submitted');
  }),

  approveSwap: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const swap = await ShiftSwapService.approveSwap(req.params.id, userId.toString());
    ResponseHandler.success(res, swap, 'Swap approved');
  }),

  rejectSwap: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const swap = await ShiftSwapService.rejectSwap(req.params.id, userId.toString(), req.body.rejectionReason);
    ResponseHandler.success(res, swap, 'Swap rejected');
  }),

  cancelSwap: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user.employeeId || (req as any).user._id;
    const swap = await ShiftSwapService.cancelSwap(req.params.id, employeeId.toString());
    ResponseHandler.success(res, swap, 'Swap cancelled');
  }),

  updateSwap: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user.employeeId || (req as any).user._id;
    const swap = await ShiftSwapService.updateSwap(req.params.id, employeeId.toString(), req.body);
    ResponseHandler.success(res, swap, 'Swap updated');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await ShiftSwapService.list({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
    });
    ResponseHandler.paginated(res, result.data, result.meta, 'Swaps fetched successfully');
  }),

  getMySwaps: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user.employeeId || (req as any).user._id;
    const result = await ShiftSwapService.getMySwaps(employeeId.toString(), {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
    });
    ResponseHandler.paginated(res, result.data, result.meta, 'My swaps fetched successfully');
  }),

  getPendingApprovals: asyncHandler(async (_req: Request, res: Response) => {
    const swaps = await ShiftSwapService.getPendingApprovals();
    ResponseHandler.success(res, swaps, 'Pending approvals fetched successfully');
  }),

  checkEligibility: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user.employeeId || (req as any).user._id;
    const eligibility = await ShiftSwapService.checkEligibility(employeeId.toString());
    ResponseHandler.success(res, eligibility, 'Eligibility fetched successfully');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const swap = await ShiftSwapService.getById(req.params.id);
    ResponseHandler.success(res, swap, 'Swap fetched successfully');
  }),

  setPreference: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user.employeeId || (req as any).user._id;
    const preference = await ShiftSwapService.setPreference(employeeId.toString(), req.body);
    ResponseHandler.success(res, preference, 'Preference saved');
  }),

  getPreference: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = (req as any).user.employeeId || (req as any).user._id;
    const preference = await ShiftSwapService.getPreference(employeeId.toString());
    ResponseHandler.success(res, preference, 'Preference fetched successfully');
  }),
};
