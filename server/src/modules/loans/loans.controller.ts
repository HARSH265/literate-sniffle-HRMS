import { Request, Response } from 'express';
import { LoansService } from './loans.service.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';

const createLoanType = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.createLoanType(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Loan type created');
});

const updateLoanType = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.updateLoanType(req.params.id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Loan type updated');
});

const listLoanTypes = asyncHandler(async (_req: Request, res: Response) => {
  const result = await LoansService.listLoanTypes(_req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Loan types fetched');
});

const getLoanType = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.getLoanType(req.params.id);
  ResponseHandler.success(res, result, 'Loan type fetched');
});

const deleteLoanType = asyncHandler(async (req: Request, res: Response) => {
  await LoansService.deleteLoanType(req.params.id, req.user!.id);
  ResponseHandler.noContent(res);
});

const applyLoan = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.applyLoan(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Loan application submitted');
});

const approveLoan = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.approveLoan(req.params.id, req.body, req.user!.id, req.body.level || 1);
  ResponseHandler.success(res, result, 'Loan status updated');
});

const disburseLoan = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.disburseLoan(req.params.id, req.user!.id, req.body.remarks);
  ResponseHandler.success(res, result, 'Loan disbursed');
});

const cancelLoan = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.cancelLoan(req.params.id, req.user!.id);
  ResponseHandler.success(res, result, 'Loan cancelled');
});

const listLoans = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.listLoans(req.query as Record<string, unknown>);
  ResponseHandler.success(res, result, 'Loans fetched');
});

const getLoan = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.getLoan(req.params.id);
  ResponseHandler.success(res, result, 'Loan fetched');
});

const getEmployeeLoanSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await LoansService.getEmployeeLoanSummary(req.params.employeeId);
  ResponseHandler.success(res, result, 'Loan summary fetched');
});

export const loansController = {
  createLoanType,
  updateLoanType,
  listLoanTypes,
  getLoanType,
  deleteLoanType,
  applyLoan,
  approveLoan,
  disburseLoan,
  cancelLoan,
  listLoans,
  getLoan,
  getEmployeeLoanSummary,
};
