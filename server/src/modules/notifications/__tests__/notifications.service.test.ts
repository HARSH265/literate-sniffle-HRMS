import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Notification from '../../../models/Notification.model.js';
import User from '../../../models/User.model.js';
import { NotificationsService } from '../notifications.service.js';

let userId: string;

beforeAll(async () => {
  const user = await User.create({ name: 'Admin', email: 'notif@test.com', password: 'TestPass1!', role: 'super-admin' });
  userId = user._id.toString();
});

beforeEach(async () => {
  await Notification.deleteMany({});
});

describe('NotificationsService', () => {
  describe('createNotification', () => {
    it('creates a notification', async () => {
      const result = await NotificationsService.createNotification({
        title: 'Payroll Run', message: 'Payroll for March completed',
        type: 'info', recipient: userId, module: 'payroll',
      });
      expect(result.title).toBe('Payroll Run');
      expect(result.isRead).toBe(false);
    });
  });

  describe('getUserNotifications', () => {
    it('returns empty list for user with no notifications', async () => {
      const result = await NotificationsService.getUserNotifications(userId, {});
      expect(result.notifications).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('returns user notifications', async () => {
      await NotificationsService.createNotification({
        title: 'Test', message: 'Test message', type: 'info', recipient: userId, module: 'test',
      });
      const result = await NotificationsService.getUserNotifications(userId, {});
      expect(result.notifications).toHaveLength(1);
    });

    it('filters by module', async () => {
      await NotificationsService.createNotification({
        title: 'Payroll', message: 'Done', type: 'info', recipient: userId, module: 'payroll',
      });
      await NotificationsService.createNotification({
        title: 'Leave', message: 'Approved', type: 'success', recipient: userId, module: 'leave',
      });
      const result = await NotificationsService.getUserNotifications(userId, { module: 'payroll' });
      expect(result.notifications).toHaveLength(1);
    });

    it('filters by read status', async () => {
      const n = await NotificationsService.createNotification({
        title: 'Read this', message: 'Test', type: 'info', recipient: userId, module: 'test',
      });
      await NotificationsService.markAsRead(n._id.toString(), userId);
      const result = await NotificationsService.getUserNotifications(userId, { isRead: 'true' });
      expect(result.notifications).toHaveLength(1);
    });
  });

  describe('getUnreadCount', () => {
    it('returns 0 when no unread', async () => {
      const count = await NotificationsService.getUnreadCount(userId);
      expect(count).toBe(0);
    });

    it('returns unread count', async () => {
      await NotificationsService.createNotification({
        title: 'Unread', message: 'Test', type: 'info', recipient: userId, module: 'test',
      });
      const count = await NotificationsService.getUnreadCount(userId);
      expect(count).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      const n = await NotificationsService.createNotification({
        title: 'Mark me', message: 'Test', type: 'info', recipient: userId, module: 'test',
      });
      const result = await NotificationsService.markAsRead(n._id.toString(), userId);
      expect(result!.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      await NotificationsService.createNotification({
        title: 'N1', message: 'Test', type: 'info', recipient: userId, module: 'test',
      });
      await NotificationsService.createNotification({
        title: 'N2', message: 'Test', type: 'warning', recipient: userId, module: 'test',
      });
      await NotificationsService.markAllAsRead(userId);
      const count = await NotificationsService.getUnreadCount(userId);
      expect(count).toBe(0);
    });
  });
});
