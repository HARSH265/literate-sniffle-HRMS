import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { ResponseHandler } from '../../core/response/ResponseHandler.js';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { TokenBlacklist } from '../../core/auth/TokenBlacklist.js';
import { logger } from '../../core/logger/logger.js';
import { env } from '../../config/env.js';
import { AUTH_CONSTANTS } from './auth.constants.js';

const cookieOpts = (maxAgeMs: number, path?: string) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: maxAgeMs,
  ...(path ? { path } : {}),
});

const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await AuthService.login(email, password, ipAddress, userAgent);

  const jwtMaxAge = parseInt(env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000;
  const refreshMaxAge = AUTH_CONSTANTS.cookieMaxAge.refreshTokenDays * 24 * 60 * 60 * 1000;

  res.cookie(AUTH_CONSTANTS.cookieNames.jwt, result.token, cookieOpts(jwtMaxAge));
  res.cookie(AUTH_CONSTANTS.cookieNames.refreshToken, result.refreshToken, cookieOpts(refreshMaxAge, '/'));

  ResponseHandler.success(res, result, 'Login successful');
});

const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.getMe(req.user!.id);
  ResponseHandler.success(res, user, 'User fetched successfully');
});

const getPasswordPolicy = asyncHandler(async (_req: Request, res: Response) => {
  const policy = await AuthService.getPasswordPolicy();
  ResponseHandler.success(res, policy, 'Password policy fetched successfully');
});

const getMyPermissions = asyncHandler(async (req: Request, res: Response) => {
  const permissions = await AuthService.getEffectivePermissions(req.user!.role);
  ResponseHandler.success(res, { role: req.user!.role, permissions });
});

const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  await AuthService.changePassword(req.user!.id, currentPassword, newPassword, ipAddress, userAgent);

  res.clearCookie(AUTH_CONSTANTS.cookieNames.jwt);
  ResponseHandler.success(res, null, 'Password changed successfully');
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[AUTH_CONSTANTS.cookieNames.refreshToken] || req.body.refreshToken;

  if (!token) {
    const { AppError } = await import('../../core/errors/AppError.js');
    throw new AppError('No refresh token provided', 401);
  }

  const result = await AuthService.refreshToken(token);

  const jwtMaxAge = parseInt(env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000;
  const refreshMaxAge = AUTH_CONSTANTS.cookieMaxAge.refreshTokenDays * 24 * 60 * 60 * 1000;

  res.cookie(AUTH_CONSTANTS.cookieNames.jwt, result.token, cookieOpts(jwtMaxAge));
  res.cookie(AUTH_CONSTANTS.cookieNames.refreshToken, result.refreshToken, cookieOpts(refreshMaxAge, '/'));

  ResponseHandler.success(res, result, 'Token refreshed successfully');
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    const token = req.cookies?.[AUTH_CONSTANTS.cookieNames.jwt] || req.headers.authorization?.split(' ')[1];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await AuthService.logout(req.user.id, token);
    await AuditService.log({
      action: 'logout',
      module: 'auth',
      userId: req.user.id,
      ipAddress,
      userAgent,
    });
  }
  res.clearCookie(AUTH_CONSTANTS.cookieNames.jwt);
  res.clearCookie(AUTH_CONSTANTS.cookieNames.refreshToken, { path: '/' });
  ResponseHandler.success(res, null, 'Logout successful');
});

const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const token = req.cookies?.[AUTH_CONSTANTS.cookieNames.jwt] || req.headers.authorization?.split(' ')[1];
  const result = await AuthService.logoutAllDevices(req.user!.id, token, ipAddress, userAgent);
  await AuditService.log({
    action: 'logout-all-devices',
    module: 'auth',
    userId: req.user!.id,
    ipAddress,
    userAgent,
  });
  res.clearCookie(AUTH_CONSTANTS.cookieNames.jwt);
  res.clearCookie(AUTH_CONSTANTS.cookieNames.refreshToken, { path: '/' });
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

  const token = req.cookies?.[AUTH_CONSTANTS.cookieNames.jwt] || req.headers.authorization?.split(' ')[1];

  await AuthService.forceChangePassword(req.user!.id, newPassword, ipAddress, userAgent);

  if (token) {
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
      await TokenBlacklist.add(token, Math.max(ttl, 1));
    } catch (err) {
      logger.error('Failed to blacklist token after force password change', err);
      try {
        await TokenBlacklist.add(token, 3600);
      } catch (fallbackErr) {
        logger.error('Fallback blacklist add also failed', fallbackErr);
      }
    }
  }

  res.clearCookie(AUTH_CONSTANTS.cookieNames.jwt);
  ResponseHandler.success(res, null, 'Password changed successfully. Please login with your new password.');
});

export const authController = {
  login,
  logout,
  logoutAllDevices,
  getMe,
  getPasswordPolicy,
  getMyPermissions,
  changePassword,
  forceChangePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  unlockAccount,
};