import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { env } from '../../config/env.js';

const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await AuthService.login(email, password, ipAddress, userAgent);

  res.cookie('jwt', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  });

  ResponseHandler.success(res, result, 'Login successful');
});

const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.getMe(req.user!.id);
  ResponseHandler.success(res, user, 'User fetched successfully');
});

const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  await AuthService.changePassword(req.user!.id, currentPassword, newPassword, ipAddress, userAgent);

  res.clearCookie('jwt');
  ResponseHandler.success(res, null, 'Password changed successfully');
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await AuthService.refreshToken(refreshToken);

  ResponseHandler.success(res, result, 'Token refreshed successfully');
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await AuthService.logout(req.user.id);
  }
  res.clearCookie('jwt');
  ResponseHandler.success(res, null, 'Logout successful');
});

const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const result = await AuthService.logoutAllDevices(req.user!.id, ipAddress, userAgent);
  res.clearCookie('jwt');
  ResponseHandler.success(res, null, result.message);
});

export const authController = {
  login,
  logout,
  logoutAllDevices,
  getMe,
  changePassword,
  refreshToken,
};