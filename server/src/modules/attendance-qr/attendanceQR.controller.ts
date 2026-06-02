import { Request, Response } from 'express';
import { AttendanceQRService } from './attendanceQR.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AppError } from '../../core/errors/AppError.js';

const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user?.employeeId) {
    throw new AppError('No employee linked to your account. Please contact HR.', 400);
  }

  const result = await AttendanceQRService.checkIn({
    ...req.body,
    employeeId: user.employeeId,
  });
  ResponseHandler.created(res, result, 'Check-in successful');
});

const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user?.employeeId) {
    throw new AppError('No employee linked to your account. Please contact HR.', 400);
  }

  const result = await AttendanceQRService.checkOut({
    ...req.body,
    employeeId: user.employeeId,
  });
  ResponseHandler.success(res, result, 'Check-out successful');
});

export const attendanceQRController = { checkIn, checkOut };
