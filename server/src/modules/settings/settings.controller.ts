import { Request, Response } from 'express';
import { SettingsService } from './settings.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';

const get = asyncHandler(async (_req: Request, res: Response) => {
  const result = await SettingsService.get();
  ResponseHandler.success(res, result, 'Settings fetched successfully');
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await SettingsService.update(req.body, req.user!.id);
  ResponseHandler.success(res, result, 'Settings updated successfully');
});

const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    ResponseHandler.error(res, 'Valid email address required', 400);
    return;
  }
  
  const result = await SettingsService.testEmail(email);
  
  if (result.success) {
    ResponseHandler.success(res, result, 'Test email sent successfully');
  } else {
    ResponseHandler.error(res, result.message || 'Failed to send test email');
  }
});

const uploadLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    ResponseHandler.error(res, 'No file uploaded', 400);
    return;
  }
  
  const result = await SettingsService.uploadLogo(req.file, req.user!.id);
  ResponseHandler.success(res, result, 'Logo uploaded successfully');
});

export const settingsController = { get, update, testEmail, uploadLogo };