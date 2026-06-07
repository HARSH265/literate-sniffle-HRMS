import { describe, it, expect } from 'vitest';
import { listNotificationsSchema, markAsReadSchema, markAllAsReadSchema } from '../notifications.validation.js';

describe('notifications validation schemas', () => {
  describe('listNotificationsSchema', () => {
    it('uses defaults for empty input', () => {
      const result = listNotificationsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('accepts type filter', () => {
      const result = listNotificationsSchema.safeParse({ type: 'warning' });
      expect(result.success).toBe(true);
    });

    it('accepts read filter', () => {
      const result = listNotificationsSchema.safeParse({ read: true });
      expect(result.success).toBe(true);
    });

    it('rejects negative page', () => {
      const result = listNotificationsSchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects limit > 100', () => {
      const result = listNotificationsSchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });
  });

  describe('markAsReadSchema', () => {
    it('accepts valid ObjectId', () => {
      const result = markAsReadSchema.safeParse({ notificationId: '507f1f77bcf86cd799439011' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid ObjectId', () => {
      const result = markAsReadSchema.safeParse({ notificationId: 'abc123' });
      expect(result.success).toBe(false);
    });
  });

  describe('markAllAsReadSchema', () => {
    it('accepts empty input', () => {
      const result = markAllAsReadSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts undefined input', () => {
      const result = markAllAsReadSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });
});
