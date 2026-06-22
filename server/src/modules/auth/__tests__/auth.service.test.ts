import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../../models/User.model.js';
import PasswordResetToken from '../../../models/PasswordResetToken.model.js';
import { AuthService } from '../auth.service.js';
import { AppError } from '../../../core/errors/AppError.js';
import { env } from '../../../config/env.js';
import { TokenBlacklist } from '../../../core/auth/TokenBlacklist.js';

describe('AuthService', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPass123!',
    role: 'hr-admin' as const,
  };

  let userId: string;

  beforeEach(async () => {
    await User.deleteMany({});
    const user = await User.create(testUser);
    userId = user._id.toString();
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      const result = await AuthService.login(testUser.email, testUser.password);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.name).toBe(testUser.name);
      expect(result.user.role).toBe(testUser.role);
    });

    it('rejects invalid email', async () => {
      await expect(AuthService.login('wrong@example.com', testUser.password)).rejects.toThrow(AppError);
    });

    it('rejects invalid password', async () => {
      await expect(AuthService.login(testUser.email, 'WrongPass1!')).rejects.toThrow(AppError);
    });

    it('rejects deactivated account', async () => {
      await User.findByIdAndUpdate(userId, { isActive: false });
      await expect(AuthService.login(testUser.email, testUser.password)).rejects.toThrow(AppError);
    });

    it('locks account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await expect(AuthService.login(testUser.email, 'WrongPass1!')).rejects.toThrow(AppError);
      }

      const user = await User.findById(userId);
      expect(user!.lockUntil).toBeInstanceOf(Date);
      expect(user!.failedLoginAttempts).toBe(5);
    });

    it('rejects login on locked account', async () => {
      await User.findByIdAndUpdate(userId, {
        failedLoginAttempts: 5,
        lockUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      await expect(AuthService.login(testUser.email, testUser.password)).rejects.toThrow(AppError);
    });

    it('resets lockout on successful login', async () => {
      await User.findByIdAndUpdate(userId, {
        failedLoginAttempts: 3,
        lockUntil: new Date(Date.now() - 1000),
      });

      const result = await AuthService.login(testUser.email, testUser.password);
      expect(result).toHaveProperty('token');

      const user = await User.findById(userId);
      expect(user!.failedLoginAttempts).toBe(0);
      expect(user!.lockUntil).toBeNull();
    });
  });

  describe('getMe', () => {
    it('returns user profile', async () => {
      const result = await AuthService.getMe(userId);

      expect(result).toHaveProperty('id', userId);
      expect(result.email).toBe(testUser.email);
      expect(result.name).toBe(testUser.name);
    });

    it('throws on non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(AuthService.getMe(fakeId)).rejects.toThrow(AppError);
    });
  });

  describe('changePassword', () => {
    it('changes password with valid current password', async () => {
      const result = await AuthService.changePassword(userId, testUser.password, 'NewPass1!');

      expect(result).toHaveProperty('message', 'Password changed successfully');

      const loginResult = await AuthService.login(testUser.email, 'NewPass1!');
      expect(loginResult).toHaveProperty('token');
    });

    it('rejects incorrect current password', async () => {
      await expect(AuthService.changePassword(userId, 'WrongPass1!', 'NewPass1!')).rejects.toThrow(AppError);
    });

    it('rejects reused password from history', async () => {
      await AuthService.changePassword(userId, testUser.password, 'NewPass1!');
      await expect(AuthService.changePassword(userId, 'NewPass1!', testUser.password)).rejects.toThrow(AppError);
    });

    it('throws on non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(AuthService.changePassword(fakeId, 'anything', 'NewPass1!')).rejects.toThrow(AppError);
    });
  });

  describe('refreshToken', () => {
    it('refreshes a valid token', async () => {
      const loginResult = await AuthService.login(testUser.email, testUser.password);
      const result = await AuthService.refreshToken(loginResult.refreshToken);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');

      const decoded = jwt.verify(result.token, env.JWT_SECRET, { algorithms: ['HS256'] }) as { id: string };
      expect(decoded.id).toBe(userId);
    });

    it('rejects invalid refresh token string', async () => {
      await expect(AuthService.refreshToken('invalid-token')).rejects.toThrow();
    });

    it('rejects revoked refresh token', async () => {
      const loginResult = await AuthService.login(testUser.email, testUser.password);
      await AuthService.logout(userId);

      await expect(AuthService.refreshToken(loginResult.refreshToken)).rejects.toThrow(AppError);
    });
  });

  describe('logout', () => {
    it('clears refresh token on logout', async () => {
      await AuthService.login(testUser.email, testUser.password);
      await AuthService.logout(userId);

      const user = await User.findById(userId);
      expect(user!.refreshToken).toBeNull();
    });

    it('does not throw on logout without login', async () => {
      await expect(AuthService.logout(userId)).resolves.not.toThrow();
    });
  });

  describe('logoutAllDevices', () => {
    it('clears refresh token and returns message', async () => {
      const result = await AuthService.logoutAllDevices(userId);

      expect(result).toHaveProperty('message', 'Logged out from all devices successfully');

      const user = await User.findById(userId);
      expect(user!.refreshToken).toBeNull();
    });
  });

  describe('locked account', () => {
    it('returns locked error message on locked account', async () => {
      await User.findByIdAndUpdate(userId, {
        failedLoginAttempts: 5,
        lockUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      try {
        await AuthService.login(testUser.email, testUser.password);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toMatch(/locked/i);
      }
    });

    it('clears lockout after lock period expires', async () => {
      await User.findByIdAndUpdate(userId, {
        failedLoginAttempts: 5,
        lockUntil: new Date(Date.now() - 1000),
      });

      const result = await AuthService.login(testUser.email, testUser.password);
      expect(result).toHaveProperty('token');
    });
  });

  describe('forgotPassword', () => {
    it('creates a reset token for valid user', async () => {
      await AuthService.forgotPassword(testUser.email);
      const token = await PasswordResetToken.findOne({ user: userId });
      expect(token).not.toBeNull();
    });

    it('returns success message even for non-existent email', async () => {
      const result = await AuthService.forgotPassword('nonexistent@example.com');
      expect(result).toHaveProperty('message');
    });
  });

  describe('resetPassword', () => {
    function hashToken(raw: string) {
      return crypto.createHash('sha256').update(raw).digest('hex');
    }

    it('invalidates all other reset tokens for the user after successful reset', async () => {
      const rawToken1 = 'raw-token-1';
      const rawToken2 = 'raw-token-2';
      const hashed1 = hashToken(rawToken1);
      const hashed2 = hashToken(rawToken2);

      await PasswordResetToken.create({
        user: userId,
        token: hashed1,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      await PasswordResetToken.create({
        user: userId,
        token: hashed2,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      await AuthService.resetPassword(rawToken1, 'NewPass1!');

      const t1 = await PasswordResetToken.findOne({ token: hashed1 });
      const t2 = await PasswordResetToken.findOne({ token: hashed2 });
      expect(t1!.used).toBe(true);
      expect(t2!.used).toBe(true);
    });

    it('throws on already used token', async () => {
      await PasswordResetToken.create({
        user: userId,
        token: hashToken('used-token'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: true,
      });

      await expect(AuthService.resetPassword('used-token', 'NewPass1!')).rejects.toThrow(AppError);
    });

    it('throws on expired token', async () => {
      await PasswordResetToken.create({
        user: userId,
        token: hashToken('expired-token'),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(AuthService.resetPassword('expired-token', 'NewPass1!')).rejects.toThrow(AppError);
    });
  });

  describe('token blacklist', () => {
    it('blacklists token on logout', async () => {
      const loginResult = await AuthService.login(testUser.email, testUser.password);
      const decoded = jwt.decode(loginResult.token) as { exp?: number };
      const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;

      await AuthService.logout(userId, loginResult.token);

      const isBlacklisted = await TokenBlacklist.isBlacklisted(loginResult.token);
      expect(isBlacklisted).toBe(true);
    });
  });

  describe('refreshToken rotation', () => {
    it('blacklists old refresh token after rotation', async () => {
      const loginResult = await AuthService.login(testUser.email, testUser.password);
      const oldRefreshToken = loginResult.refreshToken;

      await AuthService.refreshToken(oldRefreshToken);

      const isBlacklisted = await TokenBlacklist.isBlacklisted(oldRefreshToken);
      expect(isBlacklisted).toBe(true);
    });
  });

  describe('getPasswordPolicy', () => {
    it('returns default password policy', async () => {
      const policy = await AuthService.getPasswordPolicy();
      expect(policy).toHaveProperty('passwordMinLength');
      expect(policy).toHaveProperty('requireUppercase');
      expect(policy).toHaveProperty('requireLowercase');
      expect(policy).toHaveProperty('requireNumber');
      expect(policy).toHaveProperty('requireSpecialChar');
      expect(policy).toHaveProperty('passwordHistoryCount');
    });
  });
});
