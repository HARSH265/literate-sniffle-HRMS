import { Request, Response } from 'express';
import { LeaveService } from './leave.service.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { PaginationMeta } from '../../core/utils/PaginationUtil.js';

const listLeaveTypes = asyncHandler(async (_req: Request, res: Response) => {
  const result = await LeaveService.listLeaveTypes();
  ResponseHandler.success(res, result, 'Leave types fetched successfully');
});

const createLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.createLeaveType(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Leave type created successfully');
});

const updateLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.updateLeaveType(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Leave type updated successfully');
});

const deleteLeaveType = asyncHandler(async (req: Request, res: Response) => {
  await LeaveService.deleteLeaveType(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.listApplications(req.query as Record<string, unknown>);
  ResponseHandler.paginated(res, result.data, result.meta as PaginationMeta, 'Leave applications fetched successfully');
});

const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.id;
  const result = await LeaveService.getEmployeeApplications(employeeId, req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'My leave applications fetched successfully');
});

const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.createApplication(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Leave application submitted successfully');
});

const cancelApplication = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.cancelApplication(req.params.id, req.user!.id);
  ResponseHandler.success(res, result, 'Leave application cancelled successfully');
});

const approveApplication = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.approveApplication(req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Leave application updated successfully');
});

const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.getPendingApprovals(req.user!.id, req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Pending approvals fetched successfully');
});

const getBalances = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = req.params;
  const { year } = req.query;
  const result = await LeaveService.getBalances(employeeId, year ? Number(year) : undefined);
  ResponseHandler.success(res, result, 'Leave balances fetched successfully');
});

const getMyBalances = asyncHandler(async (req: Request, res: Response) => {
  const { year } = req.query;
  const result = await LeaveService.getBalances(req.user!.id, year ? Number(year) : undefined);
  ResponseHandler.success(res, result, 'My leave balances fetched successfully');
});

const accrueLeave = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.bulkAccrue(req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Leave balances accrued successfully');
});

const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.getCalendar(req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Leave calendar fetched successfully');
});

const getLeaveSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await LeaveService.getLeaveSummary(req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Leave summary fetched successfully');
});

export const leaveController = {
  listLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
  listApplications, getMyApplications, createApplication, cancelApplication,
  approveApplication, getPendingApprovals,
  getBalances, getMyBalances, accrueLeave,
  getCalendar, getLeaveSummary,
};
