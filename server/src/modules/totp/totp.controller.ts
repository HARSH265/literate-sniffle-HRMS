import { Request, Response } from 'express';
import { TOTPService } from './totp.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AppError } from '../../core/errors/AppError.js';

const enroll = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = req.body;
  const result = await TOTPService.enrollEmployee(employeeId, req.user!.id);
  ResponseHandler.success(res, result, 'TOTP enrolled successfully');
});

const verify = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, token } = req.body;
  const isValid = await TOTPService.verifyEmployeeCode(employeeId, token);
  if (!isValid) {
    throw new AppError('Invalid TOTP code', 401);
  }
  ResponseHandler.success(res, { valid: true }, 'TOTP verified successfully');
});

const disable = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId } = req.body;
  await TOTPService.disableTOTP(employeeId, req.user!.id);
  ResponseHandler.success(res, null, 'TOTP disabled successfully');
});

export const totpController = { enroll, verify, disable };
