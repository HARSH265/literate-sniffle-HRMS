import { Request, Response } from 'express';
import { KioskService } from './kiosk.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await KioskService.registerDevice(req.body, req.user!.id);
  ResponseHandler.created(res, result, 'Kiosk device registered');
});

const list = asyncHandler(async (_req: Request, res: Response) => {
  const result = await KioskService.listDevices();
  ResponseHandler.success(res, result, 'Kiosk devices fetched');
});

const qr = asyncHandler(async (req: Request, res: Response) => {
  const { kioskId } = req.params;
  const result = await KioskService.generateQR(kioskId);
  ResponseHandler.success(res, result, 'QR generated');
});

const validate = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) {
    ResponseHandler.error(res, 'Token is required', 400);
    return;
  }
  const result = await KioskService.validateQRToken(token as string);
  ResponseHandler.success(res, result, 'QR token validated');
});

const startBroadcast = asyncHandler(async (req: Request, res: Response) => {
  const { kioskId } = req.params;
  await KioskService.startQRBroadcast(kioskId);
  ResponseHandler.success(res, null, 'QR broadcast started');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await KioskService.updateDevice(id, req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Kiosk device updated');
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await KioskService.deleteDevice(id, req.user!.id);
  ResponseHandler.noContent(res);
});

export const kioskController = { register, list, qr, validate, startBroadcast, update, remove };
