import jwt from 'jsonwebtoken';
import User from '../../models/User.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { env } from '../../config/env.js';
import { AuditService } from '../../core/audit/AuditService.js';

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

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' },
    );

    const refreshToken = jwt.sign(
      { id: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' },
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

    user.password = newPassword;
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

    const newToken = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' },
    );

    const newRefreshToken = jwt.sign(
      { id: user._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' },
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
}