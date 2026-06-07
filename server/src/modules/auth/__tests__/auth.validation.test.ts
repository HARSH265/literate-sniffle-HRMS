import { describe, it, expect } from 'vitest';
import { loginSchema, changePasswordSchema, refreshTokenSchema } from '../auth.validation.js';

describe('auth validation schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: '1234567' });
      expect(result.success).toBe(false);
    });

    it('rejects missing email', () => {
      const result = loginSchema.safeParse({ password: 'password123' });
      expect(result.success).toBe(false);
    });

    it('rejects missing password', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('accepts valid passwords', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'NewPass1!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects new password without uppercase', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'newpass1!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects new password without lowercase', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'NEWPASS1!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects new password without number', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'NewPass!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects new password without special char', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'NewPass1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects new password shorter than 8 chars', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'Sh0rt!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty current password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'NewPass1!',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('accepts valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: 'some-long-token-value' });
      expect(result.success).toBe(true);
    });

    it('rejects empty refresh token', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing refresh token', () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
