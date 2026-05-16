import Notification from '../../models/Notification.model.js';
import { logger } from '../logger/logger.js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  recipient: string;
  module: string;
  link?: string;
}

export class NotificationService {
  static async send(data: NotificationData): Promise<void> {
    try {
      await Notification.create({
        title: data.title,
        message: data.message,
        type: data.type,
        recipient: data.recipient,
        module: data.module,
        link: data.link,
      });
    } catch (error) {
      logger.error('Notification send failed:', error);
    }
  }

  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.updateOne(
        { _id: notificationId, recipient: userId },
        { isRead: true },
      );
    } catch (error) {
      logger.error('Mark notification as read failed:', error);
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany({ recipient: userId }, { isRead: true });
    } catch (error) {
      logger.error('Mark all notifications as read failed:', error);
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({ recipient: userId, isRead: false });
    } catch (error) {
      logger.error('Get unread notification count failed:', error);
      return 0;
    }
  }
}