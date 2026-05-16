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

export const settingsController = { get, update };