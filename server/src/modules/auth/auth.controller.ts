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

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
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
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    const { AppError } = await import('../../core/errors/AppError.js');
    throw new AppError('No refresh token provided', 401);
  }

  const result = await AuthService.refreshToken(token);

  res.cookie('jwt', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  ResponseHandler.success(res, result, 'Token refreshed successfully');
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
    await AuthService.logout(req.user.id, token);
  }
  res.clearCookie('jwt');
  res.clearCookie('refreshToken', { path: '/' });
  ResponseHandler.success(res, null, 'Logout successful');
});

const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
  const result = await AuthService.logoutAllDevices(req.user!.id, token, ipAddress, userAgent);
  res.clearCookie('jwt');
  res.clearCookie('refreshToken', { path: '/' });
  ResponseHandler.success(res, null, result.message);
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);
  ResponseHandler.success(res, null, result.message);
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const result = await AuthService.resetPassword(token, newPassword);
  ResponseHandler.success(res, null, result.message);
});

const unlockAccount = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const result = await AuthService.unlockAccount(userId, req.user!.id);
  ResponseHandler.success(res, null, result.message);
});

const forceChangePassword = asyncHandler(async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  await AuthService.forceChangePassword(req.user!.id, newPassword, ipAddress, userAgent);

  res.clearCookie('jwt');
  ResponseHandler.success(res, null, 'Password changed successfully. Please login with your new password.');
});

export const authController = {
  login,
  logout,
  logoutAllDevices,
  getMe,
  changePassword,
  forceChangePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  unlockAccount,
};