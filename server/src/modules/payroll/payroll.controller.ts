import { Request, Response } from 'express';
import { PayrollService } from './payroll.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AppError } from '../../core/errors/AppError.js';

const listRuns = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.listRuns(req.query);
  ResponseHandler.paginated(res, result.data, result.meta as any, 'Payroll runs fetched successfully');
});

const runPayroll = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) throw new AppError('Month and year are required', 400);
  const result = await PayrollService.runPayroll(month, year, req.user!.id);
  ResponseHandler.created(res, result, 'Payroll processed successfully');
});

const previewRun = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) throw new AppError('Month and year are required', 400);
  const result = await PayrollService.previewRun(month, year);
  ResponseHandler.success(res, result, 'Payroll preview generated');
});

const submitRun = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.submitRun(req.params.id, req.user!.id);
  ResponseHandler.success(res, result, 'Payroll submitted for approval');
});

const approveRun = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.approveRun(req.params.id, req.user!.id);
  ResponseHandler.success(res, result, 'Payroll approved');
});

const rejectRun = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.rejectRun(req.params.id, req.user!.id, req.body.reason);
  ResponseHandler.success(res, result, 'Payroll rejected');
});

const finalizeRun = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.finalizeRun(req.params.id, req.user!.id, req.body.remarks);
  ResponseHandler.success(res, result, 'Payroll finalized successfully');
});

const getRunDetails = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.getRunDetails(req.params.id);
  ResponseHandler.success(res, result, 'Payroll details fetched successfully');
});

const unfinalizeRun = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.unfinalizeRun(req.params.id, req.user!.id, req.body.reason);
  ResponseHandler.success(res, result, 'Payroll unfinalized successfully');
});

const updatePayrollItem = asyncHandler(async (req: Request, res: Response) => {
  const result = await PayrollService.updatePayrollItem(req.params.itemId, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Payroll item updated successfully');
});

const batchUpdateItems = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) throw new AppError('Items array is required', 400);
  const result = await PayrollService.batchUpdateItems(req.params.id, items, req.user!.id);
  ResponseHandler.success(res, result, 'Payroll items updated in batch');
});

const deleteRun = asyncHandler(async (req: Request, res: Response) => {
  await PayrollService.deleteRun(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

const getByEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = req.params;
  const result = await PayrollService.getByEmployee(employeeId);
  ResponseHandler.success(res, result, 'Employee payroll history fetched successfully');
});

export const payrollController = {
  listRuns, runPayroll, previewRun, submitRun, approveRun, rejectRun,
  finalizeRun, getRunDetails, unfinalizeRun,
  updatePayrollItem, batchUpdateItems, deleteRun, getByEmployee,
};
