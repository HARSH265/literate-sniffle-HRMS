import jwt from 'jsonwebtoken';
import User from '../../models/User.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { env } from '../../config/env.js';
import { AuditService } from '../../core/audit/AuditService.js';
import CompanySettings from '../../models/CompanySettings.model.js';

async function getTokenExpiry(): Promise<string> {
  try {
    const settings = await CompanySettings.findOne().lean() as any;
    return settings?.authConfig?.tokenExpiry || '24h';
  } catch {
    return '24h';
  }
}

async function getRefreshTokenExpiry(): Promise<string> {
  try {
    const settings = await CompanySettings.findOne().lean() as any;
    return settings?.authConfig?.refreshTokenExpiry || '7d';
  } catch {
    return '7d';
  }
}

export class AuthService {
  static async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account is locked. Try again in ${remainingMinutes} minutes`, 401);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      
      await User.findByIdAndUpdate(user._id, {
        failedLoginAttempts: failedAttempts,
        lockUntil: lockUntil,
      });

      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    const tokenExpiry = await getTokenExpiry();
    const refreshTokenExpiry = await getRefreshTokenExpiry();

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: tokenExpiry as jwt.SignOptions['expiresIn'], algorithm: 'HS256' },
    );

    const refreshToken = jwt.sign(
      { id: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: refreshTokenExpiry as jwt.SignOptions['expiresIn'], algorithm: 'HS256' },
    );

    await User.findByIdAndUpdate(user._id, { refreshToken });

    await AuditService.log({
      action: 'login',
      module: 'auth',
      userId: user._id.toString(),
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    if (await user.isPasswordInHistory(newPassword)) {
      throw new AppError('Cannot reuse any of your last 5 passwords. Please choose a different password.', 400);
    }

    const settings = await CompanySettings.findOne().lean() as any;
    const passwordHistoryCount = settings?.authConfig?.passwordHistoryCount || 5;
    
    const previousPasswords = user.passwordHistory || [];
    previousPasswords.unshift(user.password);
    if (previousPasswords.length > passwordHistoryCount) {
      previousPasswords.pop();
    }

    user.password = newPassword;
    user.passwordHistory = previousPasswords;
    await user.save();

    await AuditService.log({
      action: 'update',
      module: 'auth',
      userId,
      targetId: userId,
      details: { action: 'password changed' },
      ipAddress,
      userAgent,
    });

    return { message: 'Password changed successfully' };
  }

  static async refreshToken(refreshToken: string) {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET, { algorithms: ['HS256'] }) as { id: string };

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    const tokenExpiry = await getTokenExpiry();
    const refreshTokenExpiry = await getRefreshTokenExpiry();

    const newToken = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: tokenExpiry as jwt.SignOptions['expiresIn'], algorithm: 'HS256' },
    );

    const newRefreshToken = jwt.sign(
      { id: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: refreshTokenExpiry as jwt.SignOptions['expiresIn'], algorithm: 'HS256' },
    );

    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  static async logoutAllDevices(userId: string, ipAddress?: string, userAgent?: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    await AuditService.log({
      action: 'logout-all-devices',
      module: 'auth',
      userId,
      details: { action: 'logged out from all devices' },
      ipAddress,
      userAgent,
    });

    return { message: 'Logged out from all devices successfully' };
  }
}