import { Request, Response } from 'express';
import { AttendanceQRService } from './attendanceQR.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const result = await AttendanceQRService.checkIn(req.body);
  ResponseHandler.created(res, result, 'Check-in successful');
});

const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const result = await AttendanceQRService.checkOut(req.body);
  ResponseHandler.success(res, result, 'Check-out successful');
});

export const attendanceQRController = { checkIn, checkOut };
