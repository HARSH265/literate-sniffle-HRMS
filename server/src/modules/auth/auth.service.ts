import jwt from 'jsonwebtoken';
import User from '../../models/User.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { env } from '../../config/env.js';
import { AuditService } from '../../core/audit/AuditService.js';

export class AuthService {
  static async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).lean();

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await dbUser.comparePassword(password);

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' as const },
    );

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
}