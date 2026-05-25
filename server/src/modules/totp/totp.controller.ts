import { Request, Response } from 'express';
import { TOTPService } from './totp.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const enroll = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    ResponseHandler.error(res, 'Employee ID is required', 400);
    return;
  }
  const result = await TOTPService.enrollEmployee(employeeId, req.user!.id);
  ResponseHandler.success(res, result, 'TOTP enrolled successfully');
});

const verify = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, token } = req.body;
  if (!employeeId || !token) {
    ResponseHandler.error(res, 'Employee ID and token are required', 400);
    return;
  }
  const isValid = await TOTPService.verifyEmployeeCode(employeeId, token);
  if (!isValid) {
    ResponseHandler.error(res, 'Invalid TOTP code', 401);
    return;
  }
  ResponseHandler.success(res, { valid: true }, 'TOTP verified successfully');
});

const disable = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    ResponseHandler.error(res, 'Employee ID is required', 400);
    return;
  }
  await TOTPService.disableTOTP(employeeId, req.user!.id);
  ResponseHandler.success(res, null, 'TOTP disabled successfully');
});

export const totpController = { enroll, verify, disable };
