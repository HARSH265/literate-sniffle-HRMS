import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/User.model.js';
import PasswordResetToken from '../../models/PasswordResetToken.model.js';
import { AppError } from '../../core/errors/AppError.js';
import { env } from '../../config/env.js';
import { AuditService } from '../../core/audit/AuditService.js';
import { TokenBlacklist } from '../../core/auth/TokenBlacklist.js';
import { EmailService } from '../../core/email/EmailService.js';
import CompanySettings from '../../models/CompanySettings.model.js';

async function getAuthConfig(): Promise<{ tokenExpiry: string; refreshTokenExpiry: string }> {
  try {
    const settings = await CompanySettings.findOne().lean() as any;
    return {
      tokenExpiry: settings?.authConfig?.tokenExpiry || '24h',
      refreshTokenExpiry: settings?.authConfig?.refreshTokenExpiry || '7d',
    };
  } catch {
    return { tokenExpiry: '24h', refreshTokenExpiry: '7d' };
  }
}

export class AuthService {
  static async login(email: string, password: string, ipAddress?: string, userAgent?: string) {


    const user = await User.findOne({ email: email.toLowerCase() });


    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError('Account is locked. Please try again later.', 401);
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

    const { tokenExpiry, refreshTokenExpiry } = await getAuthConfig();

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: tokenExpiry as jwt.SignOptions['expiresIn'], algorithm: 'HS256' },
    );

    const refreshToken = jwt.sign(
      { id: user._id.toString() },
      env.JWT_REFRESH_SECRET,
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
        employeeId: user.employeeId?.toString() || null,
        mustChangePassword: user.mustChangePassword || false,
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

  /**
   * Force change password — used when mustChangePassword is true (auto-generated credentials).
   * Does NOT require current password.
   */
  static async forceChangePassword(
    userId: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
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
    user.mustChangePassword = false;
    await user.save();

    await AuditService.log({
      action: 'update',
      module: 'auth',
      userId,
      targetId: userId,
      details: { action: 'force password change (first login)' },
      ipAddress,
      userAgent,
    });

    return { message: 'Password changed successfully. You can now use your new password.' };
  }

  static async refreshToken(refreshToken: string) {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as { id: string };

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    const { tokenExpiry, refreshTokenExpiry } = await getAuthConfig();

    const newToken = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: tokenExpiry as jwt.SignOptions['expiresIn'], algorithm: 'HS256' },
    );

    const newRefreshToken = jwt.sign(
      { id: user._id.toString() },
      env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiry as jwt.SignOptions['expiresIn'], algorithm: 'HS256' },
    );

    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(userId: string, token?: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    if (token) {
      try {
        const decoded = jwt.decode(token) as { exp?: number };
        const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
        await TokenBlacklist.add(token, Math.max(ttl, 1));
      } catch {
        await TokenBlacklist.add(token, 3600);
      }
    }
  }

  static async logoutAllDevices(userId: string, token?: string, ipAddress?: string, userAgent?: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    if (token) {
      try {
        const decoded = jwt.decode(token) as { exp?: number };
        const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
        await TokenBlacklist.add(token, Math.max(ttl, 1));
      } catch {
        await TokenBlacklist.add(token, 3600);
      }
    }

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

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });


    if (!user) {
      return { message: 'If an account exists, a reset email has been sent.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordResetToken.create({
      user: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

    await EmailService.send(
      user.email,
      'Password Reset Request',
      `<p>You requested a password reset. Click the link below to reset your password:</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>This link expires in 1 hour.</p>
       <p>If you didn't request this, ignore this email.</p>`,
    );

    return { message: 'If an account exists, a reset email has been sent.' };
  }

  static async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const user = await User.findById(resetToken.user);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (await user.isPasswordInHistory(newPassword)) {
      throw new AppError('Cannot reuse any of your last 5 passwords.', 400);
    }

    const previousPasswords = user.passwordHistory || [];
    previousPasswords.unshift(user.password);
    if (previousPasswords.length > 5) {
      previousPasswords.pop();
    }

    user.password = newPassword;
    user.passwordHistory = previousPasswords;
    user.refreshToken = undefined;
    await user.save();

    resetToken.used = true;
    await resetToken.save();

    await AuditService.log({
      action: 'update',
      module: 'auth',
      userId: user._id.toString(),
      targetId: user._id.toString(),
      details: { action: 'password reset' },
    });

    return { message: 'Password reset successful. Please login with your new password.' };
  }

  static async unlockAccount(userId: string, adminId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await User.findByIdAndUpdate(userId, {
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    await AuditService.log({
      action: 'update',
      module: 'auth',
      userId: adminId,
      targetId: userId,
      details: { action: 'account unlocked' },
    });

    return { message: 'Account unlocked successfully' };
  }
}